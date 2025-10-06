import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PatternMemory {
  pattern_signature: string;
  success_rate: number;
  total_occurrences: number;
  avg_probability: number;
  timeframes: string[];
  market_conditions: string[];
  semantic_summary: string;
  confidence_level: number;
  last_updated: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    console.log('🧠 COMPRESSOR SEMÂNTICO - Iniciando consolidação...');

    // 1. BUSCAR SINAIS DOS ÚLTIMOS 7 DIAS
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: signals, error: signalsError } = await supabaseClient
      .from('narrator_signals')
      .select('*')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (signalsError) throw signalsError;

    console.log(`📊 Analisando ${signals?.length || 0} sinais dos últimos 7 dias`);

    // 2. AGRUPAR POR PADRÃO E CALCULAR ESTATÍSTICAS
    const patternGroups = new Map<string, any[]>();

    signals?.forEach(signal => {
      const key = `${signal.pattern}_${signal.timeframe}`;
      if (!patternGroups.has(key)) {
        patternGroups.set(key, []);
      }
      patternGroups.get(key)!.push(signal);
    });

    console.log(`🔍 ${patternGroups.size} padrões únicos identificados`);

    // 3. CRIAR MEMÓRIAS SEMÂNTICAS
    const memories: PatternMemory[] = [];

    for (const [signature, groupSignals] of patternGroups) {
      // Buscar feedbacks para calcular taxa de sucesso
      const signalIds = groupSignals.map(s => s.id);
      const { data: feedbacks } = await supabaseClient
        .from('narrator_feedback')
        .select('*')
        .in('signal_id', signalIds);

      const totalFeedbacks = feedbacks?.length || 0;
      const accurateFeedbacks = feedbacks?.filter(f => f.was_accurate).length || 0;
      const successRate = totalFeedbacks > 0 ? (accurateFeedbacks / totalFeedbacks) * 100 : 0;

      const avgProb = groupSignals.reduce((acc, s) => acc + s.probability, 0) / groupSignals.length;
      const timeframes = [...new Set(groupSignals.map(s => s.timeframe))];
      const marketStatuses = [...new Set(groupSignals.map(s => s.market_status))];

      // CRIAR RESUMO SEMÂNTICO
      const semanticSummary = generateSemanticSummary({
        pattern: groupSignals[0].pattern,
        figure: groupSignals[0].figure,
        successRate,
        avgProb,
        totalOccurrences: groupSignals.length,
        timeframes,
        marketConditions: marketStatuses
      });

      // CALCULAR NÍVEL DE CONFIANÇA (baseado em quantidade + taxa de sucesso)
      const confidenceLevel = calculateConfidence(groupSignals.length, successRate);

      memories.push({
        pattern_signature: signature,
        success_rate: successRate,
        total_occurrences: groupSignals.length,
        avg_probability: avgProb,
        timeframes,
        market_conditions: marketStatuses.slice(0, 5), // Top 5
        semantic_summary: semanticSummary,
        confidence_level: confidenceLevel,
        last_updated: new Date().toISOString()
      });
    }

    console.log(`💾 ${memories.length} memórias semânticas criadas`);

    // 4. SALVAR NO BANCO (criar tabela se não existir)
    // Nota: A tabela pattern_memory será criada via migration
    const { error: saveError } = await supabaseClient
      .from('pattern_memory')
      .upsert(
        memories.map(m => ({
          pattern_signature: m.pattern_signature,
          success_rate: m.success_rate,
          total_occurrences: m.total_occurrences,
          avg_probability: m.avg_probability,
          timeframes: m.timeframes,
          market_conditions: m.market_conditions,
          semantic_summary: m.semantic_summary,
          confidence_level: m.confidence_level,
          metadata: { compressed_at: new Date().toISOString() }
        })),
        { onConflict: 'pattern_signature' }
      );

    if (saveError) {
      console.error('❌ Erro ao salvar memórias:', saveError);
      throw saveError;
    }

    console.log('✅ Memórias semânticas consolidadas com sucesso!');

    // 5. GARBAGE COLLECTOR - Arquivar dados antigos (>30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: oldData, error: archiveError } = await supabaseClient
      .from('market_m1')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString());

    if (!archiveError) {
      console.log(`🗑️ Dados M1 antigos arquivados (>30 dias)`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        memories: memories.length,
        avgConfidence: memories.reduce((acc, m) => acc + m.confidence_level, 0) / memories.length,
        topPatterns: memories
          .sort((a, b) => b.confidence_level - a.confidence_level)
          .slice(0, 5)
          .map(m => ({
            pattern: m.pattern_signature,
            confidence: m.confidence_level,
            success: m.success_rate
          }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro no compressor semântico:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// FUNÇÃO DE GERAÇÃO DE RESUMO SEMÂNTICO
function generateSemanticSummary(params: any): string {
  const { pattern, successRate, avgProb, totalOccurrences, timeframes } = params;
  
  const quality = successRate >= 70 ? 'ALTA' :
                 successRate >= 55 ? 'MÉDIA' : 'BAIXA';
  
  const reliability = totalOccurrences >= 20 ? 'confiável' :
                     totalOccurrences >= 10 ? 'moderadamente testado' : 'em validação';

  return `Padrão "${pattern}" apresenta qualidade ${quality} com ${successRate.toFixed(1)}% de acerto em ${totalOccurrences} ocorrências. ` +
         `Probabilidade média de ${avgProb.toFixed(1)}%, observado em ${timeframes.join(', ')}. ` +
         `Setup ${reliability} para tomada de decisão.`;
}

// FUNÇÃO DE CÁLCULO DE CONFIANÇA
function calculateConfidence(occurrences: number, successRate: number): number {
  // Fórmula: (ocorrências * taxa_sucesso) / 100
  // Normalizado entre 0-100
  const raw = (occurrences * successRate) / 100;
  return Math.min(100, Math.max(0, raw));
}
