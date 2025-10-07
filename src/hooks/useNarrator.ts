import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNarratorContext } from '@/contexts/NarratorContext';

export interface NarratorSignal {
  id: string;
  symbol: string;
  timeframe: string;
  timestamp: string;
  type: 'BUY' | 'SELL';
  probability: number;
  pattern: string;
  figure: string;
  risk: string;
  price: string;
  news: string;
  marketStatus: string;
  pairData: {
    change24h: string;
    vol: string;
    dominance: string;
  };
}

// Cache de notícias reais da API (atualizado dinamicamente)
let newsCache: { text: string; timestamp: number } | null = null;
const NEWS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

async function fetchLatestNews(symbol: string): Promise<string> {
  // Verificar cache
  if (newsCache && (Date.now() - newsCache.timestamp) < NEWS_CACHE_DURATION) {
    return newsCache.text;
  }

  try {
    // Buscar notícias reais da API
    const query = symbol.includes('BTC') ? 'Bitcoin mercado cripto' :
                  symbol.includes('ETH') ? 'Ethereum crypto' :
                  symbol.includes('XAU') ? 'ouro mercado' :
                  symbol.includes('EUR') ? 'euro dólar forex' :
                  'mercado financeiro';

    const { data, error } = await supabase.functions.invoke('noticias', {
      body: { q: query }
    });

    if (error || !data || data.length === 0) {
      console.warn('⚠️ Erro ao buscar notícias, usando fallback');
      return 'Mercado em movimento, aguardando catalisadores';
    }

    // Pegar a notícia mais recente
    const latestNews = data[0];
    const newsText = latestNews.title || latestNews.description || 'Sem notícias recentes';

    // Atualizar cache
    newsCache = {
      text: newsText,
      timestamp: Date.now()
    };

    console.log('📰 Notícia real carregada:', newsText.substring(0, 100));
    return newsText;

  } catch (err) {
    console.error('❌ Erro ao buscar notícias:', err);
    return 'Mercado em movimento, aguardando catalisadores';
  }
}

const pairInfo = {
  'BTC/USDT': { change24h: '+2.4%', vol: '1.2B', dominance: '52%' },
  'ETH/USDT': { change24h: '+1.8%', vol: '850M', dominance: '18%' },
  'XAU/USD': { change24h: '+0.6%', vol: '2.1B', dominance: 'N/A' },
  'EUR/USD': { change24h: '-0.3%', vol: '4.5B', dominance: 'N/A' }
};

