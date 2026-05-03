-- KASTJ FULL SCHEMA (Supabase / PostgreSQL)
-- Run this in the SQL Editor of your NEW project

-- 1. TABLES
-- Proposals table
CREATE TABLE IF NOT EXISTS public.proposals (
    id BIGINT PRIMARY KEY,
    creator TEXT NOT NULL,
    recipient TEXT NOT NULL,
    token TEXT NOT NULL,
    decimals INTEGER NOT NULL DEFAULT 18,
    goal TEXT NOT NULL,
    min_threshold TEXT NOT NULL,
    deadline BIGINT NOT NULL,
    total_raised TEXT DEFAULT '0',
    status TEXT DEFAULT 'active',
    settlement_mode INTEGER DEFAULT 0,
    success BOOLEAN,
    metadata_uri TEXT,
    title TEXT,
    description TEXT,
    created_at BIGINT
);

-- Proposal Metadata (for historical/extra info)
CREATE TABLE IF NOT EXISTS public.proposal_metadata (
    proposal_id BIGINT PRIMARY KEY REFERENCES public.proposals(id) ON DELETE CASCADE,
    title TEXT,
    description TEXT,
    created_at BIGINT
);

-- Fundings (Contributions)
CREATE TABLE IF NOT EXISTS public.fundings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id BIGINT NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
    supporter TEXT NOT NULL,
    token TEXT NOT NULL,
    amount TEXT NOT NULL,
    tx_hash TEXT UNIQUE NOT NULL, -- Deterministic ID
    withdrawn BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Activity (Events Log)
CREATE TABLE IF NOT EXISTS public.activity (
    id TEXT PRIMARY KEY, -- Deterministic ID: txHash_logIndex_type
    proposal_id BIGINT REFERENCES public.proposals(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    actor TEXT,
    amount TEXT,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Sync State (Indexer Progress)
CREATE TABLE IF NOT EXISTS public.sync_state (
    key TEXT PRIMARY KEY,
    last_block BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Initialize sync state
INSERT INTO public.sync_state (key, last_block) VALUES ('indexer_last_block', 0) ON CONFLICT DO NOTHING;

-- 2. MESSAGES (from previous migration)
CREATE TABLE IF NOT EXISTS public.proposal_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id BIGINT NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.proposal_messages(id) ON DELETE CASCADE,
    author_wallet TEXT NOT NULL,
    author_role TEXT NOT NULL DEFAULT 'visitor',
    message_type TEXT NOT NULL DEFAULT 'comment',
    body TEXT NOT NULL,
    body_hash TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);
CREATE INDEX IF NOT EXISTS idx_fundings_proposal_id ON public.fundings(proposal_id);
CREATE INDEX IF NOT EXISTS idx_activity_proposal_id ON public.activity(proposal_id);
CREATE INDEX IF NOT EXISTS idx_messages_proposal_id ON public.proposal_messages(proposal_id);

-- 4. RLS POLICIES
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fundings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_messages ENABLE ROW LEVEL SECURITY;

-- Permissions
CREATE POLICY "Public Read" ON public.proposals FOR SELECT USING (true);
CREATE POLICY "Public Read" ON public.fundings FOR SELECT USING (true);
CREATE POLICY "Public Read" ON public.activity FOR SELECT USING (true);
CREATE POLICY "Public Read" ON public.proposal_metadata FOR SELECT USING (true);
CREATE POLICY "Public Read" ON public.proposal_messages FOR SELECT USING (true);

-- Auth Policies for Messages
CREATE POLICY "Auth Insert Messages" ON public.proposal_messages 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Author Update Messages" ON public.proposal_messages
FOR UPDATE USING (auth.uid()::text = author_wallet);
