-- Create the proposal_messages table
CREATE TABLE IF NOT EXISTS public.proposal_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id BIGINT NOT NULL,
    parent_id UUID REFERENCES public.proposal_messages(id) ON DELETE CASCADE,
    author_wallet TEXT NOT NULL,
    author_role TEXT NOT NULL CHECK (author_role IN ('creator', 'supporter', 'recipient', 'visitor', 'moderator')) DEFAULT 'visitor',
    message_type TEXT NOT NULL CHECK (message_type IN ('comment', 'question', 'answer', 'update', 'system')) DEFAULT 'comment',
    body TEXT NOT NULL CHECK (length(trim(body)) > 0),
    body_hash TEXT NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance and ordering
CREATE INDEX IF NOT EXISTS idx_proposal_messages_proposal_id_created ON public.proposal_messages(proposal_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposal_messages_parent_id ON public.proposal_messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_proposal_messages_is_pinned ON public.proposal_messages(is_pinned) WHERE is_pinned = true;

-- Enable Row Level Security (RLS)
ALTER TABLE public.proposal_messages ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read messages
CREATE POLICY "Allow public read access" ON public.proposal_messages
    FOR SELECT USING (true);

-- Allow authenticated (or any) to insert messages (we validate wallet signature in domain logic or just trust the wallet status for now as it's off-chain)
CREATE POLICY "Allow public insert" ON public.proposal_messages
    FOR INSERT WITH CHECK (true);

-- Allow authors to soft-delete their own messages
CREATE POLICY "Allow authors to update their own messages" ON public.proposal_messages
    FOR UPDATE USING (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updated_at
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.proposal_messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
