-- Criar tabela para armazenar trades do TradeVision IA
CREATE TABLE IF NOT EXISTS public.ai_trades (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    symbol TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    trade_type TEXT NOT NULL CHECK (trade_type IN ('BUY', 'SELL')),
    entry_price TEXT NOT NULL,
    exit_price TEXT,
    stop_loss TEXT NOT NULL,
    take_profit TEXT NOT NULL,
    size TEXT NOT NULL,
    leverage INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('OPEN', 'CLOSED')),
    result TEXT CHECK (result IN ('WIN', 'LOSS', 'NEUTRAL')),
    pnl DECIMAL,
    reason TEXT,
    action TEXT NOT NULL CHECK (action IN ('OPEN', 'CLOSE')),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    exit_timestamp TIMESTAMP WITH TIME ZONE,
    brazil_time TEXT,
    technical_context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_trades_user_id ON public.ai_trades (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_trades_symbol ON public.ai_trades (symbol);
CREATE INDEX IF NOT EXISTS idx_ai_trades_status ON public.ai_trades (status);
CREATE INDEX IF NOT EXISTS idx_ai_trades_result ON public.ai_trades (result);
CREATE INDEX IF NOT EXISTS idx_ai_trades_timestamp ON public.ai_trades (timestamp);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_ai_trades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_ai_trades_updated_at
    BEFORE UPDATE ON public.ai_trades
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_trades_updated_at();

-- Política RLS (Row Level Security)
ALTER TABLE public.ai_trades ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados
CREATE POLICY "Users can manage their own ai_trades" ON public.ai_trades
    FOR ALL USING (auth.uid() = user_id);
