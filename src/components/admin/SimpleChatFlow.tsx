import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Bot, 
  Brain, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SimpleChatFlowProps {
  symbol: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SimpleChatFlow = ({ symbol, isOpen, onOpenChange }: SimpleChatFlowProps) => {
  const { user } = useAuth();
  const [narratorSignals, setNarratorSignals] = useState<any[]>([]);
  const [builderMessages, setBuilderMessages] = useState<any[]>([]);
  const [conversationFlow, setConversationFlow] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar dados quando abrir
  useEffect(() => {
    if (isOpen) {
      loadChatFlow();
    }
  }, [isOpen, symbol]);

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

      if (narratorError) {
        console.error('Erro ao carregar sinais do narrador:', narratorError);
      } else {
        setNarratorSignals(narratorData || []);
      }

      // 2. Carregar mensagens do builder
      const { data: builderData, error: builderError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('role', 'assistant')
        .order('created_at', { ascending: false })
        .limit(10);

      if (builderError) {
        console.error('Erro ao carregar mensagens do builder:', builderError);
      } else {
        setBuilderMessages(builderData || []);
      }

      // 3. Criar fluxo de conversa
      const flow = createConversationFlow(narratorData || [], builderData || []);
      setConversationFlow(flow);

    } catch (error) {
      console.error('Erro ao carregar fluxo de chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const createConversationFlow = (narratorData: any[], builderData: any[]) => {
    const flow: any[] = [];
    
    // Combinar dados em ordem cronológica
    const allData = [
      ...narratorData.map(item => ({ ...item, type: 'narrator', timestamp: item.created_at })),
      ...builderData.map(item => ({ ...item, type: 'builder', timestamp: item.created_at }))
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

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
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
          <MessageSquare className="h-4 w-4 mr-2" />
          Fluxo de Chats
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full max-w-5xl bg-slate-900 border-slate-700">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-400" />
            Fluxo: Narrador → Builder → Resposta
            <Badge variant="outline" className="text-xs">
              {symbol}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {/* Controles */}
          <Card className="mb-4 bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Controles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  onClick={loadChatFlow}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar Fluxo
                </Button>
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="outline"
                  className="border-gray-500 text-gray-400 hover:bg-gray-500/10"
                >
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Fluxo de Conversa */}
          <Card className="h-96 bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-orange-400" />
                Fluxo de Conversa
                <Badge variant="outline" className="text-xs">
                  {conversationFlow.length} conversas
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-80 px-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-400">Carregando fluxo...</span>
                  </div>
                ) : conversationFlow.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                    <p>Nenhuma conversa ainda</p>
                    <p className="text-sm">O fluxo aparecerá aqui automaticamente</p>
                  </div>
                ) : (
                  <div className="space-y-4 pb-4">
                    {conversationFlow.map((flow) => (
                      <div
                        key={flow.id}
                        className="p-4 bg-slate-700 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                      >
                        {/* Timestamp */}
                        <div className="text-xs text-gray-400 mb-3">
                          {new Date(flow.timestamp).toLocaleString()}
                        </div>

                        {/* Narrador */}
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Bot className="h-4 w-4 text-blue-400" />
                            <span className="text-sm font-semibold text-blue-400">Narrador</span>
                            <Badge variant="outline" className="text-xs">
                              {flow.narrator.signal_type}
                            </Badge>
                            <Badge className={`text-xs ${getConfidenceColor(flow.narrator.probability)}`}>
                              {flow.narrator.probability}%
                            </Badge>
                          </div>
                          <div className="pl-6 text-sm text-white">
                            <strong>Padrão:</strong> {flow.narrator.pattern}
                          </div>
                          {flow.narrator.figure && (
                            <div className="pl-6 text-sm text-gray-300">
                              <strong>Figura:</strong> {flow.narrator.figure}
                            </div>
                          )}
                          <div className="pl-6 text-sm text-blue-400">
                            <strong>Preço:</strong> {flow.narrator.price}
                          </div>
                        </div>

                        {/* Seta */}
                        <div className="flex justify-center mb-3">
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </div>

                        {/* Builder */}
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Brain className="h-4 w-4 text-purple-400" />
                            <span className="text-sm font-semibold text-purple-400">Builder Agente</span>
                            <Badge variant="outline" className="text-xs">
                              {flow.builder.role}
                            </Badge>
                          </div>
                          <div className="pl-6 text-sm text-white">
                            {flow.builder.content}
                          </div>
                        </div>

                        {/* Linha divisória */}
                        <div className="border-t border-slate-600 pt-3">
                          <div className="text-xs text-gray-400">
                            <strong>Resposta:</strong> Builder processou o sinal do narrador e gerou análise
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card className="mt-4 bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Estatísticas do Fluxo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{narratorSignals.length}</div>
                  <div className="text-sm text-gray-400">Sinais Narrador</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{builderMessages.length}</div>
                  <div className="text-sm text-gray-400">Mensagens Builder</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">{conversationFlow.length}</div>
                  <div className="text-sm text-gray-400">Conversas</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};
