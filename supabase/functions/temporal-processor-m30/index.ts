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

    console.log('🔄 M30 Processor - Consolidando últimos 2 M15 para:', symbol);

    // Buscar últimos 2 registros M15
    const { data: lastM15Records, error: queryError } = await supabase
      .from('market_m15')
      .select('*')
      .eq('symbol', symbol)
      .order('timestamp', { ascending: false })
      .limit(2);

    if (queryError) throw queryError;

    if (!lastM15Records || lastM15Records.length < 2) {
      console.log('⏳ M30: Ainda não há 2 registros M15 suficientes');
      return new Response(
        JSON.stringify({ success: false, reason: 'Aguardando mais dados M15' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Consolidar dados
    const open = lastM15Records[1].open;
    const close = lastM15Records[0].close;
    const high = Math.max(...lastM15Records.map(r => r.high));
    const low = Math.min(...lastM15Records.map(r => r.low));
    const totalVolume = lastM15Records.reduce((sum, r) => sum + Number(r.total_volume), 0);

    // Tendência macro
    const m15Trends = lastM15Records.map(r => r.trend_direction);
    const isBullish = m15Trends.every(t => t === 'bullish');
    const isBearish = m15Trends.every(t => t === 'bearish');
    
    const avgConsistency = lastM15Records.reduce((sum, r) => 
      sum + Number(r.trend_consistency), 0) / lastM15Records.length;

    const macroTrend = 
      isBullish && avgConsistency > 80 ? 'strong_bullish' :
      isBullish ? 'bullish' :
      isBearish && avgConsistency > 80 ? 'strong_bearish' :
      isBearish ? 'bearish' : 'neutral';

    // Filtro de ruído
    const noiseFiltered = avgConsistency > 70;

    // Fase de mercado (Wyckoff)
    const currentPattern = lastM15Records[0].major_pattern;
    const institutionalFlow = lastM15Records[0].institutional_flow;
    
    const marketPhase = 
      institutionalFlow === 'accumulation' && currentPattern === 'bullish_structure' ? 'accumulation' :
      institutionalFlow === 'accumulation' && macroTrend.includes('bullish') ? 'markup' :
      institutionalFlow === 'distribution' && currentPattern === 'bearish_structure' ? 'distribution' :
      institutionalFlow === 'distribution' && macroTrend.includes('bearish') ? 'markdown' : 'accumulation';

    // Posição no ciclo (0-100)
    const avgMaturity = lastM15Records.reduce((sum, r) => 
      sum + Number(r.pattern_maturity), 0) / lastM15Records.length;
    const cyclePosition = avgMaturity;

    // Confluências validadas
    const validatedConfluences = [];
    if (noiseFiltered) validatedConfluences.push('trend_consistency');
    if (avgConsistency > 80) validatedConfluences.push('strong_trend');
    if (institutionalFlow !== 'neutral') validatedConfluences.push('institutional_flow');

    // Tempo esperado de reação (minutos)
    const expectedReactionTime = macroTrend.includes('strong') ? 5 : 10;

    // Insight estratégico
    const strategicInsight = `PANORAMA MACRO: ${macroTrend.toUpperCase().replace('_', ' ')} na fase de ${marketPhase.toUpperCase()}. ` +
      `Ciclo em ${cyclePosition.toFixed(0)}%. ` +
      `Confluências: ${validatedConfluences.join(', ')}. ` +
      `Tempo de reação esperado: ${expectedReactionTime} min.`;

    // Performance recente (simplificado - seria calculado com dados reais)
    const recentAccuracy = avgConsistency; // placeholder

    // Resumo M15
    const m15Summary = lastM15Records.map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      trend_direction: r.trend_direction,
      institutional_flow: r.institutional_flow,
      insight: r.contextual_insight
    }));

    // Inserir M30
    const { data: m30Record, error: insertError } = await supabase
      .from('market_m30')
      .insert({
        symbol,
        timestamp: new Date().toISOString(),
        open,
        high,
        low,
        close,
        total_volume: totalVolume,
        macro_trend: macroTrend,
        noise_filtered: noiseFiltered,
        market_phase: marketPhase,
        cycle_position: cyclePosition,
        m15_summary: m15Summary,
        validated_confluences: validatedConfluences,
        expected_reaction_time: expectedReactionTime,
        strategic_insight: strategicInsight,
        recent_accuracy: recentAccuracy,
        metadata: {
          processor: 'M30',
          version: '1.0',
          m15_analyzed: lastM15Records.length
        }
      })
      .select()
      .single();

    if (insertError) throw insertError;

    console.log('✅ M30 consolidado:', m30Record.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        m30_id: m30Record.id,
        insight: strategicInsight,
        macro_trend: macroTrend,
        market_phase: marketPhase
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro M30 Processor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
