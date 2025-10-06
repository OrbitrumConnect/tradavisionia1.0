-- Add feedback fields to chat_messages table
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS feedback_score INTEGER CHECK (feedback_score BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS feedback_notes TEXT,
ADD COLUMN IF NOT EXISTS feedback_timestamp TIMESTAMP WITH TIME ZONE;

-- Add index for feedback queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_feedback 
ON public.chat_messages(feedback_score) 
WHERE feedback_score IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.chat_messages.feedback_score IS 'User rating from 1 (poor) to 5 (excellent)';
COMMENT ON COLUMN public.chat_messages.feedback_notes IS 'Optional user notes about the response quality';
COMMENT ON COLUMN public.chat_messages.feedback_timestamp IS 'When the feedback was provided';