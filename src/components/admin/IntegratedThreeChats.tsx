import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';
import { 
  MessageSquare, 
  Bot, 
  Brain, 
  Zap,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Send,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNarratorContext } from '@/contexts/NarratorContext';

interface IntegratedThreeChatsProps {
  symbol: string;
}

export const IntegratedThreeChats = ({ symbol }: IntegratedThreeChatsProps) => {
  const { user } = useAuth();
  const { narratorSignals } = useNarratorContext();
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [binanceConnected, setBinanceConnected] = useState(false);

  // Carregar dados existentes
  useEffect(() => {
    loadAllData();
    testBinanceConnection();
  }, [symbol]);

  // Atualizar automaticamente quando novos sinais chegarem
  useEffect(() => {
    console.log('🔄 NarratorSignals atualizados:', narratorSignals);
    loadAllData();
    
    // Enviar novos sinais para o agente TradeVision IA
    if (narratorSignals.length > 0) {
      const latestSignal = narratorSignals[0];
      sendNarratorSignalToAgent(latestSignal);
    }
  }, [narratorSignals]);

  // Assinar realtime para sinais do narrador no banco e atualizar instantaneamente
  useEffect(() => {
    const channel = supabase
      .channel('integrated-threechats-narrator')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'narrator_signals'
      }, (payload: any) => {
        const row = payload.new;
        if (!row) return;
        // Append mensagem do narrador imediatamente
        const narratorMsg = {
          id: row.id,
          type: 'narrator',
          timestamp: row.created_at || new Date().toISOString(),
          content: `🔔 **SINAL ${row.signal_type}** - ${row.symbol}\n📊 **Padrão:** ${row.pattern}\n💰 **Preço:** ${row.price}\n📈 **Probabilidade:** ${row.probability}%\n⚠️ **Risco:** ${row.risk_note || 'Baixo'}`,
          metadata: {
            signal_type: row.signal_type,
            probability: row.probability,
            pattern: row.pattern,
            price: row.price,
            risk: row.risk_note
          }
        };
        setAllMessages(prev => [narratorMsg, ...prev]);
      })
      .subscribe((status) => {
        console.log('📡 narrator_signals realtime status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Testar conexão com Binance
  const testBinanceConnection = async () => {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol.replace('/', '')}`);
      if (response.ok) {
        setBinanceConnected(true);
        console.log('✅ Conexão com Binance ativa');
      } else {
        setBinanceConnected(false);
        console.log('❌ Erro na conexão com Binance');
      }
    } catch (error) {
      setBinanceConnected(false);
      console.error('❌ Erro ao testar conexão Binance:', error);
    }
  };

  // Enviar sinal do narrador para o agente TradeVision IA
  const sendNarratorSignalToAgent = async (signal: any) => {
    try {
      console.log('📤 Enviando sinal do narrador para TradeVision IA:', signal);

      // Buscar dados atuais da Binance
      let binanceData = null;
      try {
        const binanceResponse = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${signal.symbol?.replace('/', '') || symbol.replace('/', '')}`);
        if (binanceResponse.ok) {
          binanceData = await binanceResponse.json();
        }
      } catch (binanceError) {
        console.warn('Erro ao buscar dados da Binance:', binanceError);
      }

      const realTimeContext = {
        symbol: signal.symbol || symbol,
        exchange: 'Binance',
        timestamp: new Date().toISOString(),
        dataSource: 'narrator-signal',
        narratorSignal: {
          type: signal.type,
          probability: signal.probability,
          pattern: signal.pattern,
          price: signal.price,
          risk: signal.risk,
          figure: signal.figure,
          news: signal.news,
          marketStatus: signal.marketStatus
        },
        binanceData: binanceData ? {
          price: binanceData.lastPrice,
          change24h: binanceData.priceChangePercent,
          volume24h: binanceData.volume,
          high24h: binanceData.highPrice,
          low24h: binanceData.lowPrice,
          openPrice: binanceData.openPrice
        } : null
      };

      const { data, error } = await supabase.functions.invoke('trade-chat', {
        body: {
          message: `🔔 **NOVO SINAL DO NARRADOR**\n\n📊 **${signal.type}** - ${signal.symbol}\n💰 **Preço:** ${signal.price}\n📈 **Probabilidade:** ${signal.probability}%\n🎯 **Padrão:** ${signal.pattern}\n⚠️ **Risco:** ${signal.risk || 'Baixo'}\n📰 **Contexto:** ${signal.news || 'Nenhuma notícia relevante'}\n\nAnalise este sinal e forneça insights técnicos detalhados.`,
          userId: user?.id,
          sessionId: `narrator-${signal.id}`,
          realTimeContext: realTimeContext
        }
      });

      if (error) {
        console.error('❌ Erro ao enviar sinal para TradeVision IA:', error);
        return;
      }

      console.log('✅ Resposta do TradeVision IA para sinal do narrador:', data);

      // Adicionar resposta do agente ao chat
      const agentResponse = {
        id: `agent-${Date.now()}`,
        type: 'agent',
        timestamp: new Date().toISOString(),
        content: `🧠 **TradeVision IA (Resposta ao Sinal):** ${data.response}`,
        sender: 'TradeVision IA',
        metadata: { 
          contextType: data.contextType,
          referenceChunks: data.referenceChunks,
          conversationState: data.conversationState,
          triggeredBy: 'narrator-signal',
          originalSignal: signal.id
        }
      };

      setAllMessages(prev => [agentResponse, ...prev]);

      // Meta Chat não aparece no chat unificado - apenas processa internamente
      console.log('🔄 Meta Chat processando internamente - não exibindo no chat unificado');
      
    } catch (error) {
      console.error('❌ Erro na comunicação com TradeVision IA:', error);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Unificar todos os dados em uma única lista de mensagens
      const messages: any[] = [];

      // 1. Adicionar sinais do narrador (tempo real)
      console.log('📊 Processando sinais do narrador:', narratorSignals.length);
      narratorSignals.forEach((signal, index) => {
        console.log(`📊 Sinal ${index + 1}:`, {
          id: signal.id,
          type: signal.type,
            symbol: signal.symbol, 
          price: signal.price,
          probability: signal.probability
        });
        
        messages.push({
          id: signal.id,
          type: 'narrator',
          timestamp: signal.timestamp,
          content: `🔔 **SINAL ${signal.type}** - ${signal.symbol}\n📊 **Padrão:** ${signal.pattern}\n💰 **Preço:** ${signal.price}\n📈 **Probabilidade:** ${signal.probability}%\n⚠️ **Risco:** ${signal.risk || 'Baixo'}`,
        metadata: { 
            signal_type: signal.type,
            probability: signal.probability,
            pattern: signal.pattern,
            price: signal.price,
            risk: signal.risk
          }
        });
      });

      // 2. Carregar mensagens de chat (Agente IA)
      const { data: chatData, error: chatError } = await supabase
            .from('chat_messages')
            .select('*')
        .eq('role', 'assistant')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!chatError && chatData) {
        chatData.forEach(msg => {
          messages.push({
            id: `agent-${msg.id}`,
            type: 'agent',
            timestamp: msg.created_at,
            content: msg.content,
            metadata: msg.metadata
          });
        });
      }

      // 3. Carregar análises de trade (Meta Chat)
      const { data: analysisData, error: analysisError } = await supabase
        .from('trade_analysis')
        .select('*')
        .eq('symbol', symbol.replace('/', ''))
        .order('created_at', { ascending: false })
        .limit(10);

      if (!analysisError && analysisData) {
        analysisData.forEach(analysis => {
          messages.push({
          id: `meta-${analysis.id}`,
            type: 'meta',
          timestamp: analysis.created_at,
            content: `🔄 **Meta Chat:** Consolidação concluída!\n📊 **Padrão:** ${analysis.pattern_detected || 'N/A'}\n💰 **Preço:** ${analysis.entry_price || 'N/A'}\n⭐ **Confiança:** ${analysis.confidence_score || 0}%\n📝 **Resultado:** ${analysis.result || 'N/A'}`,
          metadata: { 
              confidence_score: analysis.confidence_score,
              pattern_detected: analysis.pattern_detected,
              result: analysis.result
            }
          });
        });
      }

      // Ordenar mensagens por timestamp (mais recentes primeiro)
      messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setAllMessages(messages);
      console.log('📊 Mensagens unificadas carregadas:', messages.length);
      console.log('📊 Detalhamento das mensagens:', {
        narrator: messages.filter(m => m.type === 'narrator').length,
        agent: messages.filter(m => m.type === 'agent').length,
        meta: messages.filter(m => m.type === 'meta').length,
        user: messages.filter(m => m.type === 'user').length,
        total: messages.length
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
    }
  };

  const getSignalIcon = (signalType: string) => {
    return signalType === 'BUY' ? 
      <TrendingUp className="h-4 w-4 text-green-400" /> : 
      <TrendingDown className="h-4 w-4 text-red-400" />;
  };

  const getSignalColor = (signalType: string) => {
    return signalType === 'BUY' ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10';
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'narrator':
        return <Bot className="h-4 w-4 text-blue-400" />;
      case 'agent':
        return <Brain className="h-4 w-4 text-purple-400" />;
      case 'meta':
        return <MessageSquare className="h-4 w-4 text-orange-400" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-400" />;
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'narrator':
        return 'border-blue-500 bg-blue-500/10';
      case 'agent':
        return 'border-purple-500 bg-purple-500/10';
      case 'meta':
        return 'border-orange-500 bg-orange-500/10';
      default:
        return 'border-slate-600 bg-slate-700';
    }
  };

  const getMessageTitle = (type: string) => {
    switch (type) {
      case 'narrator':
        return 'Narrador IA';
      case 'agent':
        return 'Agente IA';
      case 'meta':
        return 'Meta Chat';
      default:
        return 'Sistema';
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
        timestamp: new Date().toISOString(),
      content: chatInput,
      sender: user?.email || 'Usuário'
    };

    // Adicionar mensagem do usuário ao chat unificado
    setAllMessages(prev => [userMessage, ...prev]);
    setChatInput('');

    // Chamar agente TradeVision IA real com dados da Binance
    try {
      // Buscar dados atuais da Binance para contexto completo
      let binanceData = null;
      try {
        const binanceResponse = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol.replace('/', '')}`);
        if (binanceResponse.ok) {
          binanceData = await binanceResponse.json();
          console.log('📊 Dados da Binance obtidos:', {
            symbol: binanceData.symbol,
            price: binanceData.lastPrice,
            change24h: binanceData.priceChangePercent,
            volume: binanceData.volume
          });
        }
      } catch (binanceError) {
        console.warn('Erro ao buscar dados da Binance para contexto:', binanceError);
      }

      const realTimeContext = {
        symbol: symbol,
        exchange: 'Binance',
        timestamp: new Date().toISOString(),
        dataSource: 'real-time-binance',
        // Dados completos da Binance
        binanceData: binanceData ? {
          price: binanceData.lastPrice,
          change24h: binanceData.priceChangePercent,
          volume24h: binanceData.volume,
          high24h: binanceData.highPrice,
          low24h: binanceData.lowPrice,
          openPrice: binanceData.openPrice
        } : null,
        // Contexto do sistema
        systemContext: {
          narratorSignals: narratorSignals.length,
          totalMessages: allMessages.length,
          userMessages: allMessages.filter(m => m.type === 'user').length
        }
      };

      console.log('📤 Contexto enviado para TradeVision IA:', realTimeContext);

      const { data, error } = await supabase.functions.invoke('trade-chat', {
        body: {
          message: chatInput,
          userId: user?.id,
          sessionId: `session-${Date.now()}`,
          realTimeContext: realTimeContext
        }
      });

      if (error) {
        console.error('Erro ao chamar TradeVision IA:', error);
        // Fallback para resposta simulada
        addSimulatedResponse();
        return;
      }

      console.log('✅ Resposta do TradeVision IA recebida:', {
        responseLength: data.response?.length,
        contextType: data.contextType,
        referenceChunks: data.referenceChunks?.length,
        conversationState: data.conversationState
      });

      // Resposta real do TradeVision IA
      const aiResponse = {
        id: `ai-${Date.now()}`,
        type: 'agent',
        timestamp: new Date().toISOString(),
        content: `🧠 **TradeVision IA:** ${data.response}`,
        sender: 'TradeVision IA',
        metadata: {
          contextType: data.contextType,
          referenceChunks: data.referenceChunks,
          conversationState: data.conversationState
        }
      };

      setAllMessages(prev => [aiResponse, ...prev]);

      // Meta Chat não aparece no chat unificado - apenas processa internamente
      console.log('🔄 Meta Chat processando internamente - não exibindo no chat unificado');

    } catch (error) {
      console.error('Erro na comunicação com TradeVision IA:', error);
      addSimulatedResponse();
    }
  };

  const addSimulatedResponse = () => {
    const aiResponse = {
      id: `ai-${Date.now()}-1`,
      type: 'agent',
      timestamp: new Date().toISOString(),
      content: `🧠 **Agente IA:** Analisando sua pergunta sobre "${chatInput}"... Baseado nos dados atuais do ${symbol}, posso fornecer insights técnicos específicos.`,
      sender: 'TradeVision IA'
    };
    setAllMessages(prev => [aiResponse, ...prev]);
    
    // Meta Chat não aparece no chat unificado - apenas processa internamente
    console.log('🔄 Meta Chat processando internamente - não exibindo no chat unificado');
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-blue-400" />
            Sistema 3 IAs - TradeVision
            <Badge variant="outline" className="text-sm">
              {symbol}
            </Badge>
          </h2>
          <p className="text-gray-400 mt-2">Sistema integrado de Narrador, Agente e Meta Chat</p>
          </div>
        <div className="flex gap-3">
          <div className="flex gap-3">
          <Button
            onClick={loadAllData}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar Dados
          </Button>
          <Button
              onClick={async () => {
                try {
                  // Buscar dados atuais da Binance
                  const binanceData = await supabase.functions.invoke('binance-proxy', {
                    body: { symbol: symbol.replace('/', '') }
                  });
                  
                  if (binanceData.data) {
                    console.log('📊 Dados da Binance atualizados:', binanceData.data);
                  }
                } catch (error) {
                  console.error('Erro ao buscar dados da Binance:', error);
                }
              }}
            className="bg-green-600 hover:bg-green-700"
          >
              <TrendingUp className="h-4 w-4 mr-2" />
              Atualizar Binance
          </Button>
          <Button
              onClick={async () => {
                // Testar fluxo: Narrador -> Agente
                if (narratorSignals.length > 0) {
                  const testSignal = narratorSignals[0];
                  console.log('🧪 Testando fluxo Narrador -> Agente com sinal:', testSignal);
                  await sendNarratorSignalToAgent(testSignal);
                } else {
                  console.log('⚠️ Nenhum sinal do narrador disponível para teste');
                }
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              Testar Fluxo
          </Button>
          </div>
        </div>
      </div>

        <div>
          {/* Status dos Chats */}
          <Card className="mb-4 bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                Status dos Chats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                  <span className="text-sm text-blue-400 font-medium">Narrador IA</span>
              </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                  <span className="text-sm text-purple-400 font-medium">Agente IA</span>
                  </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
                  <span className="text-sm text-orange-400 font-medium">Meta Chat</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className={`w-2 h-2 rounded-full ${binanceConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                  <span className={`text-sm font-medium ${binanceConnected ? 'text-green-400' : 'text-red-400'}`}>
                    Binance API
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat Unificado */}
          <Card className="h-[600px] bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-400" />
                Sistema 3 IAs - Chat Unificado
                <Badge variant="outline" className="text-xs">
                  {allMessages.length} mensagens
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col">
              <ScrollArea className="h-[520px] px-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-400">Carregando conversa...</span>
                  </div>
                ) : allMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                    <p>Nenhuma mensagem ainda</p>
                    <p className="text-sm">As mensagens aparecerão aqui automaticamente</p>
                  </div>
                ) : (
                  <div className="space-y-3 pb-4">
                    {allMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-4 rounded-lg border flex flex-col ${
                          message.type === 'user' 
                            ? 'border-green-500 bg-green-500/10' 
                            : getMessageColor(message.type)
                        } hover:border-opacity-80 transition-colors`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {message.type === 'user' ? (
                              <span className="text-sm font-medium text-green-400">👤 Você</span>
                            ) : (
                              <>
                                {getMessageIcon(message.type)}
                                <span className="text-sm font-medium text-white">
                                  {message.sender || getMessageTitle(message.type)}
                          </span>
                              </>
                            )}
                            <span className="text-sm text-gray-400">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                          <div className="flex gap-2 mb-2">
                            {message.type === 'narrator' && (
                            <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                              🔔 SINAL NARRADOR
                            </Badge>
                          )}
                            {message.type === 'agent' && message.metadata?.triggeredBy === 'narrator-signal' && (
                            <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">
                              🤖 RESPOSTA AUTOMÁTICA
                  </Badge>
                          )}
                            {message.type === 'agent' && message.metadata?.triggeredBy === 'narrator-signal' && (
                            <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                              📤 NARRADOR → AGENTE
                            </Badge>
                          )}
                          {message.metadata?.probability && (
                            <Badge className={`text-xs ${getConfidenceColor(message.metadata.probability)}`}>
                              {message.metadata.probability}%
                            </Badge>
                          )}
                          {message.metadata?.confidence_score && (
                            <Badge className={`text-xs ${getConfidenceColor(message.metadata.confidence_score)}`}>
                              {message.metadata.confidence_score}%
                            </Badge>
                          )}
                    </div>
                        
                        <div className="text-white text-sm leading-relaxed mt-2 prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                        
                        {message.type !== 'agent' && message.metadata && Object.keys(message.metadata).length > 0 && (
                          <div className="mt-3 p-3 rounded-lg bg-slate-900/40 border border-slate-700">
                            <div className="text-xs text-gray-400 mb-2">Detalhes</div>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(message.metadata).slice(0, 8).map(([key, value]) => (
                                <Badge key={key} variant="outline" className="text-xs">
                                  {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        </div>
                        {/* close container with justify-between */}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              
              {/* Input de Chat */}
              <div className="p-4 border-t border-slate-700">
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Digite sua pergunta para as IAs..."
                    className="flex-1 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  />
                  <Button
                    onClick={sendChatMessage}
                    disabled={!chatInput.trim()}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                          </div>
                          </div>
              </CardContent>
            </Card>


          {/* Estatísticas */}
          <Card className="mt-12 bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-cyan-400" />
                Estatísticas do Chat Unificado
                </CardTitle>
              </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-3">
                <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-3xl font-bold text-blue-400 mb-1">
                    {(() => {
                      const count = allMessages.filter(m => m.type === 'narrator').length;
                      console.log('📊 Contando sinais do narrador:', count, 'de', allMessages.length, 'total');
                      return count;
                    })()}
                    </div>
                  <div className="text-xs text-blue-300 font-medium">Sinais Narrador</div>
                            </div>
                <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="text-3xl font-bold text-purple-400 mb-1">
                    {allMessages.filter(m => m.type === 'agent').length}
                          </div>
                  <div className="text-xs text-purple-300 font-medium">Insights Agente</div>
                          </div>
                <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="text-3xl font-bold text-orange-400 mb-1">
                    {allMessages.filter(m => m.type === 'meta').length}
                        </div>
                  <div className="text-xs text-orange-300 font-medium">Análises Meta</div>
                    </div>
                <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="text-3xl font-bold text-green-400 mb-1">
                    {allMessages.filter(m => m.type === 'user').length}
          </div>
                  <div className="text-xs text-green-300 font-medium">Suas Mensagens</div>
            </div>
                <div className="text-center p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <div className="text-3xl font-bold text-cyan-400 mb-1">{allMessages.length}</div>
                  <div className="text-xs text-cyan-300 font-medium">Total Mensagens</div>
            </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
