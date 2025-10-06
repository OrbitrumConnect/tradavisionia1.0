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

    console.log('🔄 M15 Processor - Consolidando últimos 3 M5 para:', symbol);

    // Buscar últimos 3 registros M5
    const { data: lastM5Records, error: queryError } = await supabase
      .from('market_m5')
      .select('*')
      .eq('symbol', symbol)
      .order('timestamp', { ascending: false })
      .limit(3);

    if (queryError) throw queryError;

    if (!lastM5Records || lastM5Records.length < 3) {
      console.log('⏳ M15: Ainda não há 3 registros M5 suficientes');
      return new Response(
        JSON.stringify({ success: false, reason: 'Aguardando mais dados M5' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Consolidar dados
    const open = lastM5Records[2].open;
    const close = lastM5Records[0].close;
    const high = Math.max(...lastM5Records.map(r => r.high));
    const low = Math.min(...lastM5Records.map(r => r.low));
    const totalVolume = lastM5Records.reduce((sum, r) => sum + Number(r.total_volume), 0);

    // Direção da tendência
    const bullishM5 = lastM5Records.filter(r => r.predominant_direction === 'bullish').length;
    const bearishM5 = lastM5Records.filter(r => r.predominant_direction === 'bearish').length;
    
    const trendDirection = 
      bullishM5 > bearishM5 ? 'bullish' :
      bearishM5 > bullishM5 ? 'bearish' : 'neutral';

    // Consistência da tendência
    const trendConsistency = Math.max(bullishM5, bearishM5) / 3 * 100;

    // Calcular suporte e resistência (simplificado)
    const supportLevel = Math.min(...lastM5Records.map(r => r.low));
    const resistanceLevel = Math.max(...lastM5Records.map(r => r.high));

    // Detectar padrão maior
    const avgTrendStrength = lastM5Records.reduce((sum, r) => 
      sum + Number(r.trend_strength), 0) / lastM5Records.length;

    const majorPattern = 
      trendDirection === 'bullish' && avgTrendStrength > 70 ? 'bullish_structure' :
      trendDirection === 'bearish' && avgTrendStrength > 70 ? 'bearish_structure' : 'range';

    // Maturidade do padrão
    const patternMaturity = avgTrendStrength;

    // Fluxo institucional (baseado em volume e direção)
    const lastVolumeIncrease = Number(lastM5Records[0].total_volume) > Number(lastM5Records[1].total_volume);
    const institutionalFlow = 
      trendDirection === 'bullish' && lastVolumeIncrease ? 'accumulation' :
      trendDirection === 'bearish' && lastVolumeIncrease ? 'distribution' : 'neutral';

    // Insight contextual
    const contextualInsight = `Estrutura ${majorPattern.replace('_', ' ').toUpperCase()} (${patternMaturity.toFixed(0)}% maturidade). ` +
      `Fluxo institucional: ${institutionalFlow}. ` +
      `S/R: ${supportLevel.toFixed(2)} / ${resistanceLevel.toFixed(2)}. ` +
      `Consistência: ${trendConsistency.toFixed(0)}%.`;

    // Calibração de indicadores (auto-ajuste de pesos baseado em performance)
    const totalTrueSignals = lastM5Records.reduce((sum, r) => sum + r.true_signals_count, 0);
    const totalFalseSignals = lastM5Records.reduce((sum, r) => sum + r.false_signals_count, 0);
    const successRate = totalTrueSignals / (totalTrueSignals + totalFalseSignals);

    const indicatorWeights = {
      rsi_weight: successRate > 0.7 ? 1.2 : successRate < 0.5 ? 0.8 : 1.0,
      volume_weight: lastVolumeIncrease ? 1.3 : 1.0,
      trend_weight: trendConsistency > 80 ? 1.5 : 1.0
    };

    // Resumo M5
    const m5Summary = lastM5Records.map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      predominant_direction: r.predominant_direction,
      insight: r.tactical_insight,
      trend_strength: r.trend_strength
    }));

    // Inserir M15
    const { data: m15Record, error: insertError } = await supabase
      .from('market_m15')
      .insert({
        symbol,
        timestamp: new Date().toISOString(),
        open,
        high,
        low,
        close,
        total_volume: totalVolume,
        trend_direction: trendDirection,
        trend_consistency: trendConsistency,
        support_level: supportLevel,
        resistance_level: resistanceLevel,
        major_pattern: majorPattern,
        pattern_maturity: patternMaturity,
        m5_summary: m5Summary,
        institutional_flow: institutionalFlow,
        contextual_insight: contextualInsight,
        indicator_weights: indicatorWeights,
        metadata: {
          processor: 'M15',
          version: '1.0',
          m5_analyzed: lastM5Records.length,
          success_rate: successRate
        }
      })
      .select()
      .single();

    if (insertError) throw insertError;

    console.log('✅ M15 consolidado:', m15Record.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        m15_id: m15Record.id,
        insight: contextualInsight,
        major_pattern: majorPattern,
        institutional_flow: institutionalFlow
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro M15 Processor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