export const useNarrator = (
  enabled: boolean,
  liveData: any,
  selectedPair: string,
  selectedTimeframe: string,
  technicalIndicators?: any,
  detectedPatterns?: any,
  speakEnabled: boolean = true
) => {
  const { user } = useAuth();
  const { addNarratorSignal } = useNarratorContext();
  const [isPlaying, setIsPlaying] = useState(true);
  const [feed, setFeed] = useState<NarratorSignal[]>([]);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);

  // NOVO: Função para consultar Agente antes de gerar sinal
  const consultAgentBeforeSignal = async (pattern: any, symbol: string, timeframe: string, liveData: any, indicators: any) => {
    try {
      console.log('🤖 Consultando Agente TradeVision IA...');
      
      const { data, error } = await supabase.functions.invoke('trade-chat', {
        body: {
          message: `🎙️ NARRADOR ${timeframe.toUpperCase()} CONSULTANDO: Detectei ${pattern.type} em ${symbol} a ${liveData?.price || 'N/A'}. RSI: ${indicators?.RSI?.toFixed(1) || 'N/A'}. MACD: ${indicators?.MACD?.histogram?.toFixed(2) || 'N/A'}. Devo gerar sinal? Qual sua análise?`,
          userId: user?.id,
          sessionId: `narrator-consultation-${Date.now()}`,
          realTimeContext: {
            pattern,
            marketData: {
              symbol,
              timeframe,
              price: liveData?.price || '0',
              volume: liveData?.volume || '0'
            },
            technicalIndicators: indicators,
            consultationType: 'narrator-signal-validation',
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) {
        console.error('❌ Erro ao consultar Agente:', error);
        return { recommendation: 'WAIT', reasoning: 'Erro na consulta ao Agente' };
      }

      // Extrair recomendação da resposta do Agente
      const response = data.response || '';
      console.log('🤖 Resposta do Agente:', response);
      console.log('🤖 Data completa do Agente:', data);
      
      const isApproved = response.includes('GENERATE_SIGNAL') || 
                        response.includes('gerar sinal') || 
                        response.includes('recomendo') ||
                        response.includes('aprovado') ||
                        response.includes('RECOMENDO');
      
      console.log('🤖 Agente aprovou sinal?', isApproved);
      
      return {
        recommendation: isApproved ? 'GENERATE_SIGNAL' : 'WAIT',
        reasoning: response,
        confidence: data.confidence || 70,
        agentResponse: data
      };
    } catch (error) {
      console.error('❌ Erro na consulta ao Agente:', error);
      return { recommendation: 'WAIT', reasoning: 'Erro na consulta' };
    }
  };

  const generateSignal = async () => {
    // Verificar se ainda está ativo antes de gerar
    if (!enabled || !isPlaying || !liveData || !user || !isRunningRef.current) {
      console.log('⏸️ Narrador pausado ou desabilitado - ignorando geração de sinal');
      return;
    }

    console.log('🎙️ Iniciando geração de sinal inteligente...');
    console.log('🔍 Debug - detectedPatterns:', detectedPatterns);
    console.log('🔍 Debug - liveData:', liveData);
    console.log('🔍 Debug - technicalIndicators:', technicalIndicators);

    // APENAS análise inteligente real - SEM FALLBACK FICTÍCIO
    if (detectedPatterns && Object.keys(detectedPatterns).length > 0) {
      console.log('✅ Padrões detectados, gerando sinal...');
      await generateIntelligentSignal();
    } else {
      console.log('⏳ Aguardando padrões serem detectados...');
      console.log('🔍 Debug - detectedPatterns é null/undefined ou vazio');
    }
  };

  const generateIntelligentSignal = async () => {
    // Verificar novamente antes de iniciar análise
    if (!isRunningRef.current || !isPlaying) {
      console.log('⏸️ Narrador foi pausado durante geração - abortando');
      return;
    }
    
    try {
      console.log('🧠 Analisando com IA...');

      // Preparar dados para análise + timestamp de detecção
      const detectedAt = Date.now();
      const pattern = {
        type: detectedPatterns.orderBlockDetected ? 'Order Block' :
              detectedPatterns.fvgDetected ? 'FVG' :
              detectedPatterns.chochDetected ? 'CHOCH' :
              detectedPatterns.bosDetected ? 'BOS' :
              'Estrutura Técnica',
        order_block_type: detectedPatterns.orderBlockType,
        fvg_type: detectedPatterns.fvgType,
        support_level: detectedPatterns.supportLevel,
        resistance_level: detectedPatterns.resistanceLevel,
        detected_at: detectedAt
      };

      // NOVO: Consultar Agente TradeVision IA antes de gerar sinal
      const agentValidation = await consultAgentBeforeSignal(pattern, selectedPair, selectedTimeframe, liveData, technicalIndicators);
      
      // Só prosseguir se Agente aprovar
      if (agentValidation.recommendation !== 'GENERATE_SIGNAL') {
        console.log('⏸️ Sinal descartado pelo Agente:', agentValidation.reasoning);
        console.log('🔍 Debug - agentValidation:', agentValidation);
        
        // Se o Agente rejeitou, ainda assim podemos falar sobre isso
        if (speakEnabled && enabled && isPlaying && isRunningRef.current) {
          const utterance = new SpeechSynthesisUtterance(
            `Sinal descartado pelo Agente TradeVision IA. ${agentValidation.reasoning}`
          );
          utterance.lang = 'pt-BR';
          utterance.rate = 0.8;
          speechSynthesis.speak(utterance);
        }
        return;
      }

      // Buscar notícia real da API
      const latestNews = await fetchLatestNews(selectedPair);

      const marketData = {
        symbol: selectedPair,
        timeframe: selectedTimeframe,
        price: liveData?.price || '0',
        volume: liveData?.volume,
        news: latestNews
      };

      // Chamar edge function de análise inteligente
      const { data, error } = await supabase.functions.invoke('intelligent-narrator', {
        body: {
          pattern,
          marketData,
          technicalIndicators,
          userId: user.id
        }
      });

      if (error) {
        console.error('❌ Erro na análise:', error);
        return; // SEM fallback - aguardar próximo ciclo
      }

      if (!data.success) {
        console.log('⚠️ Sinal descartado pela TradeVision IA:', data.reason);
        
        // Notificar usuário sobre descarte inteligente
        if (speakEnabled && enabled && isPlaying) {
          const utterance = new SpeechSynthesisUtterance(
            `Sinal descartado. ${data.aiValidation || 'Score abaixo do mínimo aceitável.'}`
          );
          utterance.lang = 'pt-BR';
          utterance.rate = 0.85;
          utterance.pitch = 0.9;
          speechSynthesis.speak(utterance);
        }
        return; // SEM fallback fictício
      }

      const analysisEndTime = Date.now();
      const totalAnalysisTime = analysisEndTime - detectedAt;
      console.log(`✅ Sinal VALIDADO pela TradeVision IA em ${totalAnalysisTime}ms!`, data.aiValidation);

      // Adicionar ao feed com validação IA
      const timing = data.signal.metadata?.timing;
      const aiValidation = data.signal.metadata?.tradevision_validation;
      const mtContext = data.signal.metadata?.multi_timeframe_context;
      
      // Contexto multi-timeframe para narração
      const mtContextText = mtContext ? 
        `M1: ${mtContext.m1?.trend || 'aguardando'} | M5: ${mtContext.m5?.trend || 'aguardando'} | M15: ${mtContext.m15?.trend || 'aguardando'} | M30: ${mtContext.m30?.trend || 'aguardando'}` :
        'Contexto multi-timeframe carregando...';

      const signal: NarratorSignal = {
        id: `signal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        symbol: selectedPair,
        timeframe: selectedTimeframe,
        timestamp: new Date().toISOString(),
        type: data.signal.signal_type,
        probability: agentValidation.confidence || data.signal.probability, // Usar confiança do Agente
        pattern: data.signal.pattern,
        figure: `${data.signal.figure} | Agente: ${agentValidation.reasoning.substring(0, 100)}... | ${mtContextText}`,
        risk: data.signal.risk_note,
        price: data.signal.price,
        news: data.signal.news || '',
        marketStatus: `${data.signal.market_status} | Agente Validado: ${agentValidation.confidence}% | IA: ${aiValidation?.recommendation || 'VALIDADO'} | ${totalAnalysisTime}ms`,
        pairData: pairInfo[selectedPair as keyof typeof pairInfo] || pairInfo['BTC/USDT']
      };

      setFeed((prev) => [signal, ...prev.slice(0, 49)]);
      
      // Adicionar sinal ao contexto compartilhado para o Sistema 3 IAs
      addNarratorSignal(signal);

      // Voice synthesis ENRIQUECIDA com validação IA + contexto multi-timeframe
      // Verificar se ainda está ativo antes de falar
      if (speakEnabled && enabled && isPlaying && isRunningRef.current) {
        const urgency = aiValidation?.recommendation === 'STRONG_BUY' ? 'ALTA URGÊNCIA' :
                       aiValidation?.recommendation === 'BUY' ? 'Oportunidade forte' :
                       'Oportunidade detectada';
        
        const aiInsight = aiValidation?.keyPoints?.[0] || data.signal.figure;
        
        // Adicionar contexto de timeframes maiores na narração
        let mtSpeech = '';
        if (mtContext) {
          const higherTFs = [];
          if (mtContext.m5?.trend && mtContext.m5.trend !== 'neutral') higherTFs.push(`M5 ${mtContext.m5.trend}`);
          if (mtContext.m15?.trend && mtContext.m15.trend !== 'neutral') higherTFs.push(`M15 ${mtContext.m15.trend}`);
          if (mtContext.m30?.trend && mtContext.m30.trend !== 'neutral') higherTFs.push(`M30 ${mtContext.m30.trend}`);
          
          if (higherTFs.length > 0) {
            mtSpeech = ` Contexto superior: ${higherTFs.join(', ')}.`;
          }
        }
        
        const utterance = new SpeechSynthesisUtterance(
          `${urgency}! ${selectedPair}: ${data.signal.signal_type} validado pela TradeVision IA com ${data.signal.probability}% de confiança. ${aiInsight}.${mtSpeech} ${aiValidation?.reasoning || 'Análise completa disponível.'}`
        );
        utterance.lang = 'pt-BR';
        utterance.rate = 0.9;
        utterance.pitch = aiValidation?.recommendation?.includes('STRONG') ? 1.2 : 1.0;
        speechSynthesis.speak(utterance);
      }

    } catch (err) {
      console.error('❌ Erro ao gerar sinal inteligente:', err);
      // SEM fallback - aguardar próximo ciclo
    }
  };

  const startNarrator = () => {
    if (isRunningRef.current) return;
    
    console.log('🎙️ Narrador iniciado');
    console.log('🔍 Debug - enabled:', enabled);
    console.log('🔍 Debug - isPlaying:', isPlaying);
    console.log('🔍 Debug - liveData:', liveData);
    console.log('🔍 Debug - user:', user);
    
    isRunningRef.current = true;
    
    // Gerar primeiro sinal imediatamente
    timeoutRef.current = setTimeout(() => {
      console.log('⏰ Timeout executado - tentando gerar sinal...');
      generateSignal();
    }, 1000);
    
    // Continuar gerando sinais a cada 1 minuto
    intervalRef.current = setInterval(() => {
      console.log('⏰ Interval executado - tentando gerar sinal...');
      generateSignal();
    }, 60000);
  };

  const stopNarrator = () => {
    console.log('🔇 Narrador pausado');
    
    // Cancelar qualquer síntese de voz em andamento
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    isRunningRef.current = false;
  };

  const toggle = () => {
    if (isPlaying) {
      stopNarrator();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      startNarrator();
    }
  };

  const speakLatest = () => {
    if (!speakEnabled) return;
    if (feed.length > 0) {
      const latest = feed[0];
      const utterance = new SpeechSynthesisUtterance(
        `${latest.symbol} ${latest.timeframe}: ${latest.pattern}. Probabilidade: ${latest.probability}%`
      );
      utterance.lang = 'pt-BR';
      speechSynthesis.speak(utterance);
    }
  };

  // Single effect to handle start/stop
  useEffect(() => {
    if (enabled && isPlaying && liveData && !isRunningRef.current) {
      startNarrator();
    } else if ((!enabled || !isPlaying) && isRunningRef.current) {
      stopNarrator();
    }
  }, [enabled, isPlaying, liveData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopNarrator();
      console.log('🔚 Narrador desmontado');
    };
  }, []);

  return {
    isPlaying,
    feed,
    toggle,
    speakLatest,
    enabled
  };
};
