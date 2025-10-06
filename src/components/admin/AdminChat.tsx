import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMarketContext } from '@/contexts/MarketContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, MessageSquare, Brain, TrendingUp, Star, FileText, Sparkles, Zap, Target, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { useLocalEmbeddings } from '@/hooks/useLocalEmbeddings';
import { ConversationsSidebar } from './ConversationsSidebar';
import { StudyResults } from '@/components/learning/StudyResults';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  feedback_score?: number | null;
  feedback_notes?: string | null;
}

export function AdminChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const marketContext = useMarketContext();
  const { getEmbedding, isReady: embeddingsReady } = useLocalEmbeddings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [instructionsInput, setInstructionsInput] = useState('');
  const [instructionsDialogOpen, setInstructionsDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const submitFeedback = async (messageId: string, score: number) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({
          feedback_score: score,
          feedback_timestamp: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, feedback_score: score } : msg
      ));

      sonnerToast.success(`Avaliação registrada: ${score} estrela${score > 1 ? 's' : ''}`);
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      sonnerToast.error('Erro ao registrar avaliação');
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sistema automático para responder mensagens do narrador
  useEffect(() => {
    const checkForNarratorMessages = async () => {
      try {
        // Buscar mensagens do narrador não respondidas
        const { data: narratorMessages, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('context_type', 'narrator_signal')
          .eq('role', 'user')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.error('Erro ao verificar mensagens do narrador:', error);
          return;
        }

        if (narratorMessages && narratorMessages.length > 0) {
          console.log('🔍 AdminChat detectou mensagens do narrador:', narratorMessages.length);
          for (const message of narratorMessages) {
            console.log('📨 Verificando mensagem:', message.id, message.content.substring(0, 50));
            console.log('🔍 Metadata da mensagem:', message.metadata);
            // Verificar se já foi respondida
            const { data: existingResponse, error: checkError } = await supabase
              .from('chat_messages')
              .select('*')
              .eq('context_type', 'narrator_signal_response')
              .contains('metadata', { narrator_signal_id: (message.metadata as any)?.narrator_signal_id })
              .eq('role', 'assistant')
              .single();

            if (!existingResponse && !checkError) {
              console.log('🤖 Detectada mensagem do narrador não respondida:', message.id);
              await processNarratorMessage(message);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao verificar mensagens do narrador:', error);
      }
    };

    // Verificar a cada 3 segundos
    const interval = setInterval(checkForNarratorMessages, 3000);
    
    // Verificar imediatamente
    checkForNarratorMessages();

    return () => clearInterval(interval);
  }, [user, sessionId]);

  const processNarratorMessage = async (message: any) => {
    if (!user) return;

    try {
      console.log('🤖 Processando mensagem do narrador:', message.content);

      // Preparar contexto do sinal do narrador
      const signalContext = {
        symbol: message.metadata?.symbol || 'BTC/USDT',
        signalData: message.metadata?.original_signal,
        narratorSignal: message.content,
        realTimeContext: {
          symbol: marketContext.symbol,
          price: marketContext.price,
          timeframe: marketContext.timeframe,
          fearGreedIndex: marketContext.fearGreedIndex,
          buyerDominance: marketContext.buyerDominance,
          marketPressure: marketContext.marketPressure,
        }
      };

      console.log('📤 Enviando sinal do narrador para IA:', signalContext);

      // Chamar edge function para análise do sinal
      const { data: functionData, error: functionError } = await supabase.functions.invoke('trade-chat', {
        body: { 
          message: `Analise este sinal do narrador: ${message.content}`,
          userId: user.id,
          sessionId,
          realTimeContext: signalContext.realTimeContext,
          signalAnalysis: true,
          signalData: signalContext.signalData,
        }
      });

      if (functionError) {
        console.error('❌ Erro na análise do sinal:', functionError);
        return;
      }

      console.log('✅ IA analisou o sinal do narrador');

      // Salvar resposta da IA
      const { data: assistantMessage, error: assistantError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          role: 'assistant',
          content: functionData.response,
          session_id: sessionId,
          conversation_id: message.conversation_id,
          context_type: 'narrator_signal_response',
          reference_chunks: functionData.referenceChunks || [],
          conversation_state: functionData.conversationState || {},
          metadata: { 
            narrator_signal_id: message.metadata?.narrator_signal_id,
            original_narrator_message: message.id,
            signal_analysis: true,
            knowledgeUsed: functionData.knowledgeUsed || [] 
          },
        })
        .select()
        .single();

      if (assistantError) {
        console.error('❌ Erro ao salvar resposta:', assistantError);
        return;
      }

      console.log('✅ Resposta da IA salva:', assistantMessage.id);
      console.log('🎉 Fluxo completo: Narrador → ChatFlow → Builder → Resposta!');

      // Atualizar mensagens locais se estivermos na conversa correta
      if (message.conversation_id === currentConversationId) {
        setMessages(prev => [...prev, {
          id: assistantMessage.id,
          role: 'assistant',
          content: assistantMessage.content,
          created_at: assistantMessage.created_at,
          feedback_score: null,
          feedback_notes: null,
        }]);
      }

    } catch (error) {
      console.error('❌ Erro ao processar mensagem do narrador:', error);
    }
  };

  const loadMessages = async (conversationId?: string) => {
    if (!user) return;

    const query = supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (conversationId) {
      query.eq('conversation_id', conversationId);
    } else {
      query.is('conversation_id', null).limit(50);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages((data || []).map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      created_at: msg.created_at,
      feedback_score: msg.feedback_score,
      feedback_notes: msg.feedback_notes,
    })));
  };

  useEffect(() => {
    loadMessages(currentConversationId || undefined);
  }, [user, currentConversationId]);

  const createNewConversation = async () => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: 'Nova Conversa',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    return data.id;
  };

  const updateConversationSummary = async (conversationId: string, firstMessage: string) => {
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
    
    await supabase
      .from('conversations')
      .update({ 
        title,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);
  };

  const sendMessage = async (customInstructions?: string) => {
    const messageText = customInstructions || input.trim();
    if (!messageText || !user) return;

    setLoading(true);

    try {
      // Criar conversa se não existir
      let conversationId = currentConversationId;
      if (!conversationId) {
        conversationId = await createNewConversation();
        if (conversationId) {
          setCurrentConversationId(conversationId);
        }
      }
      // Gerar embedding local da mensagem (busca semântica)
      let embedding: number[] | null = null;
      if (embeddingsReady) {
        try {
          embedding = await getEmbedding(messageText);
          console.log('🧠 Embedding gerado localmente:', embedding.length, 'dimensões');
        } catch (err) {
          console.warn('Falha ao gerar embedding:', err);
        }
      }

      // Salvar mensagem do usuário COM embedding
      const { data: userMessage, error: userError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          role: 'user',
          content: messageText,
          session_id: sessionId,
          conversation_id: conversationId,
          context_type: customInstructions ? 'instructions' : 'general',
          reference_chunks: [],
          conversation_state: {},
          embedding: embedding ? `[${embedding.join(',')}]` : null,
        })
        .select()
        .single();

      if (userError) throw userError;

      setMessages(prev => [...prev, {
        id: userMessage.id,
        role: userMessage.role as 'user' | 'assistant' | 'system',
        content: userMessage.content,
        created_at: userMessage.created_at,
        feedback_score: null,
        feedback_notes: null,
      }]);
      
      if (customInstructions) {
        setInstructionsInput('');
        setInstructionsDialogOpen(false);
      } else {
        setInput('');
      }

      // Atualizar título da conversa com primeira mensagem
      if (conversationId && messages.length === 0) {
        await updateConversationSummary(conversationId, messageText);
      }

      // Preparar contexto em tempo real
      const realTimeContext = {
        symbol: marketContext.symbol,
        price: marketContext.price,
        timeframe: marketContext.timeframe,
        fearGreedIndex: marketContext.fearGreedIndex,
        buyerDominance: marketContext.buyerDominance,
        marketPressure: marketContext.marketPressure,
      };

      console.log('📤 Sending real-time context to AI:', realTimeContext);

      // Chamar edge function para resposta da IA com contexto + embedding semântico
      const { data: functionData, error: functionError } = await supabase.functions.invoke('trade-chat', {
        body: { 
          message: messageText,
          userId: user.id,
          sessionId,
          realTimeContext,
          userEmbedding: embedding,
          isInstructionMode: !!customInstructions,
        }
      });

      if (functionError) throw functionError;

      // Salvar resposta da IA
      const { data: assistantMessage, error: assistantError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          role: 'assistant',
          content: functionData.response,
          session_id: sessionId,
          conversation_id: conversationId,
          context_type: functionData.contextType || 'general',
          reference_chunks: functionData.referenceChunks || [],
          conversation_state: functionData.conversationState || {},
          metadata: { knowledgeUsed: functionData.knowledgeUsed || [] },
        })
        .select()
        .single();

      if (assistantError) throw assistantError;

      setMessages(prev => [...prev, {
        id: assistantMessage.id,
        role: assistantMessage.role as 'user' | 'assistant' | 'system',
        content: assistantMessage.content,
        created_at: assistantMessage.created_at,
        feedback_score: null,
        feedback_notes: null,
      }]);

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = async () => {
    console.log('🆕 Iniciando nova conversa. Conversa atual:', currentConversationId);
    
    // Se já existe conversa atual com mensagens, atualizar o resumo antes de criar nova
    if (currentConversationId && messages.length > 0) {
      const firstUserMessage = messages.find(m => m.role === 'user')?.content;
      if (firstUserMessage) {
        console.log('💾 Salvando resumo da conversa atual');
        await updateConversationSummary(currentConversationId, firstUserMessage);
      }
    }

    // Criar nova conversa
    const newConversationId = await createNewConversation();
    console.log('✨ Nova conversa criada:', newConversationId);
    
    if (newConversationId) {
      setCurrentConversationId(newConversationId);
      setMessages([]);
      sonnerToast.success('Nova conversa criada');
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  const sendInstructions = async () => {
    if (!instructionsInput.trim()) return;
    await sendMessage(instructionsInput);
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-120px)]">
      {/* Sidebar de conversas à direita */}
      <div className="w-80 shrink-0">
        <ConversationsSidebar
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
        />
      </div>

      {/* Chat principal */}
      <div className="flex-1 space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">🤖 TradeVision AI - Sistema de Aprendizado</h2>
          <p className="text-muted-foreground">Converse e ensine o narrador a identificar padrões com precisão</p>
        </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat" className="flex gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat ao Vivo
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex gap-2">
            <TrendingUp className="h-4 w-4" />
            Insights & Análises
          </TabsTrigger>
          <TabsTrigger value="results" className="flex gap-2">
            <Star className="h-4 w-4" />
            Resultados de Estudos
          </TabsTrigger>
          <TabsTrigger value="history" className="flex gap-2">
            <MessageSquare className="h-4 w-4" />
            Histórico de Conversas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Conversa Interativa
              </CardTitle>
              <CardDescription>
                Cada conversa é analisada para melhorar a precisão do narrador em 100%
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center text-muted-foreground">
                    <div>
                      <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Inicie uma conversa para treinar a IA</p>
                      <p className="text-sm mt-2">Pergunte sobre padrões, estratégias e análise técnica</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 gap-2`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-lg shadow-sm ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground border border-border'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={message.role === 'user' ? 'secondary' : 'outline'} className="text-xs">
                            {message.role === 'user' ? '👤 Admin' : '🤖 TradeVision IA'}
                          </Badge>
                        </div>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        <p className="text-xs mt-2 opacity-60">
                          {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      
                      {message.role === 'assistant' && (
                        <div className="flex gap-1 items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => submitFeedback(message.id, star)}
                              className="p-1 hover:scale-110 transition-transform disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={message.feedback_score !== null && message.feedback_score !== undefined}
                              title={`Avaliar com ${star} estrela${star > 1 ? 's' : ''}`}
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  message.feedback_score && star <= message.feedback_score
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-400 hover:text-yellow-300'
                                }`}
                              />
                            </button>
                          ))}
                          {message.feedback_score && (
                            <span className="text-xs text-muted-foreground ml-2">
                              Avaliado ({message.feedback_score}⭐)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex gap-2 border-t border-border pt-4">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Ensine sobre padrões, estratégias, análise Wyckoff... (Enter para enviar)"
                  className="min-h-[80px] max-h-[120px] resize-none"
                  disabled={loading}
                />
                
                <Dialog open={instructionsDialogOpen} onOpenChange={setInstructionsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-[80px] w-[80px] shrink-0"
                      title="Instruções Especiais - Cole documentos ou instruções para análise cruzada"
                    >
                      <Sparkles className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Instruções Especiais
                      </DialogTitle>
                      <DialogDescription>
                        Cole documentos, dados ou instruções. A IA irá ler, entender, cruzar com o conhecimento existente e dar um resumo conversacional.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Textarea
                        value={instructionsInput}
                        onChange={(e) => setInstructionsInput(e.target.value)}
                        placeholder="Cole aqui suas instruções, dados, documentos ou perguntas complexas..."
                        className="min-h-[200px]"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setInstructionsDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={sendInstructions}
                          disabled={!instructionsInput.trim() || loading}
                          className="gap-2"
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          Analisar & Cruzar Dados
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  onClick={() => sendMessage()} 
                  disabled={loading || !input.trim()}
                  size="icon"
                  className="h-[80px] w-[80px] shrink-0"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Análise de Aprendizado
              </CardTitle>
              <CardDescription>
                Insights extraídos das conversas para melhorar a precisão do narrador
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <h3 className="font-semibold mb-2">📊 Próximas Funcionalidades</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Análise de sentimento das conversas</li>
                    <li>Identificação de padrões mais discutidos</li>
                    <li>Métricas de acurácia das respostas</li>
                    <li>Sugestões de melhoria no conhecimento</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          <StudyResults />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 max-h-[80vh] overflow-hidden">
            <CardHeader className="flex-shrink-0 pb-4">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Histórico de Mensagens
              </CardTitle>
              <CardDescription>
                Todas as conversas são analisadas para cruzar dados e melhorar respostas
              </CardDescription>
              {messages.length > 0 && (
                <Badge variant="outline" className="w-fit">
                  {messages.length} mensagens no histórico
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {messages.length > 0 ? (
                <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} gap-2`}
                      >
                        <div
                          className={`max-w-[85%] p-3 rounded-lg shadow-sm ${
                            message.role === 'user'
                              ? 'bg-primary/10 text-primary-foreground border border-primary/20'
                              : 'bg-muted/50 text-foreground border border-border/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Badge 
                              variant={message.role === 'user' ? 'secondary' : 'outline'} 
                              className="text-xs"
                            >
                              {message.role === 'user' ? '👤 Admin' : '🤖 TradeVision IA'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(message.created_at).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </p>
                          {message.feedback_score && (
                            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
                              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                              <span className="text-xs text-muted-foreground">
                                Avaliado: {message.feedback_score}/5
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2 text-sm">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">
                        💡 Sistema de análise cruzada: Cada conversa contribui para o aprendizado contínuo do narrador
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-center text-muted-foreground">
                  <div>
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nenhuma mensagem no histórico</p>
                    <p className="text-sm mt-2">
                      Comece uma conversa na aba "Chat ao Vivo" para construir o histórico
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}