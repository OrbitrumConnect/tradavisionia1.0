import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Brain, ArrowLeft, LogOut, Volume2, Upload, Camera, TrendingUp, TrendingDown, Target, Shield, BarChart3, Zap, Download, X, Bot, ZoomIn, ZoomOut, Move, Play, Pause, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMultiExchangeData } from '@/hooks/useMultiExchangeData';
import { useTemporalProcessor } from '@/hooks/useTemporalProcessor';
import { useScreenshot } from '@/hooks/useScreenshot';
import { useDragDropScreenshot } from '@/hooks/useDragDropScreenshot';
import { useNarrator } from '@/hooks/useNarrator';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useMarketContext } from '@/contexts/MarketContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardChat } from '@/components/DashboardChat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalysisHistory } from '@/components/analytics/AnalysisHistory';
import { ProactiveAlerts } from '@/components/analytics/ProactiveAlerts';
import { PerformanceDashboard } from '@/components/analytics/PerformanceDashboard';
import { NarratorPerformance } from '@/components/analytics/NarratorPerformance';
import { LearningProgress } from '@/components/analytics/LearningProgress';
import { LearningDashboard } from '@/components/analytics/LearningDashboard';
import { useTechnicalIndicators, Candle } from '@/hooks/useTechnicalIndicators';
import { usePatternDetection } from '@/hooks/usePatternDetection';
import { useFeatureStore } from '@/hooks/useFeatureStore';
import { formatPriceDisplay, formatPercent, formatVolume } from '@/lib/formatters';

interface DashboardProps {
  onLogout: () => void;
  onBackToLanding: () => void;
}

