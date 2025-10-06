-- Feature Store para armazenar todas as features calculadas
CREATE TABLE market_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  timeframe text NOT NULL,
  timestamp timestamptz NOT NULL,
  
  -- OHLCV
  open numeric NOT NULL,
  high numeric NOT NULL,
  low numeric NOT NULL,
  close numeric NOT NULL,
  volume numeric NOT NULL,
  
  -- Indicadores Técnicos
  ema_9 numeric,
  ema_20 numeric,
  ema_50 numeric,
  ema_200 numeric,
  rsi_14 numeric,
  macd numeric,
  macd_signal numeric,
  macd_histogram numeric,
  atr_14 numeric,
  vwap numeric,
  adx numeric,
  bollinger_upper numeric,
  bollinger_middle numeric,
  bollinger_lower numeric,
  
  -- Volume Analysis
  volume_ma numeric,
  volume_z_score numeric,
  volume_spike boolean DEFAULT false,
  
  -- Market Structure
  order_block_detected boolean DEFAULT false,
  order_block_type text, -- 'bullish' ou 'bearish'
  fvg_detected boolean DEFAULT false,
  fvg_type text,
  spring_detected boolean DEFAULT false,
  upthrust_detected boolean DEFAULT false,
  bos_detected boolean DEFAULT false, -- Break of Structure
  choch_detected boolean DEFAULT false, -- Change of Character
  liquidity_sweep boolean DEFAULT false,
  
  -- Support/Resistance
  support_level numeric,
  resistance_level numeric,
  distance_to_support numeric,
  distance_to_resistance numeric,
  
  -- Patterns & Signals
  pattern_name text,
  signal_type text, -- 'BUY', 'SELL', 'NEUTRAL'
  confidence_score numeric, -- 0-100
  
  -- Labels (para treino ML futuro)
  labels jsonb, -- { target_hit: bool, pnl: number, direction: string }
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_market_features_symbol_time ON market_features(symbol, timeframe, timestamp DESC);
CREATE INDEX idx_market_features_timestamp ON market_features USING BRIN(timestamp);
CREATE INDEX idx_market_features_patterns ON market_features(symbol, timeframe) 
  WHERE order_block_detected = true OR fvg_detected = true OR spring_detected = true;

-- Tabela para rastrear resultados de sinais (para aprendizado)
CREATE TABLE signal_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id uuid REFERENCES market_features(id),
  user_id uuid,
  
  signal_type text NOT NULL,
  entry_price numeric NOT NULL,
  exit_price numeric,
  stop_loss numeric,
  take_profit numeric,
  
  status text DEFAULT 'open', -- 'open', 'win', 'loss', 'breakeven'
  pnl numeric,
  pnl_percent numeric,
  
  entry_time timestamptz NOT NULL,
  exit_time timestamptz,
  duration_minutes integer,
  
  feedback_score integer, -- 1-5 do usuário
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_signal_results_user ON signal_results(user_id, status);
CREATE INDEX idx_signal_results_feature ON signal_results(feature_id);

-- RLS Policies
ALTER TABLE market_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_results ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ler features (dados públicos de mercado)
CREATE POLICY "Anyone can read market features"
ON market_features FOR SELECT
USING (true);

-- Sistema pode inserir features
CREATE POLICY "System can insert features"
ON market_features FOR INSERT
WITH CHECK (true);

-- Usuários podem ler seus próprios resultados
CREATE POLICY "Users can read own signal results"
ON signal_results FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Usuários podem inserir seus resultados
CREATE POLICY "Users can insert signal results"
ON signal_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus resultados
CREATE POLICY "Users can update own signal results"
ON signal_results FOR UPDATE
USING (auth.uid() = user_id);