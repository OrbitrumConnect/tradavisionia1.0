import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Candle, TechnicalIndicators } from './useTechnicalIndicators';
import { PatternDetection } from './usePatternDetection';

interface SaveFeaturesParams {
  symbol: string;
  timeframe: string;
  candle: Candle;
  indicators: TechnicalIndicators;
  patterns: PatternDetection;
}

export const useFeatureStore = () => {
  const saveFeatures = useCallback(async ({
    symbol,
    timeframe,
    candle,
    indicators,
    patterns
  }: SaveFeaturesParams) => {
    try {
      // Calcular score de confiança baseado em múltiplos fatores
      const confidenceScore = calculateConfidenceScore(indicators, patterns);
      
      // Determinar tipo de sinal
      const signalType = determineSignalType(indicators, patterns);
      
      const { error } = await supabase
        .from('market_features')
        .insert({
          symbol,
          timeframe,
          timestamp: new Date(candle.timestamp).toISOString(),
          
          // OHLCV
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
          
          // Indicadores
          ema_9: indicators.ema9,
          ema_20: indicators.ema20,
          ema_50: indicators.ema50,
          ema_200: indicators.ema200,
          rsi_14: indicators.rsi14,
          macd: indicators.macd,
          macd_signal: indicators.macdSignal,
          macd_histogram: indicators.macdHistogram,
          atr_14: indicators.atr14,
          vwap: indicators.vwap,
          adx: indicators.adx,
          bollinger_upper: indicators.bollingerUpper,
          bollinger_middle: indicators.bollingerMiddle,
          bollinger_lower: indicators.bollingerLower,
          
          // Volume
          volume_ma: indicators.volumeMA,
          volume_z_score: indicators.volumeZScore,
          volume_spike: indicators.volumeSpike,
          
          // Padrões
          order_block_detected: patterns.orderBlockDetected,
          order_block_type: patterns.orderBlockType,
          fvg_detected: patterns.fvgDetected,
          fvg_type: patterns.fvgType,
          spring_detected: patterns.springDetected,
          upthrust_detected: patterns.upthrustDetected,
          bos_detected: patterns.bosDetected,
          choch_detected: patterns.chochDetected,
          liquidity_sweep: patterns.liquiditySweep,
          
          // Suporte/Resistência
          support_level: patterns.supportLevel,
          resistance_level: patterns.resistanceLevel,
          distance_to_support: patterns.supportLevel ? 
            ((candle.close - patterns.supportLevel) / patterns.supportLevel) * 100 : null,
          distance_to_resistance: patterns.resistanceLevel ?
            ((patterns.resistanceLevel - candle.close) / candle.close) * 100 : null,
          
          // Sinal
          pattern_name: patterns.patternName,
          signal_type: signalType,
          confidence_score: confidenceScore,
          
          metadata: {
            detectedAt: new Date().toISOString(),
            version: '1.0'
          }
        });

      if (error) {
        console.error('❌ Erro ao salvar features:', error);
        return false;
      }

      console.log('✅ Features salvas:', {
        symbol,
        timeframe,
        patterns: patterns.patternName,
        signal: signalType,
        confidence: confidenceScore
      });

      return true;
    } catch (err) {
      console.error('❌ Erro ao salvar features:', err);
      return false;
    }
  }, []);

  return { saveFeatures };
};

// Calcular score de confiança (0-100)
function calculateConfidenceScore(
  indicators: TechnicalIndicators,
  patterns: PatternDetection
): number {
  let score = 50; // Base
  
  // Padrões Wyckoff (+20 cada)
  if (patterns.springDetected) score += 20;
  if (patterns.upthrustDetected) score += 20;
  
  // Order Block + FVG combo (+15)
  if (patterns.orderBlockDetected && patterns.fvgDetected) {
    score += 15;
  } else if (patterns.orderBlockDetected || patterns.fvgDetected) {
    score += 8;
  }
  
  // Market structure (+10)
  if (patterns.bosDetected) score += 10;
  if (patterns.chochDetected) score += 8;
  if (patterns.liquiditySweep) score += 12;
  
  // 🆕 Padrões Geométricos Avançados (Price Action Matemática)
  if (patterns.triangleDetected) {
    score += 18; // Triângulos têm alta confiabilidade (70-80%)
    // Bonus por convergência próxima (mais confiável)
    if (patterns.triangleConvergence && patterns.triangleConvergence < 10) {
      score += 7; // Próximo da convergência = maior tensão
    }
  }
  
  if (patterns.bandeiraDetected) {
    score += 22; // Bandeiras são excelentes (80-85% accuracy)
  }
  
  if (patterns.cunhaDetected) {
    score += 16; // Cunhas são boas (70-75%)
    // Bonus por convergência próxima
    if (patterns.cunhaConvergence && patterns.cunhaConvergence < 8) {
      score += 6;
    }
  }
  
  if (patterns.elliottDetected) {
    // Elliott varia por fase
    if (patterns.elliottPhase === 'impulsive') {
      score += 15; // Fase impulsiva (ondas 1-5)
      if (patterns.elliottWave === 3) {
        score += 10; // Onda 3 é a mais forte!
      }
    } else {
      score += 8; // Fase corretiva (ABC)
    }
  }
  
  // 🕯️ Padrões de Vela (Candlestick Patterns)
  if (patterns.candlePatternDetected) {
    if (patterns.candlePatternStrength === 'strong') {
      score += 14; // Hammer, Engulfing, Morning/Evening Star
    } else if (patterns.candlePatternStrength === 'moderate') {
      score += 8; // Doji, Pin Bar
    } else {
      score += 4; // Inside Bar
    }
  }
  
  // Indicadores técnicos alinhados
  const emaAligned = 
    (indicators.ema9 > indicators.ema20 && 
     indicators.ema20 > indicators.ema50 && 
     indicators.ema50 > indicators.ema200) || // Bullish
    (indicators.ema9 < indicators.ema20 && 
     indicators.ema20 < indicators.ema50 && 
     indicators.ema50 < indicators.ema200); // Bearish
  
  if (emaAligned) score += 10;
  
  // MACD alinhado
  if (Math.abs(indicators.macdHistogram) > 0.5) score += 5;
  
  // ADX forte (tendência)
  if (indicators.adx > 25) score += 8;
  
  // Volume spike
  if (indicators.volumeSpike) score += 7;
  
  // RSI em zona de reversão
  if (indicators.rsi14 < 30 || indicators.rsi14 > 70) score += 5;
  
  return Math.min(100, Math.max(0, score));
}

