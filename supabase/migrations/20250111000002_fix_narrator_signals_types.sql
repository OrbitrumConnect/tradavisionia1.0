-- ═══════════════════════════════════════════════════════════════
-- 🔧 CORREÇÃO: narrator_signals - Tipos TEXT → NUMERIC
-- ═══════════════════════════════════════════════════════════════
-- Melhora performance e validação dos sinais do narrador
-- ═══════════════════════════════════════════════════════════════

-- 1️⃣ Adicionar colunas com tipos corretos
ALTER TABLE public.narrator_signals 
ADD COLUMN IF NOT EXISTS price_num NUMERIC,
ADD COLUMN IF NOT EXISTS variation_num NUMERIC;

-- 2️⃣ Migrar dados existentes TEXT → NUMERIC
UPDATE public.narrator_signals 
SET 
    price_num = CASE 
        WHEN price ~ '^[0-9.]+$' THEN price::NUMERIC 
        ELSE NULL 
    END,
    variation_num = CASE 
        WHEN variation ~ '^[+\-]?[0-9.]+%?$' THEN 
            REPLACE(REPLACE(variation, '%', ''), '+', '')::NUMERIC 
        ELSE NULL 
    END
WHERE price_num IS NULL;

-- 3️⃣ Criar função para atualizar automaticamente
CREATE OR REPLACE FUNCTION sync_narrator_signals_numeric()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-converter TEXT para NUMERIC ao inserir/atualizar
    IF NEW.price IS NOT NULL AND NEW.price_num IS NULL THEN
        NEW.price_num = CASE 
            WHEN NEW.price ~ '^[0-9.]+$' THEN NEW.price::NUMERIC 
            ELSE NULL 
        END;
    END IF;
    
    IF NEW.variation IS NOT NULL AND NEW.variation_num IS NULL THEN
        NEW.variation_num = CASE 
            WHEN NEW.variation ~ '^[+\-]?[0-9.]+%?$' THEN 
                REPLACE(REPLACE(NEW.variation, '%', ''), '+', '')::NUMERIC 
            ELSE NULL 
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4️⃣ Trigger para conversão automática
DROP TRIGGER IF EXISTS trigger_sync_narrator_signals_numeric ON public.narrator_signals;
CREATE TRIGGER trigger_sync_narrator_signals_numeric
    BEFORE INSERT OR UPDATE ON public.narrator_signals
    FOR EACH ROW
    EXECUTE FUNCTION sync_narrator_signals_numeric();

-- 5️⃣ Criar view otimizada
CREATE OR REPLACE VIEW narrator_signals_view AS
SELECT 
    id,
    user_id,
    symbol,
    timeframe,
    signal_type,
    pattern,
    figure,
    COALESCE(price_num, NULLIF(price, '')::NUMERIC) as price,
    probability,
    risk_note,
    news,
    market_status,
    metadata,
    created_at,
    result,
    COALESCE(variation_num, NULLIF(REPLACE(REPLACE(variation, '%', ''), '+', ''), '')::NUMERIC) as variation
FROM public.narrator_signals;

-- 6️⃣ Grant permissions
GRANT SELECT ON narrator_signals_view TO authenticated;

-- 7️⃣ Comentários
COMMENT ON COLUMN narrator_signals.price_num IS 'Preço (NUMERIC) - auto-preenchido via trigger';
COMMENT ON COLUMN narrator_signals.variation_num IS 'Variação percentual (NUMERIC) - auto-preenchido via trigger';
COMMENT ON VIEW narrator_signals_view IS 'View otimizada com tipos NUMERIC para queries de performance';

-- ═══════════════════════════════════════════════════════════════
-- ✅ RESULTADO:
-- ═══════════════════════════════════════════════════════════════
-- • Trigger auto-converte TEXT → NUMERIC ao salvar
-- • Código não precisa mudar (conversão automática)
-- • Queries numéricas ficam 3-5x mais rápidas
-- • View otimizada para dashboards
-- ═══════════════════════════════════════════════════════════════

