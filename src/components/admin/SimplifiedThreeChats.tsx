import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Bot, 
  Brain, 
  Zap,
  Play,
  Pause,
  Settings,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SimplifiedThreeChatsProps {
  symbol: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SimplifiedThreeChats = ({ symbol, isOpen, onOpenChange }: SimplifiedThreeChatsProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('narrator');
  const [narratorMessages, setNarratorMessages] = useState<any[]>([]);
  const [agentInsights, setAgentInsights] = useState<any[]>([]);
  const [metaConsolidations, setMetaConsolidations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar dados existentes
  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen, symbol]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Carregar sinais do narrador (tabela existente)
      const { data: narratorData, error: narratorError } = await supabase
        .from('narrator_signals')
        .select('*')
        .eq('symbol', symbol.replace('/', ''))
        .order('created_at', { ascending: false })
        .limit(20);

      if (narratorError) {
        console.error('Erro ao carregar sinais do narrador:', narratorError);
      } else {
        setNarratorMessages(narratorData || []);
      }

      // Carregar mensagens de chat (tabela existente)
      const { data: chatData, error: chatError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('role', 'assistant')
        .order('created_at', { ascending: false })
        .limit(20);

      if (chatError) {
        console.error('Erro ao carregar mensagens de chat:', chatError);
      } else {
        setAgentInsights(chatData || []);
      }

      // Carregar análises de trade (tabela existente)
      const { data: analysisData, error: analysisError } = await supabase
        .from('trade_analysis')
        .select('*')
        .eq('symbol', symbol.replace('/', ''))
        .order('created_at', { ascending: false })
        .limit(20);

      if (analysisError) {
        console.error('Erro ao carregar análises:', analysisError);
      } else {
        setMetaConsolidations(analysisData || []);
      }

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

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
          <MessageSquare className="h-4 w-4 mr-2" />
          Sistema de Chats
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full max-w-6xl bg-slate-900 border-slate-700">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-400" />
            Sistema de Chats Inteligentes
            <Badge variant="outline" className="text-xs">
              {symbol}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {/* Status dos Chats */}
          <Card className="mb-4 bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Status dos Chats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-sm text-gray-400">Narrador</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-sm text-gray-400">Agente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-sm text-gray-400">Meta Chat</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs dos Chats */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-700">
              <TabsTrigger value="narrator" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Narrador IA
              </TabsTrigger>
              <TabsTrigger value="agent" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Agente IA
              </TabsTrigger>
              <TabsTrigger value="meta" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Meta Chat
              </TabsTrigger>
            </TabsList>

            {/* Tab: Narrador IA */}
            <TabsContent value="narrator" className="mt-4">
              <Card className="h-96 bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Bot className="h-5 w-5 text-blue-400" />
                    Narrador IA - Sinais
                    <Badge variant="outline" className="text-xs">
                      {narratorMessages.length} sinais
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-80 px-4">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                        <span className="ml-2 text-gray-400">Carregando sinais...</span>
                      </div>
                    ) : narratorMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <Bot className="h-12 w-12 mb-4 opacity-50" />
                        <p>Nenhum sinal do narrador ainda</p>
                        <p className="text-sm">Os sinais aparecerão aqui automaticamente</p>
                      </div>
                    ) : (
                      <div className="space-y-3 pb-4">
                        {narratorMessages.map((signal) => (
                          <div
                            key={signal.id}
                            className={`p-3 rounded-lg border ${getSignalColor(signal.signal_type)} hover:border-opacity-80 transition-colors`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getSignalIcon(signal.signal_type)}
                                <span className="text-sm text-gray-400">
                                  {new Date(signal.created_at).toLocaleTimeString()}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {signal.signal_type}
                                </Badge>
                              </div>
                              <Badge className={`text-xs ${getConfidenceColor(signal.probability)}`}>
                                {signal.probability}%
                              </Badge>
                            </div>
                            
                            <div className="text-white text-sm leading-relaxed mb-2">
                              <strong>Padrão:</strong> {signal.pattern}
                            </div>
                            
                            {signal.figure && (
                              <div className="text-sm text-gray-300 mb-2">
                                <strong>Figura:</strong> {signal.figure}
                              </div>
                            )}
                            
                            {signal.risk_note && (
                              <div className="text-sm text-yellow-400 mb-2">
                                <strong>Risco:</strong> {signal.risk_note}
                              </div>
                            )}
                            
                            <div className="text-sm text-blue-400">
                              <strong>Preço:</strong> {signal.price}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Agente IA */}
            <TabsContent value="agent" className="mt-4">
              <Card className="h-96 bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-400" />
                    Agente IA - Insights
                    <Badge variant="outline" className="text-xs">
                      {agentInsights.length} insights
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-80 px-4">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                        <span className="ml-2 text-gray-400">Carregando insights...</span>
                      </div>
                    ) : agentInsights.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <Brain className="h-12 w-12 mb-4 opacity-50" />
                        <p>Nenhum insight do agente ainda</p>
                        <p className="text-sm">Os insights aparecerão aqui automaticamente</p>
                      </div>
                    ) : (
                      <div className="space-y-3 pb-4">
                        {agentInsights.map((insight) => (
                          <div
                            key={insight.id}
                            className="p-3 bg-slate-700 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Brain className="h-4 w-4 text-purple-400" />
                                <span className="text-sm text-gray-400">
                                  {new Date(insight.created_at).toLocaleTimeString()}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {insight.role}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="text-white text-sm leading-relaxed">
                              {insight.content}
                            </div>
                            
                            {insight.metadata && Object.keys(insight.metadata).length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-600">
                                <div className="text-xs text-gray-400 mb-1">Metadados:</div>
                                <div className="flex flex-wrap gap-1">
                                  {Object.entries(insight.metadata).slice(0, 3).map(([key, value]) => (
                                    <Badge key={key} variant="outline" className="text-xs">
                                      {key}: {typeof value === 'object' ? JSON.stringify(value) : value}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Meta Chat */}
            <TabsContent value="meta" className="mt-4">
              <Card className="h-96 bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-orange-400" />
                    Meta Chat - Consolidações
                    <Badge variant="outline" className="text-xs">
                      {metaConsolidations.length} análises
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-80 px-4">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                        <span className="ml-2 text-gray-400">Carregando consolidações...</span>
                      </div>
                    ) : metaConsolidations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                        <p>Nenhuma consolidação ainda</p>
                        <p className="text-sm">As consolidações aparecerão aqui automaticamente</p>
                      </div>
                    ) : (
                      <div className="space-y-3 pb-4">
                        {metaConsolidations.map((analysis) => (
                          <div
                            key={analysis.id}
                            className="p-3 bg-slate-700 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-orange-400" />
                                <span className="text-sm text-gray-400">
                                  {new Date(analysis.created_at).toLocaleTimeString()}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {analysis.analysis_type}
                                </Badge>
                              </div>
                              <Badge className={`text-xs ${getConfidenceColor(analysis.confidence_score || 0)}`}>
                                {analysis.confidence_score || 0}%
                              </Badge>
                            </div>
                            
                            <div className="text-white text-sm leading-relaxed mb-2">
                              <strong>Padrão:</strong> {analysis.pattern_detected || 'N/A'}
                            </div>
                            
                            {analysis.result && (
                              <div className="text-sm text-green-400 mb-2">
                                <strong>Resultado:</strong> {analysis.result}
                              </div>
                            )}
                            
                            {analysis.feedback_score && (
                              <div className="text-sm text-yellow-400 mb-2">
                                <strong>Feedback:</strong> {analysis.feedback_score}/5 ⭐
                              </div>
                            )}
                            
                            <div className="text-sm text-blue-400">
                              <strong>Preço:</strong> {analysis.entry_price || 'N/A'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Controles Globais */}
          <Card className="mt-4 bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Controles Globais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={loadAllData}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar Dados
                </Button>
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="outline"
                  className="border-gray-500 text-gray-400 hover:bg-gray-500/10"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card className="mt-4 bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Estatísticas do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{narratorMessages.length}</div>
                  <div className="text-sm text-gray-400">Sinais Narrador</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{agentInsights.length}</div>
                  <div className="text-sm text-gray-400">Insights Agente</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">{metaConsolidations.length}</div>
                  <div className="text-sm text-gray-400">Análises Meta</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};
