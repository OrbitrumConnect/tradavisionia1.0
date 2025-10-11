import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Brain, 
  Bot, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Lightbulb,
  RefreshCw,
  Play,
  Pause,
  Zap,
  BarChart3
} from 'lucide-react';

interface MetaMessage {
  id: string;
  timestamp: string;
  narrator_id: string;
  agent_id: string;
  symbol: string;
  narrator_text: string;
  agent_text: string;
  combined_summary: string;
  learning_insights: any;
  pattern_correlation: any;
  learning_flag: boolean;
  backtesting_triggered: boolean;
}

interface MetaChatProps {
  symbol: string;
  onConsolidationComplete?: (consolidation: MetaMessage) => void;
}

export const MetaChat = ({ symbol, onConsolidationComplete }: MetaChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MetaMessage[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Carregar mensagens existentes
  useEffect(() => {
    loadExistingMessages();
  }, [symbol]);

  // Escutar novas mensagens do agente
  useEffect(() => {
    const channel = supabase
      .channel('agent_insights')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'agent_insights',
          filter: `symbol=eq.${symbol}`
        }, 
        async (payload) => {
          console.log('🔄 Nova insight do agente recebida pelo meta chat:', payload.new);
          
          // Processar automaticamente se ativo
          if (isActive) {
            await processAgentInsight(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [symbol, isActive]);

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
  }, [messages]);

  const loadExistingMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('meta_chat_history')
        .select('*')
        .eq('symbol', symbol)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAgentInsight = async (agentInsight: any) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      console.log('🧠 Meta chat processando insight do agente:', agentInsight.id);
      
      // Buscar mensagem original do narrador
      const { data: narratorMessage, error: narratorError } = await supabase
        .from('narrator_output')
        .select('*')
        .eq('id', agentInsight.narrator_id)
        .single();

      if (narratorError) {
        console.error('Erro ao buscar mensagem do narrador:', narratorError);
        return;
      }

      // Gerar consolidação
      const consolidation = await generateConsolidation(narratorMessage, agentInsight);
      
      // Salvar consolidação no banco
      const { data, error } = await supabase
        .from('meta_chat_history')
        .insert({
          narrator_id: narratorMessage.id,
          agent_id: agentInsight.id,
          symbol: symbol,
          narrator_text: narratorMessage.narrator_text,
          agent_text: agentInsight.insight_text,
          combined_summary: consolidation.summary,
          learning_insights: consolidation.learningInsights,
          pattern_correlation: consolidation.patternCorrelation,
          learning_flag: true,
          backtesting_triggered: false
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Consolidação gerada pelo meta chat:', data);
      setMessages(prev => [data, ...prev]);
      onConsolidationComplete?.(data);
      
      // Disparar backtesting se necessário
      if (consolidation.shouldTriggerBacktesting) {
        await triggerBacktesting(data);
      }
      
    } catch (error) {
      console.error('Erro ao processar insight do agente:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateConsolidation = async (narratorMessage: any, agentInsight: any): Promise<{
    summary: string;
    learningInsights: any;
    patternCorrelation: any;
    shouldTriggerBacktesting: boolean;
  }> => {
    // Gerar resumo consolidado
    const summary = `CONSOLIDAÇÃO: O narrador detectou "${narratorMessage.pattern_detected || 'padrão geral'}" com ${narratorMessage.confidence_score}% de confiança. O agente IA analisou e gerou insight do tipo "${agentInsight.insight_type}" com ${agentInsight.confidence_score}% de confiança. ${agentInsight.action_suggestion || 'Nenhuma ação específica sugerida.'}`;
    
    // Gerar insights de aprendizado
    const learningInsights = {
      pattern: narratorMessage.pattern_detected,
      narrator_confidence: narratorMessage.confidence_score,
      agent_confidence: agentInsight.confidence_score,
      insight_type: agentInsight.insight_type,
      correlation_strength: Math.min(narratorMessage.confidence_score, agentInsight.confidence_score) / 100,
      learning_priority: agentInsight.insight_type === 'learning' ? 'high' : 'medium'
    };
    
    // Correlação de padrões
    const patternCorrelation = {
      detected_pattern: narratorMessage.pattern_detected,
      agent_analysis: agentInsight.insight_type,
      confidence_alignment: Math.abs(narratorMessage.confidence_score - agentInsight.confidence_score) < 20,
      learning_value: narratorMessage.confidence_score * agentInsight.confidence_score / 10000
    };
    
    // Decidir se deve disparar backtesting
    const shouldTriggerBacktesting = 
      agentInsight.insight_type === 'learning' && 
      narratorMessage.confidence_score >= 70 && 
      agentInsight.confidence_score >= 70;

    return {
      summary,
      learningInsights,
      patternCorrelation,
      shouldTriggerBacktesting
    };
  };

  const triggerBacktesting = async (metaMessage: MetaMessage) => {
    try {
      console.log('🔄 Disparando backtesting para:', metaMessage.symbol);
      
      // Chamar função de backtesting
      const { data, error } = await supabase.functions.invoke('autonomous-backtesting', {
        body: {
          symbol: metaMessage.symbol,
          timeframe: '1m',
          days: 7,
          trigger_source: 'meta_chat',
          meta_message_id: metaMessage.id
        }
      });
      
      if (error) throw error;
      
      // Atualizar flag de backtesting
      await supabase
        .from('meta_chat_history')
        .update({ backtesting_triggered: true })
        .eq('id', metaMessage.id);
      
      console.log('✅ Backtesting disparado com sucesso');
      
    } catch (error) {
      console.error('Erro ao disparar backtesting:', error);
    }
  };

  const handleToggleActive = () => {
    setIsActive(!isActive);
  };

  const handleRefresh = () => {
    loadExistingMessages();
  };

  const getLearningPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-green-500 bg-green-500/10';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10';
      case 'low': return 'border-gray-500 bg-gray-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getLearningPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Zap className="h-4 w-4 text-green-400" />;
      case 'medium': return <Lightbulb className="h-4 w-4 text-yellow-400" />;
      case 'low': return <Target className="h-4 w-4 text-gray-400" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  return (
    <Card className="h-full bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-orange-400" />
            Meta Chat
            <Badge variant="outline" className="text-xs">
              {symbol}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleToggleActive}
              size="sm"
              className={isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : isActive ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isProcessing ? 'Processando...' : isActive ? 'Pausar' : 'Ativar'}
            </Button>
            <Button
              onClick={handleRefresh}
              size="sm"
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
            {isActive ? 'Ativo' : 'Inativo'}
          </div>
          <div>{messages.length} consolidações</div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea ref={scrollAreaRef} className="h-96 px-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">Carregando consolidações...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
              <p>Nenhuma consolidação ainda</p>
              <p className="text-sm">Ative o meta chat para começar</p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg border ${
                    message.learning_flag ? 'border-green-500 bg-green-500/10' : 'border-gray-500 bg-gray-500/10'
                  } hover:border-opacity-80 transition-colors`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-orange-400" />
                      <span className="text-sm text-gray-400">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                      {message.learning_flag && (
                        <Badge variant="outline" className="text-xs text-green-400">
                          Aprendizado
                        </Badge>
                      )}
                      {message.backtesting_triggered && (
                        <Badge variant="outline" className="text-xs text-blue-400">
                          Backtesting
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Bot className="h-3 w-3 text-blue-400" />
                      <Brain className="h-3 w-3 text-purple-400" />
                    </div>
                  </div>
                  
                  <div className="text-white text-sm leading-relaxed mb-3">
                    {message.combined_summary}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-2 bg-slate-700 rounded border border-slate-600">
                      <div className="text-xs text-gray-400 mb-1">Narrador:</div>
                      <div className="text-sm text-blue-400">{message.narrator_text}</div>
                    </div>
                    <div className="p-2 bg-slate-700 rounded border border-slate-600">
                      <div className="text-xs text-gray-400 mb-1">Agente:</div>
                      <div className="text-sm text-purple-400">{message.agent_text}</div>
                    </div>
                  </div>
                  
                  {message.learning_insights && (
                    <div className="mt-3 pt-3 border-t border-slate-600">
                      <div className="text-xs text-gray-400 mb-2">Insights de Aprendizado:</div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getLearningPriorityIcon(message.learning_insights.learning_priority)}
                          <span className="text-sm text-white">
                            Prioridade: {message.learning_insights.learning_priority}
                          </span>
                        </div>
                        <div className="text-sm text-gray-300">
                          Correlação: {Math.round(message.learning_insights.correlation_strength * 100)}%
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {message.pattern_correlation && (
                    <div className="mt-3 pt-3 border-t border-slate-600">
                      <div className="text-xs text-gray-400 mb-2">Correlação de Padrões:</div>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">
                          {message.pattern_correlation.detected_pattern}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {message.pattern_correlation.agent_analysis}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Valor: {Math.round(message.pattern_correlation.learning_value)}%
                        </Badge>
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
  );
};
