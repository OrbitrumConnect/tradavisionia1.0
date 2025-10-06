-- Add missing columns to chat_messages for v3.0
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS session_id UUID,
ADD COLUMN IF NOT EXISTS context_type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS reference_chunks TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS conversation_state JSONB DEFAULT '{}'::jsonb;

-- Add index for session queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_context_type ON public.chat_messages(context_type);

-- Comments
COMMENT ON COLUMN public.chat_messages.session_id IS 'Groups messages in the same conversation session';
COMMENT ON COLUMN public.chat_messages.context_type IS 'Type of message context (greeting, followup, analysis, gap, finalization, etc)';
COMMENT ON COLUMN public.chat_messages.reference_chunks IS 'IDs of knowledge chunks used to generate response';
COMMENT ON COLUMN public.chat_messages.conversation_state IS 'State tracking for gaps, topics, learning';