import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CursorData {
  timestamp: string;
  price: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  volume: number;
  indicators: {
    MACD: {
      macd: number;
      signal: number;
      histogram: number;
    };
    RSI: number;
    EMA_20: number;
    SMA_50: number;
    Bollinger: {
      upper: number;
      middle: number;
      lower: number;
    };
  };
  heatmap_data: {
    buy_pressure: number;
    sell_pressure: number;
    institutional_flow: 'positive' | 'negative' | 'neutral';
  };
  score_ia: {
    tendencia: 'bull' | 'bear' | 'neutral';
    probabilidade: number;
    confidence: number;
  };
}

interface NarratorFeedData {
  id: string;
  timestamp: string;
  symbol: string;
  timeframe: string;
  pattern_detected: string;
  pattern_type: string;
  indicators: any;
  market_data: any;
  narrator_text: string;
  confidence_score: number;
  processed_flag: boolean;
  created_at: string;
}

export const useNarratorFeed = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastFeedId, setLastFeedId] = useState<string | null>(null);

  // Enviar dados capturados do cursor para o feed do narrador
  const sendToNarratorFeed = useCallback(async (
    cursorData: CursorData,
    symbol: string,
    timeframe: string
  ): Promise<string | null> => {
    setIsLoading(true);
    
    try {
      // Gerar texto do narrador baseado nos dados capturados
      const narratorText = generateNarratorText(cursorData, symbol);
      
      // Determinar padrão detectado baseado nos indicadores
      const patternDetected = detectPatternFromData(cursorData);
      
      // Preparar dados para inserção no feed
      const feedData = {
        symbol,
        timeframe,
        pattern_detected: patternDetected.pattern,
        pattern_type: patternDetected.type,
        indicators: cursorData.indicators,
        market_data: {
          price: cursorData.price,
          volume: cursorData.volume,
          heatmap: cursorData.heatmap_data,
          timestamp: cursorData.timestamp
        },
        narrator_text: narratorText,
        confidence_score: cursorData.score_ia.confidence,
        processed_flag: false // Será processado pelo agente
      };

      // Inserir no feed do narrador
      const { data, error } = await supabase
        .from('narrator_output')
        .insert([feedData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao enviar para feed do narrador:', error);
        return null;
      }

      setLastFeedId(data.id);
      // Dados enviados silenciosamente para feed do narrador
      
      return data.id;
    } catch (error) {
      console.error('Erro ao processar dados do cursor:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Gerar texto do narrador baseado nos dados
  const generateNarratorText = (data: CursorData, symbol: string): string => {
    const price = data.price.close;
    const rsi = data.indicators.RSI;
    const macd = data.indicators.MACD;
    const trend = data.score_ia.tendencia;
    const probability = data.score_ia.probabilidade;
    
    // Determinar status do RSI
    let rsiStatus = 'neutro';
    if (rsi > 70) rsiStatus = 'sobrecomprado';
    else if (rsi < 30) rsiStatus = 'sobrevendido';
    
    // Determinar direção do MACD
    const macdDirection = macd.macd > macd.signal ? 'positivo' : 'negativo';
    
    // Determinar pressão de compra/venda
    const pressure = data.heatmap_data.buy_pressure > 60 ? 'alta pressão de compra' : 
                    data.heatmap_data.sell_pressure > 60 ? 'alta pressão de venda' : 'pressão equilibrada';
    
    // Gerar texto narrativo
    const narratorText = `📊 ${symbol} em $${price.toLocaleString()} - ` +
      `RSI ${rsi.toFixed(1)} (${rsiStatus}), ` +
      `MACD ${macdDirection}, ` +
      `${pressure}. ` +
      `Tendência ${trend === 'bull' ? '🟢 ALTA' : trend === 'bear' ? '🔴 BAIXA' : '🟡 LATERAL'} ` +
      `com ${probability}% de probabilidade. ` +
      `Fluxo institucional ${data.heatmap_data.institutional_flow}.`;

    return narratorText;
  };

  // Detectar padrão baseado nos dados
  const detectPatternFromData = (data: CursorData) => {
    const { RSI, MACD, EMA_20, SMA_50, Bollinger } = data.indicators;
    const price = data.price.close;
    
    // Lógica de detecção de padrões
    if (RSI > 70 && MACD.macd > MACD.signal) {
      return { pattern: 'Divergência RSI-MACD', type: 'reversal' };
    }
    
    if (price > EMA_20 && EMA_20 > SMA_50 && MACD.histogram > 0) {
      return { pattern: 'Tendência de Alta', type: 'continuation' };
    }
    
    if (price < Bollinger.lower && RSI < 30) {
      return { pattern: 'Bollinger Squeeze', type: 'reversal' };
    }
    
    if (Math.abs(MACD.histogram) < 5 && RSI > 45 && RSI < 55) {
      return { pattern: 'Consolidação', type: 'neutral' };
    }
    
    return { pattern: 'Análise Geral', type: 'analysis' };
  };

  // Buscar feeds recentes do narrador
  const getRecentFeeds = useCallback(async (limit: number = 10): Promise<NarratorFeedData[]> => {
    try {
      const { data, error } = await supabase
        .from('narrator_output')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Erro ao buscar feeds do narrador:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao processar feeds:', error);
      return [];
    }
  }, []);

  return {
    sendToNarratorFeed,
    getRecentFeeds,
    isLoading,
    lastFeedId
  };
};
