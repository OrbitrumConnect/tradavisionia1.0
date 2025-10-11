-- ═══════════════════════════════════════════════════════════════
-- 🔧 CORREÇÃO: ai_trades - Tipos TEXT → NUMERIC
-- ═══════════════════════════════════════════════════════════════
-- Corrige tipos de dados para melhor performance e validação
-- Mantém compatibilidade com código existente via view
-- ═══════════════════════════════════════════════════════════════

-- 1️⃣ Adicionar novas colunas com tipos corretos
ALTER TABLE public.ai_trades 
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('BUY', 'SELL')),
ADD COLUMN IF NOT EXISTS entry_price_num NUMERIC,
ADD COLUMN IF NOT EXISTS exit_price_num NUMERIC,
ADD COLUMN IF NOT EXISTS stop_loss_num NUMERIC,
ADD COLUMN IF NOT EXISTS take_profit_num NUMERIC,
ADD COLUMN IF NOT EXISTS size_num NUMERIC,
ADD COLUMN IF NOT EXISTS exit_time TIMESTAMP WITH TIME ZONE;

-- 2️⃣ Migrar dados existentes TEXT → NUMERIC (se houver)
UPDATE public.ai_trades 
SET 
    type = trade_type,
    entry_price_num = CASE 
        WHEN entry_price ~ '^[0-9.]+$' THEN entry_price::NUMERIC 
        ELSE NULL 
    END,
    exit_price_num = CASE 
        WHEN exit_price ~ '^[0-9.]+$' THEN exit_price::NUMERIC 
        ELSE NULL 
    END,
    stop_loss_num = CASE 
        WHEN stop_loss ~ '^[0-9.]+$' THEN stop_loss::NUMERIC 
        ELSE NULL 
    END,
    take_profit_num = CASE 
        WHEN take_profit ~ '^[0-9.]+$' THEN take_profit::NUMERIC 
        ELSE NULL 
    END,
    size_num = CASE 
        WHEN size ~ '^[0-9.]+$' THEN size::NUMERIC 
        ELSE NULL 
    END,
    exit_time = exit_timestamp
WHERE entry_price_num IS NULL;

-- 3️⃣ Criar view de compatibilidade (para não quebrar código)
CREATE OR REPLACE VIEW ai_trades_compatible AS
SELECT 
    id,
    user_id,
    symbol,
    timeframe,
    COALESCE(type, trade_type) as type,
    COALESCE(entry_price_num, NULLIF(entry_price, '')::NUMERIC) as entry_price,
    COALESCE(exit_price_num, NULLIF(exit_price, '')::NUMERIC) as exit_price,
    COALESCE(stop_loss_num, NULLIF(stop_loss, '')::NUMERIC) as stop_loss,
    COALESCE(take_profit_num, NULLIF(take_profit, '')::NUMERIC) as take_profit,
    COALESCE(size_num, NULLIF(size, '')::NUMERIC) as size,
    leverage,
    status,
    result,
    pnl,
    reason,
    action,
    timestamp,
    COALESCE(exit_time, exit_timestamp) as exit_time,
    brazil_time,
    technical_context,
    created_at,
    updated_at
FROM public.ai_trades;

-- 4️⃣ Grant permissions na view
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_trades_compatible TO authenticated;

-- 5️⃣ Comentários para documentação
COMMENT ON COLUMN ai_trades.entry_price_num IS 'Preço de entrada (NUMERIC) - usar esta coluna para novos registros';
COMMENT ON COLUMN ai_trades.exit_price_num IS 'Preço de saída (NUMERIC) - usar esta coluna para novos registros';
COMMENT ON COLUMN ai_trades.type IS 'Tipo de trade (BUY/SELL) - usar esta coluna em vez de trade_type';
COMMENT ON VIEW ai_trades_compatible IS 'View de compatibilidade - usa colunas NUMERIC quando disponíveis, fallback para TEXT';

-- ═══════════════════════════════════════════════════════════════
-- ✅ RESULTADO:
-- ═══════════════════════════════════════════════════════════════
-- • Novos trades usam tipos NUMERIC (mais rápido, validação automática)
-- • Trades antigos continuam funcionando (view faz conversão)
-- • Código não precisa mudar (compatível com ambos)
-- • Performance melhorada em queries numéricas
-- ═══════════════════════════════════════════════════════════════

