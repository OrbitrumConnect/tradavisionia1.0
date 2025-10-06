-- Função para busca semântica por similaridade de embeddings
CREATE OR REPLACE FUNCTION match_messages(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  user_id_filter uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  role text,
  created_at timestamptz,
  metadata jsonb,
  feedback_score int,
  similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    chat_messages.id,
    chat_messages.content,
    chat_messages.role,
    chat_messages.created_at,
    chat_messages.metadata,
    chat_messages.feedback_score,
    1 - (chat_messages.embedding <=> query_embedding) AS similarity
  FROM chat_messages
  WHERE 
    chat_messages.embedding IS NOT NULL
    AND (user_id_filter IS NULL OR chat_messages.user_id = user_id_filter)
    AND 1 - (chat_messages.embedding <=> query_embedding) > match_threshold
  ORDER BY chat_messages.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;