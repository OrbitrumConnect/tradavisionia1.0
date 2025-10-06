import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { signalId, actualResult } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    console.log('📈 CURVA DE CONFIANÇA ADAPTATIVA - Processando feedback...');

    // 1. BUSCAR SINAL ORIGINAL
    const { data: signal, error: signalError } = await supabaseClient
      .from('narrator_signals')
      .select('*')
      .eq('id', signalId)
      .single();

    if (signalError) throw signalError;

    console.log(`🎯 Analisando: ${signal.pattern} | ${signal.timeframe}`);

    // 2. BUSCAR PADRÃO NA MEMÓRIA SEMÂNTICA
    const patternSignature = `${signal.pattern}_${signal.timeframe}`;
    const { data: memory, error: memoryError } = await supabaseClient
      .from('pattern_memory')
      .select('*')
      .eq('pattern_signature', patternSignature)
      .single();

    // 3. CALCULAR NOVA TAXA DE SUCESSO
    const wasAccurate = actualResult === 'success';
    
    let newSuccessRate = signal.probability; // fallback
    let newConfidence = 50;

    if (memory) {
      const oldSuccesses = (memory.success_rate / 100) * memory.total_occurrences;
      const newSuccesses = oldSuccesses + (wasAccurate ? 1 : 0);
      const newTotal = memory.total_occurrences + 1;
      
      newSuccessRate = (newSuccesses / newTotal) * 100;
      newConfidence = calculateAdaptiveConfidence(newSuccessRate, newTotal);

      console.log(`📊 Taxa antiga: ${memory.success_rate.toFixed(1)}% → Nova: ${newSuccessRate.toFixed(1)}%`);
      console.log(`🎲 Confiança: ${memory.confidence_level} → ${newConfidence}`);

      // ATUALIZAR MEMÓRIA
      const { error: updateError } = await supabaseClient
        .from('pattern_memory')
        .update({
          success_rate: newSuccessRate,
          confidence_level: newConfidence,
          total_occurrences: newTotal,
          last_updated: new Date().toISOString()
        })
        .eq('pattern_signature', patternSignature);

      if (updateError) {
        console.error('❌ Erro ao atualizar memória:', updateError);
      }
    } else {
      console.log('⚠️ Padrão não encontrado na memória - criando nova entrada');
      
      // Criar nova memória
      const { error: createError } = await supabaseClient
        .from('pattern_memory')
        .insert({
          pattern_signature: patternSignature,
          success_rate: wasAccurate ? 100 : 0,
          total_occurrences: 1,
          avg_probability: signal.probability,
          timeframes: [signal.timeframe],
          market_conditions: [signal.market_status],
          semantic_summary: `Padrão "${signal.pattern}" em fase inicial de aprendizado.`,
          confidence_level: 20, // Baixa confiança inicial
          metadata: { first_seen: new Date().toISOString() }
        });

      if (createError) {
        console.error('❌ Erro ao criar memória:', createError);
      }
    }

    // 4. REGISTRAR FEEDBACK
    const { error: feedbackError } = await supabaseClient
      .from('narrator_feedback')
      .insert({
        signal_id: signalId,
        user_id: signal.user_id,
        was_accurate: wasAccurate,
        rating: wasAccurate ? 5 : 2,
        notes: `Resultado: ${actualResult}. Nova confiança: ${newConfidence}%`
      });

    if (feedbackError) {
      console.error('❌ Erro ao salvar feedback:', feedbackError);
    }

    console.log('✅ Curva de confiança atualizada!');

    return new Response(
      JSON.stringify({
        success: true,
        updated: {
          oldRate: memory?.success_rate || 0,
          newRate: newSuccessRate,
          oldConfidence: memory?.confidence_level || 0,
          newConfidence,
          adjustment: wasAccurate ? '+' : '-'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro na curva de confiança:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// CÁLCULO DE CONFIANÇA ADAPTATIVA
function calculateAdaptiveConfidence(successRate: number, sampleSize: number): number {
  // Fórmula bayesiana simplificada:
  // Confiança = taxa_sucesso * fator_amostra
  // Onde fator_amostra aumenta com mais dados
  
  const sampleFactor = Math.min(1, sampleSize / 50); // Máximo em 50 amostras
  const confidence = successRate * sampleFactor;
  
  return Math.round(Math.min(100, Math.max(0, confidence)));
}
