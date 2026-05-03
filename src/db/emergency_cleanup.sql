-- EMERGENCY CLEANUP SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. ANALYZE STORAGE
SELECT
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    reltuples::bigint AS estimated_rows
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- 2. REMOVE DUPLICATES IN 'fundings'
-- Keeps only the first entry for each transaction hash
DELETE FROM public.fundings
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY tx_hash ORDER BY created_at) as row_num
        FROM public.fundings
        WHERE tx_hash IS NOT NULL
    ) t WHERE t.row_num > 1
);

-- 3. REMOVE DUPLICATES IN 'activity'
-- Keeps only the first entry for each unique activity (type + proposal + tx_hash)
DELETE FROM public.activity
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY type, proposal_id, tx_hash ORDER BY created_at) as row_num
        FROM public.activity
        WHERE tx_hash IS NOT NULL
    ) t WHERE t.row_num > 1
);

-- 4. FIX ACTIVITY TABLE SCHEMA (Add PK if missing)
-- This ensures the indexer can use 'id' as a primary key for upserts
DO $$ 
BEGIN
    -- Add id column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity' AND column_name='id') THEN
        ALTER TABLE public.activity ADD COLUMN id TEXT;
    END IF;

    -- Make it PRIMARY KEY if no PK exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='activity' AND constraint_type='PRIMARY KEY') THEN
        -- If there are rows without ID, generate them from tx_hash or random
        UPDATE public.activity SET id = gen_random_uuid()::text WHERE id IS NULL;
        ALTER TABLE public.activity ADD PRIMARY KEY (id);
    END IF;
END $$;

-- 5. RECLAIM SPACE (VACUUM)
-- Note: VACUUM FULL locks the table. Use VACUUM if the site is under heavy load.
VACUUM FULL public.fundings;
VACUUM FULL public.activity;
VACUUM FULL public.proposals;
