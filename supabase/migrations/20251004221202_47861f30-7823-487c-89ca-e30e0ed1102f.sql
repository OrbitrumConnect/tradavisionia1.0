-- Expandir perfil do usuário para personalização do mentor
ALTER TABLE user_trading_profiles 
ADD COLUMN IF NOT EXISTS experience_level text DEFAULT 'iniciante' CHECK (experience_level IN ('iniciante', 'intermediario', 'avancado', 'profissional')),
ADD COLUMN IF NOT EXISTS mentor_detail_level text DEFAULT 'detalhado' CHECK (mentor_detail_level IN ('resumido', 'normal', 'detalhado')),
ADD COLUMN IF NOT EXISTS learning_goals jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS strengths jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS weaknesses jsonb DEFAULT '[]'::jsonb;

-- Tabela de sessões de backtesting
CREATE TABLE IF NOT EXISTS backtesting_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_name text NOT NULL,
  symbol text NOT NULL,
  timeframe text NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  initial_capital numeric NOT NULL DEFAULT 10000,
  strategy_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  results jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE backtesting_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own backtesting sessions"
  ON backtesting_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own backtesting sessions"
  ON backtesting_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own backtesting sessions"
  ON backtesting_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Tabela de paper trading (trades simulados)
CREATE TABLE IF NOT EXISTS paper_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  symbol text NOT NULL,
  side text NOT NULL CHECK (side IN ('BUY', 'SELL')),
  entry_price numeric NOT NULL,
  exit_price numeric,
  quantity numeric NOT NULL,
  stop_loss numeric,
  take_profit numeric,
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  pnl numeric,
  pnl_percent numeric,
  entry_time timestamp with time zone DEFAULT now(),
  exit_time timestamp with time zone,
  strategy_used text,
  notes text,
  lessons_learned text,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE paper_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own paper trades"
  ON paper_trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own paper trades"
  ON paper_trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own paper trades"
  ON paper_trades FOR UPDATE
  USING (auth.uid() = user_id);

-- Tabela de progresso de aprendizado
CREATE TABLE IF NOT EXISTS learning_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  topic text NOT NULL,
  skill_level integer DEFAULT 0 CHECK (skill_level BETWEEN 0 AND 100),
  mistakes_count integer DEFAULT 0,
  successes_count integer DEFAULT 0,
  last_practice timestamp with time zone DEFAULT now(),
  recommended_content jsonb DEFAULT '[]'::jsonb,
  improvement_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own learning progress"
  ON learning_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own learning progress"
  ON learning_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning progress"
  ON learning_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Tabela de sessões de estudo
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  topic text NOT NULL,
  duration_minutes integer,
  key_learnings jsonb DEFAULT '[]'::jsonb,
  questions_asked integer DEFAULT 0,
  concepts_mastered jsonb DEFAULT '[]'::jsonb,
  areas_to_review jsonb DEFAULT '[]'::jsonb,
  satisfaction_score integer CHECK (satisfaction_score BETWEEN 1 AND 5),
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own study sessions"
  ON study_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own study sessions"
  ON study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study sessions"
  ON study_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_backtesting_sessions_user_id ON backtesting_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_paper_trades_user_id ON paper_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_conversation_id ON study_sessions(conversation_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_learning_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_learning_progress_timestamp
  BEFORE UPDATE ON learning_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_learning_progress_updated_at();