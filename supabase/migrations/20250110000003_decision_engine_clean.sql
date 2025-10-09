-- ============================================================================
-- TRADEVISION IA v9.0 - NÚCLEO DE DECISÃO DINÂMICA (CLEAN INSTALL)
-- Limpa tentativas anteriores e cria tudo novo
-- ============================================================================

-- PRIMEIRO: Limpa tudo que possa ter ficado de tentativas anteriores
DROP TABLE IF EXISTS public.agent_background_tasks CASCADE;
DROP TABLE IF EXISTS public.agent_actions_plan CASCADE;
DROP TABLE IF EXISTS public.agent_priorities CASCADE;
DROP TABLE IF EXISTS public.agent_insights CASCADE;
DROP TABLE IF EXISTS public.agent_context CASCADE;
DROP TABLE IF EXISTS public.agent_memory CASCADE;

DROP FUNCTION IF EXISTS public.match_agent_memories CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_memories CASCADE;
DROP FUNCTION IF EXISTS public.update_memory_access CASCADE;

-- Habilita extensão vector se não existir
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- AGORA CRIA TUDO LIMPO
-- ============================================================================

-- 1. AGENT_MEMORY
CREATE TABLE public.agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('short_term', 'mid_term', 'long_term')),
  content TEXT NOT NULL,
  summary TEXT,
  embedding VECTOR(384),
  context JSONB DEFAULT '{}',
  importance_score FLOAT DEFAULT 0.5,
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  related_memories UUID[],
  tags TEXT[]
);

CREATE INDEX idx_agent_memory_user_id ON public.agent_memory(user_id);
CREATE INDEX idx_agent_memory_type ON public.agent_memory(memory_type);
CREATE INDEX idx_agent_memory_importance ON public.agent_memory(importance_score DESC);
CREATE INDEX idx_agent_memory_created ON public.agent_memory(created_at DESC);

ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_memory_select ON public.agent_memory 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY agent_memory_insert ON public.agent_memory 
  FOR INSERT WITH CHECK (true);
CREATE POLICY agent_memory_update ON public.agent_memory 
  FOR UPDATE USING (true);

-- 2. AGENT_CONTEXT
CREATE TABLE public.agent_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_state JSONB DEFAULT '{}',
  active_patterns TEXT[],
  signals_generated_today INTEGER DEFAULT 0,
  signals_validated INTEGER DEFAULT 0,
  win_rate_24h FLOAT DEFAULT 0,
  win_rate_7d FLOAT DEFAULT 0,
  sharpe_ratio FLOAT DEFAULT 0,
  user_behavior JSONB DEFAULT '{}',
  user_preferences JSONB DEFAULT '{}',
  current_focus TEXT,
  priority_level TEXT CHECK (priority_level IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'BACKGROUND')),
  recent_insights JSONB DEFAULT '[]',
  pending_actions JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  context_snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_context_user_id ON public.agent_context(user_id);
CREATE INDEX idx_agent_context_updated ON public.agent_context(updated_at DESC);

ALTER TABLE public.agent_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_context_select ON public.agent_context 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY agent_context_all ON public.agent_context 
  FOR ALL USING (true);

-- 3. AGENT_INSIGHTS
CREATE TABLE public.agent_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN (
    'correlation', 'pattern_discovery', 'performance_improvement',
    'risk_alert', 'opportunity', 'hypothesis_validation'
  )),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence FLOAT DEFAULT 0.5,
  data_points JSONB DEFAULT '{}',
  evidence TEXT[],
  validated BOOLEAN DEFAULT FALSE,
  validation_score FLOAT,
  user_feedback INTEGER,
  recommended_action TEXT,
  action_taken BOOLEAN DEFAULT FALSE,
  expected_impact TEXT,
  actual_impact JSONB,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  presented_to_user_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_agent_insights_user_id ON public.agent_insights(user_id);
CREATE INDEX idx_agent_insights_type ON public.agent_insights(insight_type);
CREATE INDEX idx_agent_insights_confidence ON public.agent_insights(confidence DESC);
CREATE INDEX idx_agent_insights_discovered ON public.agent_insights(discovered_at DESC);
CREATE INDEX idx_agent_insights_validated ON public.agent_insights(validated);

ALTER TABLE public.agent_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_insights_select ON public.agent_insights 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY agent_insights_all ON public.agent_insights 
  FOR ALL USING (true);

