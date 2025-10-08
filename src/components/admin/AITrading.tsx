import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMultiExchangeData } from '@/hooks/useMultiExchangeData';
import { useTechnicalIndicators } from '@/hooks/useTechnicalIndicators';
import { usePatternDetection } from '@/hooks/usePatternDetection';
// import InteractiveChart from '@/components/analytics/InteractiveChart';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Shield, 
  Activity,
  Send,
  Bot,
  Play,
  Pause
} from 'lucide-react';

interface Trade {
  id: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice?: number;
  exitTime?: string;
  stopLoss: number;
  takeProfit: number;
  size: number;
  leverage: number;
  timestamp: string;
  status: 'OPEN' | 'CLOSED';
  result?: 'WIN' | 'LOSS';
  pnl?: number;
  reason: string;
}

interface AITradingProps {
  symbol?: string;
}

export function AITrading({ symbol = 'BTC/USDT' }: AITradingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTimeframe] = useState('1m'); // M1 para scalping
  const { candles, liveData, isConnected } = useMultiExchangeData('binance', symbol, selectedTimeframe);
  
  const formattedCandles = candles.map(c => ({
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
    timestamp: c.time
  }));
  
  const technicalIndicators = useTechnicalIndicators(formattedCandles);
  const patterns = usePatternDetection(formattedCandles);

  const [isTrading, setIsTrading] = useState(true); // 🤖 INICIA AUTOMATICAMENTE
  const [trades, setTrades] = useState<Trade[]>([]);
  const [currentPosition, setCurrentPosition] = useState<Trade | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [stats, setStats] = useState({
    totalTrades: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    totalPnL: 0,
    balance: 1000 // Saldo inicial simulado: $1000
  });

  const tradingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Estados para controle automático
  const [autoResetEnabled, setAutoResetEnabled] = useState(true);
  const [backgroundTrading, setBackgroundTrading] = useState(false);
  const [manualTradeTrigger, setManualTradeTrigger] = useState(false);
  const [manualExitTrigger, setManualExitTrigger] = useState(false);
  const [nextTradeTime, setNextTradeTime] = useState<Date | null>(null);
  const [brazilTime, setBrazilTime] = useState<string>('');
  
  // Contador único para IDs de mensagens
  const messageCounterRef = useRef(0);
  
  // Limpar mensagens duplicadas ao iniciar
  useEffect(() => {
    setChatMessages(prev => {
      const uniqueMessages = Array.from(
        new Map(prev.map(m => [m.id, m])).values()
      );
      if (uniqueMessages.length !== prev.length) {
        console.log('🧹 Limpando mensagens duplicadas:', prev.length - uniqueMessages.length);
      }
      return uniqueMessages;
    });
  }, []);
  
  // 📊 Performance de Sinais do Narrador
  const [narratorStats, setNarratorStats] = useState({
    totalSignals: 0,
    validatedSignals: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    avgVariation: 0
  });

  // 📊 Carregar Performance de Sinais do Narrador
  useEffect(() => {
    const loadNarratorPerformance = async () => {
      try {
        const { data: validatedSignals, error } = await supabase
          .from('narrator_signals')
          .select('*')
          .not('result', 'is', null);

        if (error) throw error;

        const { data: allSignals } = await supabase
          .from('narrator_signals')
          .select('id');

        const wins = validatedSignals?.filter((s: any) => s.result === 'WIN').length || 0;
        const losses = validatedSignals?.filter((s: any) => s.result === 'LOSS').length || 0;
        const total = validatedSignals?.length || 0;
        const winRate = total > 0 ? (wins / total) * 100 : 0;

        const variations = validatedSignals
          ?.filter((s: any) => s.variation)
          .map((s: any) => parseFloat(s.variation.replace('%', '').replace('+', ''))) || [];
        const avgVariation = variations.length > 0 
          ? variations.reduce((a, b) => a + b, 0) / variations.length 
          : 0;

        setNarratorStats({
          totalSignals: allSignals?.length || 0,
          validatedSignals: total,
          wins,
          losses,
          winRate,
          avgVariation
        });
      } catch (error) {
        console.error('❌ Erro ao carregar performance do narrador:', error);
      }
    };

    loadNarratorPerformance();
    const interval = setInterval(loadNarratorPerformance, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, []);

  // Timer do Brasil
  useEffect(() => {
    const updateBrazilTime = () => {
      const now = new Date();
      const brazilTime = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(now);
      setBrazilTime(brazilTime);
    };

    updateBrazilTime();
    const interval = setInterval(updateBrazilTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Debug: Log quando dados carregarem
  useEffect(() => {
    console.log('📊 AITrading - Dados carregados:', {
      candles: candles.length,
      liveData: liveData?.price,
      isConnected,
      technicalIndicators: !!technicalIndicators,
      patterns: !!patterns,
      symbol,
      selectedTimeframe
    });
    
    if (candles.length > 0) {
      console.log('🕯️ Último candle:', candles[candles.length - 1]);
    }
    
    if (technicalIndicators) {
      console.log('📈 Indicadores técnicos:', technicalIndicators);
    }
  }, [candles, liveData, isConnected, technicalIndicators, patterns, symbol, selectedTimeframe]);

  // Configurações fixas
  const TRADE_SIZE = 0.01; // 0.01 BTC
  const LEVERAGE = 50; // 50x
  const STOP_LOSS_PERCENT = 0.5; // 0.5% (com 50x = 25% do capital)
  const TAKE_PROFIT_PERCENT = 1.0; // 1.0% (com 50x = 50% do capital)

  // Função para enviar mensagem ao TradeVision IA
  const sendMessageToAI = async (message: string, isSystem: boolean = false) => {
    messageCounterRef.current += 1;
    const newMessage = {
      id: `msg-${Date.now()}-${messageCounterRef.current}`,
      role: isSystem ? 'system' : 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    // Verificar se mensagem já existe (evitar duplicatas)
    setChatMessages(prev => {
      const exists = prev.some(m => m.content === message && m.role === newMessage.role);
      if (exists) {
        console.log('⚠️ Mensagem duplicada ignorada:', message.substring(0, 50));
        return prev;
      }
      return [newMessage, ...prev];
    });

    if (!isSystem) {
      // Chamar TradeVision IA real
      try {
        const { data, error } = await supabase.functions.invoke('trade-chat', {
          body: {
            message,
            userId: user?.id,
            sessionId: `ai-trading-${Date.now()}`,
            realTimeContext: {
              symbol,
              timeframe: selectedTimeframe,
              price: liveData?.price,
              technicalIndicators,
              patterns,
              currentPosition,
              tradingStats: stats
            }
          }
        });

        if (!error && data) {
          const aiMessage = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: data.response,
            timestamp: new Date().toISOString()
          };
          setChatMessages(prev => [aiMessage, ...prev]);
        }
      } catch (error) {
        console.error('Erro ao chamar TradeVision IA:', error);
      }
    }
  };

  // Trigger manual para executar trade
  const triggerManualTrade = async () => {
    if (!liveData || !technicalIndicators || !patterns) {
      sendMessageToAI('❌ Dados insuficientes para executar trade manual', true);
      return;
    }

    setManualTradeTrigger(true);
    sendMessageToAI('🎯 TRIGGER MANUAL: Executando análise forçada...', true);
    await analyzeAndTrade();
    setManualTradeTrigger(false);
  };

  // Trigger manual para sair da posição
  const triggerManualExit = () => {
    if (!currentPosition) {
      sendMessageToAI('❌ Nenhuma posição aberta para fechar', true);
      return;
    }

    setManualExitTrigger(true);
    const currentPrice = parseFloat(liveData?.price?.replace(/,/g, '') || '0');
    closePosition(currentPrice, 'WIN', 'Saída manual solicitada');
    sendMessageToAI('🎯 TRIGGER MANUAL: Posição fechada manualmente', true);
    setManualExitTrigger(false);
  };

  // Função para analisar mercado e decidir trade - 100% AUTOMÁTICO
  const analyzeAndTrade = async () => {
    if (!liveData || !technicalIndicators || !patterns) return;

    const currentPrice = parseFloat(liveData.price?.replace(/,/g, '') || '0');
    if (currentPrice === 0) return;

    // Se já tem posição aberta, verificar stop/target
    if (currentPosition) {
      checkPositionExit(currentPrice);
      return;
    }

    // TRADING 100% AUTOMÁTICO - A cada 3 minutos executa trade
    try {
      const { data, error } = await supabase.functions.invoke('trade-chat', {
        body: {
          message: `🤖 TRADING AUTOMÁTICO M1 - EXECUTAR TRADE AGORA:

⏰ HORA BRASIL: ${brazilTime}
📊 DADOS ATUAIS:
- Par: ${symbol}
- Preço: $${currentPrice.toFixed(2)}
- RSI: ${technicalIndicators.rsi14?.toFixed(1) || 'N/A'}
- MACD: ${technicalIndicators.macdHistogram?.toFixed(4) || 'N/A'}
- EMA20: ${technicalIndicators.ema20?.toFixed(2) || 'N/A'}
- EMA50: ${technicalIndicators.ema50?.toFixed(2) || 'N/A'}

🎯 PADRÕES DETECTADOS:
${patterns.orderBlockDetected ? '✅ Order Block' : '❌ Order Block'}
${patterns.fvgDetected ? '✅ Fair Value Gap' : '❌ Fair Value Gap'}
${patterns.bosDetected ? '✅ Break of Structure' : '❌ Break of Structure'}

⚙️ PARÂMETROS FIXOS:
- Tamanho: ${TRADE_SIZE} BTC
- Alavancagem: ${LEVERAGE}x
- Stop Loss: ${STOP_LOSS_PERCENT}%
- Take Profit: ${TAKE_PROFIT_PERCENT}%

🚀 INSTRUÇÃO: Execute trade automaticamente! Responda APENAS:
- "BUY" - Para compra
- "SELL" - Para venda
- "HOLD" - Para aguardar

Se BUY ou SELL, explique o motivo técnico em 1 linha.

⚠️ IMPORTANTE: Só execute 1 trade por vez. Se já houver posição aberta, responda "HOLD".`,
          userId: user?.id,
          sessionId: `auto-trading-${Date.now()}`,
          realTimeContext: {
            symbol,
            timeframe: selectedTimeframe,
            price: currentPrice,
            technicalIndicators,
            patterns,
            tradingMode: 'auto-scalping-m1',
            leverage: LEVERAGE,
            size: TRADE_SIZE,
            brazilTime,
            autoMode: true
          }
        }
      });

      if (error || !data) {
        console.error('❌ Erro na análise automática:', error);
        sendMessageToAI('❌ Erro na análise automática. Tentando novamente em 3 minutos...', true);
        return;
      }

      const response = data.response.toUpperCase();
      console.log('🤖 TradeVision IA Auto Response:', response);
      
      // Detectar sinal de entrada - MAIS AGRESSIVO
      const shouldBuy = response.includes('BUY') || response.includes('COMPRA') || response.includes('LONG') || response.includes('ALTA');
      const shouldSell = response.includes('SELL') || response.includes('VENDA') || response.includes('SHORT') || response.includes('BAIXA');

      if (shouldBuy) {
        const reason = response.substring(response.indexOf('BUY') + 3).trim() || 'Setup bullish automático detectado';
        openPosition('BUY', currentPrice, `🤖 AUTO: ${reason}`);
        sendMessageToAI(`🚀 TRADE AUTOMÁTICO EXECUTADO: BUY @ $${currentPrice.toFixed(2)} - ${reason}`, true);
      } else if (shouldSell) {
        const reason = response.substring(response.indexOf('SELL') + 3).trim() || 'Setup bearish automático detectado';
        openPosition('SELL', currentPrice, `🤖 AUTO: ${reason}`);
        sendMessageToAI(`🚀 TRADE AUTOMÁTICO EXECUTADO: SELL @ $${currentPrice.toFixed(2)} - ${reason}`, true);
      } else {
        // HOLD ou análise negativa
        sendMessageToAI(`⏳ AUTO: ${response} - Aguardando próximo ciclo (1min)`, true);
      }

      // Atualizar próximo trade
      const nextTime = new Date(Date.now() + 60000); // 1 minuto
      setNextTradeTime(nextTime);

    } catch (error) {
      console.error('❌ Erro na análise automática:', error);
      sendMessageToAI('❌ Erro na análise automática. Tentando novamente em 1 minuto...', true);
    }
  };

  // Abrir posição
  const openPosition = (type: 'BUY' | 'SELL', entryPrice: number, reason: string) => {
    const stopLoss = type === 'BUY' 
      ? entryPrice * (1 - STOP_LOSS_PERCENT / 100)
      : entryPrice * (1 + STOP_LOSS_PERCENT / 100);

    const takeProfit = type === 'BUY'
      ? entryPrice * (1 + TAKE_PROFIT_PERCENT / 100)
      : entryPrice * (1 - TAKE_PROFIT_PERCENT / 100);

    const trade: Trade = {
      id: `trade-${Date.now()}`,
      type,
      entryPrice,
      stopLoss,
      takeProfit,
      size: TRADE_SIZE,
      leverage: LEVERAGE,
      timestamp: new Date().toISOString(),
      status: 'OPEN',
      reason: reason.substring(0, 200)
    };

    setCurrentPosition(trade);
    setTrades(prev => [trade, ...prev]);

    // SALVAR TRADE NO BANCO PARA TRADEVISION IA
    saveTradeToDatabase(trade, 'OPEN');

    sendMessageToAI(
      `🤖 TradeVision IA abriu posição ${type} @ $${entryPrice.toFixed(2)} | Stop: $${stopLoss.toFixed(2)} | Target: $${takeProfit.toFixed(2)} | Tamanho: ${TRADE_SIZE} BTC (${LEVERAGE}x)`,
      true
    );
  };

  // 🧠 ENVIAR FEEDBACK PARA A IA APRENDER
  const sendFeedbackToAI = async (trade: Trade, action: 'OPEN' | 'CLOSE') => {
    try {
      if (action === 'CLOSE' && trade.result) {
        const feedbackMessage = `
📊 **FEEDBACK DE TRADE SIMULADO**

🆔 Trade ID: ${trade.id}
📈 Tipo: ${trade.type}
💰 Entrada: $${trade.entryPrice.toFixed(2)}
💵 Saída: $${trade.exitPrice?.toFixed(2) || 'N/A'}
🎯 Take Profit: $${trade.takeProfit.toFixed(2)}
🛡️ Stop Loss: $${trade.stopLoss.toFixed(2)}

${trade.result === 'WIN' ? '✅ RESULTADO: GANHO' : '❌ RESULTADO: PERDA'}
💸 P&L: $${trade.pnl?.toFixed(2) || '0.00'}

📝 Motivo: ${trade.reason}

🧠 **APRENDIZADO:**
${trade.result === 'WIN' 
  ? 'Este padrão funcionou bem! Considere usar em situações similares.' 
  : 'Este padrão falhou. Revise as condições de entrada e ajuste a estratégia.'}
`;

        // Enviar para o TradeVision IA processar e aprender
        const { error } = await supabase.functions.invoke('trade-chat', {
          body: {
            message: feedbackMessage,
            userId: user?.id,
            sessionId: `trade-feedback-${trade.id}`,
            realTimeContext: {
              tradeResult: trade.result,
              tradePnL: trade.pnl,
              tradeType: trade.type,
              entryPrice: trade.entryPrice,
              exitPrice: trade.exitPrice,
              reason: trade.reason,
              technicalContext: trade
            }
          }
        });

        if (!error) {
          console.log('✅ Feedback enviado para TradeVision IA aprender:', trade.id);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao enviar feedback para IA:', error);
    }
  };

  // Salvar trade no banco para TradeVision IA
  const saveTradeToDatabase = async (trade: Trade, action: 'OPEN' | 'CLOSE') => {
    try {
      const tradeData = {
        id: trade.id,
        user_id: user?.id,
        symbol: symbol,
        timeframe: selectedTimeframe,
        trade_type: trade.type,
        entry_price: trade.entryPrice.toString(),
        exit_price: trade.exitPrice?.toString() || null,
        stop_loss: trade.stopLoss.toString(),
        take_profit: trade.takeProfit.toString(),
        size: trade.size.toString(),
        leverage: trade.leverage,
        status: trade.status,
        result: trade.result || null,
        pnl: trade.pnl || null,
        reason: trade.reason,
        action: action,
        timestamp: trade.timestamp,
        exit_timestamp: trade.exitTime || null,
        brazil_time: brazilTime,
        technical_context: JSON.stringify({
          rsi: technicalIndicators?.rsi14,
          macd: technicalIndicators?.macdHistogram,
          ema20: technicalIndicators?.ema20,
               ema50: technicalIndicators?.ema50,
          patterns: patterns
        })
      };

      const { error } = await (supabase as any)
        .from('ai_trades')
        .upsert(tradeData);

      if (error) {
        console.error('❌ Erro ao salvar trade no banco:', error);
      } else {
        console.log('✅ Trade salvo no banco para TradeVision IA:', tradeData.id);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar trade:', error);
    }
  };

  // Auto-reset da banca quando zerar
  const checkAndResetBalance = () => {
    if (stats.balance <= 0 && autoResetEnabled) {
      setStats(prev => ({
        ...prev,
        balance: 1000, // Reset para $1000
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalPnL: 0
      }));
      
      sendMessageToAI('🔄 BANCA RESETADA! Saldo zerado, retornando para $1000. TradeVision IA continua operando...', true);
      toast({ title: '🔄 Banca Resetada', description: 'Saldo zerado, retornando para $1000' });
    }
  };

  // Verificar saída da posição
  const checkPositionExit = (currentPrice: number) => {
    if (!currentPosition) return;

    const { type, entryPrice, stopLoss, takeProfit, size, leverage } = currentPosition;

    let shouldClose = false;
    let result: 'WIN' | 'LOSS' = 'WIN';
    let exitReason = '';

    // Verificar stop loss
    if (type === 'BUY' && currentPrice <= stopLoss) {
      shouldClose = true;
      result = 'LOSS';
      exitReason = 'Stop Loss acionado';
    } else if (type === 'SELL' && currentPrice >= stopLoss) {
      shouldClose = true;
      result = 'LOSS';
      exitReason = 'Stop Loss acionado';
    }

    // Verificar take profit
    if (type === 'BUY' && currentPrice >= takeProfit) {
      shouldClose = true;
      result = 'WIN';
      exitReason = 'Take Profit atingido';
    } else if (type === 'SELL' && currentPrice <= takeProfit) {
      shouldClose = true;
      result = 'WIN';
      exitReason = 'Take Profit atingido';
    }

    if (shouldClose) {
      closePosition(currentPrice, result, exitReason);
    }
  };

  // Fechar posição
  const closePosition = (exitPrice: number, result: 'WIN' | 'LOSS', reason: string) => {
    if (!currentPosition) return;

    const { type, entryPrice, size, leverage } = currentPosition;

    // Calcular P&L
    const priceChange = type === 'BUY' 
      ? (exitPrice - entryPrice) / entryPrice
      : (entryPrice - exitPrice) / entryPrice;

    const pnl = priceChange * size * exitPrice * leverage;

    // Atualizar trade
    const closedTrade: Trade = {
      ...currentPosition,
      exitPrice,
      status: 'CLOSED',
      result,
      pnl
    };

    setTrades(prev => prev.map(t => t.id === currentPosition.id ? closedTrade : t));
    setCurrentPosition(null);

    // SALVAR TRADE FECHADO NO BANCO
    saveTradeToDatabase(closedTrade, 'CLOSE');

    // 🧠 ENVIAR FEEDBACK PARA A IA APRENDER COM O RESULTADO
    sendFeedbackToAI(closedTrade, 'CLOSE');

    // Atualizar estatísticas
    setStats(prev => ({
      totalTrades: prev.totalTrades + 1,
      wins: prev.wins + (result === 'WIN' ? 1 : 0),
      losses: prev.losses + (result === 'LOSS' ? 1 : 0),
      winRate: ((prev.wins + (result === 'WIN' ? 1 : 0)) / (prev.totalTrades + 1)) * 100,
      totalPnL: prev.totalPnL + pnl,
      balance: prev.balance + pnl
    }));

    sendMessageToAI(
      `🤖 TradeVision IA fechou posição ${type} @ $${exitPrice.toFixed(2)} | ${reason} | P&L: ${pnl > 0 ? '+' : ''}$${pnl.toFixed(2)} | Resultado: ${result}`,
      true
    );

    // Verificar auto-reset da banca após fechar posição
    setTimeout(() => {
      checkAndResetBalance();
    }, 100);
  };

  // Loop de trading automático - 100% AUTOMÁTICO
  useEffect(() => {
    if (isTrading) {
      // Executar análise imediatamente ao iniciar
      setTimeout(() => {
        analyzeAndTrade();
      }, 2000); // 2 segundos para carregar dados

      // Analisar a cada 1 minuto (60 segundos) - TRADING AUTOMÁTICO
      tradingIntervalRef.current = setInterval(() => {
        console.log('🤖 Executando análise automática...');
        analyzeAndTrade();
      }, 60000);

      // Definir próximo trade
      const nextTime = new Date(Date.now() + 60000);
      setNextTradeTime(nextTime);

      sendMessageToAI(`🤖 TRADING 100% AUTOMÁTICO ATIVADO! TradeVision IA executando trades a cada 1 minuto. Próximo trade: ${nextTime.toLocaleTimeString('pt-BR')}`, true);
      sendMessageToAI('🚀 Sistema configurado para executar BUY/SELL automaticamente baseado em análise técnica!', true);
    } else {
      if (tradingIntervalRef.current) {
        clearInterval(tradingIntervalRef.current);
      }
      setNextTradeTime(null);
    }

    return () => {
      if (tradingIntervalRef.current) {
        clearInterval(tradingIntervalRef.current);
      }
    };
  }, [isTrading]); // APENAS isTrading como dependência

  // Monitorar posições abertas - FECHAR AUTOMATICAMENTE
  useEffect(() => {
    if (!currentPosition || !liveData) return;

    const monitorPosition = () => {
      const currentPrice = parseFloat(liveData.price?.replace(/,/g, '') || '0');
      if (currentPrice > 0) {
        checkPositionExit(currentPrice);
      }
    };

    // Verificar a cada 5 segundos se há posição aberta
    const positionInterval = setInterval(monitorPosition, 5000);

    return () => {
      clearInterval(positionInterval);
    };
  }, [currentPosition, liveData]);

  const toggleTrading = () => {
    setIsTrading(!isTrading);
    if (!isTrading) {
      sendMessageToAI('Iniciando sistema de trading automático...', false);
    } else {
      sendMessageToAI('Pausando sistema de trading automático...', false);
    }
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    sendMessageToAI(chatInput, false);
    setChatInput('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Gráfico x I.A</h2>
          <p className="text-gray-400">TradeVision IA executando trades automáticos a cada 1 minuto</p>
          <p className="text-sm text-green-400">🚀 Sistema 100% automático - BUY/SELL baseado em análise técnica</p>
          <p className="text-xs text-blue-400 mt-1">
            💡 Trades simulados (Paper Trading) | Dados salvos no banco | IA aprende continuamente
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={toggleTrading}
            className={`${isTrading ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isTrading ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isTrading ? 'Pausar Trading' : 'Iniciar Trading'}
          </Button>
          
          {isTrading && (
            <>
              <Button
                onClick={triggerManualTrade}
                disabled={manualTradeTrigger || !!currentPosition}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <Target className="h-4 w-4 mr-2" />
                Executar Trade
              </Button>
              
              <Button
                onClick={triggerManualExit}
                disabled={!currentPosition || manualExitTrigger}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
              >
                <Shield className="h-4 w-4 mr-2" />
                Sair Posição
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status e Configurações */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Activity className={`h-4 w-4 ${isTrading ? 'text-green-400 animate-pulse' : 'text-gray-400'}`} />
              <span className="text-xs text-gray-400">Status</span>
            </div>
            <div className={`text-lg font-bold ${isTrading ? 'text-green-400' : 'text-gray-400'}`}>
              {isTrading ? 'OPERANDO' : 'PAUSADO'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-gray-400">Saldo</span>
            </div>
            <div className={`text-lg font-bold ${stats.balance >= 1000 ? 'text-green-400' : 'text-red-400'}`}>
              ${stats.balance.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-gray-400">Win Rate</span>
            </div>
            <div className="text-lg font-bold text-purple-400">
              {stats.winRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-gray-400">P&L Total</span>
            </div>
            <div className={`text-lg font-bold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-orange-400" />
              <span className="text-xs text-gray-400">Trades</span>
            </div>
            <div className="text-lg font-bold text-orange-400">
              {stats.totalTrades}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações de Trading */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">Configurações Fixas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Tamanho:</span>
              <span className="text-white font-bold ml-2">{TRADE_SIZE} BTC</span>
            </div>
            <div>
              <span className="text-gray-400">Alavancagem:</span>
              <span className="text-white font-bold ml-2">{LEVERAGE}x</span>
            </div>
            <div>
              <span className="text-gray-400">Stop Loss:</span>
              <span className="text-white font-bold ml-2">{STOP_LOSS_PERCENT}%</span>
            </div>
            <div>
              <span className="text-gray-400">Take Profit:</span>
              <span className="text-white font-bold ml-2">{TAKE_PROFIT_PERCENT}%</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoReset"
                checked={autoResetEnabled}
                onChange={(e) => setAutoResetEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="autoReset" className="text-xs">
                <span className="text-white font-bold">Auto Reset</span>
                <br />
                <span className="text-gray-400">Banca → $1000</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-white">📊 {symbol} - M1 (Scalping)</h3>
          <Badge variant="outline" className={`${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {isConnected ? 'Conectado' : 'Desconectado'}
          </Badge>
          {currentPosition && (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              Posição {currentPosition.type} Aberta @ ${currentPosition.entryPrice.toFixed(2)}
            </Badge>
          )}
          {isTrading && !currentPosition && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse">
              🔍 Próximo trade: {nextTradeTime ? nextTradeTime.toLocaleTimeString('pt-BR') : 'Calculando...'}
            </Badge>
          )}
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            🇧🇷 {brazilTime}
          </Badge>
        </div>

        {candles.length === 0 ? (
          <div className="h-[500px] flex items-center justify-center bg-slate-800 rounded-lg border border-slate-700">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
              <p className="text-gray-400">Carregando gráfico em tempo real...</p>
              <p className="text-sm text-gray-500 mt-2">Conectando com Binance M1</p>
            </div>
          </div>
        ) : (
          <div className="h-[500px] bg-slate-900 rounded-lg border border-slate-700 p-4">
            <div className="h-full flex flex-col">
              {/* Header do Gráfico */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-white font-bold">{symbol}</span>
                  <span className="text-green-400 font-mono text-lg">
                    ${liveData?.price || '0.00'}
                  </span>
                  <span className={`text-sm ${liveData?.change?.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {liveData?.change || '0.00%'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Volume:</span>
                  <span className="text-white font-mono">{liveData?.volume || '0'}</span>
                </div>
              </div>

              {/* Gráfico REAL de Velas - Igual Dashboard Home */}
              <div className="flex-1 bg-gradient-to-br from-slate-900 to-slate-800 rounded border border-slate-600 relative overflow-hidden">
                {/* Real-Time Chart with Live Data - IGUAL DASHBOARD HOME */}
                <div className="h-full bg-gradient-to-t from-blue-500/5 to-transparent rounded border-l-2 border-b-2 border-slate-500/20 relative">
                  
                  {/* Real Candlestick visualization with Animation - KEY atualiza em tempo real */}
                  <div className="absolute inset-2" key={`${Date.now()}-${candles.length}`}>
                    {candles.slice(-35).map((candle, index) => { // Mostrar 35 velas
                      const isGreen = candle.close > candle.open;
                      
                      // Usar TODOS os candles para calcular range, não apenas os 35 visíveis
                      const allCandles = candles;
                      const basePrice = Math.min(...allCandles.map(c => c.low));
                      const maxPrice = Math.max(...allCandles.map(c => c.high));
                      const priceRange = maxPrice - basePrice || 1;
                      
                      // Calculate positions based on price data - AJUSTE DINÂMICO
                      const chartHeight = 280;
                      const wickTop = ((candle.high - basePrice) / priceRange) * chartHeight;
                      const wickBottom = ((candle.low - basePrice) / priceRange) * chartHeight;
                      const bodyTop = ((Math.max(candle.open, candle.close) - basePrice) / priceRange) * chartHeight;
                      const bodyBottom = ((Math.min(candle.open, candle.close) - basePrice) / priceRange) * chartHeight;
                      
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
                              isGreen ? 'bg-green-500' : 'bg-red-500'
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
                                ? 'bg-green-500 border border-green-400/50' 
                                : 'bg-red-500 border border-red-400/50'
                            } ${index === candles.slice(-35).length - 1 ? 'animate-pulse shadow-lg' : ''}`}
                            style={{ 
                              height: `${Math.max(2, bodyTop - bodyBottom)}px`,
                              bottom: `${bodyBottom}px`,
                              opacity: 0.7 + (index / 35) * 0.3,
                              boxShadow: index === candles.slice(-35).length - 1 ? `0 0 8px ${isGreen ? '#10b981' : '#ef4444'}` : 'none'
                            }}
                          />
                          
                          {/* Price tooltip on hover */}
                          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-slate-800/95 backdrop-blur-sm px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap border border-slate-600/50 z-10">
                            <div className="text-center">
                              <div className={`font-semibold ${isGreen ? 'text-green-400' : 'text-red-400'}`}>
                                Close: {candle.close.toFixed(2)}
                              </div>
                              <div className="text-gray-400 text-xs">
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
                  
                  {/* Linha Amarela - Preço Real Atual */}
                  {liveData && candles.length > 0 && (
                    <div 
                      className="absolute transition-all duration-200 ease-out z-20"
                      style={{ 
                        bottom: `${(() => {
                          const currentPrice = parseFloat(liveData.price.replace(/,/g, ''));
                          // Usar TODOS os candles para range dinâmico
                          const allCandles = candles;
                          const basePrice = Math.min(...allCandles.map(c => c.low));
                          const maxPrice = Math.max(...allCandles.map(c => c.high));
                          const priceRange = maxPrice - basePrice || 1;
                          
                          const normalizedPosition = (currentPrice - basePrice) / priceRange;
                          const chartHeight = 280;
                          const bottomOffset = 50;
                          
                          const realPosition = normalizedPosition * chartHeight + bottomOffset;
                          return Math.max(50, Math.min(realPosition, 350));
                        })()}px`,
                        width: '92%',
                        left: '4%',
                        height: '2px',
                        backgroundColor: '#fbbf24',
                        boxShadow: '0 0 8px #fbbf24'
                      }}
                    >
                      {/* Preço atual flutuante */}
                      <div 
                        className="absolute -top-8 left-0 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold"
                        style={{ transform: 'translateX(-50%)' }}
                      >
                        ${liveData.price}
                      </div>
                    </div>
                  )}

                  {/* LINHAS DE TRADING - Entrada, Take Profit, Stop Loss */}
                  {currentPosition && liveData && candles.length > 0 && (
                    <>
                      {/* Linha de ENTRADA (Azul) */}
                      <div 
                        className="absolute transition-all duration-200 ease-out z-25"
                        style={{ 
                          bottom: `${(() => {
                            const entryPrice = currentPosition.entryPrice;
                            // Usar TODOS os candles para range dinâmico
                            const allCandles = candles;
                            const basePrice = Math.min(...allCandles.map(c => c.low));
                            const maxPrice = Math.max(...allCandles.map(c => c.high));
                            const priceRange = maxPrice - basePrice || 1;
                            
                            const normalizedPosition = (entryPrice - basePrice) / priceRange;
                            const chartHeight = 280;
                            const bottomOffset = 50;
                            
                            const realPosition = normalizedPosition * chartHeight + bottomOffset;
                            return Math.max(50, Math.min(realPosition, 350));
                          })()}px`,
                          width: '92%',
                          left: '4%',
                          height: '3px',
                          backgroundColor: '#3b82f6',
                          boxShadow: '0 0 6px #3b82f6',
                          borderTop: '2px dashed #60a5fa',
                          borderBottom: '2px dashed #60a5fa'
                        }}
                      >
                        <div 
                          className="absolute -top-8 left-0 bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold"
                          style={{ transform: 'translateX(-50%)' }}
                        >
                          ENTRADA: ${currentPosition.entryPrice.toFixed(2)}
                        </div>
                      </div>

                      {/* Linha de TAKE PROFIT (Verde) */}
                      <div 
                        className="absolute transition-all duration-200 ease-out z-25"
                        style={{ 
                          bottom: `${(() => {
                            const takeProfitPrice = currentPosition.takeProfit;
                            // Usar TODOS os candles para range dinâmico
                            const allCandles = candles;
                            const basePrice = Math.min(...allCandles.map(c => c.low));
                            const maxPrice = Math.max(...allCandles.map(c => c.high));
                            const priceRange = maxPrice - basePrice || 1;
                            
                            const normalizedPosition = (takeProfitPrice - basePrice) / priceRange;
                            const chartHeight = 280;
                            const bottomOffset = 50;
                            
                            const realPosition = normalizedPosition * chartHeight + bottomOffset;
                            return Math.max(50, Math.min(realPosition, 350));
                          })()}px`,
                          width: '92%',
                          left: '4%',
                          height: '3px',
                          backgroundColor: '#10b981',
                          boxShadow: '0 0 6px #10b981',
                          borderTop: '2px solid #34d399',
                          borderBottom: '2px solid #34d399'
                        }}
                      >
                        <div 
                          className="absolute -top-8 left-0 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold"
                          style={{ transform: 'translateX(-50%)' }}
                        >
                          TP: ${currentPosition.takeProfit.toFixed(2)}
                        </div>
                      </div>

                      {/* Linha de STOP LOSS (Vermelho) */}
                      <div 
                        className="absolute transition-all duration-200 ease-out z-25"
                        style={{ 
                          bottom: `${(() => {
                            const stopLossPrice = currentPosition.stopLoss;
                            // Usar TODOS os candles para range dinâmico
                            const allCandles = candles;
                            const basePrice = Math.min(...allCandles.map(c => c.low));
                            const maxPrice = Math.max(...allCandles.map(c => c.high));
                            const priceRange = maxPrice - basePrice || 1;
                            
                            const normalizedPosition = (stopLossPrice - basePrice) / priceRange;
                            const chartHeight = 280;
                            const bottomOffset = 50;
                            
                            const realPosition = normalizedPosition * chartHeight + bottomOffset;
                            return Math.max(50, Math.min(realPosition, 350));
                          })()}px`,
                          width: '92%',
                          left: '4%',
                          height: '3px',
                          backgroundColor: '#ef4444',
                          boxShadow: '0 0 6px #ef4444',
                          borderTop: '2px solid #f87171',
                          borderBottom: '2px solid #f87171'
                        }}
                      >
                        <div 
                          className="absolute -top-8 left-0 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold"
                          style={{ transform: 'translateX(-50%)' }}
                        >
                          SL: ${currentPosition.stopLoss.toFixed(2)}
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Grid de preços */}
                  <div className="absolute inset-0 opacity-20">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="absolute w-full border-t border-slate-500" 
                           style={{ top: `${20 + i * 20}%` }} />
                    ))}
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="absolute h-full border-l border-slate-500" 
                           style={{ left: `${12.5 + i * 12.5}%` }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Informações Adicionais */}
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div className="bg-slate-800 p-3 rounded">
                  <p className="text-gray-400">Último Candle</p>
                  <p className="text-white font-bold">
                    O: {candles[candles.length - 1]?.open?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-white font-bold">
                    C: {candles[candles.length - 1]?.close?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="bg-slate-800 p-3 rounded">
                  <p className="text-gray-400">Alta/Baixa</p>
                  <p className="text-white font-bold">
                    H: {candles[candles.length - 1]?.high?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-white font-bold">
                    L: {candles[candles.length - 1]?.low?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="bg-slate-800 p-3 rounded">
                  <p className="text-gray-400">Padrões</p>
                  <p className="text-white font-bold">
                    {patterns && Object.keys(patterns).length > 0 
                      ? Object.keys(patterns).join(', ') 
                      : 'Nenhum'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Performance do Narrador IA */}
      <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-400" />
            Performance de Sinais do Narrador IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className="text-2xl font-bold text-blue-400">{narratorStats.totalSignals}</div>
              <div className="text-xs text-gray-400">Total Sinais</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className="text-2xl font-bold text-green-400">{narratorStats.wins}</div>
              <div className="text-xs text-gray-400">Vitórias</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className="text-2xl font-bold text-red-400">{narratorStats.losses}</div>
              <div className="text-xs text-gray-400">Perdas</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className="text-2xl font-bold text-purple-400">{narratorStats.winRate.toFixed(1)}%</div>
              <div className="text-xs text-gray-400">Win Rate</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className="text-2xl font-bold text-cyan-400">{narratorStats.validatedSignals}</div>
              <div className="text-xs text-gray-400">Validados</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className="text-2xl font-bold text-yellow-400">{narratorStats.avgVariation.toFixed(2)}%</div>
              <div className="text-xs text-gray-400">Variação Média</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas e Chat */}
      <div className="grid grid-cols-2 gap-6">
        {/* Info sobre Sistema de Aprendizado */}
        <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-500/30 mb-4">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Bot className="h-6 w-6 text-blue-400 mt-1" />
              <div className="space-y-1">
                <h3 className="text-white font-semibold text-sm">🧠 Sistema de Aprendizado Contínuo</h3>
                <p className="text-xs text-gray-300">
                  <strong className="text-green-400">✅ Simulado:</strong> Dinheiro fictício, operações reais (Binance)
                </p>
                <p className="text-xs text-gray-300">
                  <strong className="text-blue-400">💾 Banco:</strong> Todos trades salvos em <code className="bg-black/30 px-1 rounded text-xs">ai_trades</code>
                </p>
                <p className="text-xs text-gray-300">
                  <strong className="text-purple-400">🤖 IA:</strong> Aprende com WIN/LOSS e ajusta estratégias
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-sm">Estatísticas de Trading (Paper Trading)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900/50">
                <span className="text-gray-400">Total de Trades:</span>
                <span className="text-white font-bold">{stats.totalTrades}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <span className="text-green-400">Wins:</span>
                <span className="text-green-400 font-bold">{stats.wins}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <span className="text-red-400">Losses:</span>
                <span className="text-red-400 font-bold">{stats.losses}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <span className="text-purple-400">Win Rate:</span>
                <span className="text-purple-400 font-bold">{stats.winRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <span className="text-cyan-400">P&L Total:</span>
                <span className={`font-bold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <span className="text-blue-400">Saldo Atual:</span>
                <span className={`font-bold ${stats.balance >= 1000 ? 'text-green-400' : 'text-red-400'}`}>
                  ${stats.balance.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat com TradeVision IA */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Bot className="h-4 w-4 text-blue-400" />
              Chat com TradeVision IA
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex flex-col">
            <ScrollArea className="h-[300px] px-4">
              <div className="space-y-3 pb-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Converse com o TradeVision IA</p>
                    <p className="text-sm">Pergunte sobre as operações</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.role === 'system' 
                          ? 'bg-blue-500/10 border border-blue-500/30' 
                          : msg.role === 'user'
                          ? 'bg-green-500/10 border border-green-500/30'
                          : 'bg-purple-500/10 border border-purple-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-medium ${
                          msg.role === 'system' ? 'text-blue-400' :
                          msg.role === 'user' ? 'text-green-400' :
                          'text-purple-400'
                        }`}>
                          {msg.role === 'system' ? '🤖 Sistema' :
                           msg.role === 'user' ? '👤 Você' :
                           '🧠 TradeVision IA'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm text-white whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Input de Chat */}
            <div className="p-4 border-t border-slate-700">
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Pergunte ao TradeVision IA sobre as operações..."
                  className="flex-1 bg-slate-700 border-slate-600 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                />
                <Button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Trades */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">Histórico de Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {trades.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum trade executado ainda</p>
                  <p className="text-sm">Inicie o trading automático</p>
                </div>
              ) : (
                trades.map((trade) => (
                  <div
                    key={trade.id}
                    className={`p-4 rounded-lg border ${
                      trade.status === 'OPEN' 
                        ? 'bg-blue-500/10 border-blue-500/30' 
                        : trade.result === 'WIN'
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={`${
                          trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {trade.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {trade.size} BTC ({trade.leverage}x)
                        </Badge>
                        {trade.status === 'CLOSED' && trade.result && (
                          <Badge className={`${
                            trade.result === 'WIN' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {trade.result}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(trade.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                      <div>
                        <span className="text-gray-400">Entry:</span>
                        <span className="text-white font-bold ml-1">${trade.entryPrice.toFixed(2)}</span>
                      </div>
                      {trade.exitPrice && (
                        <div>
                          <span className="text-gray-400">Exit:</span>
                          <span className="text-white font-bold ml-1">${trade.exitPrice.toFixed(2)}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-400">Stop:</span>
                        <span className="text-red-400 font-bold ml-1">${trade.stopLoss.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Target:</span>
                        <span className="text-green-400 font-bold ml-1">${trade.takeProfit.toFixed(2)}</span>
                      </div>
                    </div>

                    {trade.pnl !== undefined && (
                      <div className="flex items-center justify-between p-2 rounded bg-slate-900/50">
                        <span className="text-xs text-gray-400">P&L:</span>
                        <span className={`text-sm font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className="text-xs text-gray-400 mt-2">
                      {trade.reason}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
