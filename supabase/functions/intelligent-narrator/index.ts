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
      pattern,
      marketData,
      technicalIndicators,
      userId
    } = await req.json();

    console.log('🔍 Analisando padrão detectado:', pattern);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. CONSULTAR CONTEXTO MULTI-TIMEFRAME
    console.log('🕐 Consultando contexto temporal M1→M5→M15→M30...');
    const multiTimeframeContext = await getMultiTimeframeContext(
      supabase,
      marketData.symbol
    );

    console.log('📊 Contexto temporal:', {
      m1_available: !!multiTimeframeContext.m1,
      m5_available: !!multiTimeframeContext.m5,
      m15_available: !!multiTimeframeContext.m15,
      m30_available: !!multiTimeframeContext.m30
    });

    // 2. Buscar conhecimento técnico relevante
    const { data: knowledge } = await supabase
      .from('bot_knowledge')
      .select('*')
      .in('category', ['padroes', 'estrategias', 'wyckoff'])
      .order('usage_count', { ascending: false })
      .limit(15);

    console.log('📚 Conhecimento carregado:', knowledge?.length || 0, 'entradas');

  // 3. Análise inteligente proprietária COM CONTEXTO TEMPORAL
    const analysis = await analyzePatternIntelligently(
      pattern,
      marketData,
      technicalIndicators,
      knowledge || [],
      multiTimeframeContext
    );

    console.log('🧠 Análise completa. Score:', analysis.confidenceScore);

    // 4. VALIDAÇÃO CONTEXTUAL PROFUNDA COM TRADEVISION IA + MULTI-TIMEFRAME
    const tradeVisionValidation = await validateWithTradeVisionAI(
      analysis,
      pattern,
      marketData,
      technicalIndicators,
      knowledge || [],
      multiTimeframeContext
    );

    console.log('🤖 Validação TradeVision IA:', tradeVisionValidation.recommendation);

    // 🧠 BLOCO 1: Memória Neural Entre Sessões COM PATTERN WEIGHTS
    const neuralState = await loadNeuralState(supabase, marketData.symbol);
    console.log('🧠 Estado neural:', neuralState ? 'Carregado' : 'Nova sessão');
    
    // 🎯 APLICAR PATTERN WEIGHTS APRENDIDOS
    if (neuralState?.pattern_weights && Object.keys(neuralState.pattern_weights).length > 0) {
      const patternKey = pattern.type || analysis.patternDescription;
      const learnedWeight = neuralState.pattern_weights[patternKey];
      
      if (learnedWeight) {
        const successRate = learnedWeight.weight || 0.5;
        const adjustmentFactor = (successRate - 0.5) * 40; // -20 a +20 pontos
        
        analysis.confidenceScore = Math.max(0, Math.min(100, 
          analysis.confidenceScore + adjustmentFactor
        ));
        
        console.log(`🎓 Aprendizado aplicado para "${patternKey}": ${successRate * 100}% sucesso → ${adjustmentFactor > 0 ? '+' : ''}${adjustmentFactor.toFixed(0)} pontos`);
      }
    }

    // 🧠 BLOCO 2: Score Consolidado Multi-Frame
    const consolidatedScore = await calculateConsolidatedScore(
      supabase,
      multiTimeframeContext,
      neuralState
    );
    console.log('📊 Score consolidado:', consolidatedScore);

    // 🧠 BLOCO 3: Consciência Temporal
    const temporalAwareness = await evaluateTemporalAwareness(
      supabase,
      marketData.symbol,
      multiTimeframeContext
    );
    console.log('⏱️ Tendência há', temporalAwareness.duration, 'minutos');

    // 5. Filtrar sinais ruins COM VALIDAÇÃO MULTI-TIMEFRAME
    const shouldReject =
      (tradeVisionValidation.recommendation === 'STRONG_AVOID') ||
      (analysis.confidenceScore < 45 && tradeVisionValidation.aiConfidence < 40) ||
      (multiTimeframeContext.shouldReject);

    if (shouldReject) {
      console.log('❌ Sinal rejeitado -', tradeVisionValidation.reasoning);
      return new Response(
        JSON.stringify({
          success: false,
          reason: multiTimeframeContext.shouldReject ? 'rejected_by_timeframe_analysis' : 'rejected_by_ai',
          score: analysis.confidenceScore,
          aiConfidence: tradeVisionValidation.aiConfidence,
          recommendation: tradeVisionValidation.recommendation,
          reasoning: tradeVisionValidation.reasoning,
          timeframeRejection: multiTimeframeContext.rejectionReason
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Gerar sinal ENRIQUECIDO com validação TradeVision IA + MULTI-TIMEFRAME
    const detectionTime = new Date();
    const analysisTime = Date.now() - (pattern.detected_at || Date.now());
    const actionWindow = tradeVisionValidation.suggestedActionWindow || 300;
    
    const signalData = {
      user_id: userId,
      symbol: marketData.symbol,
      timeframe: marketData.timeframe || '1h',
      signal_type: analysis.signalType,
      probability: Math.round((analysis.confidenceScore + tradeVisionValidation.aiConfidence) / 2), // Média ponderada
      pattern: analysis.patternDescription,
      figure: pattern.type || 'Estrutura detectada',
      risk_note: tradeVisionValidation.enhancedRiskNote || analysis.riskNote,
      price: marketData.price.toString(),
      news: marketData.news || null,
      market_status: tradeVisionValidation.contextualInsight || analysis.marketContext,
      metadata: {
        analysis: analysis.summary,
        confluences: analysis.confluences,
        technicalScore: analysis.technicalScore,
        volumeAnalysis: analysis.volumeAnalysis,
        ai_generated: true,
        ai_validated: true,
        multi_timeframe_validated: true,
        timeframe_context: {
          m1_insight: multiTimeframeContext.m1?.micro_insight,
          m5_insight: multiTimeframeContext.m5?.tactical_insight,
          m15_insight: multiTimeframeContext.m15?.contextual_insight,
          m30_insight: multiTimeframeContext.m30?.strategic_insight,
          macro_trend: multiTimeframeContext.m30?.macro_trend,
          market_phase: multiTimeframeContext.m30?.market_phase,
          timeframe_confirmation: multiTimeframeContext.confirmation
        },
        tradevision_validation: {
          recommendation: tradeVisionValidation.recommendation,
          reasoning: tradeVisionValidation.reasoning,
          confidence: tradeVisionValidation.aiConfidence,
          keyPoints: tradeVisionValidation.keyPoints,
          shouldEnter: tradeVisionValidation.shouldEnter
        },
        pattern_details: pattern,
        timing: {
          detected_at: detectionTime.toISOString(),
          analysis_duration_ms: analysisTime,
          action_window_seconds: actionWindow,
          expires_at: new Date(Date.now() + actionWindow * 1000).toISOString(),
          urgency_level: tradeVisionValidation.urgencyLevel
        }
      }
    };

    // 7. PROCESSAR M1 (captura instantânea)
    console.log('💾 Processando M1...');
    await supabase.functions.invoke('temporal-processor-m1', {
      body: {
        symbol: marketData.symbol,
        marketData: {
          open: marketData.open || marketData.price,
          high: marketData.high || marketData.price,
          low: marketData.low || marketData.price,
          close: marketData.price,
          volume: marketData.volume || 0
        },
        technicalIndicators,
        detectedPatterns: pattern
      }
    });

    // 8. Salvar sinal validado
    const { data: savedSignal, error: signalError } = await supabase
      .from('narrator_signals')
      .insert(signalData)
      .select()
      .single();

    if (signalError) {
      console.error('❌ Erro ao salvar sinal:', signalError);
      throw signalError;
    }

    console.log('✅ Sinal validado por TradeVision IA + Multi-Timeframe e salvo!');

    // 🧠 BLOCO 4: Salvar no histórico temporal para aprendizado longitudinal
    await saveTemporalLearningHistory(
      supabase,
      marketData,
      multiTimeframeContext,
      consolidatedScore,
      tradeVisionValidation,
      analysis
    );
    console.log('📚 Histórico de aprendizado salvo');

    // 🧠 BLOCO 5: Atualizar estado neural da sessão
    await updateNeuralState(
      supabase,
      marketData.symbol,
      analysis,
      tradeVisionValidation,
      multiTimeframeContext,
      temporalAwareness
    );
    console.log('🧠 Estado neural atualizado');

    // 9. Atualizar conhecimento usado
    if (analysis.knowledgeUsed.length > 0) {
      for (const knowledgeId of analysis.knowledgeUsed) {
        await supabase.rpc('increment_knowledge_usage', {
          knowledge_id: knowledgeId
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        signal: savedSignal,
        analysis: {
          score: Math.round((analysis.confidenceScore + tradeVisionValidation.aiConfidence) / 2),
          summary: analysis.summary,
          confluences: analysis.confluences,
          narration: analysis.narration
        },
        aiValidation: {
          recommendation: tradeVisionValidation.recommendation,
          reasoning: tradeVisionValidation.reasoning,
          shouldEnter: tradeVisionValidation.shouldEnter,
          keyInsights: tradeVisionValidation.keyPoints
        },
        timeframeContext: {
          m1: multiTimeframeContext.m1?.micro_insight,
          m5: multiTimeframeContext.m5?.tactical_insight,
          m15: multiTimeframeContext.m15?.contextual_insight,
          m30: multiTimeframeContext.m30?.strategic_insight,
          confirmation: multiTimeframeContext.confirmation
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro no narrador inteligente:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ========== FUNÇÃO DE CONSULTA MULTI-TIMEFRAME ==========

async function getMultiTimeframeContext(supabase: any, symbol: string): Promise<any> {
  console.log('🔍 Buscando contexto multi-timeframe para', symbol);

  // Buscar último registro de cada timeframe
  const { data: m1 } = await supabase
    .from('market_m1')
    .select('*')
    .eq('symbol', symbol)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: m5 } = await supabase
    .from('market_m5')
    .select('*')
    .eq('symbol', symbol)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: m15 } = await supabase
    .from('market_m15')
    .select('*')
    .eq('symbol', symbol)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: m30 } = await supabase
    .from('market_m30')
    .select('*')
    .eq('symbol', symbol)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Análise de confirmação entre timeframes
  let confirmation = 'neutral';
  let shouldReject = false;
  let rejectionReason = '';

  // Se temos contexto M15 e M30, validar alinhamento
  if (m15 && m30) {
    const m15Direction = m15.trend_direction;
    const m30MacroTrend = m30.macro_trend;

    // Rejeitar se há divergência forte entre M15 e M30
    if (
      (m15Direction === 'bullish' && m30MacroTrend.includes('bearish')) ||
      (m15Direction === 'bearish' && m30MacroTrend.includes('bullish'))
    ) {
      shouldReject = true;
      rejectionReason = `Divergência forte: M15 está ${m15Direction} mas M30 está ${m30MacroTrend}`;
      confirmation = 'divergent';
    } else {
      // Confirmação positiva
      confirmation = 'aligned';
    }
  }

  return {
    m1,
    m5,
    m15,
    m30,
    confirmation,
    shouldReject,
    rejectionReason
  };
}

// ========== MOTOR DE VALIDAÇÃO TRADEVISION IA ==========

async function validateWithTradeVisionAI(
  analysis: any,
  pattern: any,
  marketData: any,
  indicators: any,
  knowledge: any[],
  multiTimeframeContext: any
): Promise<any> {
  console.log('🤖 TradeVision IA analisando contexto profundo com multi-timeframe...');

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.warn('⚠️ LOVABLE_API_KEY não configurada - validação simplificada');
    return {
      shouldDiscard: false,
      recommendation: 'PROCEED',
      reasoning: 'Validação IA não disponível',
      aiConfidence: analysis.confidenceScore,
      shouldEnter: true,
      keyPoints: [],
      enhancedRiskNote: analysis.riskNote,
      contextualInsight: analysis.marketContext,
      suggestedActionWindow: 300,
      urgencyLevel: 'medium'
    };
  }

  // Montar contexto rico para a IA COM MULTI-TIMEFRAME
  const now = new Date();
  const brazilTime = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'long',
    timeZone: 'America/Sao_Paulo'
  }).format(now);
  
  const contextPrompt = `
Você é a TradeVision IA, uma inteligência institucional especializada em análise de mercado financeiro.

**DATA E HORA ATUAL:** ${brazilTime}

**SUA MISSÃO:** Validar se vale a pena entrar neste trade baseado em análise contextual profunda + análise multi-timeframe.

**DADOS TÉCNICOS:**
- Padrão detectado: ${pattern.type || 'Estrutura técnica'}
- Sinal sugerido: ${analysis.signalType}
- Score técnico: ${analysis.confidenceScore}%
- Confluências: ${analysis.confluences.join(', ')}

**INDICADORES:**
- RSI: ${indicators?.rsi_14 || 'N/A'}
- MACD: ${indicators?.macd || 'N/A'}
- Volume Z-Score: ${indicators?.volume_z_score || 'N/A'}
- EMAs: ${indicators?.ema_9 || 'N/A'} / ${indicators?.ema_50 || 'N/A'} / ${indicators?.ema_200 || 'N/A'}

**CONTEXTO DE MERCADO:**
- Par: ${marketData.symbol}
- Timeframe: ${marketData.timeframe}
- Preço atual: $${marketData.price}
- Notícia relevante: ${marketData.news || 'Nenhuma'}

**ANÁLISE MULTI-TIMEFRAME (APRENDIZADO TEMPORAL):**
${multiTimeframeContext.m1 ? `- M1 (1 min): ${multiTimeframeContext.m1.micro_insight} | Continuação: ${multiTimeframeContext.m1.continuation_probability}%` : '- M1: Aguardando dados'}
${multiTimeframeContext.m5 ? `- M5 (5 min): ${multiTimeframeContext.m5.tactical_insight} | Tendência: ${multiTimeframeContext.m5.trend_strength}%` : '- M5: Aguardando consolidação'}
${multiTimeframeContext.m15 ? `- M15 (15 min): ${multiTimeframeContext.m15.contextual_insight} | Fluxo: ${multiTimeframeContext.m15.institutional_flow}` : '- M15: Aguardando padrão maior'}
${multiTimeframeContext.m30 ? `- M30 (30 min): ${multiTimeframeContext.m30.strategic_insight} | Fase: ${multiTimeframeContext.m30.market_phase}` : '- M30: Aguardando panorama macro'}
- **CONFIRMAÇÃO ENTRE TIMEFRAMES:** ${multiTimeframeContext.confirmation.toUpperCase()}

**CONHECIMENTO DISPONÍVEL:**
${knowledge.slice(0, 3).map(k => `- ${k.topic}: ${k.content.substring(0, 150)}...`).join('\n')}

**RESPONDA EM JSON ESTRUTURADO:**
{
  "shouldDiscard": boolean,
  "recommendation": "STRONG_BUY" | "BUY" | "PROCEED" | "WAIT" | "AVOID" | "STRONG_AVOID",
  "reasoning": "Explicação detalhada da sua decisão",
  "aiConfidence": number (0-100),
  "shouldEnter": boolean,
  "keyPoints": ["ponto 1", "ponto 2", "ponto 3"],
  "enhancedRiskNote": "Nota de risco contextualizada",
  "contextualInsight": "Insight sobre o momento do mercado em 1 frase",
  "suggestedActionWindow": number (segundos),
  "urgencyLevel": "high" | "medium" | "low"
}

**CRITÉRIOS DE AVALIAÇÃO:**
1. Confluência entre indicadores técnicos (peso 25%)
2. Contexto de mercado e notícias (peso 15%)
3. Qualidade do padrão detectado (peso 20%)
4. Risco/retorno estimado (peso 10%)
5. Timing e momento do mercado (peso 10%)
6. **CONFIRMAÇÃO MULTI-TIMEFRAME (peso 20%)** ← NOVO!

**ORIENTAÇÕES:**
- Score técnico ≥ 55%: considere aprovar se houver confluências
- **Se M15 e M30 estão alinhados: FORTE SINAL**
- **Se há divergência entre timeframes: CAUTELA ou AVOID**
- Sinais BUY/SELL são válidos se tiverem fundamento + confirmação temporal
- Use WAIT se timeframes ainda estão se formando
- AVOID apenas se houver risco evidente, contradições graves OU divergência forte entre M15-M30
- Prefira validar sinais educacionais em vez de descartá-los totalmente
- Quanto mais timeframes disponíveis e alinhados, maior a confiança
`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Você é a TradeVision IA, mentor institucional de traders. Sua função é validar sinais com rigor analítico máximo.'
          },
          {
            role: 'user',
            content: contextPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Parse JSON da resposta
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Resposta da IA não contém JSON válido');
    }

    const validation = JSON.parse(jsonMatch[0]);
    console.log('✅ TradeVision IA validou:', validation.recommendation);

    return validation;

  } catch (error) {
    console.error('❌ Erro na validação TradeVision IA:', error);
    
    // Fallback: aprovar sinais com score razoável (≥55)
    return {
      shouldDiscard: analysis.confidenceScore < 55,
      recommendation: analysis.confidenceScore >= 65 ? 'BUY' : analysis.confidenceScore >= 55 ? 'PROCEED' : 'WAIT',
      reasoning: `Validação IA falhou. Score técnico: ${analysis.confidenceScore}%. ${analysis.confluences.join('. ')}`,
      aiConfidence: analysis.confidenceScore,
      shouldEnter: analysis.confidenceScore >= 55,
      keyPoints: analysis.confluences.slice(0, 3),
      enhancedRiskNote: analysis.riskNote,
      contextualInsight: analysis.marketContext,
      suggestedActionWindow: 300,
      urgencyLevel: analysis.confidenceScore >= 65 ? 'medium' : 'low'
    };
  }
}

// ========== MOTOR DE ANÁLISE PROPRIETÁRIO ==========

async function analyzePatternIntelligently(
  pattern: any,
  marketData: any,
  indicators: any,
  knowledge: any[],
  multiTimeframeContext: any
): Promise<any> {
  console.log('🧠 Iniciando análise inteligente com contexto temporal...');

  let confidenceScore = 50; // Base
  const confluences: string[] = [];
  const knowledgeUsed: string[] = [];
  let signalType = 'NEUTRAL';

  // BOOST: Se temos contexto multi-timeframe alinhado
  if (multiTimeframeContext.confirmation === 'aligned') {
    confidenceScore += 15;
    confluences.push('✅ Confirmação multi-timeframe ALINHADA');
    
    if (multiTimeframeContext.m30) {
      confluences.push(`Tendência macro: ${multiTimeframeContext.m30.macro_trend}`);
    }
    if (multiTimeframeContext.m15) {
      confluences.push(`Fluxo institucional: ${multiTimeframeContext.m15.institutional_flow}`);
    }
  } else if (multiTimeframeContext.confirmation === 'divergent') {
    confidenceScore -= 20;
    confluences.push('⚠️ DIVERGÊNCIA entre timeframes detectada');
  }

  // 1. Análise de Volume
  const volumeScore = analyzeVolume(indicators, marketData);
  confidenceScore += volumeScore.score;
  if (volumeScore.isSignificant) {
    confluences.push(volumeScore.description);
  }

  // 2. Análise de Suporte/Resistência
  const srAnalysis = analyzeSupportResistance(pattern, marketData, indicators);
  confidenceScore += srAnalysis.score;
  if (srAnalysis.hasConfluence) {
    confluences.push(srAnalysis.description);
  }

  // 3. Determinar direção inicial baseada no padrão detectado
  let initialDirection = 'NEUTRAL';
  
  // Prioridade 1: Padrões bearish/bullish explícitos
  if (pattern.fvg_type === 'bearish' || pattern.order_block_type === 'bearish') {
    initialDirection = 'SELL';
  } else if (pattern.fvg_type === 'bullish' || pattern.order_block_type === 'bullish') {
    initialDirection = 'BUY';
  }
  
  // Prioridade 2: Wyckoff patterns
  if (pattern.type === 'Upthrust' || pattern.type === 'Wyckoff Upthrust') {
    initialDirection = 'SELL';
  } else if (pattern.type === 'Spring' || pattern.type === 'Wyckoff Spring') {
    initialDirection = 'BUY';
  }

  // 4. Análise de Tendência Macro (valida ou sobrescreve direção)
  const trendAnalysis = analyzeTrend(indicators);
  confidenceScore += trendAnalysis.score;
  confluences.push(trendAnalysis.description);
  
  // Se padrão tem direção clara, usar ela. Senão, usar tendência
  signalType = initialDirection !== 'NEUTRAL' ? initialDirection : trendAnalysis.direction;

  // 5. Análise de Padrão Específico
  const patternAnalysis = analyzeSpecificPattern(pattern, knowledge);
  confidenceScore += patternAnalysis.score;
  if (patternAnalysis.knowledge) {
    knowledgeUsed.push(...patternAnalysis.knowledgeIds);
    confluences.push(patternAnalysis.insight);
  }

  // 5. Análise de RSI
  if (indicators?.rsi_14) {
    const rsiAnalysis = analyzeRSI(indicators.rsi_14, signalType);
    confidenceScore += rsiAnalysis.score;
    confluences.push(rsiAnalysis.description);
  }

  // 6. Análise de MACD
  if (indicators?.macd && indicators?.macd_signal) {
    const macdAnalysis = analyzeMACDvoid(indicators.macd, indicators.macd_signal, signalType);
    confidenceScore += macdAnalysis.score;
    confluences.push(macdAnalysis.description);
  }

  // Limitar score entre 0-100
  confidenceScore = Math.max(0, Math.min(100, confidenceScore));

  // Gerar narração rica
  const narration = generateRichNarration(
    pattern,
    confluences,
    confidenceScore,
    signalType,
    marketData
  );

  return {
    confidenceScore: Math.round(confidenceScore),
    signalType,
    confluences,
    knowledgeUsed,
    summary: narration.summary,
    narration: narration.full,
    patternDescription: narration.patternName,
    riskNote: narration.risk,
    marketContext: narration.context,
    technicalScore: Math.round(confidenceScore),
    volumeAnalysis: volumeScore.description
  };
}

function analyzeVolume(indicators: any, marketData: any): any {
  if (!indicators?.volume_spike && !indicators?.volume_z_score) {
    return { score: 0, isSignificant: false, description: 'Volume normal' };
  }

  let score = 0;
  let description = '';

  if (indicators.volume_spike) {
    score += 15;
    description = `Volume explosivo detectado (${indicators.volume_z_score?.toFixed(2) || '3+'}σ acima da média)`;
    return { score, isSignificant: true, description };
  }

  if (indicators.volume_z_score > 2) {
    score += 10;
    description = `Volume ${indicators.volume_z_score.toFixed(2)}σ acima da média`;
    return { score, isSignificant: true, description };
  }

  if (indicators.volume_z_score > 1) {
    score += 5;
    description = 'Volume acima da média';
    return { score, isSignificant: true, description };
  }

  return { score: -5, isSignificant: false, description: 'Volume abaixo da média' };
}

function analyzeSupportResistance(pattern: any, marketData: any, indicators: any): any {
  if (!pattern.support_level && !pattern.resistance_level) {
    return { score: 0, hasConfluence: false, description: 'Sem níveis de S/R claros' };
  }

  const currentPrice = parseFloat(marketData.price);
  let score = 0;
  let description = '';

  // Distância do suporte
  if (pattern.support_level) {
    const distanceToSupport = ((currentPrice - pattern.support_level) / currentPrice) * 100;
    
    if (Math.abs(distanceToSupport) < 1) {
      score += 15;
      description = `Preço em zona de suporte crítico ($${pattern.support_level.toFixed(2)})`;
      return { score, hasConfluence: true, description };
    } else if (Math.abs(distanceToSupport) < 2) {
      score += 10;
      description = `Próximo ao suporte em $${pattern.support_level.toFixed(2)}`;
      return { score, hasConfluence: true, description };
    }
  }

  // Distância da resistência
  if (pattern.resistance_level) {
    const distanceToResistance = ((pattern.resistance_level - currentPrice) / currentPrice) * 100;
    
    if (Math.abs(distanceToResistance) < 1) {
      score += 15;
      description = `Preço testando resistência crítica ($${pattern.resistance_level.toFixed(2)})`;
      return { score, hasConfluence: true, description };
    } else if (Math.abs(distanceToResistance) < 2) {
      score += 10;
      description = `Próximo à resistência em $${pattern.resistance_level.toFixed(2)}`;
      return { score, hasConfluence: true, description };
    }
  }

  return { score, hasConfluence: score > 0, description };
}

function analyzeTrend(indicators: any): any {
  if (!indicators?.ema_9 || !indicators?.ema_50 || !indicators?.ema_200) {
    // Sem EMAs, usar RSI como backup
    if (indicators?.rsi_14) {
      return {
        score: 5,
        direction: indicators.rsi_14 > 50 ? 'BUY' : 'SELL',
        description: `Tendência baseada em RSI (${indicators.rsi_14.toFixed(1)})`
      };
    }
    
    // Último recurso: usar MACD
    if (indicators?.macd && indicators?.macd_signal) {
      return {
        score: 5,
        direction: indicators.macd > indicators.macd_signal ? 'BUY' : 'SELL',
        description: 'Tendência baseada em MACD'
      };
    }
    
    // Fallback: detectar tendência baseada em padrão detectado
    return { score: 0, direction: 'NEUTRAL', description: 'Sem indicadores suficientes para determinar direção' };
  }

  const { ema_9, ema_50, ema_200 } = indicators;

  // Calcular divergências percentuais para detectar micro-tendências
  const ema9_vs_50 = ((ema_9 - ema_50) / ema_50) * 100;
  const ema50_vs_200 = ((ema_50 - ema_200) / ema_200) * 100;

  // Tendência de alta forte
  if (ema_9 > ema_50 && ema_50 > ema_200) {
    return {
      score: 20,
      direction: 'BUY',
      description: 'Tendência de alta confirmada (EMAs alinhadas)'
    };
  }

  // Tendência de baixa forte
  if (ema_9 < ema_50 && ema_50 < ema_200) {
    return {
      score: 20,
      direction: 'SELL',
      description: 'Tendência de baixa confirmada (EMAs alinhadas)'
    };
  }

  // Micro-tendência de alta (EMA9 > EMA50 mesmo que próximas)
  if (ema9_vs_50 > 0.01) {
    return {
      score: 12,
      direction: 'BUY',
      description: `Micro-tendência de alta (EMA9 ${ema9_vs_50.toFixed(3)}% acima)`
    };
  }

  // Micro-tendência de baixa (EMA9 < EMA50 mesmo que próximas)
  if (ema9_vs_50 < -0.01) {
    return {
      score: 12,
      direction: 'SELL',
      description: `Micro-tendência de baixa (EMA9 ${Math.abs(ema9_vs_50).toFixed(3)}% abaixo)`
    };
  }

  // EMAs muito próximas - lateral -> usar EMA50 vs EMA200 para decidir
  if (ema_50 > ema_200) {
    return { 
      score: 8, 
      direction: 'BUY', 
      description: 'Mercado lateral com viés de alta (EMA50 > EMA200)' 
    };
  } else {
    return { 
      score: 8, 
      direction: 'SELL', 
      description: 'Mercado lateral com viés de baixa (EMA50 < EMA200)' 
    };
  }
}

function analyzeSpecificPattern(pattern: any, knowledge: any[]): any {
  const patternType = pattern.type?.toLowerCase() || '';
  
  // Buscar conhecimento relacionado
  const relevantKnowledge = knowledge.filter(k => {
    const topic = k.topic?.toLowerCase() || '';
    const content = k.content?.toLowerCase() || '';
    return topic.includes(patternType) || 
           content.includes(patternType) ||
           topic.includes('order block') && patternType.includes('ob') ||
           topic.includes('fvg') && patternType.includes('fvg');
  });

  if (relevantKnowledge.length === 0) {
    return { score: 5, knowledge: false, knowledgeIds: [], insight: 'Padrão reconhecido' };
  }

  const knowledgeIds = relevantKnowledge.map(k => k.id);
  const topKnowledge = relevantKnowledge[0];

  let score = 15;
  let insight = '';

  // Order Block
  if (patternType.includes('ob') || patternType.includes('order block')) {
    score += 10;
    insight = `Order Block ${pattern.order_block_type || 'detectado'} com ${topKnowledge.accuracy_score || 'alta'} precisão histórica`;
  }

  // FVG
  else if (patternType.includes('fvg')) {
    score += 10;
    insight = `FVG ${pattern.fvg_type || 'detectado'} - gap significativo no volume`;
  }

  // CHOCH
  else if (patternType.includes('choch')) {
    score += 15;
    insight = 'Mudança de caráter detectada - possível reversão de tendência';
  }

  // BOS
  else if (patternType.includes('bos')) {
    score += 15;
    insight = 'Break of Structure confirmado - continuação de tendência';
  }

  else {
    insight = `Padrão ${topKnowledge.topic} identificado com base em conhecimento validado`;
  }

  return {
    score,
    knowledge: true,
    knowledgeIds,
    insight
  };
}

function analyzeRSI(rsi: number, signalType: string): any {
  // RSI extremo - zona crítica
  if (rsi > 95) {
    return {
      score: signalType === 'SELL' ? 15 : -10,
      description: `RSI EXTREMO em sobrecompra (${rsi.toFixed(1)}) - ${signalType === 'SELL' ? 'FORTE sinal de venda' : 'CUIDADO com reversão'}`
    };
  }

  if (rsi < 5) {
    return {
      score: signalType === 'BUY' ? 15 : -10,
      description: `RSI EXTREMO em sobrevenda (${rsi.toFixed(1)}) - ${signalType === 'BUY' ? 'FORTE sinal de compra' : 'CUIDADO com reversão'}`
    };
  }

  // RSI sobrecompra/sobrevenda normal
  if (rsi < 30 && signalType === 'BUY') {
    return {
      score: 10,
      description: `RSI em sobrevenda (${rsi.toFixed(1)}) - favorece compra`
    };
  }

  if (rsi > 70 && signalType === 'SELL') {
    return {
      score: 10,
      description: `RSI em sobrecompra (${rsi.toFixed(1)}) - favorece venda`
    };
  }

  if (rsi > 50 && signalType === 'BUY') {
    return {
      score: 5,
      description: `RSI neutro-positivo (${rsi.toFixed(1)})`
    };
  }

  if (rsi < 50 && signalType === 'SELL') {
    return {
      score: 5,
      description: `RSI neutro-negativo (${rsi.toFixed(1)})`
    };
  }

  return {
    score: 0,
    description: `RSI em ${rsi.toFixed(1)} - zona neutra`
  };
}

function analyzeMACDvoid(macd: number, signal: number, signalType: string): any {
  const histogram = macd - signal;

  if (histogram > 0 && signalType === 'BUY') {
    return {
      score: 8,
      description: 'MACD bullish - momento de alta confirmado'
    };
  }

  if (histogram < 0 && signalType === 'SELL') {
    return {
      score: 8,
      description: 'MACD bearish - momento de baixa confirmado'
    };
  }

  return {
    score: 0,
    description: 'MACD sem confirmação clara'
  };
}

function generateRichNarration(
  pattern: any,
  confluences: string[],
  score: number,
  signalType: string,
  marketData: any
): any {
  const patternName = pattern.type || 'Estrutura técnica';
  const confluenceList = confluences.join(' + ');
  
  const summary = `${patternName} detectado com ${score}% de probabilidade. Confluências: ${confluenceList}`;

  const full = `
🎯 **SETUP DE ${score >= 80 ? 'ALTA' : score >= 55 ? 'MÉDIA' : 'BAIXA'} PROBABILIDADE**

📊 **Padrão:** ${patternName}
💹 **Sinal:** ${signalType}
🎲 **Probabilidade:** ${score}%

🔗 **Confluências detectadas:**
${confluences.map((c, i) => `${i + 1}. ${c}`).join('\n')}

💰 **Preço atual:** $${marketData.price}
⏰ **Timeframe:** ${marketData.timeframe || '1h'}
⚡ **Janela de ação:** 5 minutos
🤖 **Análise disponível para TradeVision IA**
  `.trim();

  const risk = score >= 80 
    ? 'Risco controlado - setup de alta qualidade. Agir rapidamente.'
    : score >= 55
    ? 'Risco moderado - padrão detectado em tempo real. Avaliar contexto.'
    : 'Risco elevado - operar com cautela extrema';

  const context = confluences.length >= 3
    ? `${confluences.length} confluências técnicas identificadas`
    : `Setup com ${confluences.length} confluência(s)`;

  return {
    summary,
    full,
    patternName,
    risk,
    context
  };
}

// ========== 🧠 BLOCO 1: MEMÓRIA NEURAL ENTRE SESSÕES ==========
async function loadNeuralState(supabase: any, symbol: string): Promise<any> {
  const { data } = await supabase
    .from('tradevision_state')
    .select('*')
    .eq('symbol', symbol)
    .maybeSingle();
    
  return data;
}

async function updateNeuralState(
  supabase: any,
  symbol: string,
  analysis: any,
  aiValidation: any,
  multiTimeframe: any,
  temporalAwareness: any
): Promise<void> {
  const dominantPattern = analysis.confluences[0] || 'unknown';
  const marketBias = aiValidation.recommendation.includes('BUY') ? 'bullish' : 
                     aiValidation.recommendation.includes('SELL') ? 'bearish' : 'neutral';
  
  const sessionInsights = `Última análise: ${aiValidation.reasoning}. 
    Tendência ${marketBias} há ${temporalAwareness.duration} minutos.
    Timeframes alinhados: ${temporalAwareness.alignment}`;

  await supabase
    .from('tradevision_state')
    .upsert({
      symbol,
      market_bias: marketBias,
      avg_accuracy: analysis.confidenceScore,
      dominant_pattern: dominantPattern,
      session_insights: sessionInsights,
      last_trend_change: temporalAwareness.lastChange,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'symbol'
    });
}

// ========== 🧠 BLOCO 2: SCORE CONSOLIDADO MULTI-FRAME COM PESOS APRENDIDOS ==========
async function calculateConsolidatedScore(
  supabase: any,
  multiTimeframe: any,
  neuralState: any
): Promise<number> {
  // Extrair tendências de cada timeframe
  const m1Trend = multiTimeframe.m1?.direction || null;
  const m5Trend = multiTimeframe.m5?.predominant_direction || null;
  const m15Trend = multiTimeframe.m15?.trend_direction || null;
  const m30Trend = multiTimeframe.m30?.macro_trend || null;

  // Usar função SQL para calcular score
  const { data, error } = await supabase
    .rpc('calculate_consolidated_trend_score', {
      m1_trend: m1Trend,
      m5_trend: m5Trend,
      m15_trend: m15Trend,
      m30_trend: m30Trend
    });

  if (error) {
    console.error('Erro ao calcular score consolidado:', error);
    return 50; // Score neutro
  }

  return data || 50;
}

// ========== 🧠 BLOCO 3: CONSCIÊNCIA TEMPORAL ==========
async function evaluateTemporalAwareness(
  supabase: any,
  symbol: string,
  multiTimeframe: any
): Promise<any> {
  // Buscar última mudança de tendência registrada
  const { data: lastHistory } = await supabase
    .from('temporal_learning_history')
    .select('*')
    .eq('symbol', symbol)
    .order('timestamp', { ascending: false })
    .limit(10);

  let duration = 0;
  let lastChange = new Date();
  let alignment = 0;

  if (lastHistory && lastHistory.length > 0) {
    // Calcular há quanto tempo está na mesma tendência
    const currentTrend = lastHistory[0].consolidated_trend;
    for (const record of lastHistory) {
      if (record.consolidated_trend === currentTrend) {
        duration = Math.floor((Date.now() - new Date(record.timestamp).getTime()) / 60000);
      } else {
        lastChange = new Date(record.timestamp);
        break;
      }
    }

    // Calcular alinhamento entre timeframes
    const trends = [
      multiTimeframe.m1?.direction,
      multiTimeframe.m5?.predominant_direction,
      multiTimeframe.m15?.trend_direction,
      multiTimeframe.m30?.macro_trend
    ].filter(Boolean);

    const bullishCount = trends.filter(t => t === 'bullish').length;
    const bearishCount = trends.filter(t => t === 'bearish').length;
    alignment = Math.max(bullishCount, bearishCount);
  }

  return {
    duration,
    lastChange,
    alignment,
    trend: alignment > 2 ? (multiTimeframe.m15?.trend_direction || 'neutral') : 'divergent'
  };
}

// ========== 🧠 BLOCO 4: SALVAR HISTÓRICO TEMPORAL PARA APRENDIZADO ==========
async function saveTemporalLearningHistory(
  supabase: any,
  marketData: any,
  multiTimeframe: any,
  consolidatedScore: number,
  aiValidation: any,
  analysis: any
): Promise<void> {
  const consolidatedTrend = consolidatedScore > 20 ? 'bullish' : 
                           consolidatedScore < -20 ? 'bearish' : 'neutral';
  
  const patternsDetected = analysis.confluences.map((c: string) => ({
    name: c,
    confidence: analysis.confidenceScore
  }));

  await supabase
    .from('temporal_learning_history')
    .insert({
      symbol: marketData.symbol,
      timestamp: new Date().toISOString(),
      price: marketData.price,
      trend_m1: multiTimeframe.m1?.direction,
      trend_m5: multiTimeframe.m5?.predominant_direction,
      trend_m15: multiTimeframe.m15?.trend_direction,
      trend_m30: multiTimeframe.m30?.macro_trend,
      consolidated_trend: consolidatedTrend,
      trend_score: consolidatedScore,
      final_decision: aiValidation.recommendation,
      patterns_detected: patternsDetected,
      metadata: {
        aiConfidence: aiValidation.aiConfidence,
        reasoning: aiValidation.reasoning
      }
    });
}
