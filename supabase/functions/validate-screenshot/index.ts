import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScreenshotAnalysis {
  pattern: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  confidence: number;
  symbol: string;
  timeframe: string;
}

interface MarketData {
  currentPrice: number;
  heatmap: {
    fearGreedIndex: number;
    buyerDominance: number;
    marketPressure: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      screenshotAnalysis,
      marketData,
      userId 
    }: { 
      screenshotAnalysis: ScreenshotAnalysis;
      marketData: MarketData;
      userId: string;
    } = await req.json();

    console.log('🔍 Validando análise de screenshot:', screenshotAnalysis);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar contexto multi-timeframe
    const { data: mtContext } = await supabase
      .from('market_m30')
      .select('*')
      .eq('symbol', screenshotAnalysis.symbol.replace('/', ''))
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    const { data: m15Data } = await supabase
      .from('market_m15')
      .select('*')
      .eq('symbol', screenshotAnalysis.symbol.replace('/', ''))
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    const { data: m5Data } = await supabase
      .from('market_m5')
      .select('*')
      .eq('symbol', screenshotAnalysis.symbol.replace('/', ''))
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    const { data: m1Data } = await supabase
      .from('market_m1')
      .select('*')
      .eq('symbol', screenshotAnalysis.symbol.replace('/', ''))
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    console.log('📊 Contexto multi-timeframe carregado');

    // 2. Buscar conhecimento de gestão de risco
    const { data: riskKnowledge } = await supabase
      .from('bot_knowledge')
      .select('content')
      .eq('category', 'gestao_risco')
      .single();

    // 3. Calcular métricas de validação
    const riskReward = Math.abs(screenshotAnalysis.take_profit - screenshotAnalysis.entry_price) / 
                       Math.abs(screenshotAnalysis.entry_price - screenshotAnalysis.stop_loss);
    
    const stopDistance = Math.abs(screenshotAnalysis.entry_price - screenshotAnalysis.stop_loss) / screenshotAnalysis.entry_price * 100;
    const tpDistance = Math.abs(screenshotAnalysis.take_profit - screenshotAnalysis.entry_price) / screenshotAnalysis.entry_price * 100;

    // 4. Validar com regras de gestão de risco
    const validationIssues: string[] = [];
    const recommendations: string[] = [];

    // Checar R:R mínimo baseado em confiança
    const minRR = screenshotAnalysis.confidence >= 90 ? 2.0 : 
                  screenshotAnalysis.confidence >= 85 ? 2.5 : 3.0;
    
    if (riskReward < minRR) {
      validationIssues.push(`R:R de ${riskReward.toFixed(2)}:1 está abaixo do mínimo ${minRR}:1 para ${screenshotAnalysis.confidence}% de confiança`);
      recommendations.push(`Ajustar TP para atingir pelo menos ${minRR}:1 R:R`);
    }

    // Validar distância do stop (máximo 2-3%)
    if (stopDistance > 3) {
      validationIssues.push(`Stop loss muito distante: ${stopDistance.toFixed(2)}% (máximo recomendado: 3%)`);
      recommendations.push('Aproximar stop loss de estrutura relevante (OB, FVG, swing low/high)');
    }

    // Validar take profit vs estruturas de timeframes superiores
    if (m15Data?.resistance_level && screenshotAnalysis.take_profit > m15Data.resistance_level * 1.002) {
      validationIssues.push(`TP acima de resistência M15 ($${m15Data.resistance_level})`);
      recommendations.push(`Considerar TP próximo a resistência M15: $${m15Data.resistance_level.toFixed(2)}`);
    }

    if (m15Data?.support_level && screenshotAnalysis.stop_loss < m15Data.support_level * 0.998) {
      validationIssues.push(`SL abaixo de suporte M15 ($${m15Data.support_level})`);
      recommendations.push(`Ajustar SL para próximo ao suporte M15: $${m15Data.support_level.toFixed(2)}`);
    }

