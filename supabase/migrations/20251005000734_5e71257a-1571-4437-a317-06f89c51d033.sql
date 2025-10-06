-- Tabela M1: Captura a cada 1 minuto
CREATE TABLE public.market_m1 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL DEFAULT 'M1',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Dados de mercado
  open NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  close NUMERIC NOT NULL,
  volume NUMERIC NOT NULL,
  
  -- Análise instantânea
  direction TEXT, -- 'bullish', 'bearish', 'neutral'
  volatility_level TEXT, -- 'low', 'medium', 'high', 'extreme'
  volume_spike BOOLEAN DEFAULT false,
  
  -- Indicadores técnicos
  rsi_14 NUMERIC,
  ema_9 NUMERIC,
  ema_20 NUMERIC,
  
  -- Padrões detectados
  patterns_detected JSONB DEFAULT '[]'::jsonb,
  
  -- Resumo textual curto
  micro_insight TEXT,
  
  -- Probabilidade de continuação
  continuation_probability NUMERIC,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela M5: Resumo de 5 minutos (analisa últimos 5 M1)
CREATE TABLE public.market_m5 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL DEFAULT 'M5',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Dados consolidados
  open NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  close NUMERIC NOT NULL,
  total_volume NUMERIC NOT NULL,
  
  -- Aprendizado tático
  predominant_direction TEXT,
  avg_probability NUMERIC,
  trend_strength NUMERIC, -- 0-100
  
  -- Padrões identificados
  micro_trend_pattern TEXT, -- 'continuation', 'reversal', 'consolidation'
  pattern_confidence NUMERIC,
  
  -- Resumo dos 5 M1
  m1_summary JSONB, -- array com IDs e insights dos últimos 5 M1
  
  -- Aprendizado
  false_signals_count INTEGER DEFAULT 0,
  true_signals_count INTEGER DEFAULT 0,
  
  -- Insight consolidado
  tactical_insight TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela M15: Resumo de 15 minutos (analisa últimos 3 M5)
CREATE TABLE public.market_m15 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL DEFAULT 'M15',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Dados consolidados
  open NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  close NUMERIC NOT NULL,
  total_volume NUMERIC NOT NULL,
  
  -- Aprendizado contextual
  trend_direction TEXT,
  trend_consistency NUMERIC, -- 0-100, quão consistente é a tendência
  support_level NUMERIC,
  resistance_level NUMERIC,
  
  -- Detecção de padrão maior
  major_pattern TEXT, -- 'bullish_structure', 'bearish_structure', 'range'
  pattern_maturity NUMERIC, -- 0-100, quão maduro/completo está o padrão
  
  -- Resumo dos 3 M5
  m5_summary JSONB,
  
  -- Fluxo institucional
  institutional_flow TEXT, -- 'accumulation', 'distribution', 'neutral'
  
  -- Insight contextual
  contextual_insight TEXT,
  
  -- Calibração de indicadores
  indicator_weights JSONB DEFAULT '{}'::jsonb, -- pesos ajustados de cada indicador
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela M30: Resumo de 30 minutos (analisa últimos 2 M15)
CREATE TABLE public.market_m30 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL DEFAULT 'M30',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Dados consolidados
  open NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  close NUMERIC NOT NULL,
  total_volume NUMERIC NOT NULL,
  
  -- Aprendizado estratégico
  macro_trend TEXT, -- 'strong_bullish', 'bullish', 'neutral', 'bearish', 'strong_bearish'
  noise_filtered BOOLEAN DEFAULT false,
  
  -- Panorama macro
  market_phase TEXT, -- 'accumulation', 'markup', 'distribution', 'markdown'
  cycle_position NUMERIC, -- 0-100, posição no ciclo
  
  -- Resumo dos 2 M15
  m15_summary JSONB,
  
  -- Confluências validadas
  validated_confluences JSONB DEFAULT '[]'::jsonb,
  
  -- Previsão temporal
  expected_reaction_time INTEGER, -- minutos esperados para reação
  
  -- Insight estratégico
  strategic_insight TEXT,
  
  -- Performance histórica
  recent_accuracy NUMERIC, -- % de acerto das últimas previsões
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_market_m1_symbol_timestamp ON public.market_m1(symbol, timestamp DESC);
CREATE INDEX idx_market_m5_symbol_timestamp ON public.market_m5(symbol, timestamp DESC);
CREATE INDEX idx_market_m15_symbol_timestamp ON public.market_m15(symbol, timestamp DESC);
CREATE INDEX idx_market_m30_symbol_timestamp ON public.market_m30(symbol, timestamp DESC);

-- RLS Policies - Todos podem ler, apenas sistema pode escrever
ALTER TABLE public.market_m1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_m5 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_m15 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_m30 ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura
CREATE POLICY "Anyone can read M1 data" ON public.market_m1 FOR SELECT USING (true);
CREATE POLICY "Anyone can read M5 data" ON public.market_m5 FOR SELECT USING (true);
CREATE POLICY "Anyone can read M15 data" ON public.market_m15 FOR SELECT USING (true);
CREATE POLICY "Anyone can read M30 data" ON public.market_m30 FOR SELECT USING (true);

-- Políticas de escrita (apenas sistema/backend)
CREATE POLICY "System can insert M1 data" ON public.market_m1 FOR INSERT WITH CHECK (true);
CREATE POLICY "System can insert M5 data" ON public.market_m5 FOR INSERT WITH CHECK (true);
CREATE POLICY "System can insert M15 data" ON public.market_m15 FOR INSERT WITH CHECK (true);
CREATE POLICY "System can insert M30 data" ON public.market_m30 FOR INSERT WITH CHECK (true);