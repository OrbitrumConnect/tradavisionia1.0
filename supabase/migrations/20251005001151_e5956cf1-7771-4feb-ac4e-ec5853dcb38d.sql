-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Agendar processamento M5 a cada 5 minutos
SELECT cron.schedule(
  'process-m5-timeframe',
  '*/5 * * * *', -- A cada 5 minutos
  $$
  SELECT net.http_post(
    url := 'https://krjpvdllsbxeuuncmitt.supabase.co/functions/v1/temporal-processor-m5',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyanB2ZGxsc2J4ZXV1bmNtaXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODA0MzksImV4cCI6MjA3NTE1NjQzOX0.5pnSaFe5URJmfE_DdKCsInPsIBCbKsCZCQ-yzarIwDk"}'::jsonb,
    body := '{"symbol": "BTC/USDT"}'::jsonb
  ) AS request_id;
  $$
);

-- Agendar processamento M15 a cada 15 minutos
SELECT cron.schedule(
  'process-m15-timeframe',
  '*/15 * * * *', -- A cada 15 minutos
  $$
  SELECT net.http_post(
    url := 'https://krjpvdllsbxeuuncmitt.supabase.co/functions/v1/temporal-processor-m15',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyanB2ZGxsc2J4ZXV1bmNtaXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODA0MzksImV4cCI6MjA3NTE1NjQzOX0.5pnSaFe5URJmfE_DdKCsInPsIBCbKsCZCQ-yzarIwDk"}'::jsonb,
    body := '{"symbol": "BTC/USDT"}'::jsonb
  ) AS request_id;
  $$
);

-- Agendar processamento M30 a cada 30 minutos
SELECT cron.schedule(
  'process-m30-timeframe',
  '*/30 * * * *', -- A cada 30 minutos
  $$
  SELECT net.http_post(
    url := 'https://krjpvdllsbxeuuncmitt.supabase.co/functions/v1/temporal-processor-m30',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyanB2ZGxsc2J4ZXV1bmNtaXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODA0MzksImV4cCI6MjA3NTE1NjQzOX0.5pnSaFe5URJmfE_DdKCsInPsIBCbKsCZCQ-yzarIwDk"}'::jsonb,
    body := '{"symbol": "BTC/USDT"}'::jsonb
  ) AS request_id;
  $$
);