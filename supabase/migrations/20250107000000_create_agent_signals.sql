-- Criar tabela para sinais do Agente TradeVision IA
CREATE TABLE IF NOT EXISTS agent_signals (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('BUY', 'SELL', 'HOLD')),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  analysis TEXT NOT NULL,
  pattern TEXT,
  price TEXT,
  risk TEXT,
  technical_data JSONB,
  market_context JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_agent_signals_symbol ON agent_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_agent_signals_timeframe ON agent_signals(timeframe);
CREATE INDEX IF NOT EXISTS idx_agent_signals_created_at ON agent_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_signals_user_id ON agent_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_signals_signal_type ON agent_signals(signal_type);

-- RLS (Row Level Security)
ALTER TABLE agent_signals ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver apenas seus próprios sinais
CREATE POLICY "Users can view their own agent signals" ON agent_signals
  FOR SELECT USING (auth.uid() = user_id);

-- Política: usuários podem inserir seus próprios sinais
CREATE POLICY "Users can insert their own agent signals" ON agent_signals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: usuários podem atualizar seus próprios sinais
CREATE POLICY "Users can update their own agent signals" ON agent_signals
  FOR UPDATE USING (auth.uid() = user_id);

-- Política: usuários podem deletar seus próprios sinais
CREATE POLICY "Users can delete their own agent signals" ON agent_signals
  FOR DELETE USING (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON TABLE agent_signals IS 'Sinais gerados pelo Agente TradeVision IA em análise independente';
COMMENT ON COLUMN agent_signals.id IS 'ID único do sinal';
COMMENT ON COLUMN agent_signals.symbol IS 'Par de moedas analisado (ex: BTC/USDT)';
COMMENT ON COLUMN agent_signals.timeframe IS 'Timeframe da análise (ex: 3m, 5m, 15m)';
COMMENT ON COLUMN agent_signals.signal_type IS 'Tipo do sinal: BUY, SELL ou HOLD';
COMMENT ON COLUMN agent_signals.confidence IS 'Confiança do sinal (0-100)';
COMMENT ON COLUMN agent_signals.analysis IS 'Análise detalhada do Agente';
COMMENT ON COLUMN agent_signals.pattern IS 'Padrão detectado no mercado';
COMMENT ON COLUMN agent_signals.price IS 'Preço no momento da análise';
COMMENT ON COLUMN agent_signals.risk IS 'Nível de risco do sinal';
COMMENT ON COLUMN agent_signals.technical_data IS 'Dados técnicos utilizados (RSI, MACD, EMAs, etc.)';
COMMENT ON COLUMN agent_signals.market_context IS 'Contexto do mercado (volume, volatilidade, tendência)';
COMMENT ON COLUMN agent_signals.user_id IS 'ID do usuário que gerou o sinal';
COMMENT ON COLUMN agent_signals.created_at IS 'Timestamp de criação do sinal';
