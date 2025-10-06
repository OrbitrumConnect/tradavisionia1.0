import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HistoricalData {
  symbol: string;
  timeframe: string;
  candles: CandleData[];
  indicators: TechnicalIndicators;
  patterns: PatternDetection;
  timestamp: string;
}

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TechnicalIndicators {
  ema9: number;
  ema20: number;
  ema50: number;
  ema200: number;
  rsi14: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  atr14: number;
  vwap: number;
  adx: number;
  bollingerUpper: number;
  bollingerMiddle: number;
  bollingerLower: number;
  volumeMA: number;
  volumeZScore: number;
  volumeSpike: boolean;
}

interface PatternDetection {
  orderBlockDetected: boolean;
  orderBlockType: string | null;
  fvgDetected: boolean;
  fvgType: string | null;
  springDetected: boolean;
  upthrustDetected: boolean;
  bosDetected: boolean;
  chochDetected: boolean;
  liquiditySweep: boolean;
  supportLevel: number | null;
  resistanceLevel: number | null;
  patternName: string | null;
}

export const useHistoricalData = (symbol: string, timeframe: string, days: number = 30) => {
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar dados históricos da Binance
  const fetchBinanceHistoricalData = useCallback(async (symbol: string, timeframe: string, days: number) => {
    try {
      const limit = Math.min(days * 24 * 60, 1000); // Máximo 1000 candles
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.map((kline: any[]) => ({
        time: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5])
      }));
    } catch (error) {
      console.error('Erro ao buscar dados históricos:', error);
      throw error;
    }
  }, []);

  // Função para calcular indicadores técnicos
  const calculateTechnicalIndicators = useCallback((candles: CandleData[]): TechnicalIndicators => {
    const closes = candles.map(c => c.close);
    const volumes = candles.map(c => c.volume);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    
    return {
      ema9: calculateEMA(closes, 9),
      ema20: calculateEMA(closes, 20),
      ema50: calculateEMA(closes, 50),
      ema200: calculateEMA(closes, 200),
      rsi14: calculateRSI(closes, 14),
      macd: calculateMACD(closes).macd,
      macdSignal: calculateMACD(closes).signal,
      macdHistogram: calculateMACD(closes).histogram,
      atr14: calculateATR(candles, 14),
      vwap: calculateVWAP(candles),
      adx: calculateADX(candles, 14),
      bollingerUpper: calculateBollingerBands(closes, 20, 2).upper,
      bollingerMiddle: calculateBollingerBands(closes, 20, 2).middle,
      bollingerLower: calculateBollingerBands(closes, 20, 2).lower,
      volumeMA: calculateMA(volumes, 20),
      volumeZScore: calculateZScore(volumes, 20),
      volumeSpike: calculateVolumeSpike(volumes, 20)
    };
  }, []);

  // Função para detectar padrões
  const detectPatterns = useCallback((candles: CandleData[]): PatternDetection => {
    const lastCandle = candles[candles.length - 1];
    const prevCandle = candles[candles.length - 2];
    
    // Detecção simplificada de padrões
    const orderBlockDetected = detectOrderBlock(candles);
    const fvgDetected = detectFVG(candles);
    const springDetected = detectSpring(candles);
    const upthrustDetected = detectUpthrust(candles);
    const bosDetected = detectBOS(candles);
    const chochDetected = detectChoCh(candles);
    const liquiditySweep = detectLiquiditySweep(candles);
    const { support, resistance } = findSupportResistance(candles);
    
    // Determinar nome do padrão
    let patternName: string | null = null;
    if (springDetected) patternName = 'Wyckoff Spring';
    else if (upthrustDetected) patternName = 'Wyckoff Upthrust';
    else if (orderBlockDetected.detected) patternName = `${orderBlockDetected.type} Order Block`;
    else if (fvgDetected.detected) patternName = `${fvgDetected.type} FVG`;
    else if (bosDetected) patternName = 'Break of Structure';
    else if (chochDetected) patternName = 'Change of Character';
    else if (liquiditySweep) patternName = 'Liquidity Sweep';
    
    return {
      orderBlockDetected: orderBlockDetected.detected,
      orderBlockType: orderBlockDetected.type,
      fvgDetected: fvgDetected.detected,
      fvgType: fvgDetected.type,
      springDetected,
      upthrustDetected,
      bosDetected,
      chochDetected,
      liquiditySweep,
      supportLevel: support,
      resistanceLevel: resistance,
      patternName
    };
  }, []);

  // Função principal para carregar dados históricos
  const loadHistoricalData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Carregando dados históricos para ${symbol} - ${timeframe} - ${days} dias`);
      
      // 1. Buscar dados da Binance
      const candles = await fetchBinanceHistoricalData(symbol, timeframe, days);
      console.log(`📊 Coletados ${candles.length} candles`);
      
      // 2. Processar dados em chunks para evitar sobrecarga
      const chunkSize = 50;
      const processedData: HistoricalData[] = [];
      
      for (let i = chunkSize; i < candles.length; i += chunkSize) {
        const chunkCandles = candles.slice(0, i + 1);
        const currentCandle = candles[i];
        
        // Calcular indicadores
        const indicators = calculateTechnicalIndicators(chunkCandles);
        
        // Detectar padrões
        const patterns = detectPatterns(chunkCandles);
        
        processedData.push({
          symbol,
          timeframe,
          candles: chunkCandles,
          indicators,
          patterns,
          timestamp: new Date(currentCandle.time).toISOString()
        });
      }
      
      setHistoricalData(processedData);
      console.log(`✅ Processados ${processedData.length} pontos de dados históricos`);
      
      // 3. Salvar no banco de dados
      await saveHistoricalDataToDatabase(processedData);
      
    } catch (error) {
      console.error('Erro ao carregar dados históricos:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe, days, fetchBinanceHistoricalData, calculateTechnicalIndicators, detectPatterns]);

  // Função para salvar dados no banco
  const saveHistoricalDataToDatabase = useCallback(async (data: HistoricalData[]) => {
    try {
      const records = data.map(d => ({
        symbol: d.symbol,
        timeframe: d.timeframe,
        timestamp: d.timestamp,
        open: d.candles[d.candles.length - 1].open,
        high: d.candles[d.candles.length - 1].high,
        low: d.candles[d.candles.length - 1].low,
        close: d.candles[d.candles.length - 1].close,
        volume: d.candles[d.candles.length - 1].volume,
        ema_9: d.indicators.ema9,
        ema_20: d.indicators.ema20,
        ema_50: d.indicators.ema50,
        ema_200: d.indicators.ema200,
        rsi_14: d.indicators.rsi14,
        macd: d.indicators.macd,
        macd_signal: d.indicators.macdSignal,
        macd_histogram: d.indicators.macdHistogram,
        atr_14: d.indicators.atr14,
        vwap: d.indicators.vwap,
        adx: d.indicators.adx,
        bollinger_upper: d.indicators.bollingerUpper,
        bollinger_middle: d.indicators.bollingerMiddle,
        bollinger_lower: d.indicators.bollingerLower,
        volume_ma: d.indicators.volumeMA,
        volume_z_score: d.indicators.volumeZScore,
        volume_spike: d.indicators.volumeSpike,
        order_block_detected: d.patterns.orderBlockDetected,
        order_block_type: d.patterns.orderBlockType,
        fvg_detected: d.patterns.fvgDetected,
        fvg_type: d.patterns.fvgType,
        spring_detected: d.patterns.springDetected,
        upthrust_detected: d.patterns.upthrustDetected,
        bos_detected: d.patterns.bosDetected,
        choch_detected: d.patterns.chochDetected,
        liquidity_sweep: d.patterns.liquiditySweep,
        support_level: d.patterns.supportLevel,
        resistance_level: d.patterns.resistanceLevel,
        pattern_name: d.patterns.patternName
      }));
      
      const { error } = await supabase
        .from('market_features')
        .upsert(records, { onConflict: 'symbol,timeframe,timestamp' });
      
      if (error) {
        console.error('Erro ao salvar dados históricos:', error);
      } else {
        console.log(`💾 Salvos ${records.length} registros no banco de dados`);
      }
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
    }
  }, []);

  // Carregar dados automaticamente
  useEffect(() => {
    if (symbol && timeframe && days > 0) {
      loadHistoricalData();
    }
  }, [symbol, timeframe, days, loadHistoricalData]);

  return {
    historicalData,
    loading,
    error,
    loadHistoricalData,
    saveHistoricalDataToDatabase
  };
};

// Funções auxiliares para cálculos
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
  }
  
  return ema;
}

function calculateRSI(prices: number[], period: number): number {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateMACD(prices: number[]) {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;
  const signal = calculateEMA([macd], 9);
  const histogram = macd - signal;
  
  return { macd, signal, histogram };
}

function calculateATR(candles: CandleData[], period: number): number {
  if (candles.length < period + 1) return 0;
  
  let trSum = 0;
  for (let i = 1; i <= period; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    
    trSum += tr;
  }
  
  return trSum / period;
}

function calculateVWAP(candles: CandleData[]): number {
  let totalVolume = 0;
  let totalVolumePrice = 0;
  
  for (const candle of candles) {
    const volumePrice = (candle.high + candle.low + candle.close) / 3;
    totalVolumePrice += volumePrice * candle.volume;
    totalVolume += candle.volume;
  }
  
  return totalVolume > 0 ? totalVolumePrice / totalVolume : 0;
}

function calculateADX(candles: CandleData[], period: number): number {
  // Implementação simplificada do ADX
  if (candles.length < period + 1) return 25;
  
  let plusDM = 0;
  let minusDM = 0;
  
  for (let i = 1; i <= period; i++) {
    const highDiff = candles[i].high - candles[i - 1].high;
    const lowDiff = candles[i - 1].low - candles[i].low;
    
    if (highDiff > lowDiff && highDiff > 0) plusDM += highDiff;
    if (lowDiff > highDiff && lowDiff > 0) minusDM += lowDiff;
  }
  
  const avgPlusDM = plusDM / period;
  const avgMinusDM = minusDM / period;
  
  const plusDI = (avgPlusDM / calculateATR(candles, period)) * 100;
  const minusDI = (avgMinusDM / calculateATR(candles, period)) * 100;
  
  const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
  return dx;
}

function calculateBollingerBands(prices: number[], period: number, stdDev: number) {
  if (prices.length < period) {
    const price = prices[prices.length - 1];
    return { upper: price, middle: price, lower: price };
  }
  
  const slice = prices.slice(-period);
  const mean = slice.reduce((sum, price) => sum + price, 0) / period;
  
  const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
  const std = Math.sqrt(variance);
  
  return {
    upper: mean + (std * stdDev),
    middle: mean,
    lower: mean - (std * stdDev)
  };
}

function calculateMA(values: number[], period: number): number {
  if (values.length < period) return values[values.length - 1];
  return values.slice(-period).reduce((sum, val) => sum + val, 0) / period;
}

function calculateZScore(values: number[], period: number): number {
  if (values.length < period) return 0;
  
  const slice = values.slice(-period);
  const mean = slice.reduce((sum, val) => sum + val, 0) / period;
  const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
  const std = Math.sqrt(variance);
  
  const currentValue = values[values.length - 1];
  return std > 0 ? (currentValue - mean) / std : 0;
}

function calculateVolumeSpike(volumes: number[], period: number): boolean {
  if (volumes.length < period) return false;
  
  const currentVolume = volumes[volumes.length - 1];
  const avgVolume = calculateMA(volumes, period);
  
  return currentVolume > avgVolume * 2; // 2x a média
}

// Funções de detecção de padrões (simplificadas)
function detectOrderBlock(candles: CandleData[]) {
  // Implementação simplificada
  return { detected: false, type: null };
}

function detectFVG(candles: CandleData[]) {
  // Implementação simplificada
  return { detected: false, type: null };
}

function detectSpring(candles: CandleData[]) {
  // Implementação simplificada
  return false;
}

function detectUpthrust(candles: CandleData[]) {
  // Implementação simplificada
  return false;
}

function detectBOS(candles: CandleData[]) {
  // Implementação simplificada
  return false;
}

function detectChoCh(candles: CandleData[]) {
  // Implementação simplificada
  return false;
}

function detectLiquiditySweep(candles: CandleData[]) {
  // Implementação simplificada
  return false;
}

function findSupportResistance(candles: CandleData[]) {
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  
  return {
    support: Math.min(...lows.slice(-20)),
    resistance: Math.max(...highs.slice(-20))
  };
}
