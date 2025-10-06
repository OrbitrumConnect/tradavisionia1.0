-- Tabela de Memória Semântica (Pattern Memory)
CREATE TABLE IF NOT EXISTS public.pattern_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_signature TEXT NOT NULL UNIQUE,
  success_rate NUMERIC NOT NULL DEFAULT 0,
  total_occurrences INTEGER NOT NULL DEFAULT 0,
  avg_probability NUMERIC NOT NULL DEFAULT 0,
  timeframes TEXT[] NOT NULL DEFAULT '{}',
  market_conditions TEXT[] NOT NULL DEFAULT '{}',
  semantic_summary TEXT,
  confidence_level NUMERIC NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pattern_memory_signature ON public.pattern_memory(pattern_signature);
CREATE INDEX IF NOT EXISTS idx_pattern_memory_confidence ON public.pattern_memory(confidence_level DESC);
CREATE INDEX IF NOT EXISTS idx_pattern_memory_success ON public.pattern_memory(success_rate DESC);

-- RLS: Todos podem ler memórias (conhecimento compartilhado)
ALTER TABLE public.pattern_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pattern memory"
  ON public.pattern_memory
  FOR SELECT
  USING (true);

CREATE POLICY "System can manage pattern memory"
  ON public.pattern_memory
  FOR ALL
  USING (true);

-- Comentários
COMMENT ON TABLE public.pattern_memory IS 'Memória semântica comprimida de padrões de trading com taxa de sucesso e confiança adaptativa';
COMMENT ON COLUMN public.pattern_memory.pattern_signature IS 'Assinatura única do padrão (ex: FVG_1m)';
COMMENT ON COLUMN public.pattern_memory.success_rate IS 'Taxa de sucesso histórica (0-100%)';
COMMENT ON COLUMN public.pattern_memory.confidence_level IS 'Nível de confiança baseado em quantidade e acertos (0-100)';
COMMENT ON COLUMN public.pattern_memory.semantic_summary IS 'Resumo em linguagem natural do comportamento do padrão';