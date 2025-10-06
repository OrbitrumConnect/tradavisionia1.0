-- Habilitar extensão pgvector para embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Adicionar coluna de embeddings nas mensagens para busca semântica
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS embedding vector(384);

-- Criar índice para busca rápida por similaridade
CREATE INDEX IF NOT EXISTS chat_messages_embedding_idx ON public.chat_messages 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Comentário explicativo
COMMENT ON COLUMN public.chat_messages.embedding IS 'Vector embedding da mensagem para busca semântica (384 dimensões do modelo all-MiniLM-L6-v2)';
