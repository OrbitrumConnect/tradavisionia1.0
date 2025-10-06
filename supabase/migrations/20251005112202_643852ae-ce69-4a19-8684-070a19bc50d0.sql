-- ============================================
-- CRITICAL SECURITY FIXES - PHASE 1 & 2
-- Protege dados proprietários mantendo funcionalidade
-- ============================================

-- 1. FIX: narrator_signals constraint (permite NEUTRAL e WAIT)
ALTER TABLE public.narrator_signals 
DROP CONSTRAINT IF EXISTS narrator_signals_signal_type_check;

ALTER TABLE public.narrator_signals 
ADD CONSTRAINT narrator_signals_signal_type_check 
CHECK (signal_type IN ('BUY', 'SELL', 'NEUTRAL', 'WAIT'));

-- 2. SECURE: tradevision_state (estado neural proprietário)
DROP POLICY IF EXISTS "System can manage state" ON public.tradevision_state;

CREATE POLICY "Authenticated users can view state"
ON public.tradevision_state
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can insert state"
ON public.tradevision_state
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "System can update state"
ON public.tradevision_state
FOR UPDATE
TO authenticated
USING (true);

-- 3. SECURE: bot_knowledge (conhecimento proprietário)
DROP POLICY IF EXISTS "Everyone can read knowledge" ON public.bot_knowledge;

CREATE POLICY "Authenticated users can read knowledge"
ON public.bot_knowledge
FOR SELECT
TO authenticated
USING (true);

-- 4. SECURE: market_m1 (dados de mercado)
DROP POLICY IF EXISTS "Anyone can read M1 data" ON public.market_m1;
DROP POLICY IF EXISTS "System can insert M1 data" ON public.market_m1;

CREATE POLICY "Authenticated users can read M1 data"
ON public.market_m1
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert M1 data"
ON public.market_m1
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. SECURE: market_m5
DROP POLICY IF EXISTS "Anyone can read M5 data" ON public.market_m5;
DROP POLICY IF EXISTS "System can insert M5 data" ON public.market_m5;

CREATE POLICY "Authenticated users can read M5 data"
ON public.market_m5
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert M5 data"
ON public.market_m5
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 6. SECURE: market_m15
DROP POLICY IF EXISTS "Anyone can read M15 data" ON public.market_m15;
DROP POLICY IF EXISTS "System can insert M15 data" ON public.market_m15;

CREATE POLICY "Authenticated users can read M15 data"
ON public.market_m15
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert M15 data"
ON public.market_m15
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 7. SECURE: market_m30
DROP POLICY IF EXISTS "Anyone can read M30 data" ON public.market_m30;
DROP POLICY IF EXISTS "System can insert M30 data" ON public.market_m30;

CREATE POLICY "Authenticated users can read M30 data"
ON public.market_m30
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert M30 data"
ON public.market_m30
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 8. SECURE: market_features
DROP POLICY IF EXISTS "Anyone can read market features" ON public.market_features;
DROP POLICY IF EXISTS "System can insert features" ON public.market_features;

CREATE POLICY "Authenticated users can read market features"
ON public.market_features
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert features"
ON public.market_features
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 9. SECURE: temporal_learning_history
DROP POLICY IF EXISTS "Anyone can read history" ON public.temporal_learning_history;
DROP POLICY IF EXISTS "System can insert history" ON public.temporal_learning_history;

CREATE POLICY "Authenticated users can read history"
ON public.temporal_learning_history
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert history"
ON public.temporal_learning_history
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 10. SECURE: pattern_memory
DROP POLICY IF EXISTS "Anyone can read pattern memory" ON public.pattern_memory;
DROP POLICY IF EXISTS "System can manage pattern memory" ON public.pattern_memory;

CREATE POLICY "Authenticated users can read pattern memory"
ON public.pattern_memory
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage pattern memory"
ON public.pattern_memory
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 11. SECURE: timeframe_performance
DROP POLICY IF EXISTS "System can manage performance" ON public.timeframe_performance;

CREATE POLICY "Authenticated users can read performance"
ON public.timeframe_performance
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage performance"
ON public.timeframe_performance
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 12. SECURE: tradevision_feedback
DROP POLICY IF EXISTS "Anyone can read feedback" ON public.tradevision_feedback;
DROP POLICY IF EXISTS "System can insert feedback" ON public.tradevision_feedback;
DROP POLICY IF EXISTS "System can update feedback" ON public.tradevision_feedback;

CREATE POLICY "Authenticated users can read feedback"
ON public.tradevision_feedback
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert feedback"
ON public.tradevision_feedback
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update feedback"
ON public.tradevision_feedback
FOR UPDATE
TO authenticated
USING (true);