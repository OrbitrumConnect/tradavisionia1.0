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

    const { symbol } = await req.json();

    console.log('🔄 M5 Processor - Consolidando últimos 5 M1 para:', symbol);

    // Buscar últimos 5 registros M1
    const { data: lastM1Records, error: queryError } = await supabase
      .from('market_m1')
      .select('*')
      .eq('symbol', symbol)
      .order('timestamp', { ascending: false })
      .limit(5);

    if (queryError) throw queryError;

    if (!lastM1Records || lastM1Records.length < 5) {
      console.log('⏳ M5: Ainda não há 5 registros M1 suficientes');
      return new Response(
        JSON.stringify({ success: false, reason: 'Aguardando mais dados M1' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Consolidar dados
    const open = lastM1Records[4].open;
    const close = lastM1Records[0].close;
    const high = Math.max(...lastM1Records.map(r => r.high));
    const low = Math.min(...lastM1Records.map(r => r.low));
    const totalVolume = lastM1Records.reduce((sum, r) => sum + Number(r.volume), 0);

    // Análise tática: direção predominante
    const bullishCount = lastM1Records.filter(r => r.direction === 'bullish').length;
    const bearishCount = lastM1Records.filter(r => r.direction === 'bearish').length;
    
    const predominantDirection = 
      bullishCount > bearishCount ? 'bullish' :
      bearishCount > bullishCount ? 'bearish' : 'neutral';

    // Probabilidade média
    const avgProbability = lastM1Records.reduce((sum, r) => 
      sum + (Number(r.continuation_probability) || 0), 0) / lastM1Records.length;

    // Força da tendência (baseado em consistência)
    const trendStrength = Math.max(bullishCount, bearishCount) / 5 * 100;

    // Detectar padrão de micro-tendência
    const isConsolidating = trendStrength < 60;
    const isReversal = (lastM1Records[0].direction !== lastM1Records[4].direction) && trendStrength > 60;
    
    const microTrendPattern = 
      isConsolidating ? 'consolidation' :
      isReversal ? 'reversal' : 'continuation';

    // Confiança no padrão
    const patternConfidence = trendStrength;

    // Aprendizado: contar sinais falsos vs verdadeiros (simplificado)
    const falseSignalsCount = lastM1Records.filter(r => 
      r.continuation_probability > 70 && r.direction !== predominantDirection
    ).length;
    
    const trueSignalsCount = 5 - falseSignalsCount;

    // Insight tático
    const tacticalInsight = `Micro-tendência: ${microTrendPattern.toUpperCase()} (${trendStrength.toFixed(0)}% força). ` +
      `Direção predominante: ${predominantDirection}. ` +
      `Taxa de acerto: ${trueSignalsCount}/5.`;

    // Resumo M1
    const m1Summary = lastM1Records.map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      direction: r.direction,
      insight: r.micro_insight,
      probability: r.continuation_probability
    }));

    // Inserir M5
    const { data: m5Record, error: insertError } = await supabase
      .from('market_m5')
      .insert({
        symbol,
        timestamp: new Date().toISOString(),
        open,
        high,
        low,
        close,
        total_volume: totalVolume,
        predominant_direction: predominantDirection,
        avg_probability: avgProbability,
        trend_strength: trendStrength,
        micro_trend_pattern: microTrendPattern,
        pattern_confidence: patternConfidence,
        m1_summary: m1Summary,
        false_signals_count: falseSignalsCount,
        true_signals_count: trueSignalsCount,
        tactical_insight: tacticalInsight,
        metadata: {
          processor: 'M5',
          version: '1.0',
          m1_analyzed: lastM1Records.length
        }
      })
      .select()
      .single();

    if (insertError) throw insertError;

    console.log('✅ M5 consolidado:', m5Record.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        m5_id: m5Record.id,
        insight: tacticalInsight,
        predominant_direction: predominantDirection,
        trend_strength: trendStrength
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro M5 Processor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
