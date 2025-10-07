import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AgentSignal {
  id: string;
  symbol: string;
  timeframe: string;
  timestamp: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  analysis: string;
  pattern: string;
  price: string;
  risk?: string;
  technicalData: {
    rsi: number;
    macd: number;
    ema9: number;
    ema20: number;
  };
  marketContext: {
    volume: number;
    volatility: number;
    trend: string;
  };
  panorama?: {
    trendDirection: string;
    accuracy: number;
    signalStrength: string;
    marketCondition: string;
    nextLevels?: string;
  };
}

interface UseAgentAnalysisProps {
  symbol: string;
  timeframe: string;
  liveData: any;
  technicalIndicators: any;
  patterns: any;
  enabled: boolean;
}

export const useAgentAnalysis = ({
  symbol,
  timeframe,
  liveData,
  technicalIndicators,
  patterns,
  enabled
}: UseAgentAnalysisProps) => {
  const { user } = useAuth();
  const [signals, setSignals] = useState<AgentSignal[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);

  // Função para gerar análise independente do Agente
  const generateIndependentAnalysis = useCallback(async () => {
    if (!enabled || !liveData || !technicalIndicators || !user || !isRunningRef.current) {
      return;
    }

    try {
      setIsAnalyzing(true);
      console.log('🤖 Agente TradeVision IA: Iniciando análise independente...');

      // Preparar dados para análise
      const marketData = {
        symbol: symbol.replace('/', ''),
        timeframe,
        price: liveData?.price || '0',
        volume: liveData?.volume || '0',
        change24h: liveData?.change || '0%'
      };

      console.log('🔍 useAgentAnalysis: Dados recebidos', {
        liveData,
        technicalIndicators,
        patterns
      });

      const technicalData = {
        rsi: technicalIndicators?.rsi14 || technicalIndicators?.RSI || 50,
        macd: technicalIndicators?.macdHistogram || technicalIndicators?.MACD?.histogram || 0,
        ema9: technicalIndicators?.ema9 || technicalIndicators?.EMA?.ema9 || 0,
        ema20: technicalIndicators?.ema20 || technicalIndicators?.EMA?.ema20 || 0,
        sma20: technicalIndicators?.sma20 || technicalIndicators?.SMA?.sma20 || 0,
        bollinger: technicalIndicators?.bollinger || technicalIndicators?.Bollinger || { upper: 0, middle: 0, lower: 0 }
      };

      const patternData = {
        orderBlockDetected: patterns?.orderBlockDetected || false,
        fvgDetected: patterns?.fvgDetected || false,
        bosDetected: patterns?.bosDetected || false,
        chochDetected: patterns?.chochDetected || false,
        orderBlockType: patterns?.orderBlockType || null,
        fvgType: patterns?.fvgType || null
      };

      // Análise completa do mercado - panorama detalhado
      const currentPrice = Number(marketData.price);
      const priceChange = Number(marketData.change24h.replace('%', ''));
      const volume = Number(marketData.volume);
      
      // Calcular tendência baseada nas médias móveis
      const trendDirection = technicalData.ema9 > technicalData.ema20 ? 'ALTA' : 
                            technicalData.ema9 < technicalData.ema20 ? 'BAIXA' : 'CONSOLIDAÇÃO';
      
      // Análise de força do RSI
      const rsiStrength = technicalData.rsi > 70 ? 'SOBRECOMPRA' :
                         technicalData.rsi < 30 ? 'SOBREVENDA' :
                         technicalData.rsi > 50 ? 'FORTE' : 'FRACO';
      
      // Análise do MACD
      const macdMomentum = technicalData.macd > 0 ? 'MOMENTUM POSITIVO' : 'MOMENTUM NEGATIVO';
      
      // Análise de volatilidade
      const volatility = Math.abs(priceChange);
      const volatilityLevel = volatility > 5 ? 'ALTA' : volatility > 2 ? 'MÉDIA' : 'BAIXA';
      
      // Análise de volume
      const volumeLevel = volume > 1000000 ? 'ALTO' : volume > 500000 ? 'MÉDIO' : 'BAIXO';

      const analysisMessage = `🤖 ANÁLISE COMPLETA E DETALHADA DO MERCADO - ${symbol} (${timeframe}):

📊 DADOS ATUAIS DO MERCADO:
• Preço Atual: $${currentPrice.toLocaleString()}
• Variação 24h: ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%
• Volume: ${volume.toLocaleString()}
• Timestamp: ${new Date().toLocaleString()}

📈 ANÁLISE TÉCNICA DETALHADA:
• RSI (14): ${technicalData.rsi.toFixed(1)} - ${rsiStrength} (${technicalData.rsi > 70 ? 'Sobrecarga de compra' : technicalData.rsi < 30 ? 'Sobrecarga de venda' : 'Neutro'})
• MACD Histogram: ${technicalData.macd.toFixed(4)} - ${macdMomentum} (${technicalData.macd > 0 ? 'Momentum de alta' : 'Momentum de baixa'})
• EMA 9: $${technicalData.ema9.toFixed(2)} (${technicalData.ema9 > currentPrice ? 'Resistência' : 'Suporte'})
• EMA 20: $${technicalData.ema20.toFixed(2)} (${technicalData.ema20 > currentPrice ? 'Resistência' : 'Suporte'})
• Tendência Principal: ${trendDirection}
• Força da Tendência: ${Math.abs(technicalData.ema9 - technicalData.ema20) > currentPrice * 0.01 ? 'FORTE' : 'FRACA'}

🎯 PADRÕES DE MERCADO DETECTADOS:
• Order Block: ${patternData.orderBlockDetected ? 'SIM - Zona de liquidez institucional' : 'NÃO - Sem zona de liquidez'}
• Fair Value Gap: ${patternData.fvgDetected ? 'SIM - Gap de valor justo' : 'NÃO - Sem gap de valor'}
• Break of Structure: ${patternData.bosDetected ? 'SIM - Quebra de estrutura' : 'NÃO - Estrutura mantida'}
• Change of Character: ${patternData.chochDetected ? 'SIM - Mudança de caráter' : 'NÃO - Caráter mantido'}

📊 CONTEXTO MACRO DO MERCADO:
• Volatilidade: ${volatilityLevel} (${volatility.toFixed(2)}%) - ${volatility > 5 ? 'Alta volatilidade, cuidado com stop loss' : volatility > 2 ? 'Volatilidade moderada' : 'Baixa volatilidade, movimento lateral'}
• Volume: ${volumeLevel} - ${volume > 1000000 ? 'Volume alto, confirmação de movimento' : volume > 500000 ? 'Volume médio' : 'Volume baixo, movimento fraco'}
• Sentimento: ${trendDirection === 'ALTA' ? 'Bullish - Tendência de alta' : trendDirection === 'BAIXA' ? 'Bearish - Tendência de baixa' : 'Neutro - Consolidação'}

🎯 SOLICITAÇÃO DETALHADA: 
Forneça uma análise completa e detalhada incluindo:

1. **TENDÊNCIA PRINCIPAL**: ALTA/BAIXA/CONSOLIDAÇÃO com justificativa
2. **ACURÁCIA DA ANÁLISE**: 0-100% baseada na convergência dos indicadores
3. **SINAL ESPECÍFICO**: BUY/SELL/HOLD com nível de entrada
4. **JUSTIFICATIVA TÉCNICA DETALHADA**: Explicação completa dos indicadores
5. **NÍVEL DE RISCO**: BAIXO/MÉDIO/ALTO com justificativa
6. **PRÓXIMOS NÍVEIS IMPORTANTES**: Suporte, resistência e targets
7. **ANÁLISE DE MOMENTUM**: Força do movimento atual
8. **RECOMENDAÇÃO DE STOP LOSS**: Nível de proteção
9. **TIMEFRAME DE VALIDADE**: Quanto tempo o sinal é válido
10. **CONFIANÇA NO SINAL**: Porcentagem de confiança baseada na análise

Seja detalhado e específico na sua análise, explicando cada ponto técnico e fundamentando suas conclusões com os dados fornecidos.`;

      // Chamar edge function para análise independente
      const { data, error } = await supabase.functions.invoke('trade-chat', {
        body: {
          message: analysisMessage,
          userId: user.id,
          sessionId: `agent-complete-analysis-${Date.now()}`,
          realTimeContext: {
            analysisType: 'complete-market-analysis',
            marketData,
            technicalData,
            patternData,
            marketContext: {
              trendDirection,
              rsiStrength,
              macdMomentum,
              volatilityLevel,
              volumeLevel,
              currentPrice,
              priceChange,
              volume
            },
            timestamp: new Date().toISOString(),
            independentMode: true
          }
        }
      });

      if (error) {
        console.error('❌ Erro na análise independente do Agente:', error);
        return;
      }

      // Processar resposta do Agente
      const response = data.response || '';
      const confidence = data.confidence || 50;
      
      // Extrair informações estruturadas da resposta
      const extractSignalInfo = (text: string) => {
        const lines = text.split('\n');
        let signalType: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
        let accuracy = confidence;
        let trend = 'NEUTRAL';
        let risk = 'MÉDIO';
        let nextLevels = '';
        
        for (const line of lines) {
          const upperLine = line.toUpperCase();
          
          // Detectar sinal
          if (upperLine.includes('BUY') || upperLine.includes('COMPRAR') || upperLine.includes('ALTA')) {
            signalType = 'BUY';
          } else if (upperLine.includes('SELL') || upperLine.includes('VENDER') || upperLine.includes('BAIXA')) {
            signalType = 'SELL';
          }
          
          // Detectar tendência
          if (upperLine.includes('TENDÊNCIA:') || upperLine.includes('TENDENCIA:')) {
            if (upperLine.includes('ALTA')) trend = 'ALTA';
            else if (upperLine.includes('BAIXA')) trend = 'BAIXA';
            else if (upperLine.includes('CONSOLIDAÇÃO') || upperLine.includes('CONSOLIDACAO')) trend = 'CONSOLIDAÇÃO';
          }
          
          // Detectar acurácia
          if (upperLine.includes('ACURÁCIA:') || upperLine.includes('ACURACIA:')) {
            const match = line.match(/(\d+)%/);
            if (match) accuracy = parseInt(match[1]);
          }
          
          // Detectar risco
          if (upperLine.includes('RISCO:')) {
            if (upperLine.includes('BAIXO')) risk = 'BAIXO';
            else if (upperLine.includes('ALTO')) risk = 'ALTO';
            else if (upperLine.includes('MÉDIO') || upperLine.includes('MEDIO')) risk = 'MÉDIO';
          }
          
          // Detectar próximos níveis
          if (upperLine.includes('NÍVEIS:') || upperLine.includes('NIVEIS:')) {
            nextLevels = line.replace(/.*[Nn][Íi]veis?:?\s*/i, '');
          }
        }
        
        return { signalType, accuracy, trend, risk, nextLevels };
      };
      
      const signalInfo = extractSignalInfo(response);

      // Só gerar sinal se confiança for suficiente (reduzido para gerar mais sinais)
      if (signalInfo.accuracy >= 30) {
        const signal: AgentSignal = {
          id: `agent-signal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          symbol,
          timeframe,
          timestamp: new Date().toISOString(),
          type: signalInfo.signalType,
          confidence: signalInfo.accuracy,
          analysis: response,
          pattern: patternData.orderBlockDetected ? 'Order Block' :
                  patternData.fvgDetected ? 'Fair Value Gap' :
                  patternData.bosDetected ? 'Break of Structure' :
                  patternData.chochDetected ? 'Change of Character' :
                  'Análise Técnica Completa',
          price: `$${Number(marketData.price).toLocaleString()}`,
          risk: signalInfo.risk,
          technicalData: {
            rsi: technicalData.rsi,
            macd: technicalData.macd,
            ema9: technicalData.ema9,
            ema20: technicalData.ema20
          },
          marketContext: {
            volume: Number(marketData.volume) || 0,
            volatility: Math.abs(Number(marketData.change24h.replace('%', ''))) || 0,
            trend: signalInfo.trend
          },
          panorama: {
            trendDirection: signalInfo.trend,
            accuracy: signalInfo.accuracy,
            signalStrength: signalInfo.accuracy >= 80 ? 'FORTE' : signalInfo.accuracy >= 60 ? 'MÉDIO' : 'FRACO',
            marketCondition: `${volatilityLevel} volatilidade, ${volumeLevel} volume`,
            nextLevels: signalInfo.nextLevels
          }
        };

        // Adicionar sinal à lista
        setSignals(prev => [signal, ...prev.slice(0, 49)]); // Manter últimos 50 sinais
        
        // Salvar no banco de dados
        try {
          const { error: dbError } = await supabase
            .from('agent_signals')
            .insert({
              id: signal.id,
              symbol: signal.symbol,
              timeframe: signal.timeframe,
              signal_type: signal.type,
              confidence: signal.confidence,
              analysis: signal.analysis,
              pattern: signal.pattern,
              price: signal.price,
              risk: signal.risk,
              technical_data: signal.technicalData,
              market_context: signal.marketContext,
              user_id: user.id,
              created_at: signal.timestamp
            });

          if (dbError) {
            console.error('❌ Erro ao salvar sinal do Agente:', dbError);
          } else {
            console.log('✅ Sinal do Agente salvo no banco de dados');
          }
        } catch (dbErr) {
          console.error('❌ Erro ao salvar sinal:', dbErr);
        }

        console.log('🎯 Sinal independente do Agente gerado:', signal);
      } else {
        console.log('⏸️ Análise do Agente: Confiança insuficiente ou sinal HOLD');
      }

      setLastAnalysis(new Date());

    } catch (error) {
      console.error('❌ Erro na análise independente:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [enabled, liveData, technicalIndicators, patterns, symbol, timeframe, user]);

  // Iniciar análise
  const startAnalysis = useCallback(() => {
    if (isRunningRef.current) return;
    
    console.log('🤖 Iniciando análise independente do Agente TradeVision IA...');
    isRunningRef.current = true;
    
    // Primeira análise imediatamente
    setTimeout(() => {
      generateIndependentAnalysis();
    }, 2000);
    
    // Continuar análise a cada 1 minuto
    intervalRef.current = setInterval(() => {
      generateIndependentAnalysis();
    }, 60000); // 1 minuto
  }, [generateIndependentAnalysis]);

  // Parar análise
  const stopAnalysis = useCallback(() => {
    console.log('⏸️ Parando análise independente do Agente...');
    isRunningRef.current = false;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Limpar sinais
  const clearSignals = useCallback(() => {
    setSignals([]);
    console.log('🗑️ Sinais do Agente limpos');
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Auto-start quando habilitado
  useEffect(() => {
    if (enabled && liveData && !isRunningRef.current) {
      startAnalysis();
    } else if (!enabled && isRunningRef.current) {
      stopAnalysis();
    }
  }, [enabled, liveData, startAnalysis, stopAnalysis]);

  return {
    signals,
    isAnalyzing,
    lastAnalysis,
    startAnalysis,
    stopAnalysis,
    clearSignals
  };
};
