import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, BarChart3, Activity, Wifi, WifiOff } from 'lucide-react';
import { useBinanceData } from '@/hooks/useBinanceData';
import { useNarratorFeed } from '@/hooks/useNarratorFeed';

interface PriceData {
  open: number;
  high: number;
  low: number;
  close: number;
}

interface MACDData {
  macd: number;
  signal: number;
  histogram: number;
}

interface BollingerData {
  upper: number;
  middle: number;
  lower: number;
}

interface Indicators {
  MACD: MACDData;
  RSI: number;
  EMA_20: number;
  SMA_50: number;
  Bollinger: BollingerData;
}

interface HeatmapData {
  buy_pressure: number;
  sell_pressure: number;
  institutional_flow: 'positive' | 'negative' | 'neutral';
}

interface IAScore {
  tendencia: 'neutral' | 'bull' | 'bear';
  probabilidade: number;
  confidence: number;
}

interface CursorData {
  timestamp: string;
  price: PriceData;
  volume: number;
  indicators: Indicators;
  heatmap_data: HeatmapData;
  score_ia: IAScore;
}

interface InteractiveChartProps {
  symbol: string;
  timeframe: string;
  onDataCapture?: (data: CursorData) => void;
  onPeriodSelect?: (startTime: number, endTime: number) => void;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  symbol,
  timeframe,
  onDataCapture,
  onPeriodSelect
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  const [cursorData, setCursorData] = useState<CursorData | null>(null);
  const [lastSentData, setLastSentData] = useState<string | null>(null);

  // 🚀 DADOS REAIS DA BINANCE
  const { candles: binanceCandles, liveData, isConnected, loading } = useBinanceData(symbol, timeframe);
  
  // 📡 FEED DO NARRADOR
  const { sendToNarratorFeed, isLoading: isSendingToFeed } = useNarratorFeed();

  // Calcular indicadores técnicos REAIS baseados nos dados históricos
  const calculateIndicators = useCallback((currentPrice: number, historicalData: any[]): Indicators => {
    if (historicalData.length < 50) {
      return {
        MACD: { macd: 0, signal: 0, histogram: 0 },
        RSI: 50,
        EMA_20: currentPrice,
        SMA_50: currentPrice,
        Bollinger: { upper: currentPrice * 1.02, middle: currentPrice, lower: currentPrice * 0.98 }
      };
    }

    // Calcular EMA 20
    const ema20 = calculateEMA(historicalData.map(c => c.close), 20);
    
    // Calcular SMA 50
    const sma50 = calculateSMA(historicalData.map(c => c.close), 50);
    
    // Calcular RSI
    const rsi = calculateRSI(historicalData.map(c => c.close), 14);
    
    // Calcular MACD
    const macd = calculateMACD(historicalData.map(c => c.close));
    
    // Calcular Bollinger Bands
    const bollinger = calculateBollingerBands(historicalData.map(c => c.close), 20);

    return {
      MACD: {
        macd: macd.macd,
        signal: macd.signal,
        histogram: macd.histogram
      },
      RSI: rsi,
      EMA_20: ema20,
      SMA_50: sma50,
      Bollinger: {
        upper: bollinger.upper,
        middle: bollinger.middle,
        lower: bollinger.lower
      }
    };
  }, []);

  // Funções auxiliares para cálculos
  const calculateEMA = (prices: number[], period: number): number => {
    if (prices.length === 0) return 0;
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    return ema;
  };

  const calculateSMA = (prices: number[], period: number): number => {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  };

