-- 1️⃣ Sistema de Autoaprendizado de Precisão (Weight Feedback System)
CREATE TABLE IF NOT EXISTS public.tradevision_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID REFERENCES public.narrator_signals(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  expected_result TEXT NOT NULL,
  actual_result TEXT,
  accuracy_weight NUMERIC DEFAULT 0.5,
  confidence_score NUMERIC,
  metadata JSONB DEFAULT '{}',
  evaluated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para consultas rápidas por padrão
CREATE INDEX idx_tradevision_feedback_pattern ON public.tradevision_feedback(pattern, timeframe);
CREATE INDEX idx_tradevision_feedback_signal ON public.tradevision_feedback(signal_id);

-- 2️⃣ Memória Neural Entre Sessões
CREATE TABLE IF NOT EXISTS public.tradevision_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  market_bias TEXT,
  avg_accuracy NUMERIC DEFAULT 0.0,
  last_volume_profile JSONB DEFAULT '{}',
  dominant_pattern TEXT,
  user_style TEXT,
  pattern_weights JSONB DEFAULT '{}',
  timeframe_accuracy JSONB DEFAULT '{}',
  trend_duration JSONB DEFAULT '{}',
  last_trend_change TIMESTAMP WITH TIME ZONE,
  session_insights TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(symbol)
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_tradevision_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tradevision_state_updated_at
  BEFORE UPDATE ON public.tradevision_state
  FOR EACH ROW
  EXECUTE FUNCTION update_tradevision_state_updated_at();

-- 3️⃣ Histórico Temporal Multi-Frame para Aprendizado Longitudinal
CREATE TABLE IF NOT EXISTS public.temporal_learning_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  price NUMERIC NOT NULL,
  trend_m1 TEXT,
  trend_m5 TEXT,
  trend_m15 TEXT,
  trend_m30 TEXT,
  consolidated_trend TEXT,
  trend_score NUMERIC,
  final_decision TEXT,
  accuracy_feedback NUMERIC,
  patterns_detected JSONB DEFAULT '[]',
  volume_profile JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para consultas temporais
CREATE INDEX idx_temporal_learning_symbol_time ON public.temporal_learning_history(symbol, timestamp DESC);

-- 4️⃣ Tabela de Performance por Timeframe (Aprendizado Temporal Dinâmico)
CREATE TABLE IF NOT EXISTS public.timeframe_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  pattern TEXT NOT NULL,
  total_signals INTEGER DEFAULT 0,
  correct_signals INTEGER DEFAULT 0,
  accuracy_rate NUMERIC DEFAULT 0.0,
  avg_confidence NUMERIC DEFAULT 0.0,
  anticipation_score NUMERIC DEFAULT 0.0,
  last_evaluation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(symbol, timeframe, pattern)
);

-- Index para consultas de performance
CREATE INDEX idx_timeframe_performance_lookup ON public.timeframe_performance(symbol, timeframe, pattern);

-- 5️⃣ Função para calcular score consolidado multi-frame
CREATE OR REPLACE FUNCTION calculate_consolidated_trend_score(
  m1_trend TEXT,
  m5_trend TEXT,
  m15_trend TEXT,
  m30_trend TEXT
)
RETURNS NUMERIC AS $$
DECLARE
  score NUMERIC := 0;
  bullish_count INTEGER := 0;
  bearish_count INTEGER := 0;
BEGIN
  -- Contar tendências de alta
  IF m1_trend = 'bullish' THEN bullish_count := bullish_count + 1; END IF;
  IF m5_trend = 'bullish' THEN bullish_count := bullish_count + 1; END IF;
  IF m15_trend = 'bullish' THEN bullish_count := bullish_count + 1; END IF;
  IF m30_trend = 'bullish' THEN bullish_count := bullish_count + 1; END IF;
  
  -- Contar tendências de baixa
  IF m1_trend = 'bearish' THEN bearish_count := bearish_count + 1; END IF;
  IF m5_trend = 'bearish' THEN bearish_count := bearish_count + 1; END IF;
  IF m15_trend = 'bearish' THEN bearish_count := bearish_count + 1; END IF;
  IF m30_trend = 'bearish' THEN bearish_count := bearish_count + 1; END IF;
  
  -- Calcular score ponderado (-100 a +100)
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
$$ LANGUAGE plpgsql;

-- 6️⃣ Função para atualizar pesos de padrões baseado em feedback
CREATE OR REPLACE FUNCTION update_pattern_weights(p_symbol TEXT)
RETURNS VOID AS $$
DECLARE
  pattern_record RECORD;
  new_weights JSONB := '{}';
BEGIN
  -- Calcular accuracy por padrão
  FOR pattern_record IN
    SELECT 
      pattern,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE actual_result = expected_result) as correct,
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
  
  -- Atualizar state
  INSERT INTO public.tradevision_state (symbol, pattern_weights)
  VALUES (p_symbol, new_weights)
  ON CONFLICT (symbol) 
  DO UPDATE SET 
    pattern_weights = new_weights,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.tradevision_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tradevision_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporal_learning_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeframe_performance ENABLE ROW LEVEL SECURITY;

-- Políticas para feedback
CREATE POLICY "System can insert feedback" ON public.tradevision_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read feedback" ON public.tradevision_feedback FOR SELECT USING (true);
CREATE POLICY "System can update feedback" ON public.tradevision_feedback FOR UPDATE USING (true);

-- Políticas para state
CREATE POLICY "System can manage state" ON public.tradevision_state FOR ALL USING (true);

-- Políticas para histórico
CREATE POLICY "System can insert history" ON public.temporal_learning_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read history" ON public.temporal_learning_history FOR SELECT USING (true);

-- Políticas para performance
CREATE POLICY "System can manage performance" ON public.timeframe_performance FOR ALL USING (true);