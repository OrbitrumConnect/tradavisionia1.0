-- Tabela para insights consolidados do Meta Consolidador
CREATE TABLE public.meta_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('dataset', 'weight_adjustment', 'pattern_summary', 'learning_insight')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_meta_insights_user_id ON public.meta_insights(user_id);
CREATE INDEX idx_meta_insights_symbol ON public.meta_insights(symbol);
CREATE INDEX idx_meta_insights_type ON public.meta_insights(insight_type);
CREATE INDEX idx_meta_insights_created_at ON public.meta_insights(created_at);

-- RLS (Row Level Security)
ALTER TABLE public.meta_insights ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver apenas seus próprios insights
CREATE POLICY "Users can view their own meta insights" ON public.meta_insights
  FOR SELECT USING (auth.uid() = user_id);

-- Política: usuários podem inserir seus próprios insights
CREATE POLICY "Users can insert their own meta insights" ON public.meta_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: usuários podem atualizar seus próprios insights
CREATE POLICY "Users can update their own meta insights" ON public.meta_insights
  FOR UPDATE USING (auth.uid() = user_id);

-- Política: usuários podem deletar seus próprios insights
CREATE POLICY "Users can delete their own meta insights" ON public.meta_insights
  FOR DELETE USING (auth.uid() = user_id);
