-- RLS POLICIES FOR KASTJ
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Enable RLS on all tables
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fundings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_messages ENABLE ROW LEVEL SECURITY;

-- 2. Proposals: Public Read, Service Role Write (Indexers)
DROP POLICY IF EXISTS "Allow public read" ON public.proposals;
CREATE POLICY "Allow public read" ON public.proposals FOR SELECT USING (true);

-- 3. Fundings: Public Read, Service Role Write
DROP POLICY IF EXISTS "Allow public read" ON public.fundings;
CREATE POLICY "Allow public read" ON public.fundings FOR SELECT USING (true);

-- 4. Activity: Public Read, Service Role Write
DROP POLICY IF EXISTS "Allow public read" ON public.activity;
CREATE POLICY "Allow public read" ON public.activity FOR SELECT USING (true);

-- 5. Proposal Metadata: Public Read, Service Role Write
DROP POLICY IF EXISTS "Allow public read" ON public.proposal_metadata;
CREATE POLICY "Allow public read" ON public.proposal_metadata FOR SELECT USING (true);

-- 6. Proposal Messages: Public Read, Authenticated Write
DROP POLICY IF EXISTS "Allow public read access" ON public.proposal_messages;
CREATE POLICY "Allow public read access" ON public.proposal_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON public.proposal_messages;
CREATE POLICY "Allow authenticated insert" ON public.proposal_messages 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authors to update their own messages" ON public.proposal_messages;
CREATE POLICY "Allow authors to update their own messages" ON public.proposal_messages
FOR UPDATE USING (auth.uid()::text = author_wallet); -- Assumes author_wallet is stored and matches auth metadata

-- 7. Sync State: Hidden from public, only Indexer (Service Role) can access
-- (By not adding any policy, it's restricted to Service Role by default if RLS is on)
