import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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
    const { 
      trade,
      userId 
    } = await req.json();

    console.log('📊 Analisando operação:', trade);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar conhecimento técnico relevante
    const { data: knowledge } = await supabase
      .from('bot_knowledge')
      .select('topic, content, category')
      .in('category', ['padroes', 'estrategias', 'gestao_risco'])
      .order('usage_count', { ascending: false })
      .limit(10);

    const knowledgeContext = knowledge?.map(k => `- ${k.topic}: ${k.content}`).join('\n') || '';

    // 2. Calcular métricas da operação
    const isProfitable = trade.pnl ? trade.pnl > 0 : null;
    const riskReward = trade.stop_loss && trade.take_profit && trade.entry_price
      ? Math.abs(trade.take_profit - trade.entry_price) / Math.abs(trade.entry_price - trade.stop_loss)
      : null;

    // 3. Análise proprietária baseada em templates
    const analysis = generateTradeAnalysis(trade, isProfitable, riskReward, knowledgeContext);

    // 4. Identificar tópicos de aprendizado
    const learningTopics = identifyLearningTopics(trade, isProfitable);

    // 5. Atualizar progresso de aprendizado
    for (const topic of learningTopics) {
      // Verificar se já existe registro deste tópico
      const { data: existing } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('topic', topic.name)
        .single();

      if (existing) {
        // Atualizar existente
        const newSuccesses = isProfitable ? existing.successes_count + 1 : existing.successes_count;
        const newMistakes = !isProfitable && trade.pnl !== null ? existing.mistakes_count + 1 : existing.mistakes_count;
        const totalTrades = newSuccesses + newMistakes;
        const newSkillLevel = totalTrades > 0 ? Math.round((newSuccesses / totalTrades) * 100) : existing.skill_level;

        await supabase
          .from('learning_progress')
          .update({
            skill_level: newSkillLevel,
            mistakes_count: newMistakes,
            successes_count: newSuccesses,
            improvement_notes: topic.improvement_note,
            last_practice: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        // Criar novo
        await supabase
          .from('learning_progress')
          .insert({
            user_id: userId,
            topic: topic.name,
            skill_level: isProfitable ? 60 : 30,
            mistakes_count: !isProfitable && trade.pnl !== null ? 1 : 0,
            successes_count: isProfitable ? 1 : 0,
            improvement_notes: topic.improvement_note,
          });
      }
    }

    // 6. Criar sessão de estudo automática
    const studyTopics = learningTopics.map(t => t.name).join(', ');
    await supabase
      .from('study_sessions')
      .insert({
        user_id: userId,
        topic: `Análise: ${trade.symbol} - ${trade.side}`,
        duration_minutes: 5,
        key_learnings: analysis.key_learnings,
        concepts_mastered: isProfitable ? [trade.strategy_used || 'Execução'] : [],
        areas_to_review: !isProfitable ? [studyTopics] : [],
        metadata: {
          trade_id: trade.id,
          auto_generated: true,
        }
      });

    console.log('✅ Análise completa e progresso atualizado');

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysis.summary,
        key_learnings: analysis.key_learnings,
        areas_to_improve: analysis.areas_to_improve,
        recommended_studies: analysis.recommended_studies,
        skill_impact: learningTopics,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Erro na análise:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function generateTradeAnalysis(
  trade: any,
  isProfitable: boolean | null,
  riskReward: number | null,
  knowledgeContext: string
): any {
  const summary: string[] = [];
  const key_learnings: string[] = [];
  const areas_to_improve: string[] = [];
  const recommended_studies: string[] = [];

  // Análise de resultado
  if (isProfitable === true) {
    summary.push(`✅ Operação LUCRATIVA: +$${trade.pnl.toFixed(2)} (${trade.pnl_percent.toFixed(2)}%)`);
    key_learnings.push(`Execução bem-sucedida da estratégia ${trade.strategy_used || 'utilizada'}`);
    key_learnings.push(`Confirmação de ${trade.side === 'BUY' ? 'momento de compra' : 'momento de venda'} correto`);
  } else if (isProfitable === false) {
    summary.push(`❌ Operação com PREJUÍZO: $${trade.pnl.toFixed(2)} (${trade.pnl_percent.toFixed(2)}%)`);
    areas_to_improve.push(`Revisar entrada em ${trade.symbol} - possível erro de timing`);
    recommended_studies.push('Análise de confluências técnicas');
    recommended_studies.push('Gestão de risco e stop loss');
  } else {
    summary.push(`⏳ Operação ABERTA em ${trade.symbol} - ${trade.side} @ $${trade.entry_price}`);
    key_learnings.push('Aguardando fechamento para análise completa');
  }

  // Análise de Risk/Reward
  if (riskReward !== null) {
    if (riskReward >= 2) {
      summary.push(`✅ Excelente R:R de ${riskReward.toFixed(2)}:1`);
      key_learnings.push('Boa gestão de risco/recompensa');
    } else if (riskReward >= 1.5) {
      summary.push(`✓ R:R aceitável de ${riskReward.toFixed(2)}:1`);
    } else {
      summary.push(`⚠️ R:R baixo de ${riskReward.toFixed(2)}:1`);
      areas_to_improve.push('Melhorar relação risco/recompensa - busque mínimo 1.5:1');
      recommended_studies.push('Cálculo de Risk/Reward otimizado');
    }
  } else {
    areas_to_improve.push('Definir sempre Stop Loss e Take Profit antes da entrada');
    recommended_studies.push('Gestão de risco: como calcular SL e TP');
  }

  // Análise de estratégia
  if (trade.strategy_used) {
    summary.push(`📋 Estratégia: ${trade.strategy_used}`);
    
    // Verificar se a estratégia está no conhecimento
    const strategyInKnowledge = knowledgeContext.toLowerCase().includes(trade.strategy_used.toLowerCase());
    if (strategyInKnowledge) {
      key_learnings.push(`Aplicação de estratégia conhecida: ${trade.strategy_used}`);
    } else {
      recommended_studies.push(`Documentar melhor a estratégia "${trade.strategy_used}"`);
    }
  } else {
    areas_to_improve.push('Registrar sempre a estratégia utilizada');
    recommended_studies.push('Desenvolvimento de plano de trading');
  }

  // Análise de notas
  if (trade.notes) {
    key_learnings.push('Boa prática: documentação do contexto da operação');
  } else {
    areas_to_improve.push('Adicionar contexto e observações em cada operação');
  }

  return {
    summary: summary.join('\n'),
    key_learnings,
    areas_to_improve,
    recommended_studies
  };
}

function identifyLearningTopics(trade: any, isProfitable: boolean | null): any[] {
  const topics: any[] = [];

  // Tópico da estratégia
  if (trade.strategy_used) {
    topics.push({
      name: trade.strategy_used,
      improvement_note: isProfitable 
        ? `Continuar aplicando ${trade.strategy_used} - resultado positivo`
        : `Revisar aplicação de ${trade.strategy_used} - pode ter falhas na execução`
    });
  }

  // Tópico de gestão de risco
  const hasRiskManagement = trade.stop_loss && trade.take_profit;
  topics.push({
    name: 'Gestão de Risco',
    improvement_note: hasRiskManagement
      ? 'Boa aplicação de SL e TP'
      : 'Precisa melhorar definição de stop loss e take profit'
  });

  // Tópico de timing
  topics.push({
    name: `Timing de ${trade.side === 'BUY' ? 'Compra' : 'Venda'}`,
    improvement_note: isProfitable
      ? `Bom timing de ${trade.side === 'BUY' ? 'compra' : 'venda'} em ${trade.symbol}`
      : `Timing de ${trade.side === 'BUY' ? 'compra' : 'venda'} precisa melhorar`
  });

  // Tópico específico do par
  topics.push({
    name: `Operações em ${trade.symbol}`,
    improvement_note: isProfitable
      ? `Boa leitura do mercado de ${trade.symbol}`
      : `Estudar mais o comportamento de ${trade.symbol}`
  });

  return topics;
}
