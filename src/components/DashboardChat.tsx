import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMarketContext } from '@/contexts/MarketContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, MessageSquare, Bot, Star, Plus, History, Trash2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { useLocalEmbeddings } from '@/hooks/useLocalEmbeddings';
import { StudyResults } from '@/components/learning/StudyResults';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  feedback_score?: number | null;
}

interface Conversation {
  id: string;
  title: string;
  summary: string | null;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export function DashboardChat() {
  const { user } = useAuth();
  const marketContext = useMarketContext();
  const { getEmbedding, isReady: embeddingsReady } = useLocalEmbeddings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      sonnerToast.success(`Avaliação: ${score} ⭐`);
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      sonnerToast.error('Erro ao registrar avaliação');
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      feedback_score: msg.feedback_score
    })));
  };

  useEffect(() => {
    loadMessages(currentConversationId || undefined);
    loadConversations();
  }, [user, currentConversationId]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const conversationsWithCount = await Promise.all(
        (data || []).map(async (conv) => {
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);

          return {
            ...conv,
            message_count: count || 0,
          };
        })
      );

      setConversations(conversationsWithCount);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
    }
  };

  const handleNewConversation = async () => {
    setCurrentConversationId(null);
    setMessages([]);
    setInput('');
    sonnerToast.success('Nova conversa iniciada');
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setHistoryOpen(false);
  };

  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      sonnerToast.success('Conversa excluída');
      loadConversations();
      
      if (currentConversationId === conversationId) {
        handleNewConversation();
      }
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      sonnerToast.error('Erro ao excluir conversa');
    }
  };

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        sonnerToast.success('Imagem carregada! Envie para analisar.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImproveStudy = async () => {
    if (!user || messages.length === 0) {
      sonnerToast.error('Nenhuma conversa para melhorar');
      return;
    }

    setIsAnalyzing(true);
    try {
      const conversationContext = messages
        .filter(m => m.role !== 'system')
        .map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`)
        .join('\n\n');

      const { data: responseData, error: functionError } = await supabase.functions.invoke('improve-study', {
        body: {
          conversationId: currentConversationId,
          conversationContext,
          marketContext: {
            symbol: marketContext.symbol,
            price: marketContext.price,
            timeframe: marketContext.timeframe,
            fearGreedIndex: marketContext.fearGreedIndex,
            buyerDominance: marketContext.buyerDominance,
            marketPressure: marketContext.marketPressure,
            narratorFeed: marketContext.narratorFeed,
          }
        }
      });

      if (functionError) throw functionError;

      const improvementMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `📚 **Estudo Melhorado**\n\n${responseData.analysis}\n\n---\n\n✅ Aprendizado salvo na base de conhecimento!`,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, improvementMessage]);

      await supabase.from('chat_messages').insert({
        user_id: user.id,
        conversation_id: currentConversationId,
        role: 'assistant',
        content: improvementMessage.content,
        session_id: sessionId,
        metadata: { type: 'improved_study', knowledge_saved: true },
      });

      sonnerToast.success('Estudo melhorado e salvo!');
    } catch (error: any) {
      console.error('Error improving study:', error);
      sonnerToast.error('Erro ao melhorar estudo');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !uploadedImage) || loading || !user) return;

    const userMessage = input.trim() || (uploadedImage ? '[Imagem enviada]' : '');
    const imageToSend = uploadedImage;
    setInput('');
    setUploadedImage(null);
    setLoading(true);

    try {
      let conversationId = currentConversationId;
      
      if (!conversationId) {
        conversationId = await createNewConversation();
        if (conversationId) {
          setCurrentConversationId(conversationId);
        }
      }

      const userMessageObj: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: userMessage,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessageObj]);

      let userEmbedding = null;
      if (embeddingsReady) {
        try {
          userEmbedding = await getEmbedding(userMessage);
        } catch (error) {
          console.error('Error getting embedding:', error);
        }
      }

      const { data: savedMessage, error: saveError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          conversation_id: conversationId,
          role: 'user',
          content: userMessage,
          session_id: sessionId,
          embedding: userEmbedding,
        })
        .select()
        .single();

      if (saveError) throw saveError;

      const { data: responseData, error: functionError } = await supabase.functions.invoke('trade-chat', {
        body: {
          message: userMessage,
          image: imageToSend,
          userId: user.id,
          sessionId,
          conversationId,
          marketContext: {
            currentPrice: marketContext.price,
            symbol: marketContext.symbol,
            timeframe: marketContext.timeframe,
            fearGreedIndex: marketContext.fearGreedIndex,
            buyerDominance: marketContext.buyerDominance,
            marketPressure: marketContext.marketPressure,
            narratorSignals: marketContext.narratorFeed,
          }
        }
      });

      if (functionError) throw functionError;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: responseData.response,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      await supabase.from('chat_messages').insert({
        user_id: user.id,
        conversation_id: conversationId,
        role: 'assistant',
        content: responseData.response,
        session_id: sessionId,
        metadata: responseData.metadata || {},
      });

    } catch (error: any) {
      console.error('Error sending message:', error);
      sonnerToast.error('Erro ao enviar mensagem: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card/80 border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Agente TradeVision IA
            <Badge variant="outline">
              {embeddingsReady ? '🟢 IA Local Ativa' : '🟡 Carregando IA...'}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleNewConversation}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Conversa
            </Button>
            
            <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
              <SheetTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                  <History className="h-4 w-4" />
                  Histórico
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Histórico de Conversas
                  </SheetTitle>
                </SheetHeader>
                
                <ScrollArea className="h-[calc(100vh-120px)] mt-6">
                  {conversations.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Nenhuma conversa ainda.
                      <br />
                      Comece uma nova conversa!
                    </div>
                  ) : (
                    <div className="space-y-2 pr-4">
                      {conversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => handleSelectConversation(conv.id)}
                          className={`group relative p-4 rounded-lg cursor-pointer transition-colors border ${
                            currentConversationId === conv.id
                              ? 'bg-primary/10 border-primary/50'
                              : 'hover:bg-muted border-transparent'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {conv.title}
                              </p>
                              {conv.summary && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                  {conv.summary}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {conv.message_count} msgs
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(conv.updated_at).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'short',
                                  })}
                                </span>
                              </div>
                            </div>
                            
                            <Button
                              onClick={(e) => deleteConversation(conv.id, e)}
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
        {/* Messages */}
        <div className="h-96 overflow-y-auto space-y-3 p-4 bg-background/50 rounded-lg border border-border/30">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Olá! Sou o TradeVision IA 🤖
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pergunte sobre análises, sinais, padrões ou estratégias de trading
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/30">
                      <span className="text-xs text-muted-foreground mr-2">Útil?</span>
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          onClick={() => submitFeedback(msg.id, score)}
                          className={`p-1 hover:scale-110 transition-transform ${
                            msg.feedback_score === score ? 'text-yellow-500' : 'text-muted-foreground'
                          }`}
                        >
                          <Star className="h-3 w-3" fill={msg.feedback_score === score ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="space-y-2">
          {uploadedImage && (
            <div className="relative inline-block">
              <img src={uploadedImage} alt="Upload" className="max-h-32 rounded-lg border" />
              <Button
                size="icon"
                variant="danger"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={() => setUploadedImage(null)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Digite sua pergunta ou envie uma imagem..."
              className="resize-none flex-1"
              rows={2}
              disabled={loading}
            />
            
            <Button
              onClick={handleSendMessage}
              disabled={loading || (!input.trim() && !uploadedImage)}
              size="icon"
              className="h-auto"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              onClick={handleImproveStudy}
              disabled={isAnalyzing || messages.length === 0}
              variant="outline"
              size="icon"
              className="h-auto"
              title="Melhorar Estudo"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Context Info */}
        <div className="flex gap-2 flex-wrap text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            📊 {marketContext.symbol || 'BTC/USDT'}
          </Badge>
          <Badge variant="outline" className="text-xs">
            💰 ${marketContext.price || '---'}
          </Badge>
          <Badge variant="outline" className="text-xs">
            😱 Medo/Ganância: {marketContext.fearGreedIndex || 50}
          </Badge>
          <Badge variant="outline" className="text-xs">
            📈 Compradores: {marketContext.buyerDominance || 50}%
          </Badge>
        </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <StudyResults />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <p>Use o botão de histórico no topo para ver todas as conversas salvas</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
