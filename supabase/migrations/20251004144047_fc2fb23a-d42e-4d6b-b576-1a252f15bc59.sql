-- Criar tabela para histórico de sinais do narrador
CREATE TABLE public.narrator_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('BUY', 'SELL')),
  probability INTEGER NOT NULL,
  pattern TEXT NOT NULL,
  figure TEXT,
  risk_note TEXT,
  price TEXT NOT NULL,
  news TEXT,
  market_status TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.narrator_signals ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own signals"
ON public.narrator_signals
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own signals"
ON public.narrator_signals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all signals"
ON public.narrator_signals
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Índice para performance
CREATE INDEX idx_narrator_signals_user_created ON public.narrator_signals(user_id, created_at DESC);
CREATE INDEX idx_narrator_signals_symbol ON public.narrator_signals(symbol, created_at DESC);