-- 4. AGENT_PRIORITIES
CREATE TABLE public.agent_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  priority TEXT NOT NULL CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'BACKGROUND')),
  priority_score INTEGER NOT NULL,
  task_type TEXT NOT NULL,
  task_description TEXT NOT NULL,
  task_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result JSONB,
  error TEXT,
  depends_on UUID[],
  blocks UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_priorities_user_id ON public.agent_priorities(user_id);
CREATE INDEX idx_agent_priorities_score ON public.agent_priorities(priority_score DESC);
CREATE INDEX idx_agent_priorities_status ON public.agent_priorities(status);
CREATE INDEX idx_agent_priorities_scheduled ON public.agent_priorities(scheduled_for);

ALTER TABLE public.agent_priorities ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_priorities_select ON public.agent_priorities 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY agent_priorities_all ON public.agent_priorities 
  FOR ALL USING (true);

-- 5. AGENT_ACTIONS_PLAN
CREATE TABLE public.agent_actions_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timeframe TEXT NOT NULL CHECK (timeframe IN ('5min', '1hour', '1day', '1week')),
  objective TEXT NOT NULL,
  actions JSONB DEFAULT '[]',
  based_on_data JSONB DEFAULT '{}',
  expected_outcomes JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'superseded', 'cancelled')),
  progress FLOAT DEFAULT 0.0,
  actual_outcomes JSONB,
  success_rate FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_agent_actions_plan_user_id ON public.agent_actions_plan(user_id);
CREATE INDEX idx_agent_actions_plan_timeframe ON public.agent_actions_plan(timeframe);
CREATE INDEX idx_agent_actions_plan_status ON public.agent_actions_plan(status);
CREATE INDEX idx_agent_actions_plan_created ON public.agent_actions_plan(created_at DESC);

ALTER TABLE public.agent_actions_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_actions_plan_select ON public.agent_actions_plan 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY agent_actions_plan_all ON public.agent_actions_plan 
  FOR ALL USING (true);

-- 6. AGENT_BACKGROUND_TASKS
CREATE TABLE public.agent_background_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  task_description TEXT,
  task_type TEXT CHECK (task_type IN (
    'correlation_analysis', 'pattern_mining', 'hypothesis_testing',
    'scenario_simulation', 'insight_generation', 'knowledge_consolidation'
  )),
  input_data JSONB DEFAULT '{}',
  output_data JSONB,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  progress INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  discoveries JSONB,
  insights_generated INTEGER DEFAULT 0,
  error TEXT,
  run_frequency TEXT,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_background_tasks_user_id ON public.agent_background_tasks(user_id);
CREATE INDEX idx_agent_background_tasks_status ON public.agent_background_tasks(status);
CREATE INDEX idx_agent_background_tasks_next_run ON public.agent_background_tasks(next_run_at);
CREATE INDEX idx_agent_background_tasks_type ON public.agent_background_tasks(task_type);

ALTER TABLE public.agent_background_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_background_tasks_select ON public.agent_background_tasks 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY agent_background_tasks_all ON public.agent_background_tasks 
  FOR ALL USING (true);

-- ============================================================================
-- FUNÇÕES AUXILIARES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.match_agent_memories(
  query_embedding VECTOR(384),
  match_user_id UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  memory_type TEXT,
  importance_score FLOAT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.memory_type,
    m.importance_score,
    0.5::FLOAT AS similarity
  FROM public.agent_memory m
  WHERE m.user_id = match_user_id
  ORDER BY m.importance_score DESC
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_memories()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.agent_memory
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_memory_access()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed_at := NOW();
  NEW.access_count := OLD.access_count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_memory_access ON public.agent_memory;
CREATE TRIGGER trigger_update_memory_access
  BEFORE UPDATE ON public.agent_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_memory_access();

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE public.agent_memory IS 'Decision Engine: Memória contextual do agente';
COMMENT ON TABLE public.agent_context IS 'Decision Engine: Estado atual do agente';
COMMENT ON TABLE public.agent_insights IS 'Decision Engine: Insights autônomos';
COMMENT ON TABLE public.agent_priorities IS 'Decision Engine: Fila de prioridades';
COMMENT ON TABLE public.agent_actions_plan IS 'Decision Engine: Planos de ação';
COMMENT ON TABLE public.agent_background_tasks IS 'Decision Engine: Tarefas background';

