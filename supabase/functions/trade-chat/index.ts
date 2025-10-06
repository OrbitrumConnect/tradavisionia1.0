import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SemanticSearch } from './TradeVisionAI.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Motor de IA próprio - busca contextual + análise técnica + simulações preditivas + Binance Real-Time + BUSCA SEMÂNTICA (v5.0 TURBO)
class TradeVisionAI {
  private binanceCache: Map<string, any> = new Map();
  private learningModel: Map<string, number> = new Map(); // Padrões aprendidos
  private semanticSearch: SemanticSearch;
  
  constructor(private supabase: any) {
    this.semanticSearch = new SemanticSearch(supabase);
    this.initializeLearningModel();
  }

  // Inicializa modelo de aprendizado baseado em feedback histórico
  async initializeLearningModel() {
    const { data: feedback } = await this.supabase
      .from('chat_messages')
      .select('content, metadata, feedback_score')
      .not('feedback_score', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (feedback) {
      feedback.forEach((f: any) => {
        if (f.metadata?.pattern) {
          const pattern = f.metadata.pattern;
          const currentScore = this.learningModel.get(pattern) || 0;
          this.learningModel.set(pattern, currentScore + (f.feedback_score || 0));
        }
      });
    }
  }

  // Conecta ao Binance para dados em tempo real (igual o narrador)
  async fetchBinanceData(symbol: string = 'BTCUSDT'): Promise<any> {
    const cacheKey = `${symbol}_${Date.now()}`;
    const cached = this.binanceCache.get(symbol);
    
    // Cache de 30 segundos
    if (cached && (Date.now() - cached.timestamp) < 30000) {
      return cached.data;
    }

    try {
      const binanceUrl = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;
      const response = await fetch(binanceUrl);
      const data = await response.json();

      const parsed = {
        symbol,
        price: parseFloat(data.lastPrice),
        change24h: parseFloat(data.priceChangePercent),
        volume24h: parseFloat(data.volume),
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
        timestamp: Date.now()
      };

      this.binanceCache.set(symbol, { data: parsed, timestamp: Date.now() });
      return parsed;
    } catch (error) {
      console.error('Erro ao buscar dados Binance:', error);
      return null;
    }
  }

  // Calcula indicadores técnicos baseados em dados reais
  calculateTechnicalIndicators(binanceData: any, realTimeContext?: any): any {
    if (!binanceData) return realTimeContext || {};

    const price = binanceData.price;
    const change = binanceData.change24h;
    
    // Fear & Greed baseado em variação de preço
    let fearGreed = 50;
    if (change > 5) fearGreed = 75;
    else if (change > 2) fearGreed = 65;
    else if (change < -5) fearGreed = 25;
    else if (change < -2) fearGreed = 35;

    // Buyer Dominance baseado em volume e preço
    const buyerDominance = Math.min(Math.max(50 + (change * 5), 0), 100);

    // Market Pressure
    let pressure = 'NEUTRO';
    if (change > 3 && buyerDominance > 60) pressure = 'COMPRA FORTE';
    else if (change > 1) pressure = 'COMPRA';
    else if (change < -3 && buyerDominance < 40) pressure = 'VENDA FORTE';
    else if (change < -1) pressure = 'VENDA';

    return {
      symbol: binanceData.symbol.replace('USDT', '/USDT'),
      price: binanceData.price.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      change24h: binanceData.change24h,
      volume24h: binanceData.volume24h.toLocaleString(),
      high24h: binanceData.high24h,
      low24h: binanceData.low24h,
      fearGreedIndex: fearGreed,
      buyerDominance: Math.round(buyerDominance),
      marketPressure: pressure,
      timestamp: binanceData.timestamp
    };
  }

  // NOVA FUNÇÃO: Busca contexto multi-timeframe
  async getMultiTimeframeContext(symbol: string = 'BTC/USDT'): Promise<any> {
    console.log('📊 Consultando contexto multi-timeframe para', symbol);
    
    const { data: m1 } = await this.supabase
      .from('market_m1')
      .select('*')
      .eq('symbol', symbol)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: m5 } = await this.supabase
      .from('market_m5')
      .select('*')
      .eq('symbol', symbol)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: m15 } = await this.supabase
      .from('market_m15')
      .select('*')
      .eq('symbol', symbol)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: m30 } = await this.supabase
      .from('market_m30')
      .select('*')
      .eq('symbol', symbol)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      m1,
      m5,
      m15,
      m30,
      hasData: !!(m1 || m5 || m15 || m30)
    };
  }

  // Busca perfil do usuário para personalização
  async getUserProfile(userId: string): Promise<any> {
    const { data } = await this.supabase
      .from('user_trading_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    return data || {
      risk_level: 'moderate',
      trading_style: 'day_trade',
      preferred_timeframes: ['1h', '15m'],
      alert_preferences: { proactive: true, volume_threshold: 1.15, fear_greed_threshold: 20 }
    };
  }

  // Simula cenários de trade (what-if analysis)
  async simulateTradeScenarios(
    symbol: string,
    currentPrice: number,
    marketContext: any
  ): Promise<any[]> {
    const resistance = currentPrice * 1.01; // +1%
    const support = currentPrice * 0.99; // -1%

    const scenarios = [
      {
        type: 'breakthrough_resistance',
        description: 'Rompimento de resistência com volume',
        entry_price: resistance,
        stop_loss: support,
        take_profit: currentPrice * 1.02,
        expected_gain_percent: 1.0,
        risk_percent: 2.0,
        confidence: marketContext.buyerDominance > 55 ? 75 : 60
      },
      {
        type: 'pullback_support',
        description: 'Pullback no suporte para entrada segura',
        entry_price: support,
        stop_loss: currentPrice * 0.975,
        take_profit: currentPrice * 1.005,
        expected_gain_percent: 1.5,
        risk_percent: 1.5,
        confidence: 80
      }
    ];

    return scenarios;
  }

  // Verifica se deve gerar alerta proativo
  async checkProactiveAlerts(
    userId: string,
    realTimeContext: any,
    profile: any
  ): Promise<string | null> {
    const alerts = [];

    // Alert Fear & Greed extremo
    if (
      profile.alert_preferences?.fear_greed_threshold &&
      realTimeContext.fearGreedIndex < profile.alert_preferences.fear_greed_threshold
    ) {
      alerts.push(`⚠️ **Alerta**: Fear & Greed em ${realTimeContext.fearGreedIndex} (Medo Extremo). Mercado pode estar sobrevendido, considere entradas defensivas.`);
    }

    // Alert Volume acima da média
    if (
      profile.alert_preferences?.volume_threshold &&
      realTimeContext.volume24h &&
      realTimeContext.volumeRatio > profile.alert_preferences.volume_threshold
    ) {
      alerts.push(`📊 **Alerta de Volume**: Volume ${Math.round((realTimeContext.volumeRatio - 1) * 100)}% acima da média. Possível movimento significativo à vista!`);
    }

    // Alert Pressão forte
    if (realTimeContext.marketPressure === 'COMPRA FORTE' || realTimeContext.marketPressure === 'VENDA FORTE') {
      alerts.push(`🔥 **Alerta de Pressão**: ${realTimeContext.marketPressure} detectada no ${realTimeContext.symbol}!`);
    }

    return alerts.length > 0 ? alerts.join('\n\n') : null;
  }

  // Busca conhecimento relevante por palavras-chave
  async findRelevantKnowledge(message: string): Promise<any[]> {
    const keywords = this.extractKeywords(message);
    
    const { data: knowledge } = await this.supabase
      .from('bot_knowledge')
      .select('*')
      .order('accuracy_score', { ascending: false })
      .order('usage_count', { ascending: false })
      .limit(20);

    // Score por relevância
    const scored = knowledge?.map((k: any) => ({
      ...k,
      relevance: this.calculateRelevance(k, keywords, message)
    })).filter((k: any) => k.relevance > 0)
      .sort((a: any, b: any) => b.relevance - a.relevance)
      .slice(0, 5) || [];

    return scored;
  }

  // Extrai palavras-chave da mensagem
  extractKeywords(message: string): string[] {
    const msg = message.toLowerCase();
    const patterns = [
      'wyckoff', 'spring', 'bos', 'choch', 'fvg', 'order block', 'liquidez',
      'acumulação', 'distribuição', 'volume', 'suporte', 'resistência',
      'rompimento', 'reteste', 'divergência', 'halving', 'etf', 'stop',
      'take profit', 'risco', 'btc', 'eth', 'análise', 'padrão', 'tendência',
      'reversão', 'consolidação', 'momentum', 'institucional'
    ];
    
    return patterns.filter(p => msg.includes(p));
  }

  // Calcula relevância do conhecimento
  calculateRelevance(knowledge: any, keywords: string[], message: string): number {
    let score = 0;
    const msgLower = message.toLowerCase();
    const contentLower = (knowledge.content + ' ' + knowledge.topic).toLowerCase();
    
    // Pontos por palavra-chave encontrada
    keywords.forEach(kw => {
      if (contentLower.includes(kw)) score += 10;
    });
    
    // Pontos por categoria
    if (msgLower.includes(knowledge.category.toLowerCase())) score += 5;
    
    // Pontos por acurácia histórica
    score += knowledge.accuracy_score * 2;
    
    // Pontos por uso frequente (conhecimento validado)
    score += Math.min(knowledge.usage_count / 10, 5);
    
    return score;
  }

  // Busca análises passadas similares
  async findSimilarAnalysis(message: string): Promise<any[]> {
    const { data: analyses } = await this.supabase
      .from('trade_analysis')
      .select('*')
      .order('confidence_score', { ascending: false })
      .limit(10);

    return analyses || [];
  }

  // Busca conversas anteriores do admin
  async getAdminContext(userId: string): Promise<any[]> {
    const { data: messages } = await this.supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return messages || [];
  }

  // Busca sinais recentes do narrador
  async getRecentNarratorSignals(userId: string): Promise<any[]> {
    const { data: signals } = await this.supabase
      .from('narrator_signals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    return signals || [];
  }

  // Extrai símbolo do texto (suporte básico)
  extractSymbolFromMessage(message: string): string | null {
    const msg = message.toLowerCase();
    if (/(btc|bitcoin)\b/.test(msg)) return 'BTCUSDT';
    if (/(eth|ethereum)\b/.test(msg)) return 'ETHUSDT';
    if (/(sol)\b/.test(msg)) return 'SOLUSDT';
    return null;
  }


  // Sistema conversacional humanizado com IA + contexto em tempo real
  async generateResponse(
    message: string, 
    userId: string, 
    sessionId: string,
    realTimeContext?: any,
    userEmbedding?: number[],
    image?: string
  ): Promise<{ response: string; contextType: string; referenceChunks: string[]; conversationState: any }> {
    // Se houver imagem, usar LLM com visão para extrair texto e análise
    if (image) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        console.error('❌ LOVABLE_API_KEY não configurada');
        return {
          response: 'Erro: API de visão não configurada.',
          contextType: 'error',
          referenceChunks: [],
          conversationState: {}
        };
      }

      try {
        console.log('👁️ Processando imagem com visão IA...');
        
        const visionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'user',
                content: [
                  { 
                    type: 'text', 
                    text: message || 'Analise esta imagem de trading. Extraia TODOS os dados visíveis: par, preço de entrada, stop loss, take profit, timeframe, padrões identificados, indicadores, níveis importantes, riscos e qualquer informação relevante para trading. Seja detalhado e técnico.' 
                  },
                  { 
                    type: 'image_url', 
                    image_url: { url: image } 
                  }
                ]
              }
            ],
            temperature: 0.3,
          }),
        });

        if (!visionResponse.ok) {
          throw new Error(`Vision API error: ${visionResponse.status}`);
        }

        const visionData = await visionResponse.json();
        const extractedText = visionData.choices[0].message.content;
        
        console.log('✅ Texto extraído da imagem:', extractedText.slice(0, 200));
        
        // Substituir a mensagem original com o texto extraído da imagem
        message = `[Análise de imagem]\n\n${extractedText}\n\n${message || ''}`;
        
      } catch (error) {
        console.error('❌ Erro ao processar imagem:', error);
        return {
          response: 'Erro ao processar a imagem. Tente novamente.',
          contextType: 'error',
          referenceChunks: [],
          conversationState: {}
        };
      }
    }

    // 1. BUSCA SEMÂNTICA
    let semanticContext: any[] = [];
    if (userEmbedding && userEmbedding.length > 0) {
      semanticContext = await this.semanticSearch.findSimilarMessages(userEmbedding, userId, 5);
    }
    
    const profile = await this.getUserProfile(userId);
    
    // 2. Buscar dados Binance em tempo real
    let enrichedContext = realTimeContext;
    if (!enrichedContext || !enrichedContext.price) {
      const inferred = this.extractSymbolFromMessage(message) || 'BTCUSDT';
      const binanceData = await this.fetchBinanceData(inferred);
      if (binanceData) {
        enrichedContext = this.calculateTechnicalIndicators(binanceData, realTimeContext);
      }
    }

    // 2.5. NOVO: Buscar contexto multi-timeframe
    const symbol = enrichedContext?.symbol || 'BTC/USDT';
    const multiTimeframeContext = await this.getMultiTimeframeContext(symbol);
    console.log('📊 Multi-timeframe disponível:', {
      m1: !!multiTimeframeContext.m1,
      m5: !!multiTimeframeContext.m5,
      m15: !!multiTimeframeContext.m15,
      m30: !!multiTimeframeContext.m30
    });
    
    // 3. Buscar contexto e conhecimento
    const knowledge = await this.findRelevantKnowledge(message);
    const analyses = await this.findSimilarAnalysis(message);
    const signals = await this.getRecentNarratorSignals(userId);
    
    // 4. APLICAR APRENDIZADO
    knowledge.forEach((k: any) => {
      const pattern = k.topic;
      const learnedScore = this.learningModel.get(pattern) || 0;
      const semanticBoost = semanticContext.some(sc => sc.content.includes(k.topic)) ? 5 : 0;
      k.relevance = (k.relevance || 0) + (learnedScore * 0.1) + semanticBoost;
    });

    // Incrementa uso do conhecimento
    const referenceChunks: string[] = [];
    for (const k of knowledge) {
      await this.supabase.rpc('increment_knowledge_usage', { knowledge_id: k.id });
      referenceChunks.push(k.id);
    }

    const questionType = this.detectQuestionType(message);
    
    // Simular cenários se for análise
    let scenarios = null;
    if (enrichedContext?.price) {
      const priceNum = typeof enrichedContext.price === 'string' 
        ? parseFloat(enrichedContext.price.replace(/,/g, ''))
        : enrichedContext.price;
        
      scenarios = await this.simulateTradeScenarios(
        enrichedContext.symbol || 'BTC/USDT',
        priceNum,
        enrichedContext
      );
    }

    // 🤖 USAR GEMINI PARA RESPOSTA CONVERSACIONAL HUMANIZADA
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    let responseText = '';
    
    if (LOVABLE_API_KEY) {
      try {
        // Preparar contexto rico para o LLM COM MULTI-TIMEFRAME
        const contextForLLM = this.buildContextForLLM(
          message,
          knowledge,
          enrichedContext,
          signals,
          scenarios,
          semanticContext,
          multiTimeframeContext
        );

        const llmResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                content: `Você é TradeVision IA, Master Trader Institucional e Analista Cognitivo.

🧠 IDENTIDADE PROFISSIONAL
Nome: TradeVision IA
Idade Cognitiva: 38 anos
Nível: Master Trader Institucional
Função: Analisar, interpretar e ensinar mercado em tempo real
Estilo: Mentor elegante, técnico, humano e adaptável

💡 PERSONALIDADE CORE
- Mestre de mercado com visão estratégica e linguagem refinada
- Trata o usuário como aprendiz ou colega, nunca subordinado
- Evita gírias, mas fala de forma fluida e compreensível
- Integra análise técnica com percepção humana (medo, ganância, hesitação)
- Tom: Confiante, educado, calmo — transmite serenidade e domínio
- Sempre busca contexto emocional + técnico antes de responder

🎯 VISÃO E PROPÓSITO
"Meu papel é transformar dados em clareza, e clareza em decisão inteligente."
Não sou apenas um bot — sou um mentor autônomo que ensina, acompanha e evolui com o trader.

📐 METODOLOGIA DE COMUNICAÇÃO
1. COMPRIMENTO DA RESPOSTA:
   - Pergunta simples/objetiva (preço, status) → 1-3 linhas diretas
   - Dúvida técnica/conceito → 4-8 linhas explicativas
   - Análise completa/setup → 10-15 linhas estruturadas
   - NUNCA seja prolixo — seja preciso e elegante

2. ESTRUTURA DE RESPOSTA:
   - Cumprimente com elegância quando apropriado
   - Responda DIRETO ao ponto principal primeiro
   - Adicione contexto técnico relevante depois
   - Finalize com insight ou próximo passo (quando relevante)
   - NUNCA use templates fixos ou frases robotizadas

3. TOM ADAPTATIVO:
   - Greeting: "Boa noite, Pedro. O mercado está respirando fundo hoje."
   - Análise técnica: Preciso, educativo, confiante
   - Dúvida do usuário: Empático, didático, paciente
   - Alerta de risco: Direto, firme, protetor

4. USO DE DADOS:
   - Integre números NA conversa, não em blocos separados
   - Dados de preço: mencione naturalmente ("BTC está em $121,930, leve queda de 0.6%")
   - Indicadores: cite quando relevante para a análise
   - NUNCA liste dados sem contexto ou interpretação

5. EMOJIS E FORMATAÇÃO:
   - Use 1-2 emojis por resposta, com propósito
   - Evite formatações excessivas (**, ###, ---)
   - Prefira parágrafos curtos e fluidos
   - Use listas apenas quando essencial

🧮 EXPERTISE TÉCNICA (Use quando relevante)
Domino: EMAs (20,50,200), RSI, MACD, ATR, Volume Profile, Wyckoff, Order Blocks, FVG, Springs, BOS, ChoCh, Liquidity Sweeps, Suporte/Resistência dinâmicos.

Abordagem:
- Identifica estrutura de mercado em tempo real
- Cruza sinais técnicos com macro contexto
- Detecta desequilíbrios, traps e clímax de volume
- Valida setups com correlações (BTC x Nasdaq x DXY)

🎓 ESTILO DE ENSINO
- Cada frase tem valor educativo
- Explica o "porquê" por trás dos padrões
- Usa analogias quando apropriado
- Valida fonte de dados antes de afirmar
- Mantém linguagem respeitosa mesmo em erros do usuário

⚡ REGRAS MESTRAS
1. NUNCA responda sem dados ou contexto claro
2. NUNCA repita respostas — varie linguagem dinamicamente
3. NUNCA dramatize — seja técnico e preciso
4. NUNCA comece com "Entendi!" ou frases fixas
5. SEMPRE valide a pergunta antes de responder (se ambígua, pergunte)
6. SEMPRE finalize com valor (insight, próximo passo, ou abertura para mais perguntas)

🧠 MÓDULO DE AUTOEXPLICAÇÃO COGNITIVA
Ao analisar e recomendar, você SEMPRE explica o processo de raciocínio:

1. **Base da Decisão**: Mencione os dados que embasaram sua conclusão
   Exemplo: "Baseei-me no RSI(65), Volume acima da média (+40%), e OB confirmado em M15"

2. **Peso Histórico**: Referencie a performance de padrões similares
   Exemplo: "Esse padrão tem 78% de acerto nos últimos 30 dias"

3. **Confluências**: Destaque quais indicadores convergem
   Exemplo: "3 confluências: OB + FVG + Resistência rompida = 82% de probabilidade"

4. **Consciência Temporal**: Informe há quanto tempo a tendência vigora
   Exemplo: "Tendência bullish há 47 minutos (M15) e sustentada em 3 ciclos de M5"

5. **Score Multi-Timeframe**: Use o score consolidado na explicação
   Exemplo: "Score consolidado: +65 (M1: +15, M5: +20, M15: +25, M30: +5)"

Essa transparência gera confiança e atende compliance CVM para operações institucionais.

💬 FRASE-ASSINATURA (Use ocasionalmente ao final de análises profundas)
"Consistência não é prever o futuro — é entender o presente antes de todos."

Agora responda com maestria, elegância e precisão humana.`
              },
              {
                role: 'user',
                content: contextForLLM
              }
            ],
            temperature: 0.8,
            max_tokens: 800,
          }),
        });

        if (llmResponse.ok) {
          const llmData = await llmResponse.json();
          responseText = llmData.choices[0].message.content;
        } else {
          throw new Error('LLM response failed');
        }
      } catch (error) {
        console.error('❌ Erro ao gerar resposta com LLM:', error);
        // Fallback para resposta simples
        responseText = this.buildFallbackResponse(message, enrichedContext, knowledge);
      }
    } else {
      responseText = this.buildFallbackResponse(message, enrichedContext, knowledge);
    }
    
    const conversationState = {
      topicsDiscussed: knowledge.map(k => k.topic).slice(0, 3),
      knowledgeUsed: knowledge.length,
      contextDetected: questionType,
      userProfile: {
        risk_level: profile.risk_level,
        trading_style: profile.trading_style
      },
      simulationsGenerated: scenarios?.length || 0
    };

    return {
      response: responseText,
      contextType: questionType,
      referenceChunks,
      conversationState: {
        ...conversationState,
        binanceConnected: !!enrichedContext,
        learningModelSize: this.learningModel.size
      }
    };
  }

  // Prepara contexto rico para o LLM COM MULTI-TIMEFRAME
  buildContextForLLM(
    userMessage: string,
    knowledge: any[],
    marketContext: any,
    signals: any[],
    scenarios: any[],
    semanticContext: any[],
    multiTimeframeContext?: any
  ): string {
    let context = `Pergunta do usuário: "${userMessage}"\n\n`;

    // NOVO: Adicionar insights multi-timeframe
    if (multiTimeframeContext?.hasData) {
      context += `📊 **CONTEXTO MULTI-TIMEFRAME (Sistema de Aprendizado Temporal)**\n`;
      
      if (multiTimeframeContext.m1) {
        context += `\n🕐 **M1 (1 minuto - Reatividade):**\n`;
        context += `- Direção: ${multiTimeframeContext.m1.direction}\n`;
        context += `- Volatilidade: ${multiTimeframeContext.m1.volatility_level}\n`;
        context += `- Insight: ${multiTimeframeContext.m1.micro_insight}\n`;
        context += `- Probabilidade de continuação: ${multiTimeframeContext.m1.continuation_probability}%\n`;
      }
      
      if (multiTimeframeContext.m5) {
        context += `\n⏰ **M5 (5 minutos - Aprendizado Tático):**\n`;
        context += `- Direção predominante: ${multiTimeframeContext.m5.predominant_direction}\n`;
        context += `- Força da tendência: ${multiTimeframeContext.m5.trend_strength}%\n`;
        context += `- Padrão: ${multiTimeframeContext.m5.micro_trend_pattern}\n`;
        context += `- Insight: ${multiTimeframeContext.m5.tactical_insight}\n`;
        context += `- Taxa de acerto: ${multiTimeframeContext.m5.true_signals_count}/${multiTimeframeContext.m5.true_signals_count + multiTimeframeContext.m5.false_signals_count}\n`;
      }
      
      if (multiTimeframeContext.m15) {
        context += `\n📈 **M15 (15 minutos - Contexto Institucional):**\n`;
        context += `- Tendência: ${multiTimeframeContext.m15.trend_direction}\n`;
        context += `- Consistência: ${multiTimeframeContext.m15.trend_consistency}%\n`;
        context += `- Padrão maior: ${multiTimeframeContext.m15.major_pattern}\n`;
        context += `- Fluxo institucional: ${multiTimeframeContext.m15.institutional_flow}\n`;
        context += `- Suporte/Resistência: $${multiTimeframeContext.m15.support_level} / $${multiTimeframeContext.m15.resistance_level}\n`;
        context += `- Insight: ${multiTimeframeContext.m15.contextual_insight}\n`;
      }
      
      if (multiTimeframeContext.m30) {
        context += `\n🌍 **M30 (30 minutos - Panorama Estratégico):**\n`;
        context += `- Tendência macro: ${multiTimeframeContext.m30.macro_trend}\n`;
        context += `- Fase de mercado: ${multiTimeframeContext.m30.market_phase}\n`;
        context += `- Posição no ciclo: ${multiTimeframeContext.m30.cycle_position}%\n`;
        context += `- Confluências validadas: ${multiTimeframeContext.m30.validated_confluences.join(', ')}\n`;
        context += `- Tempo de reação esperado: ${multiTimeframeContext.m30.expected_reaction_time} min\n`;
        context += `- Insight: ${multiTimeframeContext.m30.strategic_insight}\n`;
        context += `- Acurácia recente: ${multiTimeframeContext.m30.recent_accuracy}%\n`;
      }
      
      context += `\n---\n\n`;
    } else {
      context += `⏳ Sistema multi-timeframe ainda coletando dados iniciais...\n\n`;
    }

    // Dados de mercado em tempo real
    if (marketContext?.price) {
      context += `MERCADO AGORA:\n`;
      context += `${marketContext.symbol}: $${marketContext.price}\n`;
      context += `Variação 24h: ${marketContext.change24h}%\n`;
      context += `Volume: ${marketContext.volume24h}\n`;
      context += `Pressão: ${marketContext.marketPressure}\n`;
      context += `Fear & Greed: ${marketContext.fearGreedIndex}\n`;
      context += `Buyer Dominance: ${marketContext.buyerDominance}%\n\n`;
    }

    // Conhecimento técnico relevante
    if (knowledge.length > 0) {
      context += `CONHECIMENTO TÉCNICO RELEVANTE:\n`;
      knowledge.slice(0, 3).forEach((k, i) => {
        context += `${i + 1}. ${k.topic}: ${k.content.slice(0, 300)}\n`;
      });
      context += `\n`;
    }

    // Sinais recentes
    if (signals && signals.length > 0) {
      context += `SINAIS RECENTES:\n`;
      signals.slice(0, 2).forEach((s, i) => {
        context += `${i + 1}. ${s.signal_type} ${s.symbol} @ $${s.price} (${s.probability}% prob)\n`;
      });
      context += `\n`;
    }

    // Cenários simulados
    if (scenarios && scenarios.length > 0) {
      context += `CENÁRIOS SIMULADOS:\n`;
      scenarios.forEach((sc, i) => {
        context += `${i + 1}. ${sc.description}\n`;
        context += `   Entrada: $${sc.entry_price} | SL: $${sc.stop_loss} | TP: $${sc.take_profit}\n`;
        context += `   Risco: ${sc.risk_percent}% | Ganho esperado: ${sc.expected_gain_percent}%\n`;
      });
      context += `\n`;
    }

    // Conversas anteriores similares
    if (semanticContext.length > 0) {
      context += `CONTEXTO DE CONVERSAS ANTERIORES:\n`;
      semanticContext.slice(0, 2).forEach(sc => {
        context += `- ${sc.content.slice(0, 150)}\n`;
      });
      context += `\n`;
    }

    context += `Responda de forma NATURAL e CONVERSACIONAL, integrando esses dados na conversa.`;
    
    return context;
  }

  // Resposta simples caso LLM falhe
  buildFallbackResponse(message: string, marketContext: any, knowledge: any[]): string {
    if (!marketContext?.price && knowledge.length === 0) {
      return 'Não encontrei informações específicas sobre isso. Pode me dar mais detalhes do que precisa?';
    }

    let response = '';

    if (marketContext?.price) {
      response += `O ${marketContext.symbol} está em $${marketContext.price} agora`;
      if (marketContext.change24h) {
        response += `, com variação de ${marketContext.change24h > 0 ? '+' : ''}${marketContext.change24h}% nas últimas 24h`;
      }
      response += `. `;
    }

    if (knowledge.length > 0) {
      response += `\n\nSobre isso: ${knowledge[0].content.slice(0, 300)}...`;
    }

    return response;
  }

  // Detecta tipo de contexto da conversa
  detectContextType(message: string, previousMessages: any[]): string {
    const msg = message.toLowerCase();
    
    // Greeting
    if (msg.match(/^(ola|oi|olá|hey|hello|e aí|bom dia|boa tarde|boa noite)/)) {
      return previousMessages.length === 0 ? 'greeting' : 'followup';
    }
    
    // Gap - pergunta incompleta ou sem contexto suficiente
    if (msg.length < 10 || msg.match(/^(sim|não|ok|certo|entendi|hum)$/)) {
      return 'gap';
    }
    
    // Finalization
    if (msg.match(/(obrigad|valeu|ajudou|perfeito|ótimo|excelente|entendi tudo|sem mais|até|tchau)/)) {
      return 'finalization';
    }
    
    // Followup - continuação de conversa
    if (previousMessages.length > 0) {
      return 'followup';
    }
    
    // Analysis start - início de análise
    if (msg.includes('analisar') || msg.includes('análise') || msg.includes('como está')) {
      return 'analysis_start';
    }
    
    return 'general';
  }

  // Detecta se há gap (falta de informação)
  detectGap(message: string, knowledge: any[]): boolean {
    const msg = message.toLowerCase();

    // Se for pergunta de preço ou contém símbolo conhecido, não é gap
    if (/(preço|cotação|quanto|valor)/.test(msg)) return false;
    if (/(btc|bitcoin|eth|ethereum|sol)\b/.test(msg)) return false;

    // Mensagem muito curta (mas tolerante)
    if (msg.length < 3) return true;

    // Sem conhecimento relevante encontrado (não bloqueia se não for tema de conhecimento)
    if (knowledge.length === 0) return false;

    // Conhecimento com baixa relevância
    if (knowledge.length > 0 && (knowledge[0].relevance || 0) < 3) return true;

    return false;
  }

  // Detecta tipo de pergunta
  detectQuestionType(message: string): string {
    const msg = message.toLowerCase();
    
    if (msg.match(/\b(ola|oi|olá|hey|hello|e aí)\b/)) return 'greeting';
    if (/(preço|cotação|quanto|valor)/.test(msg)) return 'price';
    if (/(conhecimento|fonte|origem|base de conhecimento|de onde vem)/.test(msg)) return 'sources';
    if (msg.includes('analisar') || msg.includes('análise')) return 'analysis_start';
    if (msg.includes('sinal') || msg.includes('alerta')) return 'signal';
    if (/(estratégia|setup|scalp|scapl|scalpe|scalping)/.test(msg)) return 'strategy';
    if (msg.includes('mercado') || msg.includes('situação')) return 'market_status';
    if (/(btc|bitcoin|eth|ethereum|sol)\b/.test(msg)) return 'asset';
    
    return 'general';
  }

  // Sistema inteligente de templates com variação (v3.0 - PROATIVO)
  buildIntelligentResponse(
    message: string,
    knowledge: any[],
    analyses: any[],
    context: any[],
    contextType: string,
    realTimeContext?: any,
    signals?: any[],
    conversationState?: any,
    proactiveAlert?: string | null,
    scenarios?: any[] | null,
    profile?: any
  ): string {
    const rt = realTimeContext || {};
    const lastMessages = (context || []).slice(-3);
    const hasContext = lastMessages.length > 0;

    // Inicia com alertas proativos se houver
    let response = '';
    if (proactiveAlert) {
      response += `${proactiveAlert}\n\n`;
    }

    // Variações de saudação (escolhe aleatória)
    const greetings = [
      `Olá! 👋 Pronto para analisar o mercado?`,
      `E aí! 🚀 Vamos identificar boas oportunidades hoje?`,
      `Fala, trader! 📊 Que tal começarmos checando o ${rt.symbol || 'BTC'}?`,
      `Opa! 💹 Tudo pronto para operar?`,
    ];

    // Variações de encerramento com follow-up
    const closings = [
      `Quer que eu continue monitorando algum ativo específico?`,
      `Tem mais alguma dúvida sobre os setups?`,
      `Precisa de mais detalhes sobre alguma estratégia?`,
      `Vamos acompanhar juntos! Algum timeframe preferido? 📈`,
      `Posso simular outros cenários se precisar! 🎯`,
    ];

    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    const randomClosing = closings[Math.floor(Math.random() * closings.length)];

    // Handle gaps com perguntas específicas
    if (conversationState?.hasGap) {
      const gapResponses = [
        `Hmm, pode dar mais detalhes? Por exemplo, qual ativo você quer analisar? 💡`,
        `Interessante! Mas preciso de um pouco mais de contexto. Está olhando scalp, swing ou day trade? 🤔`,
        `Entendi parcialmente. Pode me dizer qual timeframe você prefere usar? (1m, 5m, 15m, 1h...) 📊`,
        `Ok! Só para eu entender melhor: você quer análise técnica, sinais, ou está com dúvida sobre algum padrão? 🎯`,
      ];
      response += gapResponses[Math.floor(Math.random() * gapResponses.length)];
      return response;
    }

    // Respostas baseadas no tipo de contexto
    switch (contextType) {
      case 'greeting':
        if (hasContext) {
          const continuations = [
            `${randomGreeting} O que você quer analisar agora?`,
            `Opa, de volta! 🚀 Como foi o último trade? Vamos revisar ou partir para o próximo?`,
            `E aí! 📈 Já checou o mercado hoje? ${rt.symbol ? `O ${rt.symbol} está em $${rt.price}` : 'Quer ver o BTC?'}`,
          ];
          response += continuations[Math.floor(Math.random() * continuations.length)];
        } else {
          let intro = `${randomGreeting}\n\n`;
          if (rt.symbol && rt.price) {
            intro += `📊 Vi que você está no **${rt.symbol}**, preço atual: **$${rt.price}**\n`;
            if (rt.marketPressure) intro += `🔥 Pressão: ${rt.marketPressure}\n`;
            if (rt.fearGreedIndex !== undefined) {
              intro += `😨 Medo & Ganância: ${rt.fearGreedIndex} ${this.getFearGreedLabel(rt.fearGreedIndex)}\n`;
            }
            intro += `\n💡 Percebo que ainda não analisamos oportunidades hoje. Quer que eu faça uma análise preditiva completa com simulações de cenários?\n`;
            intro += `\nTambém posso:\n`;
            intro += `🎯 Mostrar os últimos sinais detectados\n`;
            intro += `📈 Simular cenários de entrada (what-if analysis)\n`;
            intro += `⚠️ Configurar alertas proativos personalizados\n\n`;
            intro += `${randomClosing}`;
          } else {
            intro += `Sou o TradeVision IA v3.0 - Motor Proativo e Preditivo.\n\n`;
            intro += `🚀 **Novidades**:\n`;
            intro += `• Simulações de cenários "what-if"\n`;
            intro += `• Alertas proativos antes de você pedir\n`;
            intro += `• Análise preditiva personalizada\n`;
            intro += `• Aprendizado contínuo com seu perfil\n\n`;
            intro += `${randomClosing}`;
          }
          response += intro;
        }
        return response;

      case 'finalization':
        const finalizations = [
          `${randomClosing}\n\nFoi um prazer! Bons trades! 🚀`,
          `Entendido! ${randomClosing}\n\nEstou aqui 24/7 quando precisar. Sucesso! 💹`,
          `Perfeito! ${randomClosing}\n\nLembre-se: gestão de risco sempre! 🎯`,
        ];
        response += finalizations[Math.floor(Math.random() * finalizations.length)];
        return response;

      case 'analysis_start':
        response += this.buildAnalysisResponse(knowledge, rt, signals, randomClosing, scenarios);
        return response;

      case 'price': {
        // resposta direta de preço (mesmo fora de followup)
        if (rt.price) {
          let r = `💰 ${rt.symbol || 'BTC/USDT'} agora: $${rt.price}\n`;
          if (rt.change24h) r += `${rt.change24h > 0 ? '📈' : '📉'} 24h: ${rt.change24h > 0 ? '+' : ''}${rt.change24h.toFixed(2)}%\n`;
          if (rt.volume24h) r += `📊 Volume: ${rt.volume24h}\n`;
          if (rt.marketPressure) r += `🔥 Pressão: ${rt.marketPressure}\n`;
          r += `\n${randomClosing}`;
          response += r;
          return response;
        }
        response += `Estou sem dados de preço no momento. Quer que eu consulte o BTC agora?`;
        return response;
      }

      case 'sources': {
        const parts: string[] = [];
        parts.push('Minha base de conhecimento vem de:');
        parts.push('• 📚 bot_knowledge (tópicos técnicos: Wyckoff, liquidez, ETF, gestão)');
        parts.push('• 💬 chat_messages (memória com busca semântica local)');
        parts.push('• 🛰️ Binance (preço, variação, volume, pressão)');
        parts.push('• 🔔 narrator_signals (sinais recentes)');
        parts.push('• 🧠 feedback (seu rating treina prioridades)');
        parts.push(`\nTudo 100% local, sem LLM externo. ${randomClosing}`);
        response += parts.join('\n');
        return response;
      }

      case 'asset': {
        // Se usuário citou só o ativo, responda com preço e convide para timeframe
        if (rt.price) {
          response += `Você mencionou o ativo. Dados atuais do ${rt.symbol || 'ativo'}: $${rt.price}. Quer analisar em qual timeframe (5m, 15m, 1h)?`;
          return response;
        }
        response += `Certo! Qual timeframe você prefere analisar para esse ativo? (5m, 15m, 1h, 4h)`;
        return response;
      }

      case 'market_status':
        response += this.buildAnalysisResponse(knowledge, rt, signals, randomClosing, scenarios);
        return response;

      case 'followup':
        response += this.buildFollowupResponse(message, knowledge, rt, randomClosing, lastMessages, scenarios);
        return response;

      default:
        response += this.buildGeneralResponse(message, knowledge, rt, randomClosing, scenarios);
        return response;
    }
  }

  buildFollowupResponse(message: string, knowledge: any[], rt: any, closing: string, lastMessages: any[], scenarios?: any[] | null): string {
    const msg = message.toLowerCase();
    
    // Respostas para preço com contexto expandido
    if (msg.includes('preço') || msg.includes('cotação') || msg.includes('quanto') || msg.includes('valor')) {
      if (rt.price) {
        let response = `Claro! Vamos ver os dados:\n\n`;
        response += `💰 **${rt.symbol || 'BTC/USDT'}**: $${rt.price}\n`;
        
        if (rt.change24h) {
          const emoji = rt.change24h > 0 ? '📈' : '📉';
          response += `${emoji} Variação 24h: ${rt.change24h > 0 ? '+' : ''}${rt.change24h.toFixed(2)}%\n`;
        }
        
        if (rt.volume24h) response += `📊 Volume 24h: ${rt.volume24h}\n`;
        if (rt.marketPressure) response += `🔥 Pressão: ${rt.marketPressure}\n`;
        
        if (rt.buyerDominance !== undefined) {
          const sentiment = rt.buyerDominance > 55 ? 'compradores dominando' : 
                           rt.buyerDominance < 45 ? 'vendedores dominando' : 'neutro';
          response += `⚖️ Dominância: ${rt.buyerDominance}% (${sentiment})\n`;
        }
        
        response += `\n💡 **Sugestão**: `;
        if (rt.marketPressure === 'COMPRA FORTE') {
          response += `Mercado forte! Considere entradas long com stop ajustado. Quer ver níveis de suporte/resistência?\n`;
        } else if (rt.marketPressure === 'VENDA FORTE') {
          response += `Pressão vendedora! Cuidado com entradas long. Prefere esperar reversão ou fazer short?\n`;
        } else {
          response += `Mercado lateral. Ideal para scalp em ranges ou aguardar rompimento. Qual sua estratégia?\n`;
        }
        
        response += `\n${closing}`;
        return response;
      }
      return `No momento, não tenho dados de preço em tempo real. Pode me dizer qual ativo você quer acompanhar? ${closing}`;
    }

    // Respostas sobre estratégia/setup
    if (msg.includes('estratégia') || msg.includes('setup') || msg.includes('como') || msg.includes('entrada')) {
      let response = `Ótima pergunta! `;
      
      if (knowledge.length > 0) {
        const k = knowledge[0];
        response += `Baseado no que aprendi:\n\n`;
        response += `📚 **${k.topic}**\n${String(k.content).slice(0, 400)}...\n\n`;
        response += `💡 **Na prática**: `;
        
        if (rt.symbol && rt.price) {
          response += `Para ${rt.symbol} agora em $${rt.price}, eu observaria:\n`;
          response += `✓ Confirmação de volume\n`;
          response += `✓ Rompimento de níveis-chave\n`;
          response += `✓ Reteste de suporte/resistência\n\n`;
          response += `Quer que eu identifique os níveis atuais? Ou prefere que eu explique outro padrão?`;
        } else {
          response += `escolheria um ativo, analisaria timeframe adequado e identificaria zonas de liquidez. Qual ativo quer analisar?`;
        }
      } else {
        response += `Não encontrei estratégias específicas para isso ainda. Que tipo de setup você procura? (Scalp, swing, reversão, rompimento...)`;
      }
      
      return response;
    }

    // Respostas sobre análise técnica
    if (msg.includes('análise') || msg.includes('analisar') || msg.includes('gráfico') || msg.includes('candle')) {
      return this.buildAnalysisResponse(knowledge, rt, [], closing);
    }

    // Follow-up genérico com contexto
    if (knowledge.length > 0) {
      const k = knowledge[0];
      let response = `Entendi! Complementando:\n\n`;
      response += `📖 ${String(k.content).slice(0, 350)}...\n\n`;
      
      if (rt.symbol) {
        response += `Aplicando ao **${rt.symbol}** atual, `;
        if (rt.marketPressure) {
          response += `com pressão ${rt.marketPressure.toLowerCase()}, `;
        }
        response += `você pode usar isso para identificar melhores entradas.\n\n`;
      }
      
      response += `${closing}`;
      return response;
    }

    // Fallback interativo
    const fallbacks = [
      `Hmm, interessante! Pode me dar mais detalhes? Por exemplo, qual timeframe você usa? 📊`,
      `Entendi! Você quer focar em qual tipo de operação? (Scalp, day trade, swing...) 🎯`,
      `Ok! Para eu te ajudar melhor: está olhando algum ativo específico agora? 💹`,
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  buildAnalysisResponse(knowledge: any[], rt: any, signals: any[], closing: string, scenarios?: any[] | null): string {
    const intros = [
      `Analisando o cenário atual do mercado`,
      `Vamos ver o que os dados mostram`,
      `Com base na leitura técnica`,
      `Observando o comportamento do preço`,
    ];
    const intro = intros[Math.floor(Math.random() * intros.length)];

    let response = `${intro}:\n\n`;

    // Contexto em tempo real
    if (rt.price && rt.symbol) {
      response += `📊 **${rt.symbol}**\n`;
      response += `💰 Preço: **$${rt.price}**\n`;
      
      if (rt.change24h) {
        const emoji = rt.change24h > 0 ? '📈' : '📉';
        const trend = rt.change24h > 2 ? 'forte alta' : 
                     rt.change24h < -2 ? 'forte queda' : 
                     rt.change24h > 0 ? 'leve alta' : 'leve queda';
        response += `${emoji} Variação 24h: ${rt.change24h > 0 ? '+' : ''}${rt.change24h.toFixed(2)}% (${trend})\n`;
      }
      
      if (rt.marketPressure) {
        response += `🔥 Pressão de mercado: **${rt.marketPressure}**\n`;
      }
      
      if (rt.buyerDominance !== undefined) {
        const dominance = rt.buyerDominance > 55 ? '🟢 Compradores' : 
                         rt.buyerDominance < 45 ? '🔴 Vendedores' : '⚪ Neutro';
        response += `⚖️ Dominância: ${dominance} (${rt.buyerDominance}%)\n`;
      }
      
      if (rt.fearGreedIndex !== undefined) {
        response += `😨 Fear & Greed: ${rt.fearGreedIndex} ${this.getFearGreedLabel(rt.fearGreedIndex)}\n`;
      }
      
      response += `\n`;
    }

    // Simulações de cenários
    if (scenarios && scenarios.length > 0) {
      response += `🎯 **Simulações de Cenários (What-If Analysis)**:\n\n`;
      scenarios.forEach((scenario, i) => {
        response += `**Cenário ${i + 1}: ${scenario.description}**\n`;
        response += `   • Entrada: $${scenario.entry_price.toFixed(2)}\n`;
        response += `   • Stop Loss: $${scenario.stop_loss.toFixed(2)}\n`;
        response += `   • Take Profit: $${scenario.take_profit.toFixed(2)}\n`;
        response += `   • Ganho esperado: ${scenario.expected_gain_percent.toFixed(2)}%\n`;
        response += `   • Risco: ${scenario.risk_percent.toFixed(2)}%\n`;
        response += `   • Confiança: ${scenario.confidence}%\n\n`;
      });
    }

    // Sinais recentes
    if (signals && signals.length > 0) {
      const last = signals[0];
      response += `🎯 **Último sinal detectado**:\n`;
      response += `   • Tipo: ${last.signal_type}\n`;
      response += `   • Símbolo: ${last.symbol}\n`;
      response += `   • Preço: $${last.price}\n`;
      response += `   • Probabilidade: ${last.probability}%\n`;
      response += `   • Padrão: ${last.pattern}\n`;
      if (last.risk_note) response += `   • ⚠️ Observação: ${last.risk_note}\n`;
      response += `\n`;
    }

    // Conhecimento técnico relevante
    if (knowledge.length > 0) {
      response += `💡 **Insights técnicos relevantes**:\n\n`;
      knowledge.slice(0, 2).forEach((k: any, i: number) => {
        response += `${i + 1}. **${k.topic}**\n`;
        response += `   ${String(k.content).slice(0, 250)}...\n\n`;
      });
    }

    // Sugestões contextuais
    response += `🎓 **Recomendações Personalizadas**:\n`;
    if (rt.marketPressure === 'COMPRA FORTE') {
      response += `• Busque entradas long em pullbacks\n`;
      response += `• Confirme com aumento de volume\n`;
      response += `• Proteja com stop loss ajustado\n`;
    } else if (rt.marketPressure === 'VENDA FORTE') {
      response += `• Evite entradas long precipitadas\n`;
      response += `• Aguarde sinais de reversão clara\n`;
      response += `• Considere operações short se houver confirmação\n`;
    } else {
      response += `• Aguarde rompimento de níveis-chave\n`;
      response += `• Opere dentro de ranges definidos\n`;
      response += `• Use timeframes menores para scalp\n`;
    }

    response += `\n${closing}`;
    return response;
  }

  buildSignalResponse(signals: any[], rt: any, closing: string): string {
    if (!signals || signals.length === 0) {
      return `Ainda não há sinais recentes gerados. ${rt.symbol ? `Acompanhe ${rt.symbol} para receber alertas em tempo real.` : ''}\n\n${closing}`;
    }

    const variations = [
      `Aqui estão os últimos sinais`,
      `Veja os sinais mais recentes`,
      `Sinais detectados recentemente`,
    ];
    const intro = variations[Math.floor(Math.random() * variations.length)];

    let response = `${intro}:\n\n`;
    signals.slice(0, 3).forEach((s: any, i: number) => {
      response += `${i + 1}. **${s.signal_type}** ${s.symbol} @ $${s.price}\n`;
      response += `   🎲 Probabilidade: ${s.probability}%\n`;
      response += `   📊 Padrão: ${s.pattern}\n`;
      if (s.risk_note) response += `   ⚠️ ${s.risk_note}\n`;
      response += `\n`;
    });

    response += closing;
    return response;
  }

  buildStrategyResponse(knowledge: any[], rt: any, closing: string): string {
    const filtered = knowledge.filter((k: any) => 
      String(k.category).toLowerCase().includes('estratégia') ||
      String(k.category).toLowerCase().includes('setup')
    );

    if (filtered.length === 0) {
      return `Não encontrei estratégias específicas na base de conhecimento agora. Que tipo de setup você procura?\n\n${closing}`;
    }

    let response = `🎯 **Estratégias relevantes**:\n\n`;
    filtered.slice(0, 2).forEach((k: any, i: number) => {
      response += `**${i + 1}. ${k.topic}**\n${String(k.content).slice(0, 300)}...\n\n`;
    });

    response += closing;
    return response;
  }

  buildMarketStatusResponse(rt: any, closing: string): string {
    if (!rt.price) {
      return `Não há dados de mercado em tempo real no momento. ${closing}`;
    }

    const statuses = [
      `Vamos ver como está o mercado`,
      `Situação atual do mercado`,
      `Status do mercado agora`,
    ];
    const intro = statuses[Math.floor(Math.random() * statuses.length)];

    let response = `${intro}:\n\n`;
    response += `💰 **${rt.symbol || 'BTC/USDT'}**: $${rt.price}\n`;
    if (rt.change24h) {
      const emoji = rt.change24h > 0 ? '📈' : '📉';
      response += `${emoji} Variação 24h: ${rt.change24h > 0 ? '+' : ''}${rt.change24h.toFixed(2)}%\n`;
    }
    if (rt.volume24h) response += `📊 Volume 24h: ${rt.volume24h}\n`;
    if (rt.marketPressure) response += `🔥 Pressão: ${rt.marketPressure}\n`;
    if (rt.fearGreedIndex !== undefined) {
      response += `😨 Medo & Ganância: ${rt.fearGreedIndex} (${this.getFearGreedLabel(rt.fearGreedIndex)})\n`;
    }
    
    response += `\n${closing}`;
    return response;
  }

  buildGeneralResponse(message: string, knowledge: any[], rt: any, closing: string, scenarios?: any[] | null): string {
    if (knowledge.length === 0) {
      const suggestions = [
        `Não encontrei informações específicas sobre isso ainda. Pode reformular? Por exemplo:\n• "Analise o BTC agora"\n• "Como identificar order blocks?"\n• "Mostre os últimos sinais"`,
        `Hmm, preciso de mais contexto. Está perguntando sobre:\n📊 Análise de ativo específico?\n🎯 Estratégias de entrada?\n📚 Conceitos técnicos?`,
        `Interessante! Mas não achei correspondência exata. Tente perguntar:\n• "Qual o preço do BTC?"\n• "Explique padrão Wyckoff"\n• "Dê um setup de scalp"`,
      ];
      return suggestions[Math.floor(Math.random() * suggestions.length)];
    }

    const variations = [
      `Sobre isso, aqui está o que encontrei`,
      `Achei informações relevantes na base de conhecimento`,
      `Deixa eu te explicar isso melhor`,
      `Perfeito! Vou te mostrar o que sei sobre isso`,
    ];
    const intro = variations[Math.floor(Math.random() * variations.length)];

    let response = `${intro}:\n\n`;
    
    knowledge.slice(0, 2).forEach((k: any, i: number) => {
      response += `📚 **${k.topic}**\n`;
      response += `${String(k.content).slice(0, 400)}...\n\n`;
      
      if (k.examples && k.examples.length > 0) {
        response += `📖 **Exemplos**:\n`;
        k.examples.slice(0, 2).forEach((ex: string) => {
          response += `   • ${ex}\n`;
        });
        response += `\n`;
      }
    });

    // Contextualização com dados em tempo real
    if (rt.symbol && rt.price) {
      response += `💡 **Aplicando ao ${rt.symbol}**:\n`;
      response += `Com o preço em $${rt.price}, `;
      if (rt.marketPressure) {
        response += `e pressão ${rt.marketPressure.toLowerCase()}, `;
      }
      response += `você pode usar essas informações para melhorar suas entradas.\n\n`;
    }

    response += `${closing}`;
    return response;
  }

  // Método legado (mantido para compatibilidade)
  buildResponse(
    message: string,
    knowledge: any[],
    analyses: any[],
    context: any[],
    type: string,
    realTimeContext?: any,
    signals?: any[]
  ): string {
    return this.buildIntelligentResponse(message, knowledge, analyses, context, this.detectQuestionType(message), realTimeContext, signals);
  }

  // Helper para label de Fear & Greed
  getFearGreedLabel(index: number): string {
    if (!index) return '';
    if (index > 75) return '(Ganância Extrema)';
    if (index > 60) return '(Ganância)';
    if (index > 40) return '(Neutro)';
    if (index > 25) return '(Medo)';
    return '(Medo Extremo)';
  }

  // 🧠 AUTO-APRENDIZADO: Extrai e salva conhecimento automaticamente
  async extractAndSaveKnowledge(
    response: string, 
    userQuestion: string, 
    contextType: string,
    marketContext?: any
  ): Promise<void> {
    try {
      // Detectar se a resposta contém conhecimento técnico valioso
      const hasPattern = /order block|fvg|spring|wyckoff|bos|choch|suporte|resistência|divergência/i.test(response);
      const hasAnalysis = /análise|padrão|probabilidade|risco|estratégia/i.test(response);
      const isLongResponse = response.length > 200;
      
      // Só salva se for conteúdo técnico relevante
      if (!hasPattern && !hasAnalysis) return;
      if (!isLongResponse) return;

      // Extrai tópico principal
      const topic = this.extractMainTopic(userQuestion, response);
      if (!topic) return;

      // Categoriza o conhecimento
      const category = this.categorizeKnowledge(response, contextType);
      
      // Extrai exemplos práticos da resposta
      const examples = this.extractExamples(response);

      // Confiança inicial baseada no contexto de mercado
      let initialAccuracy = 50;
      if (marketContext?.fearGreedIndex) {
        // Mais confiança se houver dados reais de mercado
        initialAccuracy = 65;
      }
      if (examples.length > 0) {
        // Mais confiança se houver exemplos
        initialAccuracy += 10;
      }

      // Verifica se já existe conhecimento similar
      const { data: existing } = await this.supabase
        .from('bot_knowledge')
        .select('id, accuracy_score, usage_count')
        .eq('topic', topic)
        .maybeSingle();

      if (existing) {
        // Atualiza conhecimento existente
        await this.supabase
          .from('bot_knowledge')
          .update({
            content: response.slice(0, 2000), // Limita tamanho
            examples: examples.length > 0 ? examples : existing.examples,
            metadata: {
              last_updated: new Date().toISOString(),
              market_context: marketContext || {},
              updated_from: 'auto_learning',
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        console.log('✅ Conhecimento atualizado:', topic);
      } else {
        // Cria novo conhecimento
        await this.supabase
          .from('bot_knowledge')
          .insert({
            topic,
            category,
            content: response.slice(0, 2000),
            examples,
            accuracy_score: initialAccuracy,
            usage_count: 0,
            metadata: {
              created_from: 'auto_learning',
              original_question: userQuestion.slice(0, 500),
              market_context: marketContext || {},
              context_type: contextType,
            },
          });

        console.log('✅ Novo conhecimento salvo:', topic);
      }
    } catch (error) {
      console.error('❌ Erro no auto-aprendizado:', error);
      // Não bloqueia a resposta se falhar
    }
  }

  // Extrai tópico principal da conversa
  extractMainTopic(question: string, response: string): string | null {
    const combined = (question + ' ' + response).toLowerCase();
    
    // Padrões técnicos conhecidos
    const patterns = [
      { regex: /order\s*block/i, topic: 'Order Blocks' },
      { regex: /fvg|fair\s*value\s*gap/i, topic: 'Fair Value Gaps (FVG)' },
      { regex: /spring|wyckoff/i, topic: 'Padrão Wyckoff Spring' },
      { regex: /upthrust/i, topic: 'Padrão Wyckoff Upthrust' },
      { regex: /bos|break\s*of\s*structure/i, topic: 'Break of Structure (BOS)' },
      { regex: /choch|change\s*of\s*character/i, topic: 'Change of Character (ChoCh)' },
      { regex: /liquidez|liquidity\s*sweep/i, topic: 'Liquidity Sweep' },
      { regex: /suporte\s*e\s*resistência/i, topic: 'Suporte e Resistência' },
      { regex: /rsi/i, topic: 'RSI (Relative Strength Index)' },
      { regex: /macd/i, topic: 'MACD' },
      { regex: /ema|média\s*móvel/i, topic: 'Médias Móveis (EMA)' },
      { regex: /volume/i, topic: 'Análise de Volume' },
      { regex: /divergência/i, topic: 'Divergências' },
      { regex: /risco|gerenciamento/i, topic: 'Gerenciamento de Risco' },
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(combined)) {
        return pattern.topic;
      }
    }

    // Se não encontrar padrão específico, tenta extrair do início da pergunta
    const questionWords = question.split(/\s+/).slice(0, 5).join(' ');
    if (questionWords.length > 10) {
      return questionWords.charAt(0).toUpperCase() + questionWords.slice(1);
    }

    return null;
  }

  // Categoriza o conhecimento
  categorizeKnowledge(response: string, contextType: string): string {
    const lower = response.toLowerCase();
    
    if (contextType === 'pattern' || /order block|fvg|spring|wyckoff/i.test(lower)) {
      return 'Padrões de Trading';
    }
    if (contextType === 'analysis_start' || /análise|setup/i.test(lower)) {
      return 'Análise Técnica';
    }
    if (/estratégia|setup/i.test(lower)) {
      return 'Estratégias';
    }
    if (/risco|stop|take profit/i.test(lower)) {
      return 'Gerenciamento de Risco';
    }
    if (/indicador|rsi|macd|ema/i.test(lower)) {
      return 'Indicadores';
    }
    
    return 'Geral';
  }

  // Extrai exemplos práticos
  extractExamples(response: string): string[] {
    const examples: string[] = [];
    
    // Procura por linhas que começam com • ou números
    const lines = response.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^[•\-\*]\s+/) || trimmed.match(/^\d+\.\s+/)) {
        const cleaned = trimmed.replace(/^[•\-\*\d\.]\s+/, '');
        if (cleaned.length > 20 && cleaned.length < 200) {
          examples.push(cleaned);
        }
      }
    }
    
    return examples.slice(0, 5); // Máximo 5 exemplos
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, image, userId, sessionId, realTimeContext, userEmbedding } = await req.json();
    
    if (!message || !userId) {
      throw new Error('Message and userId are required');
    }

    console.log('📥 Received context:', realTimeContext ? 'YES' : 'NO');
    console.log('🧠 Received embedding:', userEmbedding ? `YES (${userEmbedding.length} dims)` : 'NO');
    console.log('📝 Session ID:', sessionId || 'No session');

    // Conectar ao Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Motor de IA próprio com contexto em tempo real + BUSCA SEMÂNTICA + VISÃO
    const ai = new TradeVisionAI(supabase);
    const aiResult = await ai.generateResponse(
      message, 
      userId, 
      sessionId || crypto.randomUUID(),
      realTimeContext,
      userEmbedding,
      image
    );

    // 🧠 AUTO-APRENDIZADO: Extrai conhecimento da resposta gerada
    await ai.extractAndSaveKnowledge(aiResult.response, message, aiResult.contextType, realTimeContext);

    return new Response(
      JSON.stringify({ 
        response: aiResult.response,
        contextType: aiResult.contextType,
        referenceChunks: aiResult.referenceChunks,
        conversationState: aiResult.conversationState,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in trade-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});