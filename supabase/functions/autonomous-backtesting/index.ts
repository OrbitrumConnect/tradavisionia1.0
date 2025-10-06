import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://krjpvdllsbxeuuncmitt.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyanB2ZGxsc2J4ZXV1bmNtaXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODA0MzksImV4cCI6MjA3NTE1NjQzOX0.5pnSaFe5URJmfE_DdKCsInPsIBCbKsCZCQ-yzarIwDk';
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')!,
        },
      },
    });

    const { symbol = 'BTCUSDT', timeframe = '1m', days = 30 } = await req.json();

    console.log(`🔄 Iniciando backtesting para ${symbol} - ${timeframe} - ${days} dias`);

    // 1. COLETAR DADOS HISTÓRICOS
    const historicalData = await fetchHistoricalData(symbol, timeframe, days);
    console.log(`📊 Coletados ${historicalData.length} candles históricos`);

    // 2. PROCESSAR PADRÕES E INDICADORES
    const processedData = await processHistoricalData(historicalData, symbol, timeframe);
    console.log(`🧠 Processados ${processedData.length} pontos de dados`);

    // 3. EXECUTAR BACKTESTING
    const backtestResults = await executeBacktesting(processedData);
    console.log(`📈 Backtesting concluído: ${backtestResults.totalTrades} trades simulados`);

    // 4. CALCULAR MÉTRICAS DE PERFORMANCE
    const performanceMetrics = calculatePerformanceMetrics(backtestResults);
    console.log(`🎯 Performance: ${performanceMetrics.winRate}% win rate, ${performanceMetrics.totalPnL}% PnL`);

    // 5. ATUALIZAR PATTERN WEIGHTS
    await updatePatternWeights(supabase, backtestResults, symbol);
    console.log(`🧠 Pattern weights atualizados para ${symbol}`);

    // 6. GERAR INSIGHTS DE APRENDIZADO
    const learningInsights = generateLearningInsights(backtestResults, performanceMetrics);
    console.log(`💡 Insights gerados: ${learningInsights.length} descobertas`);

    return new Response(
      JSON.stringify({
        success: true,
        symbol,
        timeframe,
        days,
        totalCandles: historicalData.length,
        totalTrades: backtestResults.totalTrades,
        performance: performanceMetrics,
        insights: learningInsights,
        patternWeights: backtestResults.patternWeights
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro no backtesting:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Função para coletar dados históricos
async function fetchHistoricalData(symbol: string, timeframe: string, days: number) {
  const limit = days * 24 * 60; // Aproximadamente 1 candle por minuto
  const response = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=${Math.min(limit, 1000)}`
  );
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar dados históricos: ${response.status}`);
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
}

// Função para processar dados históricos
async function processHistoricalData(candles: any[], symbol: string, timeframe: string) {
  const processedData = [];
  
  for (let i = 50; i < candles.length; i++) { // Começar após 50 candles para indicadores
    const currentCandles = candles.slice(0, i + 1);
    const currentCandle = candles[i];
    
    // Calcular indicadores técnicos
    const indicators = calculateTechnicalIndicators(currentCandles);
    
    // Detectar padrões
    const patterns = detectPatterns(currentCandles);
    
    // Calcular suporte/resistência
    const supportResistance = findSupportResistance(currentCandles);
    
    processedData.push({
      timestamp: new Date(currentCandle.time).toISOString(),
      symbol,
      timeframe,
      candle: currentCandle,
      indicators,
      patterns,
      supportResistance,
      index: i
    });
  }
  
  return processedData;
}

// Função para executar backtesting
async function executeBacktesting(processedData: any[]) {
  const trades = [];
  const patternWeights = {};
  
  for (let i = 0; i < processedData.length - 10; i++) { // Deixar 10 candles para resultado
    const data = processedData[i];
    const patterns = data.patterns;
    
    // Detectar sinais baseados nos padrões
    const signal = detectSignal(patterns, data.indicators);
    
    if (signal.type !== 'NEUTRAL') {
      // Simular trade
      const trade = simulateTrade(data, signal, processedData.slice(i + 1, i + 11));
      
      if (trade) {
        trades.push(trade);
        
        // Atualizar pattern weights
        const patternKey = signal.patternName;
        if (!patternWeights[patternKey]) {
          patternWeights[patternKey] = { wins: 0, total: 0, pnl: 0 };
        }
        
        patternWeights[patternKey].total++;
        if (trade.pnl > 0) {
          patternWeights[patternKey].wins++;
        }
        patternWeights[patternKey].pnl += trade.pnl;
      }
    }
  }
  
  return {
    trades,
    patternWeights,
    totalTrades: trades.length
  };
}

// Função para detectar sinais
function detectSignal(patterns: any, indicators: any) {
  let signalType = 'NEUTRAL';
  let patternName = null;
  let confidence = 0;
  
  // Order Block
  if (patterns.orderBlockDetected) {
    signalType = patterns.orderBlockType === 'bullish' ? 'BUY' : 'SELL';
    patternName = `Order Block ${patterns.orderBlockType}`;
    confidence = 70;
  }
  
  // FVG
  else if (patterns.fvgDetected) {
    signalType = patterns.fvgType === 'bullish' ? 'BUY' : 'SELL';
    patternName = `FVG ${patterns.fvgType}`;
    confidence = 60;
  }
  
  // Spring
  else if (patterns.springDetected) {
    signalType = 'BUY';
    patternName = 'Wyckoff Spring';
    confidence = 80;
  }
  
  // Upthrust
  else if (patterns.upthrustDetected) {
    signalType = 'SELL';
    patternName = 'Wyckoff Upthrust';
    confidence = 80;
  }
  
  // BOS
  else if (patterns.bosDetected) {
    signalType = 'BUY'; // Assumir bullish BOS
    patternName = 'Break of Structure';
    confidence = 65;
  }
  
  // CHOCH
  else if (patterns.chochDetected) {
    signalType = 'SELL'; // Assumir bearish CHOCH
    patternName = 'Change of Character';
    confidence = 75;
  }
  
  return {
    type: signalType,
    patternName,
    confidence
  };
}

// Função para simular trade
function simulateTrade(data: any, signal: any, futureCandles: any[]) {
  if (futureCandles.length < 5) return null;
  
  const entryPrice = data.candle.close;
  const targetPrice = signal.type === 'BUY' ? 
    entryPrice * 1.02 : // 2% target
    entryPrice * 0.98;  // 2% target
  
  const stopLoss = signal.type === 'BUY' ? 
    entryPrice * 0.99 : // 1% stop
    entryPrice * 1.01;  // 1% stop
  
  // Verificar resultado nos próximos 5 candles
  for (let i = 0; i < Math.min(5, futureCandles.length); i++) {
    const futureCandle = futureCandles[i];
    
    // Target atingido
    if (signal.type === 'BUY' && futureCandle.high >= targetPrice) {
      return {
        pattern: signal.patternName,
        type: signal.type,
        entryPrice,
        exitPrice: targetPrice,
        pnl: 2.0, // 2% profit
        duration: i + 1,
        timestamp: data.timestamp
      };
    }
    
    if (signal.type === 'SELL' && futureCandle.low <= targetPrice) {
      return {
        pattern: signal.patternName,
        type: signal.type,
        entryPrice,
        exitPrice: targetPrice,
        pnl: 2.0, // 2% profit
        duration: i + 1,
        timestamp: data.timestamp
      };
    }
    
    // Stop loss atingido
    if (signal.type === 'BUY' && futureCandle.low <= stopLoss) {
      return {
        pattern: signal.patternName,
        type: signal.type,
        entryPrice,
        exitPrice: stopLoss,
        pnl: -1.0, // 1% loss
        duration: i + 1,
        timestamp: data.timestamp
      };
    }
    
    if (signal.type === 'SELL' && futureCandle.high >= stopLoss) {
      return {
        pattern: signal.patternName,
        type: signal.type,
        entryPrice,
        exitPrice: stopLoss,
        pnl: -1.0, // 1% loss
        duration: i + 1,
        timestamp: data.timestamp
      };
    }
  }
  
  // Trade não fechado nos 5 candles
  const lastCandle = futureCandles[futureCandles.length - 1];
  const finalPnL = signal.type === 'BUY' ? 
    ((lastCandle.close - entryPrice) / entryPrice) * 100 :
    ((entryPrice - lastCandle.close) / entryPrice) * 100;
  
  return {
    pattern: signal.patternName,
    type: signal.type,
    entryPrice,
    exitPrice: lastCandle.close,
    pnl: finalPnL,
    duration: futureCandles.length,
    timestamp: data.timestamp
  };
}

// Função para calcular métricas de performance
function calculatePerformanceMetrics(backtestResults: any) {
  const trades = backtestResults.trades;
  const totalTrades = trades.length;
  
  if (totalTrades === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      totalPnL: 0,
      avgPnL: 0,
      maxDrawdown: 0
    };
  }
  
  const winningTrades = trades.filter((t: any) => t.pnl > 0).length;
  const winRate = (winningTrades / totalTrades) * 100;
  
  const totalPnL = trades.reduce((sum: number, t: any) => sum + t.pnl, 0);
  const avgPnL = totalPnL / totalTrades;
  
  // Calcular drawdown
  let maxDrawdown = 0;
  let currentDrawdown = 0;
  let peak = 0;
  
  for (const trade of trades) {
    currentDrawdown += trade.pnl;
    if (currentDrawdown > peak) {
      peak = currentDrawdown;
    }
    const drawdown = peak - currentDrawdown;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  return {
    totalTrades,
    winRate: Math.round(winRate * 100) / 100,
    totalPnL: Math.round(totalPnL * 100) / 100,
    avgPnL: Math.round(avgPnL * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100
  };
}

// Função para atualizar pattern weights
async function updatePatternWeights(supabase: any, backtestResults: any, symbol: string) {
  const patternWeights = {};
  
  for (const [pattern, stats] of Object.entries(backtestResults.patternWeights)) {
    const successRate = stats.wins / stats.total;
    const avgPnL = stats.pnl / stats.total;
    
    patternWeights[pattern] = {
      weight: successRate,
      avgPnL: avgPnL,
      totalTrades: stats.total,
      wins: stats.wins
    };
  }
  
  // Atualizar tradevision_state
  const { error } = await supabase
    .from('tradevision_state')
    .upsert({
      symbol,
      pattern_weights: patternWeights,
      updated_at: new Date().toISOString()
    });
  
  if (error) {
    console.error('Erro ao atualizar pattern weights:', error);
  }
}

// Função para gerar insights de aprendizado
function generateLearningInsights(backtestResults: any, performance: any) {
  const insights = [];
  
  // Insight sobre win rate
  if (performance.winRate > 70) {
    insights.push({
      type: 'success',
      message: `Excelente win rate de ${performance.winRate}%! Os padrões estão funcionando bem.`,
      priority: 'high'
    });
  } else if (performance.winRate < 40) {
    insights.push({
      type: 'warning',
      message: `Win rate baixo de ${performance.winRate}%. Considere ajustar os parâmetros de detecção.`,
      priority: 'high'
    });
  }
  
  // Insight sobre PnL
  if (performance.totalPnL > 10) {
    insights.push({
      type: 'success',
      message: `PnL positivo de ${performance.totalPnL}%! Estratégia rentável.`,
      priority: 'medium'
    });
  } else if (performance.totalPnL < -5) {
    insights.push({
      type: 'warning',
      message: `PnL negativo de ${performance.totalPnL}%. Revisar estratégia.`,
      priority: 'high'
    });
  }
  
  // Insight sobre padrões específicos
  const patternStats = Object.entries(backtestResults.patternWeights);
  const bestPattern = patternStats.reduce((best, [pattern, stats]) => {
    const successRate = stats.wins / stats.total;
    return successRate > best.successRate ? { pattern, successRate } : best;
  }, { pattern: '', successRate: 0 });
  
  if (bestPattern.successRate > 0.8) {
    insights.push({
      type: 'insight',
      message: `Padrão "${bestPattern.pattern}" tem ${Math.round(bestPattern.successRate * 100)}% de sucesso!`,
      priority: 'medium'
    });
  }
  
  return insights;
}

// Funções auxiliares para indicadores e padrões (simplificadas)
function calculateTechnicalIndicators(candles: any[]) {
  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);
  
  return {
    ema9: calculateEMA(closes, 9),
    ema20: calculateEMA(closes, 20),
    ema50: calculateEMA(closes, 50),
    rsi14: calculateRSI(closes, 14),
    volumeMA: calculateMA(volumes, 20)
  };
}

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

function calculateMA(values: number[], period: number): number {
  if (values.length < period) return values[values.length - 1];
  return values.slice(-period).reduce((sum, val) => sum + val, 0) / period;
}

function detectPatterns(candles: any[]) {
  // Implementação simplificada dos padrões
  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];
  
  return {
    orderBlockDetected: false,
    orderBlockType: null,
    fvgDetected: false,
    fvgType: null,
    springDetected: false,
    upthrustDetected: false,
    bosDetected: false,
    chochDetected: false
  };
}

function findSupportResistance(candles: any[]) {
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  
  return {
    support: Math.min(...lows.slice(-20)),
    resistance: Math.max(...highs.slice(-20))
  };
}
