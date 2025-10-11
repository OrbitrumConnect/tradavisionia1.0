-- ========== SISTEMA DE FEEDS COMPARTILHADOS ==========
-- Estrutura para comunicação entre Narrador IA, Agente IA e Meta Chat

-- 1️⃣ FEED DO NARRADOR IA
CREATE TABLE IF NOT EXISTS public.narrator_output (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  pattern_detected TEXT,
  pattern_type TEXT,
  indicators JSONB DEFAULT '{}',
  market_data JSONB DEFAULT '{}',
  narrator_text TEXT NOT NULL,
  confidence_score NUMERIC DEFAULT 0,
  processed_flag BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_narrator_output_timestamp ON public.narrator_output(timestamp DESC);
CREATE INDEX idx_narrator_output_symbol ON public.narrator_output(symbol);
CREATE INDEX idx_narrator_output_processed ON public.narrator_output(processed_flag);

-- 2️⃣ FEED DO AGENTE IA
CREATE TABLE IF NOT EXISTS public.agent_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  narrator_id UUID REFERENCES public.narrator_output(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  insight_type TEXT NOT NULL, -- 'learning', 'adjustment', 'suggestion', 'analysis'
  insight_text TEXT NOT NULL,
  adjustment_weights JSONB DEFAULT '{}',
  action_suggestion TEXT,
  confidence_score NUMERIC DEFAULT 0,
  processed_flag BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_agent_insights_timestamp ON public.agent_insights(timestamp DESC);
CREATE INDEX idx_agent_insights_narrator_id ON public.agent_insights(narrator_id);
CREATE INDEX idx_agent_insights_processed ON public.agent_insights(processed_flag);

-- 3️⃣ META CHAT - CONSOLIDAÇÃO
CREATE TABLE IF NOT EXISTS public.meta_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  narrator_id UUID REFERENCES public.narrator_output(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agent_insights(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  narrator_text TEXT NOT NULL,
  agent_text TEXT NOT NULL,
  combined_summary TEXT NOT NULL,
  learning_insights JSONB DEFAULT '{}',
  pattern_correlation JSONB DEFAULT '{}',
  learning_flag BOOLEAN DEFAULT FALSE,
  backtesting_triggered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_meta_chat_timestamp ON public.meta_chat_history(timestamp DESC);
CREATE INDEX idx_meta_chat_learning_flag ON public.meta_chat_history(learning_flag);
CREATE INDEX idx_meta_chat_symbol ON public.meta_chat_history(symbol);

-- 4️⃣ HISTÓRICO DE APRENDIZADO CONTÍNUO
CREATE TABLE IF NOT EXISTS public.learning_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  meta_chat_id UUID REFERENCES public.meta_chat_history(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  learning_type TEXT NOT NULL, -- 'pattern_analysis', 'weight_adjustment', 'backtesting', 'insight_generation'
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  success_rate NUMERIC DEFAULT 0,
  improvement_score NUMERIC DEFAULT 0,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_learning_history_timestamp ON public.learning_history(timestamp DESC);
CREATE INDEX idx_learning_history_type ON public.learning_history(learning_type);
CREATE INDEX idx_learning_history_symbol ON public.learning_history(symbol);

-- 5️⃣ TRIGGERS PARA AUTOMAÇÃO

-- Trigger: Quando narrador escreve, notificar agente
CREATE OR REPLACE FUNCTION notify_agent_on_narrator_output()
RETURNS TRIGGER AS $$
BEGIN
  -- Marcar como não processado para o agente
  NEW.processed_flag = FALSE;
  
  -- Notificar via WebSocket (se configurado)
  PERFORM pg_notify('narrator_output', json_build_object(
    'id', NEW.id,
    'symbol', NEW.symbol,
    'pattern', NEW.pattern_detected,
    'text', NEW.narrator_text
  )::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_agent_narrator
  AFTER INSERT ON public.narrator_output
  FOR EACH ROW
  EXECUTE FUNCTION notify_agent_on_narrator_output();

-- Trigger: Quando agente responde, notificar meta chat
CREATE OR REPLACE FUNCTION notify_meta_on_agent_insight()
RETURNS TRIGGER AS $$
BEGIN
  -- Marcar como não processado para o meta chat
  NEW.processed_flag = FALSE;
  
  -- Notificar via WebSocket (se configurado)
  PERFORM pg_notify('agent_insight', json_build_object(
    'id', NEW.id,
    'narrator_id', NEW.narrator_id,
    'insight_type', NEW.insight_type,
    'text', NEW.insight_text
  )::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_meta_agent
  AFTER INSERT ON public.agent_insights
  FOR EACH ROW
  EXECUTE FUNCTION notify_agent_on_narrator_output();

-- Trigger: Quando meta chat consolida, disparar aprendizado
CREATE OR REPLACE FUNCTION trigger_learning_on_meta_consolidation()
RETURNS TRIGGER AS $$
BEGIN
  -- Marcar para processamento de aprendizado
  NEW.learning_flag = TRUE;
  
  -- Notificar sistema de aprendizado
  PERFORM pg_notify('meta_consolidation', json_build_object(
    'id', NEW.id,
    'symbol', NEW.symbol,
    'narrator_text', NEW.narrator_text,
    'agent_text', NEW.agent_text,
    'summary', NEW.combined_summary
  )::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_learning_meta
  AFTER INSERT ON public.meta_chat_history
  FOR EACH ROW
  EXECUTE FUNCTION trigger_learning_on_meta_consolidation();

-- 6️⃣ VIEWS PARA DASHBOARD ADM

-- View: Feed consolidado em tempo real
CREATE OR REPLACE VIEW public.dashboard_feed AS
SELECT 
  n.id as narrator_id,
  n.timestamp,
  n.symbol,
  n.pattern_detected,
  n.narrator_text,
  n.confidence_score as narrator_confidence,
  a.id as agent_id,
  a.insight_type,
  a.insight_text,
  a.action_suggestion,
  a.confidence_score as agent_confidence,
  m.id as meta_id,
  m.combined_summary,
  m.learning_insights,
  CASE 
    WHEN m.id IS NOT NULL THEN 'consolidated'
    WHEN a.id IS NOT NULL THEN 'agent_processed'
    ELSE 'narrator_only'
  END as status
FROM public.narrator_output n
LEFT JOIN public.agent_insights a ON n.id = a.narrator_id
LEFT JOIN public.meta_chat_history m ON n.id = m.narrator_id
ORDER BY n.timestamp DESC;

-- View: Estatísticas de aprendizado
CREATE OR REPLACE VIEW public.learning_stats AS
SELECT 
  symbol,
  COUNT(*) as total_interactions,
  COUNT(CASE WHEN learning_flag = TRUE THEN 1 END) as learning_processed,
  AVG(confidence_score) as avg_confidence,
  MAX(timestamp) as last_interaction
FROM public.meta_chat_history
GROUP BY symbol
ORDER BY last_interaction DESC;

-- 7️⃣ POLÍTICAS RLS (Row Level Security)

-- Habilitar RLS
ALTER TABLE public.narrator_output ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_history ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados
CREATE POLICY "Users can view all feeds" ON public.narrator_output
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all agent insights" ON public.agent_insights
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all meta chat" ON public.meta_chat_history
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all learning history" ON public.learning_history
  FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas para inserção (sistema)
CREATE POLICY "System can insert narrator output" ON public.narrator_output
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert agent insights" ON public.agent_insights
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert meta chat" ON public.meta_chat_history
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert learning history" ON public.learning_history
  FOR INSERT WITH CHECK (true);
