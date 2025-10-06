-- ============================================
-- SISTEMA DE ROLES E ADMIN
-- ============================================

-- Criar enum de roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'premium');

-- Tabela de roles dos usuários
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Função segura para verificar roles (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS na tabela de roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Apenas admins podem inserir roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- CHAT E MENSAGENS
-- ============================================

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Usuários veem suas próprias mensagens
CREATE POLICY "Users can view own messages"
ON public.chat_messages FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem inserir suas próprias mensagens
CREATE POLICY "Users can insert own messages"
ON public.chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins veem todas as mensagens
CREATE POLICY "Admins can view all messages"
ON public.chat_messages FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- BASE DE CONHECIMENTO DO BOT
-- ============================================

CREATE TABLE public.bot_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL, -- 'wyckoff', 'halving', 'etf', 'patterns', etc
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  examples JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  accuracy_score DECIMAL DEFAULT 0.0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.bot_knowledge ENABLE ROW LEVEL SECURITY;

-- Todos podem ler conhecimento
CREATE POLICY "Everyone can read knowledge"
ON public.bot_knowledge FOR SELECT
USING (true);

-- Apenas admins podem editar
CREATE POLICY "Admins can manage knowledge"
ON public.bot_knowledge FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- ANÁLISES DO BOT (histórico de trades)
-- ============================================

CREATE TABLE public.trade_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  analysis_type TEXT NOT NULL, -- 'screenshot', 'live', 'narrator'
  pattern_detected TEXT,
  entry_price DECIMAL,
  stop_loss DECIMAL,
  take_profit DECIMAL,
  probability DECIMAL,
  confidence_score DECIMAL,
  market_context JSONB DEFAULT '{}'::jsonb,
  result TEXT, -- 'win', 'loss', 'pending'
  feedback_score INTEGER, -- 1-5 stars do usuário
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.trade_analysis ENABLE ROW LEVEL SECURITY;

-- Usuários veem suas próprias análises
CREATE POLICY "Users can view own analysis"
ON public.trade_analysis FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem inserir suas análises
CREATE POLICY "Users can insert own analysis"
ON public.trade_analysis FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar feedback
CREATE POLICY "Users can update own analysis"
ON public.trade_analysis FOR UPDATE
USING (auth.uid() = user_id);

-- Admins veem tudo
CREATE POLICY "Admins can view all analysis"
ON public.trade_analysis FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- FEEDBACK DO NARRADOR
-- ============================================

CREATE TABLE public.narrator_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_id UUID, -- referência ao sinal do narrador
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  was_accurate BOOLEAN,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.narrator_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert feedback"
ON public.narrator_feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
ON public.narrator_feedback FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bot_knowledge_updated_at
BEFORE UPDATE ON public.bot_knowledge
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trade_analysis_updated_at
BEFORE UPDATE ON public.trade_analysis
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- POPULAR CONHECIMENTO INICIAL
-- ============================================

INSERT INTO public.bot_knowledge (category, topic, content, examples) VALUES
('wyckoff', 'Spring Pattern', 
 'Spring é uma varrida abaixo da estrutura seguida de retorno imediato. Sinaliza acumulação institucional e possível reversão de tendência.',
 '[{"symbol": "BTC/USD", "date": "2023-03-10", "context": "Spring em 18.900 após range de acumulação, retorno acima de 19.700"}]'::jsonb),

('wyckoff', 'BOS - Break of Structure',
 'Quebra da estrutura prévia confirma mudança de intenção institucional. Em tendência de alta, rompe topo anterior; em baixa, rompe fundo anterior.',
 '[]'::jsonb),

('halving', 'Bitcoin Halving Cycle',
 'Evento a cada ~4 anos reduzindo recompensa de mineração pela metade. Historicamente precede bull runs 12-18 meses depois devido à escassez de oferta.',
 '[{"year": 2020, "price_before": 8500, "top": 69000, "months_to_top": 18}]'::jsonb),

('etf', 'ETF Impact',
 'ETFs spot compram BTC real, drenando liquidez do mercado. Fluxos positivos de ETF geralmente antecedem movimentos de alta.',
 '[]'::jsonb),

('liquidez', 'Caça à Liquidez',
 'Mercado move-se para onde há liquidez (stops). Rompimentos falsos (fake breaks) servem para capturar ordens contrárias antes do movimento real.',
 '[]'::jsonb),

('gestao', 'Stop Técnico',
 'Stop deve ser posicionado abaixo da estrutura + buffer de ATR. Stop muito próximo é capturado por ruído; muito longe aumenta risco desnecessariamente.',
 '[]'::jsonb);

-- ============================================
-- FUNÇÃO PARA INCREMENTAR USO DE CONHECIMENTO
-- ============================================

CREATE OR REPLACE FUNCTION public.increment_knowledge_usage(knowledge_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.bot_knowledge
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = knowledge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;