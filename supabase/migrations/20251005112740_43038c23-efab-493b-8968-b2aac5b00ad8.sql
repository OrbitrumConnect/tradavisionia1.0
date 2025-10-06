-- ============================================
-- SISTEMA DE APRENDIZADO COMPLETO DO NARRADOR
-- Habilita auto-validação e evolução neural
-- ============================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. CRON: Auto-validação de sinais (a cada 5 minutos)
SELECT cron.schedule(
  'auto-validate-signals',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://krjpvdllsbxeuuncmitt.supabase.co/functions/v1/signal-validator',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyanB2ZGxsc2J4ZXV1bmNtaXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODA0MzksImV4cCI6MjA3NTE1NjQzOX0.5pnSaFe5URJmfE_DdKCsInPsIBCbKsCZCQ-yzarIwDk"}'::jsonb,
    body := '{"trigger": "cron"}'::jsonb
  ) AS request_id;
  $$
);

-- 3. CRON: Compressão semântica de padrões (a cada 1 hora)
SELECT cron.schedule(
  'semantic-compression',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://krjpvdllsbxeuuncmitt.supabase.co/functions/v1/semantic-compressor',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyanB2ZGxsc2J4ZXV1bmNtaXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODA0MzksImV4cCI6MjA3NTE1NjQzOX0.5pnSaFe5URJmfE_DdKCsInPsIBCbKsCZCQ-yzarIwDk"}'::jsonb,
    body := '{"trigger": "cron"}'::jsonb
  ) AS request_id;
  $$
);

-- 4. CRON: Confiança adaptativa (a cada 30 minutos)
SELECT cron.schedule(
  'adaptive-confidence',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://krjpvdllsbxeuuncmitt.supabase.co/functions/v1/adaptive-confidence',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyanB2ZGxsc2J4ZXV1bmNtaXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODA0MzksImV4cCI6MjA3NTE1NjQzOX0.5pnSaFe5URJmfE_DdKCsInPsIBCbKsCZCQ-yzarIwDk"}'::jsonb,
    body := '{"trigger": "cron"}'::jsonb
  ) AS request_id;
  $$
);

-- 5. Função para atualizar pattern_weights baseado em feedback real
CREATE OR REPLACE FUNCTION update_pattern_learning()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pattern_record RECORD;
  new_weights JSONB := '{}';
  pattern_name TEXT;
  success_rate NUMERIC;
  total_count INTEGER;
BEGIN
  -- Calcular taxa de sucesso por padrão baseado em feedback
  FOR pattern_record IN
    SELECT 
      ns.pattern,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE nf.was_accurate = true) as successes,
      ROUND(
        COALESCE(
          COUNT(*) FILTER (WHERE nf.was_accurate = true)::NUMERIC / NULLIF(COUNT(*), 0),
          0.5
        ), 
        2
      ) as weight
    FROM narrator_signals ns
    LEFT JOIN narrator_feedback nf ON nf.signal_id = ns.id
    WHERE ns.created_at > NOW() - INTERVAL '7 days'
    GROUP BY ns.pattern
  LOOP
    pattern_name := pattern_record.pattern;
    success_rate := pattern_record.weight;
    total_count := pattern_record.total;
    
    -- Só incluir padrões com pelo menos 5 ocorrências
    IF total_count >= 5 THEN
      new_weights := jsonb_set(
        new_weights,
        ARRAY[pattern_name],
        jsonb_build_object(
          'weight', success_rate,
          'total', total_count,
          'successes', pattern_record.successes,
          'updated_at', NOW()
        )
      );
    END IF;
  END LOOP;

  -- Atualizar estado neural para BTC/USDT
  INSERT INTO tradevision_state (symbol, pattern_weights, updated_at)
  VALUES ('BTC/USDT', new_weights, NOW())
  ON CONFLICT (symbol) 
  DO UPDATE SET 
    pattern_weights = new_weights,
    updated_at = NOW();

  RAISE NOTICE 'Pattern learning atualizado: % padrões', jsonb_object_keys(new_weights);
END;
$$;

-- 6. CRON: Atualizar aprendizado de padrões (a cada 15 minutos)
SELECT cron.schedule(
  'update-pattern-learning',
  '*/15 * * * *',
  $$
  SELECT update_pattern_learning();
  $$
);