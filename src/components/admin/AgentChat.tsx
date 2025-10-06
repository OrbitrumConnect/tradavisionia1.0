import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Lightbulb,
  RefreshCw,
  Play,
  Pause,
  Settings,
  MessageSquare
} from 'lucide-react';

interface AgentMessage {
  id: string;
  timestamp: string;
  narrator_id: string;
  symbol: string;
  insight_type: 'learning' | 'adjustment' | 'suggestion' | 'analysis';
  insight_text: string;
  adjustment_weights: any;
  action_suggestion: string | null;
  confidence_score: number;
  processed_flag: boolean;
}

interface NarratorMessage {
  id: string;
  timestamp: string;
  symbol: string;
  pattern_detected: string | null;
  narrator_text: string;
  confidence_score: number;
  indicators: any;
  market_data: any;
}

interface AgentChatProps {
  symbol: string;
  onInsightGenerated?: (insight: AgentMessage) => void;
}

export const AgentChat = ({ symbol, onInsightGenerated }: AgentChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [narratorMessages, setNarratorMessages] = useState<NarratorMessage[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Carregar mensagens existentes
  useEffect(() => {
    loadExistingMessages();
  }, [symbol]);

  // Escutar novas mensagens do narrador
  useEffect(() => {
    const channel = supabase
      .channel('narrator_output')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'narrator_output',
          filter: `symbol=eq.${symbol}`
        }, 
        async (payload) => {
          console.log('🔄 Nova mensagem do narrador recebida pelo agente:', payload.new);
          const narratorMessage = payload.new as NarratorMessage;
          setNarratorMessages(prev => [narratorMessage, ...prev]);
          
          // Processar automaticamente se ativo
          if (isActive) {
            await processNarratorMessage(narratorMessage);
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
      
      // Carregar insights do agente
      const { data: agentData, error: agentError } = await supabase
        .from('agent_insights')
        .select('*')
        .eq('symbol', symbol)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (agentError) throw agentError;
      setMessages(agentData || []);

      // Carregar mensagens do narrador
      const { data: narratorData, error: narratorError } = await supabase
        .from('narrator_output')
        .select('*')
        .eq('symbol', symbol)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (narratorError) throw narratorError;
      setNarratorMessages(narratorData || []);

    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const processNarratorMessage = async (narratorMessage: NarratorMessage) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      console.log('🧠 Agente processando mensagem do narrador:', narratorMessage.id);
      
      // Gerar insight baseado na mensagem do narrador
      const insight = await generateInsight(narratorMessage);
      
      // Salvar insight no banco
      const { data, error } = await supabase
        .from('agent_insights')
        .insert({
          narrator_id: narratorMessage.id,
          symbol: symbol,
          insight_type: insight.type,
          insight_text: insight.text,
          adjustment_weights: insight.weights,
          action_suggestion: insight.suggestion,
          confidence_score: insight.confidence,
          processed_flag: false
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Insight gerado pelo agente:', data);
      setMessages(prev => [data, ...prev]);
      onInsightGenerated?.(data);
      
    } catch (error) {
      console.error('Erro ao processar mensagem do narrador:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateInsight = async (narratorMessage: NarratorMessage): Promise<{
    type: 'learning' | 'adjustment' | 'suggestion' | 'analysis';
    text: string;
    weights: any;
    suggestion: string | null;
    confidence: number;
  }> => {
    // Simular geração de insight baseado na mensagem do narrador
    const pattern = narratorMessage.pattern_detected;
    const confidence = narratorMessage.confidence_score;
    
    let insightType: 'learning' | 'adjustment' | 'suggestion' | 'analysis' = 'analysis';
    let insightText = '';
    let weights = {};
    let suggestion = null;
    let insightConfidence = 0;

    if (pattern) {
      if (confidence >= 80) {
        insightType = 'learning';
        insightText = `Padrão "${pattern}" detectado com alta confiança (${confidence}%). Este padrão tem histórico positivo e pode ser usado para futuras análises.`;
        weights = { [pattern]: { weight: 0.8, confidence: confidence / 100 } };
        suggestion = 'Considerar aumentar peso deste padrão no modelo de aprendizado.';
        insightConfidence = 85;
      } else if (confidence >= 60) {
        insightType = 'adjustment';
        insightText = `Padrão "${pattern}" detectado com confiança moderada (${confidence}%). Recomendo ajustar parâmetros de detecção.`;
        weights = { [pattern]: { weight: 0.6, confidence: confidence / 100 } };
        suggestion = 'Revisar algoritmo de detecção para melhorar precisão.';
        insightConfidence = 70;
      } else {
        insightType = 'suggestion';
        insightText = `Padrão "${pattern}" detectado com baixa confiança (${confidence}%). Necessário mais dados para validação.`;
        weights = { [pattern]: { weight: 0.4, confidence: confidence / 100 } };
        suggestion = 'Coletar mais dados históricos para validar este padrão.';
        insightConfidence = 50;
      }
    } else {
      insightType = 'analysis';
      insightText = `Análise de mercado geral: ${narratorMessage.narrator_text}. Nenhum padrão específico detectado, mas contexto de mercado relevante.`;
      weights = { general_analysis: { weight: 0.5, confidence: 0.6 } };
      suggestion = 'Monitorar indicadores para possíveis padrões emergentes.';
      insightConfidence = 60;
    }

    return {
      type: insightType,
      text: insightText,
      weights,
      suggestion,
      confidence: insightConfidence
    };
  };

  const handleToggleActive = () => {
    setIsActive(!isActive);
  };

  const handleRefresh = () => {
    loadExistingMessages();
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'learning': return <Brain className="h-4 w-4 text-green-400" />;
      case 'adjustment': return <Zap className="h-4 w-4 text-yellow-400" />;
      case 'suggestion': return <Lightbulb className="h-4 w-4 text-blue-400" />;
      case 'analysis': return <Target className="h-4 w-4 text-purple-400" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'learning': return 'border-green-500 bg-green-500/10';
      case 'adjustment': return 'border-yellow-500 bg-yellow-500/10';
      case 'suggestion': return 'border-blue-500 bg-blue-500/10';
      case 'analysis': return 'border-purple-500 bg-purple-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card className="h-full bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            Agente IA
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
          <div>{messages.length} insights</div>
          <div>{narratorMessages.length} mensagens narrador</div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea ref={scrollAreaRef} className="h-96 px-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">Carregando insights...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Brain className="h-12 w-12 mb-4 opacity-50" />
              <p>Nenhum insight gerado ainda</p>
              <p className="text-sm">Ative o agente para começar a processar</p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg border ${getInsightColor(message.insight_type)} hover:border-opacity-80 transition-colors`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getInsightIcon(message.insight_type)}
                      <span className="text-sm text-gray-400">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {message.insight_type}
                      </Badge>
                    </div>
                    <Badge className={`text-xs ${getConfidenceColor(message.confidence_score)}`}>
                      {message.confidence_score}%
                    </Badge>
                  </div>
                  
                  <div className="text-white text-sm leading-relaxed mb-2">
                    {message.insight_text}
                  </div>
                  
                  {message.action_suggestion && (
                    <div className="mt-2 pt-2 border-t border-slate-600">
                      <div className="text-xs text-gray-400 mb-1">Sugestão:</div>
                      <div className="text-sm text-blue-400">{message.action_suggestion}</div>
                    </div>
                  )}
                  
                  {message.adjustment_weights && Object.keys(message.adjustment_weights).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-600">
                      <div className="text-xs text-gray-400 mb-1">Ajustes de Peso:</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(message.adjustment_weights).map(([key, value]) => (
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
  );
};
