-- Corrigir search_path nas funções para segurança

-- 1. Atualizar função de trend score
DROP FUNCTION IF EXISTS calculate_consolidated_trend_score(TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION calculate_consolidated_trend_score(
  m1_trend TEXT,
  m5_trend TEXT,
  m15_trend TEXT,
  m30_trend TEXT
)
RETURNS NUMERIC 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  score NUMERIC := 0;
BEGIN
  -- M1: 15%, M5: 25%, M15: 35%, M30: 25%
  IF m1_trend = 'bullish' THEN score := score + 15; 
  ELSIF m1_trend = 'bearish' THEN score := score - 15; END IF;
  
  IF m5_trend = 'bullish' THEN score := score + 25;
  ELSIF m5_trend = 'bearish' THEN score := score - 25; END IF;
  
  IF m15_trend = 'bullish' THEN score := score + 35;
  ELSIF m15_trend = 'bearish' THEN score := score - 35; END IF;
  
  IF m30_trend = 'bullish' THEN score := score + 25;
  ELSIF m30_trend = 'bearish' THEN score := score - 25; END IF;
  
  RETURN score;
END;
$$;

-- 2. Atualizar função de pattern weights
DROP FUNCTION IF EXISTS update_pattern_weights(TEXT);
CREATE OR REPLACE FUNCTION update_pattern_weights(p_symbol TEXT)
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pattern_record RECORD;
  new_weights JSONB := '{}';
BEGIN
  FOR pattern_record IN
    SELECT 
      pattern,
      CASE 
        WHEN COUNT(*) > 0 THEN 
          ROUND((COUNT(*) FILTER (WHERE actual_result = expected_result)::NUMERIC / COUNT(*)::NUMERIC), 2)
        ELSE 0.5
      END as weight
    FROM public.tradevision_feedback
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY pattern
  LOOP
    new_weights := jsonb_set(
      new_weights, 
      ARRAY[pattern_record.pattern], 
      to_jsonb(pattern_record.weight)
    );
  END LOOP;
  
  INSERT INTO public.tradevision_state (symbol, pattern_weights)
  VALUES (p_symbol, new_weights)
  ON CONFLICT (symbol) 
  DO UPDATE SET 
    pattern_weights = new_weights,
    updated_at = NOW();
END;
$$;

-- 3. Atualizar função update_tradevision_state_updated_at
DROP TRIGGER IF EXISTS tradevision_state_updated_at ON public.tradevision_state;
DROP FUNCTION IF EXISTS update_tradevision_state_updated_at();

CREATE OR REPLACE FUNCTION update_tradevision_state_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tradevision_state_updated_at
  BEFORE UPDATE ON public.tradevision_state
  FOR EACH ROW
  EXECUTE FUNCTION update_tradevision_state_updated_at();