-- Add user trading profile table for personalization
CREATE TABLE IF NOT EXISTS public.user_trading_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  risk_level TEXT DEFAULT 'moderate',
  trading_style TEXT DEFAULT 'day_trade',
  preferred_timeframes TEXT[] DEFAULT ARRAY['1h', '15m'],
  alert_preferences JSONB DEFAULT '{"proactive": true, "volume_threshold": 1.15, "fear_greed_threshold": 20}'::jsonb,
  performance_stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_trading_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
ON public.user_trading_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.user_trading_profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.user_trading_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add proactive alerts table
CREATE TABLE IF NOT EXISTS public.proactive_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  trigger_condition JSONB NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  acknowledged BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.proactive_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own alerts"
ON public.proactive_alerts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can acknowledge own alerts"
ON public.proactive_alerts
FOR UPDATE
USING (auth.uid() = user_id);

-- Add trade simulations table
CREATE TABLE IF NOT EXISTS public.trade_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  scenario_type TEXT NOT NULL,
  entry_price NUMERIC NOT NULL,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  expected_gain_percent NUMERIC,
  risk_percent NUMERIC,
  confidence_score INTEGER,
  market_conditions JSONB DEFAULT '{}'::jsonb,
  outcome TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trade_simulations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own simulations"
ON public.trade_simulations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own simulations"
ON public.trade_simulations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_trading_profiles_user_id ON public.user_trading_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_proactive_alerts_user_id ON public.proactive_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_proactive_alerts_acknowledged ON public.proactive_alerts(acknowledged) WHERE acknowledged = false;
CREATE INDEX IF NOT EXISTS idx_trade_simulations_user_id ON public.trade_simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_simulations_session_id ON public.trade_simulations(session_id);

-- Comments
COMMENT ON TABLE public.user_trading_profiles IS 'User trading preferences and performance tracking for personalization';
COMMENT ON TABLE public.proactive_alerts IS 'Proactive alerts triggered by AI before user requests';
COMMENT ON TABLE public.trade_simulations IS 'Trade scenario simulations and what-if analysis';