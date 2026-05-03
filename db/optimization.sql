-- 1. Create sync_state table to track indexer progress
CREATE TABLE IF NOT EXISTS public.sync_state (
    key TEXT PRIMARY KEY,
    last_block BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Initialize last_block if not exists
INSERT INTO public.sync_state (key, last_block)
VALUES ('indexer_last_block', 0)
ON CONFLICT (key) DO NOTHING;

-- 2. Add indexes to improve query performance
-- Index for proposals filtering and sorting
CREATE INDEX IF NOT EXISTS idx_proposals_status_deadline ON public.proposals (status, deadline);
CREATE INDEX IF NOT EXISTS idx_proposals_id_desc ON public.proposals (id DESC);

-- Index for fundings lookups
CREATE INDEX IF NOT EXISTS idx_fundings_proposal_id ON public.fundings (proposal_id);
CREATE INDEX IF NOT EXISTS idx_fundings_supporter ON public.fundings (supporter);

-- Index for activity performance
CREATE INDEX IF NOT EXISTS idx_activity_proposal_id ON public.activity (proposal_id);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON public.activity (created_at DESC);

-- 3. Ensure activity and fundings have unique identifiers to prevent duplicates
-- For fundings, we should have a unique constraint on tx_hash.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fundings_tx_hash_key') THEN
        ALTER TABLE public.fundings ADD CONSTRAINT fundings_tx_hash_key UNIQUE (tx_hash);
    END IF;
END $$;

-- For activity, ensure we have a unique constraint on the deterministic ID column
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity' AND column_name='id') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_pkey') THEN
            ALTER TABLE public.activity ADD PRIMARY KEY (id);
        END IF;
    END IF;
END $$;
