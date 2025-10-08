-- Adicionar campos de validação automática em narrator_signals
-- Permite rastrear performance real dos sinais

ALTER TABLE narrator_signals
ADD COLUMN IF NOT EXISTS result TEXT CHECK (result IN ('WIN', 'LOSS', 'NEUTRAL')),
ADD COLUMN IF NOT EXISTS exit_price TEXT,
ADD COLUMN IF NOT EXISTS variation TEXT,
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS validation_time TEXT;

-- Criar índice para buscar sinais não validados
CREATE INDEX IF NOT EXISTS idx_narrator_signals_validation 
ON narrator_signals(created_at, result) 
WHERE result IS NULL;

-- Criar índice para análise de performance
CREATE INDEX IF NOT EXISTS idx_narrator_signals_result 
ON narrator_signals(signal_type, result, pattern);

-- Comentários
COMMENT ON COLUMN narrator_signals.result IS 'Resultado da validação: WIN (acertou), LOSS (errou), NEUTRAL (sem movimento significativo)';
COMMENT ON COLUMN narrator_signals.exit_price IS 'Preço no momento da validação (após 15min)';
COMMENT ON COLUMN narrator_signals.variation IS 'Variação percentual do preço (ex: +0.23% ou -0.15%)';
COMMENT ON COLUMN narrator_signals.validated_at IS 'Timestamp da validação automática';
COMMENT ON COLUMN narrator_signals.validation_time IS 'Tempo decorrido para validação (ex: 15min)';
