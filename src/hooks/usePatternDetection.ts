import { useMemo } from 'react';
import { Candle } from './useTechnicalIndicators';

export interface PatternDetection {
  // Order Blocks
  orderBlockDetected: boolean;
  orderBlockType: 'bullish' | 'bearish' | null;
  orderBlockPrice: number | null;
  
  // Fair Value Gaps
  fvgDetected: boolean;
  fvgType: 'bullish' | 'bearish' | null;
  fvgUpper: number | null;
  fvgLower: number | null;
  
  // Wyckoff Patterns
  springDetected: boolean;
  upthrustDetected: boolean;
  
  // Market Structure
  bosDetected: boolean; // Break of Structure
  chochDetected: boolean; // Change of Character
  liquiditySweep: boolean;
  
  // Support/Resistance
  supportLevel: number | null;
  resistanceLevel: number | null;
  
  // Pattern Name
  patternName: string | null;
}

export const usePatternDetection = (candles: Candle[]) => {
  return useMemo(() => {
    if (candles.length < 50) return null;
    
    return detectPatterns(candles);
  }, [candles]);
};

// Detectar Order Blocks (último candle de momentum antes de reverter)
function detectOrderBlock(candles: Candle[]): {
  detected: boolean;
  type: 'bullish' | 'bearish' | null;
  price: number | null;
} {
  if (candles.length < 10) return { detected: false, type: null, price: null };
  
  const recent = candles.slice(-10);
  const last = recent[recent.length - 1];
  const prev = recent[recent.length - 2];
  
  // Bullish OB: candle de alta volume seguido de reversão
  const bullishOB = 
    prev.close > prev.open && // Candle verde
    (prev.high - prev.low) > (last.high - last.low) * 1.5 && // Alto range
    prev.volume > last.volume * 1.2 && // Alto volume
    last.close < prev.low; // Reversão
  
  if (bullishOB) {
    return {
      detected: true,
      type: 'bullish',
      price: prev.low
    };
  }
  
  // Bearish OB: candle de baixa volume seguido de reversão
  const bearishOB =
    prev.close < prev.open &&
    (prev.high - prev.low) > (last.high - last.low) * 1.5 &&
    prev.volume > last.volume * 1.2 &&
    last.close > prev.high;
  
  if (bearishOB) {
    return {
      detected: true,
      type: 'bearish',
      price: prev.high
    };
  }
  
  return { detected: false, type: null, price: null };
}

// Detectar Fair Value Gaps (gaps entre candles)
function detectFVG(candles: Candle[]): {
  detected: boolean;
  type: 'bullish' | 'bearish' | null;
  upper: number | null;
  lower: number | null;
} {
  if (candles.length < 3) return { detected: false, type: null, upper: null, lower: null };
  
  const recent = candles.slice(-3);
  const [c1, c2, c3] = recent;
  
  // Bullish FVG: gap entre low de c3 e high de c1
  const bullishGap = c3.low > c1.high;
  if (bullishGap) {
    return {
      detected: true,
      type: 'bullish',
      upper: c3.low,
      lower: c1.high
    };
  }
  
  // Bearish FVG: gap entre high de c3 e low de c1
  const bearishGap = c3.high < c1.low;
  if (bearishGap) {
    return {
      detected: true,
      type: 'bearish',
      upper: c1.low,
      lower: c3.high
    };
  }
  
  return { detected: false, type: null, upper: null, lower: null };
}

// Detectar Spring (Wyckoff - sweep de liquidez + reversão)
function detectSpring(candles: Candle[]): boolean {
  if (candles.length < 20) return false;
  
  const recent = candles.slice(-20);
  
  // Encontrar suporte recente
  const lows = recent.map(c => c.low);
  const support = Math.min(...lows.slice(0, -5)); // Suporte dos primeiros 15
  
  const last5 = recent.slice(-5);
  const sweep = last5.some(c => c.low < support * 0.998); // Sweep abaixo
  
  if (!sweep) return false;
  
  // Verificar reversão forte
  const lastCandle = recent[recent.length - 1];
  const recoveryAboveSupport = lastCandle.close > support;
  const highVolume = lastCandle.volume > recent.slice(-10, -1).reduce((sum, c) => sum + c.volume, 0) / 9;
  
  return recoveryAboveSupport && highVolume;
}

// Detectar Upthrust (inverso do Spring)
function detectUpthrust(candles: Candle[]): boolean {
  if (candles.length < 20) return false;
  
  const recent = candles.slice(-20);
  
  const highs = recent.map(c => c.high);
  const resistance = Math.max(...highs.slice(0, -5));
  
  const last5 = recent.slice(-5);
  const sweep = last5.some(c => c.high > resistance * 1.002);
  
  if (!sweep) return false;
  
  const lastCandle = recent[recent.length - 1];
  const rejectionBelowResistance = lastCandle.close < resistance;
  const highVolume = lastCandle.volume > recent.slice(-10, -1).reduce((sum, c) => sum + c.volume, 0) / 9;
  
  return rejectionBelowResistance && highVolume;
}

