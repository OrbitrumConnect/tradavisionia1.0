import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { symbol, marketData, technicalIndicators, detectedPatterns } = await req.json();

    // Função para limpar e converter valores numéricos
    const parseNumber = (value: any): number | null => {
      if (value === null || value === undefined) return null;
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        // Remove vírgulas que são separadores de milhar
        const cleaned = value.replace(/,/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? null : parsed;
      }
      return null;
    };

    console.log('🔄 M1 Processor - Capturando dados:', symbol);

    // Determinar direção instantânea
    const direction = marketData.close > marketData.open ? 'bullish' :
                     marketData.close < marketData.open ? 'bearish' : 'neutral';

    // Calcular volatilidade
    const volatilityRange = ((marketData.high - marketData.low) / marketData.close) * 100;
    const volatilityLevel = 
      volatilityRange > 2 ? 'extreme' :
      volatilityRange > 1 ? 'high' :
      volatilityRange > 0.5 ? 'medium' : 'low';

    // Detectar volume spike (comparar com média, simplificado aqui)
    const volumeSpike = detectedPatterns?.volume_spike || false;

    // Gerar micro-insight
    const microInsight = `${direction.toUpperCase()} com volatilidade ${volatilityLevel}. ` +
      `RSI: ${technicalIndicators?.rsi?.toFixed(1) || 'N/A'}. ` +
      (volumeSpike ? 'VOLUME SPIKE detectado!' : 'Volume normal.');

    // Calcular probabilidade de continuação (simplificado)
    let continuationProbability = 50;
    if (direction === 'bullish' && technicalIndicators?.rsi > 50) continuationProbability += 20;
    if (direction === 'bearish' && technicalIndicators?.rsi < 50) continuationProbability += 20;
    if (volumeSpike) continuationProbability += 10;

    // Inserir no banco com valores numéricos limpos
    const { data: m1Record, error: insertError } = await supabase
      .from('market_m1')
      .insert({
        symbol,
        timestamp: new Date().toISOString(),
        open: parseNumber(marketData.open),
        high: parseNumber(marketData.high),
        low: parseNumber(marketData.low),
        close: parseNumber(marketData.close),
        volume: parseNumber(marketData.volume),
        direction,
        volatility_level: volatilityLevel,
        volume_spike: volumeSpike,
        rsi_14: parseNumber(technicalIndicators?.rsi),
        ema_9: parseNumber(technicalIndicators?.ema9),
        ema_20: parseNumber(technicalIndicators?.ema20),
        patterns_detected: detectedPatterns ? [detectedPatterns] : [],
        micro_insight: microInsight,
        continuation_probability: continuationProbability,
        metadata: {
          processor: 'M1',
          version: '1.0'
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao inserir M1:', insertError);
      throw insertError;
    }

    console.log('✅ M1 capturado:', m1Record.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        m1_id: m1Record.id,
        insight: microInsight,
        continuation_probability: continuationProbability
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro M1 Processor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
