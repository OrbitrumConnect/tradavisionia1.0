-- Habilitar realtime para proactive_alerts
ALTER TABLE proactive_alerts REPLICA IDENTITY FULL;

-- Adicionar tabela à publicação realtime (se já não estiver)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'proactive_alerts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE proactive_alerts;
  END IF;
END $$;