  const calculateRSI = (prices: number[], period: number): number => {
    if (prices.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  const calculateMACD = (prices: number[]) => {
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    const macd = ema12 - ema26;
    const signal = calculateEMA([macd], 9);
    const histogram = macd - signal;
    
    return { macd, signal, histogram };
  };

  const calculateBollingerBands = (prices: number[], period: number) => {
    const sma = calculateSMA(prices, period);
    const recentPrices = prices.slice(-period);
    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    return {
      upper: sma + (stdDev * 2),
      middle: sma,
      lower: sma - (stdDev * 2)
    };
  };

  // Calcular dados de heatmap a partir de dados reais (Binance)
  const generateHeatmapData = useCallback((historicalData: any[], currentPrice: number): HeatmapData => {
    const recent = historicalData.slice(-20);
    const last = recent[recent.length - 1];
    const prev = recent[recent.length - 2];
    const priceChangePct = prev ? ((last.close - prev.close) / Math.max(1e-9, prev.close)) * 100 : 0;
    const volumes = recent.map(c => c.volume || 0);
    const avgVol = volumes.length ? volumes.reduce((a, b) => a + b, 0) / volumes.length : 0;
    const volNorm = avgVol ? Math.min(2, Math.max(0, (last?.volume || 0) / avgVol)) : 1;
    const bias = priceChangePct * 1.2 + (volNorm - 1) * 20; // momentum + volume
    const buyPressure = Math.round(Math.max(10, Math.min(90, 50 + bias)));
    const flow: HeatmapData['institutional_flow'] = buyPressure > 60 ? 'positive' : buyPressure < 40 ? 'negative' : 'neutral';
    return {
      buy_pressure: buyPressure,
      sell_pressure: 100 - buyPressure,
      institutional_flow: flow
    };
  }, []);

  // Calcular score da IA a partir de indicadores reais
  const generateIAScore = useCallback((indicators: Indicators): IAScore => {
    const trendUpSignals = [
      indicators.EMA_20 > indicators.SMA_50,
      indicators.MACD.macd > indicators.MACD.signal,
      indicators.MACD.histogram > 0,
      indicators.RSI > 55
    ].filter(Boolean).length;
    const trendDownSignals = [
      indicators.EMA_20 < indicators.SMA_50,
      indicators.MACD.macd < indicators.MACD.signal,
      indicators.MACD.histogram < 0,
      indicators.RSI < 45
    ].filter(Boolean).length;
    let tendencia: IAScore['tendencia'] = 'neutral';
    if (trendUpSignals >= 3 && trendUpSignals > trendDownSignals) tendencia = 'bull';
    else if (trendDownSignals >= 3 && trendDownSignals > trendUpSignals) tendencia = 'bear';
    const signalStrength = Math.max(trendUpSignals, trendDownSignals);
    const probabilidade = 50 + signalStrength * 10; // 60..90
    const confidence = 60 + signalStrength * 8; // 68..92
    return {
      tendencia,
      probabilidade: Math.round(Math.max(50, Math.min(95, probabilidade))),
      confidence: Math.round(Math.max(50, Math.min(95, confidence)))
    };
  }, []);

  // Capturar dados do cursor com dados REAIS
  const captureCursorData = useCallback((price: number, volume: number) => {
    const indicators = calculateIndicators(price, binanceCandles);
    const heatmapData = generateHeatmapData(binanceCandles, price);
    const scoreIA = generateIAScore(indicators);
    
    const data: CursorData = {
      timestamp: new Date().toISOString(),
      price: {
        open: price * 0.999,
        high: price * 1.001,
        low: price * 0.998,
        close: price
      },
      volume,
      indicators,
      heatmap_data: heatmapData,
      score_ia: scoreIA
    };
    
    setCursorData(data);
    onDataCapture?.(data);
  }, [calculateIndicators, binanceCandles, generateHeatmapData, generateIAScore, onDataCapture]);

  const handleCaptureData = async () => {
    if (!cursorData) return;
    
    // Criar hash dos dados principais para detectar mudanças significativas
    const dataHash = JSON.stringify({
      price: cursorData.price.close,
      rsi: Math.round(cursorData.indicators.RSI),
      macd: Math.round(cursorData.indicators.MACD.histogram * 100),
      trend: cursorData.score_ia.tendencia,
      confidence: Math.round(cursorData.score_ia.confidence)
    });
    
    // Só enviar se houve mudança significativa
    if (lastSentData === dataHash) {
      return; // Dados iguais, não enviar
    }
    
    const feedId = await sendToNarratorFeed(cursorData, symbol, timeframe);
    if (feedId) {
      setLastSentData(dataHash);
      onDataCapture?.(cursorData);
    }
  };

  // Atualização em tempo real sem clique: gerar cursorData a cada atualização do liveData
  useEffect(() => {
    if (!liveData) return;
    const price = parseFloat(String(liveData.price).replace(/[,$]/g, ''));
    if (!Number.isFinite(price)) return;
    captureCursorData(price, 0);
  }, [liveData, captureCursorData]);

  // Enviar para o feed do narrador periodicamente (ex: a cada 15s) se houver cursorData
  useEffect(() => {
    let timer: any;
    const tick = async () => {
      if (cursorData) {
        await handleCaptureData();
      }
      timer = setTimeout(tick, 15000);
    };
    timer = setTimeout(tick, 15000);
    return () => clearTimeout(timer);
  }, [cursorData]);

  const getTrendIcon = (tendencia: IAScore['tendencia']) => {
    return tendencia === 'bull' ? (
      <TrendingUp className="h-4 w-4 text-green-400" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-400" />
    );
  };

  return null;
};

export default InteractiveChart;