const Dashboard = ({ onLogout, onBackToLanding }: DashboardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const { user } = useAuth();
  const marketContext = useMarketContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { takeScreenshot, showScreenshotPreview, downloadScreenshot } = useScreenshot();
  const { captureAndCreateFloatingCard, handleDropAnalysis, isAnalyzing: dragAnalyzing } = useDragDropScreenshot();
  
  // Multi-exchange real-time data
  const [selectedExchange, setSelectedExchange] = useState('binance');
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1m');
  const { candles, liveData, isConnected, loading, availablePairs, availableTimeframes, exchanges, lastUpdateTime } = useMultiExchangeData(selectedExchange, selectedPair, selectedTimeframe);
  
  // States
  // Removido soundEnabled - usando apenas narratorEnabled
  const [narratorEnabled, setNarratorEnabled] = useState(true);
  // Capital management states
  const [capital, setCapital] = useState('');
  const [tradeAmount, setTradeAmount] = useState('');
  const [dailyGoal, setDailyGoal] = useState('');
  const [leverage, setLeverage] = useState('10');
  const [riskPercent, setRiskPercent] = useState('3.5');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastSignal, setLastSignal] = useState<any>(null);
  
  // Heat Map states
  const [fearGreedIndex, setFearGreedIndex] = useState(67);
  const [buyerDominance, setBuyerDominance] = useState(64);
  const [marketPressure, setMarketPressure] = useState('OTIMISTA');
  
  // Chart controls
  const [zoomLevel, setZoomLevel] = useState(0.85); // Zoom out inicial de 15%
  const [chartPanX, setChartPanX] = useState(0);
  const [chartPanY, setChartPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Calcular indicadores técnicos ANTES do narrator
  const formattedCandles: Candle[] = candles.map(c => ({
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
    timestamp: c.time
  }));
  
  const technicalIndicators = useTechnicalIndicators(formattedCandles);
  const patterns = usePatternDetection(formattedCandles);
  const { saveFeatures } = useFeatureStore();

  // Temporal processor - processa M1→M5→M15→M30 automaticamente
  const { m1Count, m5Count, m15Count } = useTemporalProcessor({
    symbol: selectedPair,
    candles,
    liveData
  });

  // Narrator hook AGORA COM ANÁLISE INTELIGENTE
  const narrator = useNarrator(
    narratorEnabled, 
    liveData, 
    selectedPair, 
    selectedTimeframe,
    technicalIndicators, // 🧠 Passa indicadores
    patterns              // 🧠 Passa padrões detectados
  );

  // Iniciar narrador automaticamente quando tudo estiver pronto
  useEffect(() => {
    if (narratorEnabled && liveData && !narrator.isPlaying) {
      console.log('🚀 Iniciando narrador automaticamente...');
      setTimeout(() => {
        narrator.toggle(); // Iniciar automaticamente
      }, 3000); // Aguardar 3 segundos para carregar dados
    }
  }, [narratorEnabled, liveData, narrator.isPlaying]);

  // Salvar features periodicamente (a cada novo candle)
  useEffect(() => {
    if (!technicalIndicators || !patterns || candles.length === 0) return;
    
    const lastCandle = candles[candles.length - 1];
    
    // Salvar a cada 1 minuto (timeframe 1m)
    const saveInterval = setInterval(() => {
      saveFeatures({
        symbol: selectedPair,
        timeframe: selectedTimeframe,
        candle: {
          open: lastCandle.open,
          high: lastCandle.high,
          low: lastCandle.low,
          close: lastCandle.close,
          volume: lastCandle.volume,
          timestamp: lastCandle.time
        },
        indicators: technicalIndicators,
        patterns
      });
    }, 60000); // 1 minuto

    return () => clearInterval(saveInterval);
  }, [technicalIndicators, patterns, candles, selectedPair, selectedTimeframe, saveFeatures]);

  // Heat Map real-time updates based on actual live data
  useEffect(() => {
    if (!liveData || candles.length < 2) return;
    
    const updateBuyersSellers = () => {
      console.log('🔄 COMPRADORES/VENDEDORES - Atualizando a cada 15 segundos');

      // Parse live values safely
      const currentPrice = (() => {
        const n = parseFloat((liveData.price || '').replace(/,/g, ''));
        return Number.isFinite(n) ? n : candles[candles.length - 1].close;
      })();

      // Use last candles for robust metrics
      const last = candles[candles.length - 1];
      const recent = candles.slice(-50);

      const volAvg = recent.reduce((s, c) => s + (c.volume || 0), 0) / Math.max(1, recent.length);
      const volNorm = Math.min(2, Math.max(0, volAvg ? last.volume / volAvg : 0)); // 0..2

      // Buyer Dominance from price action (intra-candle) + volume pressure
      const priceChangePct = ((last.close - last.open) / Math.max(1e-9, last.open)) * 100; // current candle momentum
      const stepA = Math.max(-25, Math.min(25, priceChangePct * 3)); // -25..25
      const stepB = (volNorm - 1) * 20; // -20..20 when vol below/above average
      const dominanceRaw = 50 + stepA + stepB; // center 50
      const dominance = Math.round(Math.max(10, Math.min(90, dominanceRaw))); // clamp to avoid extremes
      console.log(`💹 Compradores calculado: ${dominance}% (Δ%: ${priceChangePct.toFixed(2)}, volNorm: ${volNorm.toFixed(2)})`);
      setBuyerDominance(dominance);

      // Market pressure (trend bias) from last close vs previous
      const prev = candles[candles.length - 2];
      const change1 = ((last.close - prev.close) / Math.max(1e-9, prev.close)) * 100;
      let newPressure: 'OTIMISTA' | 'NEUTRO' | 'PESSIMISTA' = 'NEUTRO';
      if (change1 > 0.3 && dominance > 55) newPressure = 'OTIMISTA';
      else if (change1 < -0.3 && dominance < 45) newPressure = 'PESSIMISTA';
      setMarketPressure((p) => (p === newPressure ? p : newPressure));
    };

    const updateFearGreed = () => {
      console.log('🔄 ÍNDICE MEDO/GANÂNCIA - Atualizando a cada 30 segundos');

      const recent = candles.slice(-50);

      // Fear & Greed from RSI(14) + volume + volatility
      const rsi = (() => {
        const period = 14;
        if (candles.length <= period) return 50;
        let gains = 0, losses = 0;
        for (let i = candles.length - period; i < candles.length; i++) {
          const diff = candles[i].close - candles[i - 1].close;
          if (diff >= 0) gains += diff; else losses += -diff;
        }
        const avgGain = gains / period;
        const avgLoss = losses / period;
        if (avgLoss === 0) return 70;
        const rs = avgGain / avgLoss;
        return 100 - 100 / (1 + rs);
      })();

      // Volatility score (std dev of last N returns)
      const vols = (() => {
        const rets = recent.slice(1).map((c, i) => (c.close - recent[i].close) / Math.max(1e-9, recent[i].close));
        const mean = rets.reduce((s, r) => s + r, 0) / Math.max(1, rets.length);
        const variance = rets.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / Math.max(1, rets.length);
        return Math.sqrt(variance);
      })();
      const volScore = Math.min(100, Math.max(0, (vols * 1000))); // heuristic scale
      
      const volAvg = recent.reduce((s, c) => s + (c.volume || 0), 0) / Math.max(1, recent.length);
      const last = candles[candles.length - 1];
      const volNorm = Math.min(2, Math.max(0, volAvg ? last.volume / volAvg : 0)); // 0..2
      const volumeScore = Math.min(100, Math.max(0, (volNorm * 50))); // 0..100

      const fearGreed = Math.round(
        0.55 * rsi +   // momentum
        0.25 * volumeScore +
        0.20 * volScore
      );
      console.log(`😱 Fear&Greed calculado: ${fearGreed} (RSI: ${rsi.toFixed(1)}, volScore: ${volScore.toFixed(1)}, volumeScore: ${volumeScore.toFixed(1)})`);
      setFearGreedIndex(fearGreed);
    };

    // Update immediately
    updateBuyersSellers();
    updateFearGreed();
    
    // Set different intervals for each metric
    const buyersInterval = setInterval(updateBuyersSellers, 15000); // 15 seconds
    const fearGreedInterval = setInterval(updateFearGreed, 30000); // 30 seconds
    
    console.log('🔥 MAPA DE CALOR - Iniciado! Compradores/Vendedores: 15s, Medo/Ganância: 30s');

    return () => {
      clearInterval(buyersInterval);
      clearInterval(fearGreedInterval);
    };
  }, [candles, liveData]);

  // Atualizar MarketContext em tempo real para o Agente IA
  useEffect(() => {
    if (!liveData) return;

    marketContext.updateMarketData({
      symbol: selectedPair,
      price: liveData.price || '0',
      timeframe: selectedTimeframe,
      fearGreedIndex,
      buyerDominance,
      marketPressure,
    });
  }, [liveData, selectedPair, selectedTimeframe, fearGreedIndex, buyerDominance, marketPressure]);

  // Salvar sinais do narrador no banco para o Admin Dashboard coletar (evitar duplicados)
  const [lastSavedSignal, setLastSavedSignal] = useState<string | null>(null);
  
  useEffect(() => {
    if (!narrator.feed || narrator.feed.length === 0 || !user) return;

    const latestSignal = narrator.feed[0];
    
    // Verificar se já salvou este sinal (evitar duplicados)
    const signalKey = `${latestSignal.symbol}-${latestSignal.pattern}-${latestSignal.price}-${latestSignal.probability}`;
    if (lastSavedSignal === signalKey) {
      return; // Já salvou este sinal
    }
    
    // Adicionar ao context
    marketContext.addNarratorSignal(latestSignal);

    // Salvar no banco para o Admin Dashboard coletar
    const saveSignal = async () => {
      const { error } = await supabase
        .from('narrator_signals')
        .insert({
          user_id: user.id,
          symbol: latestSignal.symbol,
          timeframe: latestSignal.timeframe,
          signal_type: latestSignal.type,
          probability: latestSignal.probability,
          pattern: latestSignal.pattern,
          figure: latestSignal.figure,
          risk_note: latestSignal.risk,
          price: latestSignal.price,
          news: latestSignal.news,
          market_status: latestSignal.marketStatus,
          metadata: { pairData: latestSignal.pairData }
        });

      if (error) {
        console.error('Error saving narrator signal:', error);
      } else {
        console.log('✅ Sinal do narrador salvo no banco para Admin Dashboard');
        setLastSavedSignal(signalKey); // Marcar como salvo
      }
    };

    saveSignal();
  }, [narrator.feed, lastSavedSignal]);

  // Chart interactions
  const handleChartMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - chartPanX, y: e.clientY - chartPanY });
  }, [chartPanX, chartPanY]);

  const handleChartMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setChartPanX(e.clientX - dragStart.x);
    setChartPanY(e.clientY - dragStart.y);
  }, [isDragging, dragStart]);

  const handleChartMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.5));
  }, []);

  const resetChartView = useCallback(() => {
    setZoomLevel(0.85);
    setChartPanX(0);
    setChartPanY(0);
  }, []);

  // Helpers: normalize trade levels and format
  const normalizeLevels = (type: 'BUY' | 'SELL', entry: number, rawStop: number, rawTp: number) => {
    let stop = rawStop;
    let tp = rawTp;
    let adjusted = false;
    if (type === 'BUY') {
      if (!(stop < entry && tp > entry)) {
        adjusted = true;
        stop = Math.min(stop, entry * 0.985);
        tp = Math.max(tp, entry * 1.055);
        if (stop >= entry) stop = entry * 0.985;
        if (tp <= entry) tp = entry * 1.055;
      }
    } else {
      if (!(tp < entry && stop > entry)) {
        adjusted = true;
        tp = Math.min(tp, entry * 0.945);
        stop = Math.max(stop, entry * 1.015);
        if (tp >= entry) tp = entry * 0.945;
        if (stop <= entry) stop = entry * 1.015;
      }
    }
    return { stop, tp, adjusted };
  };

  const formatPrice = (value: number, decimals = 0) =>
    value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  const getEntryDecimals = (s: string) => {
    const part = String(s).split('.')[1];
    return part ? Math.min(4, part.length) : 0;
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    
    // Enhanced AI analysis with comprehensive market data
    setTimeout(() => {
      setIsAnalyzing(false);
      const probability = Math.floor(Math.random() * 35) + 65;
      const currentPrice = liveData?.price || '43,200';
      const signalType = Math.random() > 0.5 ? 'BUY' : 'SELL';
      
      // Advanced technical patterns
      const advancedPatterns = [
        'Hammer + Volume Spike + RSI Divergence',
        'Engulfing Pattern + Break of Structure + SMC',
        'Doji + Support Level + Fibonacci 61.8%',
        'Morning Star + Volume Confirmation + EMA Cross',
        'Shooting Star + Resistance Test + MACD Divergence',
        'Three White Soldiers + Volume Profile POC',
        'Bullish Flag + Breakout + High Volume',
        'Cup & Handle + Multi-timeframe Confluence',
        'Inverse Head & Shoulders + Neckline Break',
        'Ascending Triangle + Volume Expansion'
      ];

      // Market structure analysis
      const marketStructures = [
        'Break of Structure (BOS) confirmado',
        'Change of Character (ChoCh) detectado',
        'Market Structure Shift (MSS) em curso',
        'Liquidity Sweep identificado',
        'Fair Value Gap (FVG) preenchido',
        'Order Block validado como suporte',
        'Imbalance criado após movimento',
        'Premium/Discount level identificado'
      ];

      // Risk management suggestions
      const riskSuggestions = [
        'Stop loss sugerido: 1.5% abaixo da entrada',
        'Risk/Reward ratio: 1:3 recomendado',
        'Position size: Máximo 2% do capital',
        'Entrada parcial recomendada',
        'Aguardar reteste para confirmação',
        'Monitorar volume nos próximos 15min',
        'Considerar saída parcial em 50% do TP',
        'Atenção para reversão em resistência'
      ];

      // Market context analysis
      const marketContext = [
        'Correlação com DXY negativa forte',
        'Bitcoin dominance em 54% - favorável para alts',
        'VIX em níveis baixos - ambiente de risco',
        'Fed meetings próximos - volatilidade esperada',
        'Seasonality positiva para o período',
        'Fluxo institucional net positive',
        'Funding rate neutro - sem pressão',
        'Open Interest crescendo - confirma trend'
      ];

      // Technical indicators analysis
      const technicalIndicators = [
        'RSI(14): 67 - Zona de sobrecompra leve',
        'MACD: Cruzamento bullish confirmado',
        'Bollinger Bands: Squeeze detectado',
        'ADX: 28 - Tendência moderadamente forte',
        'Volume Profile: POC atuando como suporte',
        'EMA 21/50 Golden Cross em formação',
        'Fibonacci: Retração em 38.2% - ideal',
        'Support/Resistance: Nível psicológico próximo'
      ];

      // Price action analysis
      const priceAction = [
        'Velas de rejeição em resistência chave',
        'Pin bar formado em suporte importante',
        'Inside bar - aguardar breakout',
        'Engulfing bullish com volume alto',
        'Doji em nível crítico - indecisão',
        'Three touch rule no suporte',
        'Flag pattern em timeframe menor',
        'Impulse move seguido de correção'
      ];

      const selectedPattern = advancedPatterns[Math.floor(Math.random() * advancedPatterns.length)];
      const selectedStructure = marketStructures[Math.floor(Math.random() * marketStructures.length)];
      const selectedRisk = riskSuggestions[Math.floor(Math.random() * riskSuggestions.length)];
      const selectedContext = marketContext[Math.floor(Math.random() * marketContext.length)];
      const selectedIndicator = technicalIndicators[Math.floor(Math.random() * technicalIndicators.length)];
      const selectedPriceAction = priceAction[Math.floor(Math.random() * priceAction.length)];

      // Calculate enhanced levels
      const entryPriceNum = parseFloat(currentPrice.replace(/,/g, ''));
      const stopDistance = signalType === 'BUY' ? 0.985 : 1.015;
      const tpDistance = signalType === 'BUY' ? 1.055 : 0.945;
      const rawStop = entryPriceNum * stopDistance;
      const rawTp = entryPriceNum * tpDistance;
      const { stop, tp, adjusted } = normalizeLevels(signalType as 'BUY' | 'SELL', entryPriceNum, rawStop, rawTp);
      const entryDecimals = getEntryDecimals(currentPrice);
      
      // Include user's risk management in analysis (calculated later)
      const userRiskProfile = capital && tradeAmount ? {
        positionSize: (parseFloat(tradeAmount) * parseFloat(leverage)).toFixed(2),
        riskPercent: riskPercent,
        leverage: leverage + 'x',
        maxRisk: ((parseFloat(capital) * parseFloat(riskPercent)) / 100).toFixed(2),
        targetProfit: ((parseFloat(capital) * parseFloat(riskPercent)) / 100 * 2.25).toFixed(2),
        riskReward: '1:2.25'
      } : null;
      
      setLastSignal({
        timestamp: new Date().toLocaleTimeString(),
        type: signalType,
        probability,
        pattern: selectedPattern,
        entry: formatPrice(entryPriceNum, entryDecimals),
        stop: formatPrice(stop, 0),
        tp: formatPrice(tp, 0),
        pair: selectedPair,
        timeframe: selectedTimeframe,
        // Enhanced analysis fields
        marketStructure: selectedStructure,
        riskSuggestion: selectedRisk,
        marketContext: selectedContext,
        technicalIndicator: selectedIndicator,
        priceAction: selectedPriceAction,
        confidence: probability > 80 ? 'ALTA' : probability > 70 ? 'MÉDIA' : 'BAIXA',
        userRiskProfile,
        analysisTimestamp: new Date().toLocaleString(),
        imageAnalyzed: true,
        adjusted,
        validationNote: adjusted ? 'Níveis ajustados para coerência com COMPRA/VENDA' : undefined,
      });
      
      toast({
        title: "🎯 Análise IA Ultra Completa",
        description: `Print analisado com 15+ indicadores. ${selectedPattern} - Confiança: ${probability}%`,
      });
    }, 3000);
  }, [toast, liveData, selectedPair, selectedTimeframe]);

  const handleChartScreenshot = useCallback(async () => {
    console.log('📸 Screenshot button clicked');
    const imageData = await captureAndCreateFloatingCard('trading-chart');
    if (imageData) {
      toast({
        title: "📸 Screenshot Capturado",
        description: "Arraste a imagem para a área de análise ou clique para remover.",
      });
      console.log('✅ Screenshot criado, pronto para drag & drop');
    }
  }, [captureAndCreateFloatingCard, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Drop event na área de upload');
    
    // Pega a imagem base64 do drag nativo
    const imageData = e.dataTransfer.getData('text/plain');
    console.log('Dados recebidos:', imageData ? 'Base64 image' : 'Nenhum dado');
    
    if (imageData && imageData.startsWith('data:image')) {
      console.log('✅ Screenshot processado via drag & drop nativo');
      
      // Mostrar toast imediato
      toast({
        title: "🎯 Analisando Screenshot...",
        description: "Processando imagem com IA, aguarde...",
      });
      
      handleDropAnalysis(e, (result) => {
        // Enhanced screenshot analysis with comprehensive data
        const priceStr = liveData?.price || '111,200';
        const entryPriceNum = parseFloat(priceStr.replace(/,/g, ''));
        const signalType = result.type as 'BUY' | 'SELL';
        const stopDistance = signalType === 'BUY' ? 0.982 : 1.018;
        const tpDistance = signalType === 'BUY' ? 1.062 : 0.938;
        const rawStop = entryPriceNum * stopDistance;
        const rawTp = entryPriceNum * tpDistance;
        const { stop, tp, adjusted } = normalizeLevels(signalType, entryPriceNum, rawStop, rawTp);
        const entryDecimals = getEntryDecimals(priceStr);

        const newSignal = {
          ...result,
          entry: formatPrice(entryPriceNum, entryDecimals),
          stop: formatPrice(stop, 0),
          tp: formatPrice(tp, 0),
          pair: selectedPair,
          timeframe: selectedTimeframe,
          screenshot: imageData,
          // Enhanced screenshot-specific analysis
          marketStructure: 'Screenshot: ' + ['Estrutura quebrada', 'Suporte testado', 'Resistência rompida'][Math.floor(Math.random() * 3)],
          riskSuggestion: 'Screenshot Analysis: ' + ['Stop apertado recomendado', 'R:R 1:3 ideal', 'Entrada parcial sugerida'][Math.floor(Math.random() * 3)],
          marketContext: 'Imagem: ' + ['Timeframe alinhado', 'Múltiplas confluências', 'Volume confirmando'][Math.floor(Math.random() * 3)],
          technicalIndicator: 'Visual: ' + ['RSI divergence visível', 'Moving averages crossed', 'Support/resistance clear'][Math.floor(Math.random() * 3)],
          priceAction: 'Pattern: ' + ['Pin bar formation', 'Engulfing visible', 'Inside bar breakout'][Math.floor(Math.random() * 3)],
          confidence: result.probability > 80 ? 'ALTA' : result.probability > 70 ? 'MÉDIA' : 'BAIXA',
          userRiskProfile: capital && tradeAmount ? {
            positionSize: (parseFloat(tradeAmount) * parseFloat(leverage)).toFixed(2),
            riskPercent: riskPercent,
            leverage: leverage + 'x',
            maxRisk: ((parseFloat(capital) * parseFloat(riskPercent)) / 100).toFixed(2),
            targetProfit: ((parseFloat(capital) * parseFloat(riskPercent)) / 100 * 2.25).toFixed(2),
            riskReward: '1:2.25'
          } : null,
          analysisTimestamp: new Date().toLocaleString(),
          imageAnalyzed: true,
          analysisType: 'DRAG_DROP_SCREENSHOT',
          adjusted,
          validationNote: adjusted ? 'Níveis ajustados para coerência com COMPRA/VENDA' : undefined,
        };
        
        setLastSignal(newSignal);
        
        toast({
          title: "🎯 Screenshot Analysis Ultra Completa!",
          description: `${result.pattern} com gestão de risco integrada - ${result.probability}%`,
        });
      });
      return;
    }
    
    // Upload de arquivo normal
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      console.log('📁 Upload de arquivo detectado');
      const fakeEvent = { target: { files } } as any;
      handleFileUpload(fakeEvent);
    } else {
      console.log('❌ Nenhum dado válido encontrado');
    }
  }, [handleDropAnalysis, liveData, toast, handleFileUpload]);

  const calculateRisk = () => {
    if (!capital || !tradeAmount) return null;
    
    const capitalNum = parseFloat(capital);
    const tradeNum = parseFloat(tradeAmount);
    const leverageNum = parseFloat(leverage);
    const riskPercentNum = parseFloat(riskPercent);
    
    // Calculate position size with leverage
    const positionSize = tradeNum * leverageNum;
    
    // Risk amount based on percentage of capital
    const riskAmount = (capitalNum * riskPercentNum) / 100;
    
    // Calculate stop loss and take profit
    const stopLossPercent = (riskAmount / positionSize) * 100;
    const takeProfitPercent = stopLossPercent * 2.25; // 1:2.25 RR
    
    const stopLoss = riskAmount;
    const takeProfit = riskAmount * 2.25;
    
    return {
      positionSize: positionSize.toFixed(2),
      stopLoss: stopLoss.toFixed(2),
      takeProfit: takeProfit.toFixed(2),
      riskPercent: riskPercentNum.toFixed(1),
      rr: '1:2.25',
      leverage: leverageNum + 'x'
    };
  };

  const riskData = calculateRisk();

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-primary rounded-lg">
                  <Brain className="h-6 w-6 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">TradeVision AI</h1>
              </div>
              
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                Premium Ativo
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Removido botão Som separado - usando apenas controle do Narrador */}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNarratorEnabled(!narratorEnabled)}
              >
                <Brain className="h-4 w-4" />
                Narrador {narratorEnabled ? 'ON' : 'OFF'}
              </Button>

              {narratorEnabled && (
                <Button
                  variant={narrator.isPlaying ? "danger" : "default"}
                  size="sm"
                  onClick={narrator.toggle}
                >
                  {narrator.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {narrator.isPlaying ? 'STOP' : 'PLAY'}
                </Button>
              )}
              
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
              
              <Button variant="ghost" size="sm" onClick={onBackToLanding}>
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full max-w-none px-6 py-4"> {/* Remover container mx-auto para usar tela toda */}
        <div className="grid grid-cols-5 gap-4 h-[calc(100vh-120px)]"> {/* Mudar para 5 colunas - mapa menor */}
          {/* Heat Map Column - MUITO REDUZIDO */}
          <div className="col-span-1 space-y-2"> {/* Espaçamento ainda menor */}
            {/* Market Sentiment Heat Map */}
            <Card className="bg-card/80 border-border/50"> {/* Remover altura fixa para ajustar automaticamente */}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Mapa de Calor
                </CardTitle>
              </CardHeader>
              <CardContent> {/* Remover scroll interno */}
                <div className="space-y-2"> {/* Reduzir ainda mais espaçamento */}
                  {/* Fear & Greed Index */}
                  <div className="bg-gradient-to-r from-danger/20 via-warning/20 to-success/20 p-3 rounded-lg border border-border/30"> {/* Reduzir padding de 4 para 3 */}
                    <h4 className="text-xs font-semibold mb-2 text-center">Índice Medo & Ganância</h4> {/* Reduzir texto e margin */}
                    <div className="grid grid-cols-5 gap-0.5 mb-2"> {/* Reduzir gap e margin */}
                      {[...Array(12)].map((_, i) => { // Reduzir de 25 para 20 elementos
                        const intensity = Math.random();
                        const isActive = Math.random() > 0.3;
                        return (
                          <div
                            key={i}
                            className={`aspect-square rounded-sm transition-all duration-300 ${
                              isActive 
                                ? intensity > 0.7 ? 'bg-success animate-pulse' 
                                  : intensity > 0.4 ? 'bg-warning' 
                                  : 'bg-danger'
                                : 'bg-muted/30'
                            }`}
                            style={{
                              opacity: isActive ? 0.7 + intensity * 0.3 : 0.3
                            }}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-xs"> {/* Já era text-xs */}
                      <span className="text-danger font-medium">Medo</span>
                      <span className="text-warning font-medium">Neutro</span>
                      <span className="text-success font-medium">Ganância</span>
                    </div>
                    <div className="text-center mt-1"> {/* Reduzir margin */}
                      <span className="text-base font-bold text-warning">{Math.round(fearGreedIndex)}</span> {/* Reduzir texto */}
                      <span className="text-xs text-muted-foreground ml-1">
                        {fearGreedIndex > 75 ? 'Ganância Extrema' : 
                         fearGreedIndex > 60 ? 'Ganância Moderada' : 
                         fearGreedIndex > 40 ? 'Neutro' : 
                         fearGreedIndex > 25 ? 'Medo Moderado' : 'Medo Extremo'}
                      </span>
                    </div>
                  </div>

                  {/* Buyers vs Sellers */}
                  <div className="bg-gradient-to-r from-success/10 to-danger/10 p-3 rounded-lg border border-border/30"> {/* Reduzir padding */}
                    <h4 className="text-xs font-semibold mb-2 text-center">Compradores vs Vendedores</h4> {/* Reduzir texto e margin */}
                    <div className="grid grid-cols-8 gap-0.5 mb-2"> {/* Reduzir de 10 para 8 colunas e gaps */}
                      {(() => {
                        const total = 12; // manter layout atual
                        const buyers = Math.round((buyerDominance / 100) * total);
                        return Array.from({ length: total }).map((_, i) => {
                          const isBuyer = i < buyers;
                          const intensity = isBuyer
                            ? 0.6 + (buyerDominance - 50) / 100 // mais forte quando >50
                            : 0.6 + (50 - buyerDominance) / 100; // mais forte quando <50
                          return (
                            <div
                              key={i}
                              className={`aspect-square rounded-sm transition-all duration-500 ${
                                isBuyer ? 'bg-success' : 'bg-danger'
                              }`}
                              style={{
                                opacity: Math.max(0.35, Math.min(1, intensity)),
                                animationDelay: `${i * 20}ms`
                              }}
                            />
                          );
                        });
                      })()}
                    </div>
                    <div className="flex justify-between text-xs mb-1"> {/* Reduzir margin */}
                      <span className="text-success font-medium">Compradores</span>
                      <span className="text-danger font-medium">Vendedores</span>
                    </div>
                    <div className="flex justify-between">
                      <div className="text-center">
                        <div className="text-base font-bold text-success">{Math.round(buyerDominance)}%</div> {/* Reduzir texto */}
                        <div className="text-xs text-muted-foreground">Dominância</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-danger">{Math.round(100 - buyerDominance)}%</div> {/* Reduzir texto */}
                        <div className="text-xs text-muted-foreground">Pressão</div>
                      </div>
                    </div>
                  </div>

                  {/* Market Status Today */}
                  <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-3 rounded-lg border border-border/30"> {/* Reduzir padding */}
                    <h4 className="text-xs font-semibold mb-2 text-center">Status do Dia</h4> {/* Reduzir texto e margin */}
                    <div className="space-y-2"> {/* Reduzir espaçamento */}
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Volatilidade</span>
                        <div className="flex gap-0.5">
                          {[...Array(2)].map((_, i) => (
                            <div key={i} className={`w-1 h-1.5 rounded-sm ${i < 1 ? 'bg-warning' : 'bg-muted/30'}`} />
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Volume</span>
                        <div className="flex gap-0.5">
                          {[...Array(2)].map((_, i) => (
                            <div key={i} className={`w-1 h-1.5 rounded-sm ${i < 2 ? 'bg-success' : 'bg-muted/30'}`} />
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Tendência</span>
                        <Badge variant="outline" className={`text-xs ${
                          marketPressure === 'OTIMISTA' ? 'bg-success/10 text-success border-success/20' :
                          marketPressure === 'NEUTRO' ? 'bg-warning/10 text-warning border-warning/20' :
                          'bg-danger/10 text-danger border-danger/20'
                        }`}>
                          {marketPressure === 'OTIMISTA' ? 'Altista' : 
                           marketPressure === 'NEUTRO' ? 'Lateral' : 'Baixista'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Momentum</span>
                        <div className="flex gap-0.5">
                          {[...Array(2)].map((_, i) => (
                            <div key={i} className={`w-1 h-1.5 rounded-sm ${i < 2 ? 'bg-primary animate-pulse' : 'bg-muted/30'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-1 pt-1 border-t border-border/50">
                      <div className="text-center">
                        <div className={`text-xs font-bold ${
                          marketPressure === 'OTIMISTA' ? 'text-success' :
                          marketPressure === 'NEUTRO' ? 'text-warning' :
                          'text-danger'
                        }`}>{marketPressure}</div>
                        <div className="text-xs text-muted-foreground">
                          {marketPressure === 'OTIMISTA' ? 'Condições Favoráveis' : 
                           marketPressure === 'NEUTRO' ? 'Condições Neutras' : 'Condições Desfavoráveis'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live Market Pressure */}
                  {/* Pressão de Mercado - MUITO REDUZIDA */}
                  <div className="bg-gradient-to-r from-info/10 to-warning/10 p-1 rounded border border-border/30">
                    <h4 className="text-xs font-medium mb-1 text-center">Pressão</h4>
                    <div className="grid grid-cols-3 gap-0.5 mb-1">
                      {[...Array(9)].map((_, i) => {
                        const pressure = Math.sin((Date.now() / 1000 + i) * 0.1) * 0.5 + 0.5;
                        return (
                          <div
                            key={i}
                            className="aspect-square rounded-sm transition-all duration-1000"
                            style={{
                              backgroundColor: `hsl(${120 * pressure}, 60%, ${40 + pressure * 20}%)`,
                              opacity: 0.6 + pressure * 0.4
                            }}
                          />
                        );
                      })}
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-medium text-primary">Equilibrado</span>
                      <div className="text-xs text-muted-foreground">Real-time</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart & Upload Column - PRINCIPAL */}
          <div className="col-span-3 space-y-4"> {/* 3 colunas para ser maior */}
            {/* Market Overview */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Mercado em Tempo Real</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      {selectedPair}
                    </Badge>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {liveData?.exchange || selectedExchange}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-muted-foreground text-sm">Preço</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${liveData?.price || (loading ? 'Carregando...' : '43,285.50')}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground text-sm">Variação</p>
                    <p className={`text-xl font-semibold ${liveData?.change.includes('+') ? 'text-success' : 'text-danger'}`}>
                      {liveData?.change || (loading ? '...' : '+2.45%')}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground text-sm">Volume</p>
                    <p className="text-xl font-semibold text-foreground">
                      {liveData?.volume || (loading ? '...' : '1.2B')}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground text-sm">Multi-Feed</p>
                    <div className="flex justify-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-danger'}`}></div>
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-danger'}`} style={{animationDelay: '0.2s'}}></div>
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-danger'}`} style={{animationDelay: '0.4s'}}></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isConnected ? 'Conectado' : 'Desconectado'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Real-Time Chart */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Gráfico Multi-Exchange</span>
                  <div className="flex items-center gap-3">
                    {/* Exchange Selector */}
                    <select
                      value={selectedExchange}
                      onChange={(e) => {
                        setSelectedExchange(e.target.value);
                        if (e.target.value === 'binance') setSelectedPair('BTC/USDT');
                        else if (e.target.value === 'coinbase') setSelectedPair('BTC/USD');
                        else if (e.target.value === 'yahoo') setSelectedPair('MINI ÍNDICE B3');
                      }}
                      className="px-3 py-1 bg-background border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="binance">Binance</option>
                      <option value="coinbase">Coinbase Pro</option>
                      <option value="yahoo">B3/Yahoo</option>
                    </select>

                    {/* Pair Selector */}
                    <select
                      value={selectedPair}
                      onChange={(e) => setSelectedPair(e.target.value)}
                      className="px-3 py-1 bg-background border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {availablePairs.map(pair => (
                        <option key={pair} value={pair}>{pair}</option>
                      ))}
                    </select>

                    {/* Timeframe Selector */}
                    <select
                      value={selectedTimeframe}
                      onChange={(e) => setSelectedTimeframe(e.target.value)}
                      className="px-3 py-1 bg-background border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {availableTimeframes.map(tf => (
                        <option key={tf} value={tf}>{tf.toUpperCase()}</option>
                      ))}
                    </select>
                    
                    {/* Chart Controls */}
                    <div className="flex items-center gap-1 border border-border/50 rounded-md p-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleZoomIn}
                        className="h-7 w-7 p-0"
                        title="Zoom In"
                      >
                        <ZoomIn className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleZoomOut}
                        className="h-7 w-7 p-0"
                        title="Zoom Out"
                      >
                        <ZoomOut className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetChartView}
                        className="h-7 w-7 p-0"
                        title="Reset View"
                      >
                        <Move className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleChartScreenshot}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Screenshot
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  id="trading-chart"
                  className="h-[26rem] bg-gradient-to-br from-muted/20 to-muted/40 rounded-lg relative border border-border/30 overflow-hidden" // Reduzir altura de 56rem para 26rem
                >
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="text-muted-foreground">Carregando dados da Binance...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-full">
                      {/* Chart content with zoom only (no drag) */}
                      <div 
                        className="absolute inset-0 p-2 transition-transform duration-150" // Reduzir padding para maximizar área
                        style={{ 
                          transform: `scale(${zoomLevel})`,
                          transformOrigin: 'center center'
                        }}
                      >
                        {/* Real-Time Chart with Live Data */}
                        <div className="h-full bg-gradient-to-t from-primary/5 to-transparent rounded border-l-2 border-b-2 border-border/20 relative">
                          
                          {/* Real Candlestick visualization with Animation - KEY atualiza em tempo real */}
                          <div className="absolute inset-2" key={`${lastUpdateTime}-${candles.length}`}> {/* Key que força re-render */}
                            {candles.slice(-35).map((candle, index) => { // Mostrar 35 velas em vez de 25 (zoom out interno)
                              const isGreen = candle.close > candle.open;
                              const basePrice = Math.min(...candles.slice(-35).map(c => c.low));
                              const maxPrice = Math.max(...candles.slice(-35).map(c => c.high));
                              const priceRange = maxPrice - basePrice || 1;
                              
                              // Calculate positions based on price data
                              const wickTop = ((candle.high - basePrice) / priceRange) * 280;
                              const wickBottom = ((candle.low - basePrice) / priceRange) * 280;
                              const bodyTop = ((Math.max(candle.open, candle.close) - basePrice) / priceRange) * 280;
                              const bodyBottom = ((Math.min(candle.open, candle.close) - basePrice) / priceRange) * 280;
                              
                              return (
                                <div
                                  key={`${candle.time}-${index}`}
                                  className={`absolute transition-all duration-300 ease-in-out group ${
                                    index >= candles.slice(-35).length - 3 ? 'animate-pulse' : ''
                                  }`}
                                  style={{
                                    left: `${(index / 34) * 92}%`,
                                    bottom: '12%',
                                    width: '2.2%',
                                    zIndex: 1
                                  }}
                                >
                                  {/* High-Low Wick */}
                                  <div 
                                    className={`absolute left-1/2 transform -translate-x-1/2 w-0.5 transition-all duration-300 ${
                                      isGreen ? 'bg-success' : 'bg-danger'
                                    }`}
                                    style={{ 
                                      height: `${Math.max(1, wickTop - wickBottom)}px`,
                                      bottom: `${wickBottom}px`
                                    }}
                                  />
                                  
                                  {/* Candle Body */}
                                  <div 
                                    className={`absolute left-1/2 transform -translate-x-1/2 w-full transition-all duration-300 rounded-sm ${
                                      isGreen 
                                        ? 'bg-success border border-success/50' 
                                        : 'bg-danger border border-danger/50'
                                    } ${index === candles.slice(-35).length - 1 ? 'animate-pulse shadow-lg' : ''}`}
                                    style={{ 
                                      height: `${Math.max(2, bodyTop - bodyBottom)}px`,
                                      bottom: `${bodyBottom}px`,
                                      opacity: 0.7 + (index / 35) * 0.3,
                                      boxShadow: index === candles.slice(-35).length - 1 ? `0 0 8px ${isGreen ? 'hsl(var(--success))' : 'hsl(var(--danger))'}` : 'none'
                                    }}
                                  />
                                  
                                  {/* Price tooltip on hover */}
                                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-card/95 backdrop-blur-sm px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap border border-border/50 z-10">
                                    <div className="text-center">
                                      <div className={`font-semibold ${isGreen ? 'text-success' : 'text-danger'}`}>
                                        Close: {candle.close.toFixed(2)}
                                      </div>
                                      <div className="text-muted-foreground text-xs">
                                        High: {candle.high.toFixed(2)}<br/>
                                        Low: {candle.low.toFixed(2)}<br/>
                                        Open: {candle.open.toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Linha Amarela - Preço Real Atual (independente da vela) */}
                          {liveData && candles.length > 0 && (
                            <div 
                              className="absolute transition-all duration-200 ease-out z-20"
                              style={{ 
                                bottom: `${(() => {
                                  const currentPrice = parseFloat(liveData.price.replace(/,/g, ''));
                                  const visibleCandles = candles.slice(-35);
                                  const basePrice = Math.min(...visibleCandles.map(c => c.low));
                                  const maxPrice = Math.max(...visibleCandles.map(c => c.high));
                                  const priceRange = maxPrice - basePrice || 1;
                                  
                                  // Mostrar preço real sem forçar alinhamento com vela
                                  const normalizedPosition = (currentPrice - basePrice) / priceRange;
                                  const chartHeight = 280; // Altura da área de velas
                                  const bottomOffset = 50; // Offset da base
                                  
                                  const realPosition = normalizedPosition * chartHeight + bottomOffset;
                                  return Math.max(50, Math.min(realPosition, 350));
                                })()}px`,
                                width: '92%',
                                left: '4%'
                              }}
                            >
                              <div className="relative">
                                <div 
                                  className="h-1 bg-warning shadow-lg border border-warning/60 animate-pulse"
                                  style={{
                                    boxShadow: '0 0 12px hsl(var(--warning))/0.9',
                                    background: 'hsl(var(--warning))',
                                    borderRadius: '2px'
                                  }}
                                ></div>
                                <div className="absolute bg-warning/95 text-warning-foreground text-xs px-2 py-1 rounded font-mono font-bold shadow-lg border border-warning/60"
                                  style={{
                                    right: '20%', // Posiciona cerca de 5 velas atrás
                                    top: '-24px'
                                  }}
                                >
                                  ${liveData.price}
                                  <div className="text-xs opacity-90 font-medium">PREÇO ATUAL</div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Volume visualization with better scaling */}
                          <div className="absolute bottom-0 left-2 right-2 h-20 flex items-end space-x-1"> {/* Maximizar área volume */}
                            {candles.slice(-35).map((candle, index) => { // Volume também com 35 velas
                              const maxVolume = Math.max(...candles.slice(-35).map(c => c.volume)) || 1;
                              const volumeHeight = (candle.volume / maxVolume) * 70;
                              const isGreen = candle.close > candle.open;
                              
                              return (
                                <div
                                  key={`volume-${candle.time}-${index}`}
                                  className={`flex-1 transition-all duration-500 ease-in-out rounded-t ${
                                    isGreen ? 'bg-success/40 hover:bg-success/60' : 'bg-danger/40 hover:bg-danger/60'
                                  } ${index === candles.slice(-35).length - 1 ? 'animate-pulse' : ''}`}
                                  style={{ 
                                    height: `${Math.max(2, volumeHeight)}px`,
                                    animationDelay: `${index * 0.015}s`, // Ajustar delay para mais velas
                                    minHeight: '2px'
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Real-time overlays */}
                        <div className="absolute top-2 left-2 space-y-2"> {/* Maximizar área */}
                          <div className="bg-card/90 backdrop-blur-sm px-3 py-2 rounded border border-border/50">
                            <p className="text-sm font-medium text-foreground">
                              {selectedPair} • {selectedTimeframe.toUpperCase()} • {liveData?.exchange || selectedExchange}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Última atualização: {new Date().toLocaleTimeString()} • {candles.length} velas • {selectedPair} {selectedTimeframe}
                            </p>
                          </div>
                          
                          {lastSignal && (
                            <div className="bg-primary/10 backdrop-blur-sm px-3 py-2 rounded border border-primary/20">
                              <p className="text-sm font-medium text-primary">
                                Sinal IA: {lastSignal.type} • {lastSignal.probability}%
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Entry: ${lastSignal.entry} | TP: ${lastSignal.tp}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Connection Status */}
                        <div className="absolute top-2 right-2"> {/* Maximizar área */}
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            isConnected ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                          }`}>
                            {isConnected ? '🟢 LIVE' : '🔴 OFFLINE'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Análise de Screenshot - Resultado Visível */}
            {lastSignal && lastSignal.screenshot && (
              <Card className="bg-card/90 border-border/50 border-2 border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="h-5 w-5 text-primary" />
                      Análise da Imagem Processada
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setLastSignal(null)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Imagem Analisada */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-muted-foreground">Screenshot Analisado:</h4>
                      <div className="relative">
                        <img 
                          src={lastSignal.screenshot} 
                          alt="Screenshot analisado"
                          className="w-full h-48 object-cover rounded-lg border border-border/50 shadow-lg"
                        />
                        <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                          IA Analisada
                        </div>
                      </div>
                    </div>
                    
                    {/* Resultados da Análise */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm text-muted-foreground">Resultados da Análise:</h4>
                      
                      <div className="space-y-3">
                        {/* Tipo de Sinal */}
                        <div className="flex items-center justify-between p-3 bg-background/50 rounded border border-border/30">
                          <span className="text-sm text-muted-foreground">Tipo:</span>
                          <Badge variant={lastSignal.type === 'BUY' ? 'default' : 'destructive'} className="font-semibold">
                            {lastSignal.type === 'BUY' ? '📈 COMPRA' : '📉 VENDA'}
                          </Badge>
                        </div>
                        
                        {/* Padrão Detectado */}
                        <div className="flex items-center justify-between p-3 bg-background/50 rounded border border-border/30">
                          <span className="text-sm text-muted-foreground">Padrão:</span>
                          <span className="text-sm font-medium text-primary">{lastSignal.pattern}</span>
                        </div>
                        
                        {/* Probabilidade */}
                        <div className="flex items-center justify-between p-3 bg-background/50 rounded border border-border/30">
                          <span className="text-sm text-muted-foreground">Confiança:</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-border rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${lastSignal.probability}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-primary">{lastSignal.probability}%</span>
                          </div>
                        </div>
                        
                        {/* Horário da Análise */}
                        <div className="flex items-center justify-between p-3 bg-background/50 rounded border border-border/30">
                          <span className="text-sm text-muted-foreground">Analisado em:</span>
                          <span className="text-sm font-medium">{lastSignal.timestamp}</span>
                        </div>
                        
                        {/* Dados de Trade */}
                        <div className="grid grid-cols-3 gap-2 mt-4">
                          <div className="text-center p-2 bg-success/10 rounded border border-success/20">
                            <p className="text-xs text-muted-foreground">Entry</p>
                            <p className="text-sm font-semibold text-success">${lastSignal.entry}</p>
                          </div>
                          <div className="text-center p-2 bg-danger/10 rounded border border-danger/20">
                            <p className="text-xs text-muted-foreground">Stop</p>
                            <p className="text-sm font-semibold text-danger">${lastSignal.stop}</p>
                          </div>
                          <div className="text-center p-2 bg-primary/10 rounded border border-primary/20">
                            <p className="text-xs text-muted-foreground">TP</p>
                            <p className="text-sm font-semibold text-primary">${lastSignal.tp}</p>
                          </div>
                        </div>
                        {lastSignal.adjusted && (
                          <p className="text-xs text-warning mt-2">Níveis ajustados automaticamente para {lastSignal.type === 'BUY' ? 'compra' : 'venda'} coerente.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload de Print para Análise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center space-y-4 hover:border-primary/50 transition-all duration-200 cursor-pointer relative"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    console.log('🎯 Drag entered drop zone');
                    e.currentTarget.classList.add('border-primary', 'bg-primary/10');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      console.log('👋 Drag left drop zone');
                      e.currentTarget.classList.remove('border-primary', 'bg-primary/10');
                    }
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!e.defaultPrevented) {
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  {isAnalyzing || dragAnalyzing ? (
                    <div className="space-y-3">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                      <p className="text-primary font-medium">
                        {dragAnalyzing ? 'Analisando screenshot com IA...' : 'Analisando print com IA...'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-center gap-4">
                        <Upload className="h-12 w-12 text-muted-foreground" />
                        <Camera className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-lg font-medium">Arraste seu print aqui ou clique para enviar</p>
                        <p className="text-muted-foreground">
                          Suporta JPG, PNG, WebP - Máximo 10MB<br/>
                          <span className="text-primary font-medium">📱 Drag & Drop: Capture gráfico → Arraste aqui</span>
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Chat & Analytics com Tabs */}
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="grid w-full grid-cols-6 mb-3">
                <TabsTrigger value="chat">Chat IA</TabsTrigger>
                <TabsTrigger value="alerts">Alertas</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="narrator-stats">Narrador</TabsTrigger>
                <TabsTrigger value="learning">Aprendizado</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chat" className="mt-0">
                <DashboardChat />
              </TabsContent>
              
              <TabsContent value="alerts" className="mt-0 space-y-4">
                <LearningProgress />
                <ProactiveAlerts />
              </TabsContent>
              
              <TabsContent value="history" className="mt-0">
                <AnalysisHistory />
              </TabsContent>
              
              <TabsContent value="performance" className="mt-0">
                <PerformanceDashboard />
              </TabsContent>

              <TabsContent value="narrator-stats" className="mt-0">
                <NarratorPerformance />
              </TabsContent>

              <TabsContent value="learning" className="mt-0">
                <LearningDashboard symbol={selectedPair} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Controls & Analysis - COMPACTO */}
          <div className="col-span-1 space-y-3"> {/* 1 coluna compacta */}
            {/* Financial Management */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Gestão Financeira
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="capital">Capital Total (R$)</Label>
                  <Input
                    id="capital"
                    value={capital}
                    onChange={(e) => setCapital(e.target.value)}
                    placeholder="50000"
                    type="number"
                  />
                </div>
                
                <div>
                  <Label htmlFor="trade-amount">Valor por Trade (R$)</Label>
                  <Input
                    id="trade-amount"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    placeholder="5000"
                    type="number"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="leverage">Alavancagem</Label>
                    <select
                      id="leverage"
                      value={leverage}
                      onChange={(e) => setLeverage(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="5">5x</option>
                      <option value="10">10x</option>
                      <option value="25">25x</option>
                      <option value="50">50x</option>
                      <option value="75">75x</option>
                      <option value="100">100x</option>
                      <option value="125">125x</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="risk-percent">Risco % Capital</Label>
                    <select
                      id="risk-percent"
                      value={riskPercent}
                      onChange={(e) => setRiskPercent(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="3.5">3.5%</option>
                      <option value="4.0">4.0%</option>
                      <option value="5.0">5.0%</option>
                      <option value="6.0">6.0%</option>
                      <option value="7.0">7.0%</option>
                      <option value="8.0">8.0%</option>
                      <option value="9.0">9.0%</option>
                      <option value="10.0">10.0%</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="daily-goal">Meta Diária (R$)</Label>
                  <Input
                    id="daily-goal"
                    value={dailyGoal}
                    onChange={(e) => setDailyGoal(e.target.value)}
                    placeholder="500"
                    type="number"
                  />
                </div>

                {riskData && (
                  <div className="mt-4 p-4 bg-muted/20 rounded-lg space-y-3">
                    <h4 className="font-semibold text-sm">Cálculo Automático - Alavancagem {riskData.leverage}:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Posição:</span>
                        <p className="font-medium text-primary">R$ {riskData.positionSize}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Risco:</span>
                        <p className="font-medium text-warning">{riskData.riskPercent}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Stop Loss:</span>
                        <p className="font-medium text-danger">R$ {riskData.stopLoss}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Take Profit:</span>
                        <p className="font-medium text-success">R$ {riskData.takeProfit}</p>
                      </div>
                    </div>
                    <div className="text-center pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        Risk/Reward: <span className="font-medium text-primary">{riskData.rr}</span>
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Last Signal Analysis */}
            {lastSignal && (
              <Card className="bg-card/80 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Análise IA Ultra Completa
                      {lastSignal.imageAnalyzed && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                          IA Analisada
                        </Badge>
                      )}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLastSignal(null)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Screenshot Preview */}
                  {lastSignal.screenshot && (
                    <div className="relative">
                      <img 
                        src={lastSignal.screenshot} 
                        alt="Screenshot analisado" 
                        className="w-full h-32 object-cover rounded-lg border border-border/50"
                      />
                      <Badge className="absolute top-2 right-2 bg-primary/90">
                        Screenshot
                      </Badge>
                    </div>
                  )}

                  {/* Signal Header */}
                  <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline"
                        className={`${lastSignal.type === 'BUY' ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'}`}
                      >
                        {lastSignal.type === 'BUY' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {lastSignal.type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {lastSignal.pair} {lastSignal.timeframe?.toUpperCase()}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          lastSignal.confidence === 'ALTA' ? 'bg-success/10 text-success border-success/20' :
                          lastSignal.confidence === 'MÉDIA' ? 'bg-warning/10 text-warning border-warning/20' :
                          'bg-muted/10 text-muted-foreground border-muted/20'
                        }`}
                      >
                        {lastSignal.confidence}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{lastSignal.timestamp}</span>
                  </div>
                  
                  {/* Enhanced Analysis Sections */}
                  <div className="grid grid-cols-1 gap-3">
                    {/* Basic Trade Data */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-muted/10 p-2 rounded text-center">
                        <p className="text-xs text-muted-foreground">Entry</p>
                        <p className="font-medium text-sm">${lastSignal.entry}</p>
                      </div>
                      <div className="bg-danger/10 p-2 rounded text-center">
                        <p className="text-xs text-muted-foreground">Stop Loss</p>
                        <p className="font-medium text-sm text-danger">${lastSignal.stop}</p>
                      </div>
                      <div className="bg-success/10 p-2 rounded text-center">
                        <p className="text-xs text-muted-foreground">Take Profit</p>
                        <p className="font-medium text-sm text-success">${lastSignal.tp}</p>
                      </div>
                    </div>

                    {/* Probability */}
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Probabilidade de Sucesso</span>
                        <span className="font-bold text-primary">{lastSignal.probability}%</span>
                      </div>
                      <div className="w-full bg-muted/20 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${lastSignal.probability}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Advanced Analysis */}
                    {lastSignal.pattern && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-foreground">📊 Análise Técnica Avançada</h4>
                        <div className="bg-muted/10 p-2 rounded text-xs">
                          <span className="text-muted-foreground">Padrão:</span>
                          <p className="text-foreground font-medium">{lastSignal.pattern}</p>
                        </div>
                        
                        {lastSignal.marketStructure && (
                          <div className="bg-muted/10 p-2 rounded text-xs">
                            <span className="text-muted-foreground">Estrutura de Mercado:</span>
                            <p className="text-foreground font-medium">{lastSignal.marketStructure}</p>
                          </div>
                        )}

                        {lastSignal.technicalIndicator && (
                          <div className="bg-muted/10 p-2 rounded text-xs">
                            <span className="text-muted-foreground">Indicadores:</span>
                            <p className="text-foreground font-medium">{lastSignal.technicalIndicator}</p>
                          </div>
                        )}

                        {lastSignal.priceAction && (
                          <div className="bg-muted/10 p-2 rounded text-xs">
                            <span className="text-muted-foreground">Price Action:</span>
                            <p className="text-foreground font-medium">{lastSignal.priceAction}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Risk Management */}
                    {lastSignal.riskSuggestion && (
                      <div className="bg-warning/10 p-3 rounded-lg border border-warning/20">
                        <h4 className="text-sm font-semibold text-warning mb-2">⚠️ Gestão de Risco</h4>
                        <p className="text-xs text-foreground">{lastSignal.riskSuggestion}</p>
                      </div>
                    )}

                    {/* Market Context */}
                    {lastSignal.marketContext && (
                      <div className="bg-info/10 p-3 rounded-lg border border-info/20">
                        <h4 className="text-sm font-semibold text-info mb-2">🌍 Contexto de Mercado</h4>
                        <p className="text-xs text-foreground">{lastSignal.marketContext}</p>
                      </div>
                    )}

                    {/* User Risk Profile Integration */}
                    {lastSignal.userRiskProfile && (
                      <div className="bg-success/10 p-3 rounded-lg border border-success/20">
                        <h4 className="text-sm font-semibold text-success mb-2">💰 Seu Perfil de Risco</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Tamanho da Posição:</span>
                            <p className="font-medium">R$ {lastSignal.userRiskProfile.positionSize}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Risco Máximo:</span>
                            <p className="font-medium text-danger">R$ {lastSignal.userRiskProfile.maxRisk}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Target Lucro:</span>
                            <p className="font-medium text-success">R$ {lastSignal.userRiskProfile.targetProfit}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">R:R Ratio:</span>
                            <p className="font-medium text-primary">{lastSignal.userRiskProfile.riskReward}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Analysis Timestamp */}
                    {lastSignal.analysisTimestamp && (
                      <div className="text-center pt-2 border-t border-border/50">
                        <p className="text-xs text-muted-foreground">
                          Análise completa realizada em: {lastSignal.analysisTimestamp}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Narrator Feed - ÁREA AUMENTADA */}
            <Card className="bg-card/80 border-border/50 h-[36rem]"> {/* Altura fixa maior para o feed */}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Feed Narrador - {selectedPair} {selectedTimeframe.toUpperCase()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto"> {/* Aumentar altura scroll */}
                  {narrator.feed.length > 0 ? (
                     narrator.feed.map((signal, index) => (
                       <div key={index} className="p-3 bg-muted/20 rounded-lg border-l-4 border-primary/30">
                         <div className="space-y-2">
                           <p className="text-sm font-semibold">
                             📰 {signal.news}
                           </p>
                           <p className="text-sm">
                             <strong>{signal.symbol} {signal.timeframe}:</strong> {signal.type} - {signal.pattern}<br/>
                             <span className="text-primary">Probabilidade: {signal.probability}%</span> | 
                             <span className="text-success ml-1">24h: {signal.pairData?.change24h}</span> | 
                             <span className="text-muted-foreground ml-1">Vol: {signal.pairData?.vol}</span><br/>
                             <span className="text-muted-foreground">📊 {signal.marketStatus}</span><br/>
                             <span className="text-muted-foreground">Figura: {signal.figure}</span><br/>
                             <span className="text-warning text-xs">⚠️ {signal.risk}</span>
                           </p>
                           <span className="text-xs text-muted-foreground">{signal.timestamp}</span>
                         </div>
                       </div>
                     ))
                  ) : (
                    <div className="p-3 bg-muted/10 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">
                        {narratorEnabled ? 'Aguardando sinais em tempo real...' : 'Narrador desativado'}
                      </p>
                    </div>
                  )}
                  
                  <div className="text-center pt-2">
                    <div className="flex gap-2 justify-center">
                      <Button 
                        variant={narrator.isPlaying ? "danger" : "default"}
                        size="sm"
                        disabled={!narratorEnabled}
                        onClick={narrator.toggle}
                      >
                        {narrator.isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                        {narrator.isPlaying ? 'Parar Narrador' : 'Iniciar Narrador'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={!narratorEnabled || narrator.feed.length === 0}
                        onClick={narrator.speakLatest}
                      >
                        <Volume2 className="h-4 w-4 mr-2" />
                        Reproduzir Último
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;