// Detectar Break of Structure (quebra de estrutura de mercado)
function detectBOS(candles: Candle[]): boolean {
  if (candles.length < 30) return false;
  
  const recent = candles.slice(-30);
  const highs = recent.map(c => c.high);
  const lows = recent.map(c => c.low);
  
  // Encontrar último high/low significativo
  const recentHigh = Math.max(...highs.slice(-10, -3));
  const recentLow = Math.min(...lows.slice(-10, -3));
  
  const currentPrice = recent[recent.length - 1].close;
  
  // Bullish BOS: quebra de high anterior
  const bullishBOS = currentPrice > recentHigh * 1.01;
  
  // Bearish BOS: quebra de low anterior  
  const bearishBOS = currentPrice < recentLow * 0.99;
  
  return bullishBOS || bearishBOS;
}

// Detectar Change of Character (mudança de comportamento)
function detectChoCh(candles: Candle[]): boolean {
  if (candles.length < 20) return false;
  
  const recent = candles.slice(-20);
  const first10 = recent.slice(0, 10);
  const last10 = recent.slice(-10);
  
  // Calcular momentum das duas metades
  const firstMomentum = (first10[9].close - first10[0].close) / first10[0].close;
  const lastMomentum = (last10[9].close - last10[0].close) / last10[0].close;
  
  // ChoCh: reversão de momentum
  const momentumReversed = (firstMomentum > 0.01 && lastMomentum < -0.01) ||
                           (firstMomentum < -0.01 && lastMomentum > 0.01);
  
  return momentumReversed;
}

// Detectar Liquidity Sweep
function detectLiquiditySweep(candles: Candle[]): boolean {
  if (candles.length < 15) return false;
  
  const recent = candles.slice(-15);
  const lows = recent.map(c => c.low);
  const highs = recent.map(c => c.high);
  
  const recentLow = Math.min(...lows.slice(0, -3));
  const recentHigh = Math.max(...highs.slice(0, -3));
  
  const last3 = recent.slice(-3);
  
  // Sweep de lows seguido de reversão
  const lowSweep = last3.some(c => c.low < recentLow * 0.998) &&
                   last3[2].close > recentLow * 1.001;
  
  // Sweep de highs seguido de reversão
  const highSweep = last3.some(c => c.high > recentHigh * 1.002) &&
                    last3[2].close < recentHigh * 0.999;
  
  return lowSweep || highSweep;
}

// Calcular suporte/resistência
function findSupportResistance(candles: Candle[]): {
  support: number | null;
  resistance: number | null;
} {
  if (candles.length < 50) return { support: null, resistance: null };
  
  const recent = candles.slice(-50);
  const lows = recent.map(c => c.low);
  const highs = recent.map(c => c.high);
  
  // Support: média dos 3 menores lows
  const sortedLows = [...lows].sort((a, b) => a - b);
  const support = sortedLows.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  
  // Resistance: média dos 3 maiores highs
  const sortedHighs = [...highs].sort((a, b) => b - a);
  const resistance = sortedHighs.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  
  return { support, resistance };
}

// Função principal de detecção de padrões
function detectPatterns(candles: Candle[]): PatternDetection {
  const ob = detectOrderBlock(candles);
  const fvg = detectFVG(candles);
  const spring = detectSpring(candles);
  const upthrust = detectUpthrust(candles);
  const bos = detectBOS(candles);
  const choch = detectChoCh(candles);
  const liquiditySweep = detectLiquiditySweep(candles);
  const { support, resistance } = findSupportResistance(candles);
  
  // Determinar nome do padrão mais relevante
  let patternName: string | null = null;
  if (spring) patternName = 'Wyckoff Spring';
  else if (upthrust) patternName = 'Wyckoff Upthrust';
  else if (ob.detected && fvg.detected) patternName = `${ob.type === 'bullish' ? 'Bullish' : 'Bearish'} OB + FVG`;
  else if (ob.detected) patternName = `${ob.type === 'bullish' ? 'Bullish' : 'Bearish'} Order Block`;
  else if (fvg.detected) patternName = `${fvg.type === 'bullish' ? 'Bullish' : 'Bearish'} FVG`;
  else if (bos) patternName = 'Break of Structure';
  else if (choch) patternName = 'Change of Character';
  else if (liquiditySweep) patternName = 'Liquidity Sweep';
  
  return {
    orderBlockDetected: ob.detected,
    orderBlockType: ob.type,
    orderBlockPrice: ob.price,
    fvgDetected: fvg.detected,
    fvgType: fvg.type,
    fvgUpper: fvg.upper,
    fvgLower: fvg.lower,
    springDetected: spring,
    upthrustDetected: upthrust,
    bosDetected: bos,
    chochDetected: choch,
    liquiditySweep,
    supportLevel: support,
    resistanceLevel: resistance,
    patternName
  };
}
