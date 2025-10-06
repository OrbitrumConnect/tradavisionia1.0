import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { ScrollArea } from '@/components/ui/scroll-area'; // Removido
import { 
  MessageSquare, 
  Bot, 
  Brain, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  History,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChatFlowViewProps {
  symbol: string;
}

interface Message {
  id: string;
  role: 'narrator' | 'builder' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export const ChatFlowView = ({ symbol }: ChatFlowViewProps) => {
  const { user } = useAuth();
  const [narratorSignals, setNarratorSignals] = useState<Record<string, unknown>[]>([]);
  const [builderMessages, setBuilderMessages] = useState<Record<string, unknown>[]>([]);
  const [conversationFlow, setConversationFlow] = useState<Record<string, unknown>[]>([]);
  const [messageHistory, setMessageHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [processedSignals, setProcessedSignals] = useState<Set<string>>(new Set());

  const loadChatFlow = async () => {
    setLoading(true);
    try {
      // 1. Carregar sinais do narrador
      const { data: narratorData, error: narratorError } = await supabase
        .from('narrator_signals')
        .select('*')
        .eq('symbol', symbol.replace('/', ''))
        .order('created_at', { ascending: false })
        .limit(10);

      if (narratorError) throw narratorError;
      setNarratorSignals(narratorData || []);

      // 2. Carregar mensagens do builder
      const { data: builderData, error: builderError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('context_type', 'chat_flow')
        .order('created_at', { ascending: false })
        .limit(10);

      if (builderError) throw builderError;
      setBuilderMessages(builderData || []);

      // 3. Criar fluxo de conversa
      setConversationFlow(createConversationFlow(narratorData || [], builderData || []));

    } catch (error) {
      console.error('Erro ao carregar fluxo de chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessageHistory = async () => {
    try {
      // Carregar histórico de mensagens do fluxo (narrador + builder)
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or('context_type.eq.narrator_signal,context_type.eq.narrator_signal_response')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erro ao carregar histórico:', error);
      } else {
        const history: Message[] = (data || []).map(msg => ({
          id: msg.id,
          role: msg.context_type === 'narrator_signal' ? 'narrator' as const : 'builder' as const,
          content: msg.content,
          timestamp: msg.created_at,
          metadata: msg.metadata as Record<string, unknown>
        }));
        setMessageHistory(history);
        console.log('📚 Histórico carregado:', history.length, 'mensagens');
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const checkForNewNarratorSignals = async () => {
    try {
      console.log('🔍 Verificando sinais do narrador para:', symbol);
      
      // Buscar sinais do narrador (igual ao Dashboard Home)
      const { data: narratorSignals, error } = await supabase
        .from('narrator_signals')
        .select('*')
        .eq('symbol', symbol.replace('/', ''))
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('❌ Erro ao verificar sinais do narrador:', error);
        return;
      }

      console.log('📊 Sinais do narrador encontrados:', narratorSignals?.length || 0);

      if (narratorSignals && narratorSignals.length > 0) {
        // Processar sinais recentes (últimos 2 minutos)
        for (const signal of narratorSignals) {
          const signalAge = Date.now() - new Date(signal.created_at).getTime();
          
          // Log apenas para debug quando necessário
          // console.log('🔄 Sinal:', signal.id, 'Idade:', Math.round(signalAge/1000), 's');
          
          // Evitar processar o mesmo sinal repetidamente
          if (processedSignals.has(signal.id)) {
            continue;
          }

          // Se o sinal é recente (últimos 30 minutos para processar sinais reais)
          if (signalAge < 1800000) { // 30 minutos
            console.log('⏰ Processando sinal do narrador:', signal.id);
            
            // Verificar se já foi processada pelo builder
            const { data: existingBuilderResponse, error: checkError } = await supabase
              .from('chat_messages')
              .select('*')
              .eq('context_type', 'narrator_signal')
              .contains('metadata', { narrator_signal_id: signal.id })
              .single();

            if (!existingBuilderResponse && !checkError) {
              console.log('🤖 Processando sinal do narrador não processado:', signal.id);
              // Processar sinal real do narrador
              await processNarratorSignal(signal);
              // Marcar como processado para evitar reprocessamento
              setProcessedSignals(prev => new Set(prev).add(signal.id));
              break; // Processar apenas um por vez
            } else if (existingBuilderResponse) {
              console.log('✅ Sinal do narrador já processado:', signal.id);
              // Marcar como processado para evitar verificações futuras
              setProcessedSignals(prev => new Set(prev).add(signal.id));
            } else if (checkError) {
              console.log('⚠️ Erro ao verificar sinal (pode não existir):', signal.id);
              console.log('🔧 Processando sinal mesmo com erro de verificação...');
              // Processar mesmo assim se não conseguir verificar
              await processNarratorSignal(signal);
              // Marcar como processado para evitar reprocessamento
              setProcessedSignals(prev => new Set(prev).add(signal.id));
              break;
            }
          }
        }
      } else {
        // console.log('📭 Nenhum sinal do narrador encontrado para:', symbol);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar sinais do narrador:', error);
    }
  };

  // Limpeza automática removida - sistema funciona em tempo real sem limpeza

  // Carregar dados automaticamente
  useEffect(() => {
    loadChatFlow();
    loadMessageHistory();
    
    // Processar sinais existentes automaticamente
    setTimeout(() => {
      checkForNewNarratorSignals();
    }, 2000); // Aguardar 2 segundos para carregar dados primeiro
  }, [symbol]);

  // Conectar com feed real do narrador (do dashboard home)
  useEffect(() => {
    const connectToRealNarratorFeed = () => {
      // Verificar se há novos sinais do narrador em tempo real
      checkForNewNarratorSignals();
    };

    // Verificar a cada 2 segundos por novos sinais do feed (igual Dashboard Home)
    const interval = setInterval(connectToRealNarratorFeed, 2000);

    return () => clearInterval(interval);
  }, [symbol]);

  // Escutar novas mensagens em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('chat_flow')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'narrator_signals'
        }, 
        (payload) => {
          console.log('🔄 Novo sinal do narrador detectado:', payload.new);
          // Processar imediatamente o novo sinal
          checkForNewNarratorSignals();
        }
      )
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages'
        }, 
        (payload) => {
          console.log('🔄 Nova mensagem no chat:', payload.new);
          // Atualizar histórico imediatamente para mostrar o diálogo
          loadMessageHistory();
          loadChatFlow();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [symbol]);



  const processNarratorSignal = async (signal: Record<string, unknown>) => {
    if (!user) {
      console.log('❌ Usuário não autenticado');
      return;
    }

    try {
      console.log('🤖 Processando sinal do narrador:', signal);

      // Escrever mensagem no chat (igual ao Dashboard Home)
      const messageContent = `📊 Sinal do Narrador detectado:
${signal.pattern || 'Padrão'} - ${signal.signal_type || 'Tipo'}
Probabilidade: ${signal.probability || 'N/A'}%
Preço: ${signal.price || 'N/A'}
${signal.risk_note || ''}`;

      console.log('💬 Escrevendo mensagem no chat...');
      const { data: chatMessage, error: chatError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          role: 'user',
          content: messageContent,
          context_type: 'narrator_signal',
          metadata: {
            narrator_signal_id: String(signal.id),
            symbol: symbol,
            original_signal: JSON.stringify(signal)
          }
        })
        .select()
        .single();

      if (chatError) {
        console.error('❌ Erro ao escrever mensagem no chat:', chatError);
        return;
      }

      console.log('✅ Mensagem escrita no chat:', chatMessage.id);

      // Builder TradeVision vai detectar automaticamente e responder
      console.log('🤖 Builder TradeVision vai detectar e responder automaticamente...');

      // Atualizar dados
      console.log('🔄 Atualizando dados...');
      loadMessageHistory(); // Atualizar histórico primeiro para mostrar a mensagem
      loadChatFlow();

    } catch (error) {
      console.error('❌ Erro ao processar sinal do narrador:', error);
    }
  };

  const processRealNarratorResponse = async (narratorResponse: Record<string, unknown>) => {
    if (!user) {
      console.log('❌ Usuário não autenticado');
      return;
    }

    try {
      console.log('🤖 Processando resposta real do narrador:', narratorResponse);

      // Builder processa a resposta do narrador
      console.log('🔄 Chamando Builder IA...');
      const builderResponse = await processBuilderResponse(
        String(narratorResponse.content), 
        narratorResponse
      );
      console.log('✅ Builder IA respondeu:', builderResponse.substring(0, 100) + '...');

      // Salvar resposta do builder
      console.log('💾 Salvando resposta do builder...');
      const { data: builderMessage, error: builderError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          role: 'assistant',
          content: builderResponse,
          context_type: 'chat_flow',
          metadata: {
            narrator_response_id: String(narratorResponse.id),
            symbol: symbol,
            processing_type: 'real_narrator_response',
            original_narrator_response: JSON.stringify(narratorResponse)
          }
        })
        .select()
        .single();

      if (builderError) {
        console.error('❌ Erro ao salvar resposta do builder:', builderError);
        return;
      }

      console.log('✅ Resposta do builder salva:', builderMessage.id);

      // Salvar no histórico de aprendizado
      console.log('📚 Salvando no histórico de aprendizado...');
      await saveLearningHistory(narratorResponse, builderMessage);

      console.log('🎉 Fluxo real completo: Narrador → Builder → Resposta');

      // Atualizar dados
      console.log('🔄 Atualizando dados...');
      loadChatFlow();
      loadMessageHistory();

    } catch (error) {
      console.error('❌ Erro ao processar resposta real do narrador:', error);
    }
  };

  const processRealNarratorSignal = async (narratorSignal: Record<string, unknown>) => {
    if (!user) {
      console.log('❌ Usuário não autenticado');
      return;
    }

    try {
      console.log('🤖 Processando sinal real do narrador:', narratorSignal);

      // Builder processa o sinal real
      console.log('🔄 Chamando Builder IA...');
      const builderResponse = await processBuilderResponse(
        String(narratorSignal.news || narratorSignal.pattern), 
        narratorSignal
      );
      console.log('✅ Builder IA respondeu:', builderResponse.substring(0, 100) + '...');

      // Salvar resposta do builder
      console.log('💾 Salvando resposta do builder...');
      const { data: builderMessage, error: builderError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          role: 'assistant',
          content: builderResponse,
          context_type: 'chat_flow',
          metadata: {
            narrator_signal_id: String(narratorSignal.id),
            symbol: symbol,
            processing_type: 'real_narrator',
            confidence: Number(narratorSignal.probability || 50),
            signal_type: String(narratorSignal.signal_type || 'BUY'),
            original_signal: JSON.stringify(narratorSignal)
          }
        })
        .select()
        .single();

      if (builderError) {
        console.error('❌ Erro ao salvar resposta do builder:', builderError);
        return;
      }

      console.log('✅ Resposta do builder salva:', builderMessage.id);

      // Salvar no histórico de aprendizado
      console.log('📚 Salvando no histórico de aprendizado...');
      await saveLearningHistory(narratorSignal, builderMessage);

      console.log('🎉 Fluxo real completo: Narrador → Builder → Resposta');

      // Atualizar dados
      console.log('🔄 Atualizando dados...');
      loadChatFlow();
      loadMessageHistory();

    } catch (error) {
      console.error('❌ Erro ao processar sinal real do narrador:', error);
    }
  };


  const createConversationFlow = (narratorData: Record<string, unknown>[], builderData: Record<string, unknown>[]) => {
    const flow: Record<string, unknown>[] = [];
    
    // Combinar dados em ordem cronológica
    const allData = [
      ...narratorData.map(item => ({ ...item, type: 'narrator', timestamp: item.created_at })),
      ...builderData.map(item => ({ ...item, type: 'builder', timestamp: item.created_at }))
    ].sort((a, b) => new Date(String(a.timestamp)).getTime() - new Date(String(b.timestamp)).getTime());

    // Criar fluxo de conversa
    for (let i = 0; i < allData.length; i++) {
      const current = allData[i];
      const next = allData[i + 1];
      
      if (current.type === 'narrator' && next && next.type === 'builder') {
        flow.push({
          id: `flow-${i}`,
          narrator: current,
          builder: next,
          timestamp: current.timestamp,
          type: 'conversation'
        });
      }
    }

    return flow;
  };


  const processBuilderResponse = async (narratorMessage: string, narratorSignal: Record<string, unknown>): Promise<string> => {
    if (!user) return 'Erro: usuário não autenticado';

    try {
      console.log('🤖 Builder IA processando sinal do narrador:', narratorSignal);

      // Usar a IA viva (trade-chat function) para processar o sinal
      const { data: responseData, error: functionError } = await supabase.functions.invoke('trade-chat', {
        body: {
          message: `🎯 **SISTEMA DE APRENDIZADO - TRADEVISION IA**

📊 **SINAL DO FEED NARRADOR**:
- Tipo: ${narratorSignal.signal_type}
- Confiança: ${narratorSignal.probability}%
- Padrão: ${narratorSignal.pattern}
- Símbolo: ${narratorSignal.symbol}
- Timeframe: ${narratorSignal.timeframe || '1m'}
- Notícias: ${narratorSignal.news || 'N/A'}
- Status: ${narratorSignal.market_status || 'Ativo'}

🤖 **SOLICITAÇÃO PARA BUILDER TRADEVISION IA**: 
Analise este sinal do Feed Narrador e forneça:
1. Análise técnica detalhada
2. Recomendação de entrada/saída
3. Gestão de risco específica
4. Contexto de mercado
5. Próximos passos

**Objetivo**: Melhorar o aprendizado do sistema através da análise do Feed Narrador.`,
          userId: user.id,
          sessionId: crypto.randomUUID(),
          conversationId: null,
          marketContext: {
            currentPrice: 0,
            symbol: narratorSignal.symbol,
            timeframe: narratorSignal.timeframe || '1m',
            fearGreedIndex: 50,
            buyerDominance: 50,
            marketPressure: 'NEUTRO',
            narratorSignals: [narratorSignal]
          }
        }
      });

      if (functionError) {
        console.error('Erro na função trade-chat:', functionError);
        // Fallback para resposta simples se a IA falhar
        return `🤖 **Builder IA**: Processei o sinal ${narratorSignal.signal_type} em ${narratorSignal.symbol} com ${narratorSignal.probability}% de confiança. Padrão: ${narratorSignal.pattern}. Análise em andamento...`;
      }

      console.log('✅ Builder IA respondeu:', responseData);
      return responseData.response || 'Builder IA processou o sinal com sucesso.';

    } catch (error) {
      console.error('Erro ao processar com Builder IA:', error);
      // Fallback para resposta simples
      return `🤖 **Builder IA**: Sinal ${narratorSignal.signal_type} em ${narratorSignal.symbol} processado. Confiança: ${narratorSignal.probability}%. Padrão: ${narratorSignal.pattern}.`;
    }
  };

  const saveLearningHistory = async (narratorSignal: Record<string, unknown>, builderMessage: Record<string, unknown>) => {
    try {
      // Salvar no histórico de aprendizado
      const { error } = await supabase
        .from('trade_analysis')
        .insert({
          user_id: user?.id,
          symbol: symbol.replace('/', ''),
          timeframe: '1m',
          analysis_type: 'chat_flow',
          pattern_detected: String(narratorSignal.pattern || 'Padrão detectado'),
          entry_price: 0,
          probability: Number(narratorSignal.probability || 50),
          confidence_score: Number(narratorSignal.probability || 50),
          market_context: {
            narrator_message: String(narratorSignal.news || ''),
            builder_response: String(builderMessage.content || ''),
            processing_time: new Date().toISOString()
          },
          result: 'pending'
        });

      if (error) {
        console.error('Erro ao salvar histórico de aprendizado:', error);
      }
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Sistema de Aprendizado</h1>
          <p className="text-gray-400">Feed Narrador → Builder TradeVision IA → Respostas Aqui</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs text-green-400">Conectado com Feed Narrador (Dashboard Home)</span>
            <span className="text-xs text-blue-400">• Builder TradeVision IA ativo</span>
            <span className="text-xs text-gray-400">• Processando em tempo real</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadChatFlow}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            onClick={async () => {
              if (confirm('🧹 Limpar dados simulados e manter apenas fluxo real?')) {
                try {
                  // Limpar mensagens simuladas antigas
                  const { error } = await supabase
                    .from('chat_messages')
                    .delete()
                    .or('context_type.eq.narrator_signal,context_type.eq.narrator_signal_response');
                  
                  if (error) {
                    console.error('Erro ao limpar dados:', error);
                  } else {
                    console.log('✅ Dados simulados removidos - apenas fluxo real agora');
                    // Limpar estado local também
                    setMessageHistory([]);
                    setProcessedSignals(new Set());
                    loadChatFlow();
                  }
                } catch (error) {
                  console.error('Erro ao limpar dados:', error);
                }
              }
            }}
            className="bg-red-600 hover:bg-red-700"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Limpar Dados Simulados
          </Button>
        </div>
      </div>


      {/* Feed Narrador Automático */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-400" />
            Feed Narrador Automático
            <Badge variant="outline" className="text-xs">
              Conectado com Dashboard Home
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span>Monitorando feed do narrador em tempo real</span>
            </div>
            
            <div className="text-sm text-gray-300">
              <p>🔄 <strong>Fluxo Real:</strong> Narrador (Dashboard Home) → Builder TradeVision IA</p>
              <p>🤖 <strong>Automático:</strong> Detecta sinais reais e gera análises automaticamente</p>
              <p>📊 <strong>Tempo Real:</strong> Apenas sinais dos últimos 5 minutos</p>
            </div>

            {/* Status do feed */}
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Status do Feed:</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-sm text-green-400">Ativo</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Verificando novos sinais a cada 3 segundos
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-gray-400">Feed Narrador</span>
            </div>
            <div className="text-2xl font-bold text-blue-400 mt-2">{narratorSignals.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-400" />
              <span className="text-sm text-gray-400">Builder TradeVision</span>
            </div>
            <div className="text-2xl font-bold text-purple-400 mt-2">{builderMessages.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-orange-400" />
              <span className="text-sm text-gray-400">Análises</span>
            </div>
            <div className="text-2xl font-bold text-orange-400 mt-2">{conversationFlow.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-green-400" />
              <span className="text-sm text-gray-400">Aprendizado</span>
            </div>
            <div className="text-2xl font-bold text-green-400 mt-2">{messageHistory.length}</div>
          </CardContent>
        </Card>
      </div>


      {/* Fluxo de Conversa */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-orange-400" />
            Feed Narrador → Builder TradeVision IA
            <Badge variant="outline" className="text-xs">
              {messageHistory.length} mensagens
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">Carregando conversa...</span>
            </div>
          ) : messageHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
              <p>Nenhuma conversa ainda</p>
              <p className="text-sm">Aguardando sinais do narrador do Dashboard Home</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-3">
              {messageHistory.slice(0, 6).map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg border ${
                    message.role === 'narrator' 
                      ? 'border-blue-500/30 bg-blue-500/5' 
                      : 'border-purple-500/30 bg-purple-500/5'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {message.role === 'narrator' ? (
                      <Bot className="h-4 w-4 text-blue-400" />
                    ) : (
                      <Brain className="h-4 w-4 text-purple-400" />
                    )}
                    <span className="text-sm font-semibold text-white">
                      {message.role === 'narrator' ? 'Feed Narrador' : 'Builder TradeVision'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-300">
                    {message.role === 'narrator' && message.content.includes('Sinal do Narrador') ? (
                      <div>
                        <div className="font-medium text-blue-300">📊 {message.content.split('\n')[0]}</div>
                        <div className="mt-1 text-gray-400">
                          {message.content.split('\n').slice(1).join(' • ')}
                        </div>
                      </div>
                    ) : (
                      <div>
                        {message.content.length > 150 
                          ? message.content.substring(0, 150) + '...' 
                          : message.content
                        }
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {messageHistory.length > 6 && (
                <div className="text-center py-2">
                  <span className="text-xs text-gray-500">
                    +{messageHistory.length - 6} mensagens anteriores
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};