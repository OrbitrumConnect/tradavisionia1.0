-- ============================================================================
-- TRADEVISION IA v9.0 - NÚCLEO DE DECISÃO DINÂMICA (MINIMAL - SEM ERROS)
-- Versão simplificada para debug
-- ============================================================================

-- Habilita extensões
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- 1. AGENT_MEMORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_agent_memory_user_id ON agent_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_type ON agent_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_agent_memory_importance ON agent_memory(importance_score DESC);

ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_memory_select" ON agent_memory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "agent_memory_insert" ON agent_memory FOR INSERT WITH CHECK (true);
CREATE POLICY "agent_memory_update" ON agent_memory FOR UPDATE USING (true);

-- ============================================================================
-- 2. AGENT_CONTEXT
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
  priority_level TEXT,
  recent_insights JSONB DEFAULT '[]',
  pending_actions JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  context_snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_context_user_id ON agent_context(user_id);

ALTER TABLE agent_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_context_select" ON agent_context FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "agent_context_all" ON agent_context FOR ALL USING (true);

-- ============================================================================
-- 3. AGENT_INSIGHTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_agent_insights_user_id ON agent_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_insights_type ON agent_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_agent_insights_discovered ON agent_insights(discovered_at DESC);

ALTER TABLE agent_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_insights_select" ON agent_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "agent_insights_all" ON agent_insights FOR ALL USING (true);

-- ============================================================================
-- 4. AGENT_PRIORITIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  priority TEXT NOT NULL,
  priority_score INTEGER NOT NULL,
  task_type TEXT NOT NULL,
  task_description TEXT NOT NULL,
  task_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
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

CREATE INDEX IF NOT EXISTS idx_agent_priorities_user_id ON agent_priorities(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_priorities_score ON agent_priorities(priority_score DESC);

ALTER TABLE agent_priorities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_priorities_select" ON agent_priorities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "agent_priorities_all" ON agent_priorities FOR ALL USING (true);

-- ============================================================================
-- 5. AGENT_ACTIONS_PLAN
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_actions_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  timeframe TEXT NOT NULL,
  objective TEXT NOT NULL,
  actions JSONB DEFAULT '[]',
  based_on_data JSONB DEFAULT '{}',
  expected_outcomes JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  progress FLOAT DEFAULT 0.0,
  actual_outcomes JSONB,
  success_rate FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agent_actions_plan_user_id ON agent_actions_plan(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_plan_timeframe ON agent_actions_plan(timeframe);

ALTER TABLE agent_actions_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_actions_plan_select" ON agent_actions_plan FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "agent_actions_plan_all" ON agent_actions_plan FOR ALL USING (true);

-- ============================================================================
-- 6. AGENT_BACKGROUND_TASKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_background_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  task_description TEXT,
  task_type TEXT,
  input_data JSONB DEFAULT '{}',
  output_data JSONB,
  status TEXT DEFAULT 'queued',
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

CREATE INDEX IF NOT EXISTS idx_agent_background_tasks_user_id ON agent_background_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_background_tasks_status ON agent_background_tasks(status);

ALTER TABLE agent_background_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_background_tasks_select" ON agent_background_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "agent_background_tasks_all" ON agent_background_tasks FOR ALL USING (true);

-- ============================================================================
-- FUNÇÕES
-- ============================================================================

CREATE OR REPLACE FUNCTION match_agent_memories(
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
  FROM agent_memory m
  WHERE m.user_id = match_user_id
  ORDER BY m.importance_score DESC
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION cleanup_expired_memories()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM agent_memory
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

