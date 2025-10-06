import { useMemo } from 'react';

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

export interface TechnicalIndicators {
  // EMAs
  ema9: number;
  ema20: number;
  ema50: number;
  ema200: number;
  
  // MACD
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  
  // Others
  rsi14: number;
  atr14: number;
  vwap: number;
  adx: number;
  
  // Bollinger Bands
  bollingerUpper: number;
  bollingerMiddle: number;
  bollingerLower: number;
  
  // Volume
  volumeMA: number;
  volumeZScore: number;
  volumeSpike: boolean;
}

export const useTechnicalIndicators = (candles: Candle[]) => {
  return useMemo(() => {
    if (candles.length < 200) return null; // Precisa de dados suficientes
    
    return calculateIndicators(candles);
  }, [candles]);
};

// Cálculo de EMA
function calculateEMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1];
  
  const multiplier = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

// Cálculo de RSI
function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length <= period) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += -diff;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Cálculo de ATR
function calculateATR(candles: Candle[], period: number = 14): number {
  if (candles.length <= period) return 0;
  
  const trueRanges = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }
  
  return trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
}

// Cálculo de VWAP
function calculateVWAP(candles: Candle[]): number {
  let sumPV = 0;
  let sumV = 0;
  
  for (const candle of candles) {
    const typical = (candle.high + candle.low + candle.close) / 3;
    sumPV += typical * candle.volume;
    sumV += candle.volume;
  }
  
  return sumV > 0 ? sumPV / sumV : candles[candles.length - 1].close;
}

// Cálculo de MACD
function calculateMACD(closes: number[]) {
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macd = ema12 - ema26;
  
  // Signal line (EMA 9 do MACD)
  const macdHistory = []; // Simplificado para último valor
  for (let i = Math.max(0, closes.length - 26); i < closes.length; i++) {
    const e12 = calculateEMA(closes.slice(0, i + 1), 12);
    const e26 = calculateEMA(closes.slice(0, i + 1), 26);
    macdHistory.push(e12 - e26);
  }
  
  const signal = calculateEMA(macdHistory, 9);
  
  return {
    macd,
    signal,
    histogram: macd - signal
  };
}

// Cálculo de ADX
function calculateADX(candles: Candle[], period: number = 14): number {
  if (candles.length < period + 1) return 0;
  
  let plusDM = 0, minusDM = 0;
  
  for (let i = 1; i < candles.length; i++) {
    const upMove = candles[i].high - candles[i - 1].high;
    const downMove = candles[i - 1].low - candles[i].low;
    
    if (upMove > downMove && upMove > 0) plusDM += upMove;
    if (downMove > upMove && downMove > 0) minusDM += downMove;
  }
  
  const atr = calculateATR(candles, period);
  if (atr === 0) return 0;
  
  const plusDI = (plusDM / candles.length) / atr * 100;
  const minusDI = (minusDM / candles.length) / atr * 100;
  
  const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
  return dx || 0;
}

// Bollinger Bands
function calculateBollingerBands(closes: number[], period: number = 20, stdDev: number = 2) {
  const sma = closes.slice(-period).reduce((a, b) => a + b, 0) / period;
  
  const squaredDiffs = closes.slice(-period).map(c => Math.pow(c - sma, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(variance);
  
  return {
    upper: sma + (std * stdDev),
    middle: sma,
    lower: sma - (std * stdDev)
  };
}

// Função principal que calcula todos os indicadores
function calculateIndicators(candles: Candle[]): TechnicalIndicators {
  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);
  
  const ema9 = calculateEMA(closes, 9);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);
  
  const { macd, signal, histogram } = calculateMACD(closes);
  
  const rsi14 = calculateRSI(closes, 14);
  const atr14 = calculateATR(candles, 14);
  const vwap = calculateVWAP(candles);
  const adx = calculateADX(candles, 14);
  
  const bollinger = calculateBollingerBands(closes);
  
  // Volume analysis
  const volumeMA = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const volumeMean = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const volumeVariance = volumes.reduce((sum, v) => sum + Math.pow(v - volumeMean, 2), 0) / volumes.length;
  const volumeStd = Math.sqrt(volumeVariance);
  const volumeZScore = volumeStd > 0 ? (volumes[volumes.length - 1] - volumeMean) / volumeStd : 0;
  const volumeSpike = volumeZScore > 2;
  
  return {
    ema9,
    ema20,
    ema50,
    ema200,
    macd,
    macdSignal: signal,
    macdHistogram: histogram,
    rsi14,
    atr14,
    vwap,
    adx,
    bollingerUpper: bollinger.upper,
    bollingerMiddle: bollinger.middle,
    bollingerLower: bollinger.lower,
    volumeMA,
    volumeZScore,
    volumeSpike
  };
}