    // 5. Validar com TradeVision IA
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const aiPrompt = `
Você é a TradeVision IA, especialista em validação de operações de trading.

**ANÁLISE DE SCREENSHOT:**
- Padrão detectado: ${screenshotAnalysis.pattern}
- Entry: $${screenshotAnalysis.entry_price}
- Stop Loss: $${screenshotAnalysis.stop_loss}
- Take Profit: $${screenshotAnalysis.take_profit}
- Confiança: ${screenshotAnalysis.confidence}%
- R:R calculado: ${riskReward.toFixed(2)}:1

**DADOS REAIS DO MERCADO:**
- Preço atual: $${marketData.currentPrice}
- Fear & Greed: ${marketData.heatmap.fearGreedIndex}
- Buyers: ${marketData.heatmap.buyerDominance}%
- Pressão: ${marketData.heatmap.marketPressure}

**CONTEXTO MULTI-TIMEFRAME:**
- M30: ${mtContext?.macro_trend || 'N/A'} | Fase: ${mtContext?.market_phase || 'N/A'}
- M15: ${m15Data?.trend_direction || 'N/A'} | Support: $${m15Data?.support_level || 'N/A'} | Resistance: $${m15Data?.resistance_level || 'N/A'}
- M5: ${m5Data?.predominant_direction || 'N/A'} | Padrão: ${m5Data?.micro_trend_pattern || 'N/A'}
- M1: ${m1Data?.direction || 'N/A'}

**PROBLEMAS IDENTIFICADOS:**
${validationIssues.length > 0 ? validationIssues.map(issue => `- ${issue}`).join('\n') : '- Nenhum problema crítico detectado'}

**REGRAS DE GESTÃO DE RISCO:**
${riskKnowledge?.content || 'Padrão institucional de gestão de risco'}

**SUA TAREFA:**
1. Validar se os níveis propostos (Entry, SL, TP) estão alinhados com:
   - Estruturas de mercado reais (suporte/resistência de M15/M30)
   - Contexto multi-timeframe (tendências confirmadas?)
   - Regras de gestão de risco (R:R, distância do stop)
   - Heatmap atual (sentimento vs direção do trade)

2. Se necessário, AJUSTAR os níveis propostos para:
   - Entry: preço mais seguro baseado em estrutura
   - SL: logo abaixo/acima de estrutura relevante (não em zona óbvia)
   - TP: primeiro obstáculo estrutural (FVG, OB, resistência)

3. Retornar JSON com:
{
  "is_valid": boolean,
  "confidence_adjusted": number (0-100),
  "adjusted_levels": {
    "entry": number,
    "stop_loss": number,
    "take_profit": number
  },
  "validation_notes": "Explicação clara em português",
  "risk_reward": number,
  "recommended_position_size": "1-2% do capital"
}

**IMPORTANTE:** 
- Seja RIGOROSO - melhor descartar uma análise de screenshot ruim do que validar algo perigoso
- Priorize ESTRUTURAS REAIS (dados M15/M30) sobre análise visual
- TP muito alto é PERIGOSO - ajuste para primeiro obstáculo estrutural
`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é TradeVision IA, especialista em validação de operações de trading. Sempre retorne JSON válido.' },
          { role: 'user', content: aiPrompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`TradeVision IA error: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const aiValidation = JSON.parse(aiData.choices[0].message.content);

    console.log('🤖 TradeVision IA validou:', aiValidation);

    // 6. Retornar resultado completo
    return new Response(
      JSON.stringify({
        success: true,
        original_analysis: screenshotAnalysis,
        validation: {
          is_valid: aiValidation.is_valid,
          confidence_original: screenshotAnalysis.confidence,
          confidence_adjusted: aiValidation.confidence_adjusted,
          issues: validationIssues,
          recommendations: recommendations,
          ai_validation: aiValidation.validation_notes
        },
        adjusted_levels: aiValidation.adjusted_levels,
        risk_metrics: {
          risk_reward_original: riskReward,
          risk_reward_adjusted: aiValidation.risk_reward,
          stop_distance_percent: stopDistance,
          tp_distance_percent: tpDistance,
          recommended_position_size: aiValidation.recommended_position_size
        },
        market_context: {
          multi_timeframe: {
            m30: mtContext?.macro_trend || 'N/A',
            m15: m15Data?.trend_direction || 'N/A',
            m5: m5Data?.predominant_direction || 'N/A',
            m1: m1Data?.direction || 'N/A'
          },
          heatmap: marketData.heatmap,
          current_price: marketData.currentPrice
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Erro na validação:', error);
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