// Determinar tipo de sinal
function determineSignalType(
  indicators: TechnicalIndicators,
  patterns: PatternDetection
): 'BUY' | 'SELL' | 'NEUTRAL' {
  let bullishPoints = 0;
  let bearishPoints = 0;
  
  // Padrões institucionais
  if (patterns.springDetected) bullishPoints += 3;
  if (patterns.upthrustDetected) bearishPoints += 3;
  if (patterns.orderBlockType === 'bullish') bullishPoints += 2;
  if (patterns.orderBlockType === 'bearish') bearishPoints += 2;
  if (patterns.fvgType === 'bullish') bullishPoints += 2;
  if (patterns.fvgType === 'bearish') bearishPoints += 2;
  
  // 🆕 Padrões geométricos
  if (patterns.triangleType === 'ascending') bullishPoints += 2;
  if (patterns.triangleType === 'descending') bearishPoints += 2;
  if (patterns.bandeiraType === 'bullish') bullishPoints += 3;
  if (patterns.bandeiraType === 'bearish') bearishPoints += 3;
  if (patterns.cunhaType === 'rising') bearishPoints += 2; // Cunha ascendente rompe para BAIXO
  if (patterns.cunhaType === 'falling') bullishPoints += 2; // Cunha descendente rompe para CIMA
  if (patterns.elliottPhase === 'impulsive' && patterns.elliottWave && patterns.elliottWave <= 5) bullishPoints += 2;
  
  // 🕯️ Padrões de vela
  if (patterns.candlePatternDirection === 'bullish') bullishPoints += patterns.candlePatternStrength === 'strong' ? 2 : 1;
  if (patterns.candlePatternDirection === 'bearish') bearishPoints += patterns.candlePatternStrength === 'strong' ? 2 : 1;
  
  // EMAs (tendência)
  if (indicators.ema9 > indicators.ema20 && indicators.ema20 > indicators.ema50) {
    bullishPoints += 2;
  }
  if (indicators.ema9 < indicators.ema20 && indicators.ema20 < indicators.ema50) {
    bearishPoints += 2;
  }
  
  // MACD
  if (indicators.macdHistogram > 0) bullishPoints += 1;
  else if (indicators.macdHistogram < 0) bearishPoints += 1;
  
  // RSI
  if (indicators.rsi14 < 30) bullishPoints += 2;
  else if (indicators.rsi14 > 70) bearishPoints += 2;
  
  // BOS
  if (patterns.bosDetected) {
    // Detectar direção do BOS pela relação com suporte/resistência
    if (patterns.supportLevel && patterns.resistanceLevel) {
      const currentIsAboveResistance = indicators.ema9 > patterns.resistanceLevel;
      const currentIsBelowSupport = indicators.ema9 < patterns.supportLevel;
      
      if (currentIsAboveResistance) bullishPoints += 2;
      if (currentIsBelowSupport) bearishPoints += 2;
    }
  }
  
  const diff = bullishPoints - bearishPoints;
  const totalPoints = bullishPoints + bearishPoints;
  
  // ✅ LÓGICA INTELIGENTE: NEUTRAL apenas se REALMENTE não houver tendência
  
  // Se a diferença é MUITO pequena E há poucos sinais = Mercado lateral
  if (Math.abs(diff) <= 1 && totalPoints < 5) {
    // Verificar se é consolidação real (Inside Bar, Doji, etc)
    const isConsolidation = 
      patterns.candlePatternType === 'Inside Bar' ||
      patterns.candlePatternType === 'Doji' ||
      (Math.abs(indicators.macdHistogram) < 0.1 && indicators.rsi14 > 45 && indicators.rsi14 < 55);
    
    if (isConsolidation) {
      return 'NEUTRAL'; // OK retornar NEUTRAL aqui (consolidação real)
    }
  }
  
  // Se há MOVIMENTO/TENDÊNCIA clara, NUNCA retorna NEUTRAL!
  if (diff > 0) return 'BUY';
  if (diff < 0) return 'SELL';
  
  // Empate exato mas com sinais (não é lateral) → usa RSI como desempate
  if (indicators.rsi14 > 50) return 'BUY';
  return 'SELL';
}
