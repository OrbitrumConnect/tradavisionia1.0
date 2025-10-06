import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Database, Target, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MetaInsight {
  id: string;
  type: 'dataset' | 'weight_adjustment' | 'pattern_summary' | 'learning_insight';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  created_at: string;
  metadata: {
    narrator_count: number;
    builder_count: number;
    patterns_detected: string[];
    learning_score: number;
  };
}

export const MetaConsolidator = ({ symbol }: { symbol: string }) => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<MetaInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Carregar insights consolidados
  const loadMetaInsights = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('meta_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('symbol', symbol.replace('/', ''))
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Erro ao carregar insights meta:', error);
        return;
      }

      setInsights(data || []);
    } catch (error) {
      console.error('Erro ao carregar insights meta:', error);
    } finally {
      setLoading(false);
    }
  };

  // Processar conversas e gerar insights consolidados
  const processConversations = async () => {
    if (!user || isProcessing) return;

    try {
      setIsProcessing(true);
      console.log('🧠 Meta Consolidador processando conversas...');

      // Buscar conversas recentes (últimas 24h)
      const { data: conversations, error: convError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('context_type', 'chat_flow')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (convError) {
        console.error('Erro ao buscar conversas:', convError);
        return;
      }

      if (!conversations || conversations.length === 0) {
        console.log('📭 Nenhuma conversa encontrada para processar');
        return;
      }

      // Separar narrador e builder
      const narratorMessages = conversations.filter(msg => 
        msg.metadata?.processing_type === 'real_narrator_response'
      );
      const builderMessages = conversations.filter(msg => 
        msg.metadata?.processing_type === 'real_narrator_response'
      );

      console.log(`📊 Processando ${narratorMessages.length} narrador + ${builderMessages.length} builder`);

      // Gerar insights consolidados
      const consolidatedInsights = await generateConsolidatedInsights(
        narratorMessages,
        builderMessages
      );

      // Salvar insights no banco
      for (const insight of consolidatedInsights) {
        const { error } = await supabase
          .from('meta_insights')
          .insert({
            user_id: user.id,
            symbol: symbol.replace('/', ''),
            insight_type: insight.type,
            title: insight.title,
            content: insight.content,
            priority: insight.priority,
            confidence: insight.confidence,
            metadata: insight.metadata
          });

        if (error) {
          console.error('Erro ao salvar insight:', error);
        }
      }

      console.log(`✅ ${consolidatedInsights.length} insights consolidados gerados`);
      
      // Recarregar insights
      await loadMetaInsights();

    } catch (error) {
      console.error('Erro ao processar conversas:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Gerar insights consolidados
  const generateConsolidatedInsights = async (
    narratorMessages: any[],
    builderMessages: any[]
  ): Promise<MetaInsight[]> => {
    const insights: MetaInsight[] = [];

    // 1. Dataset para Backtesting
    if (narratorMessages.length > 0) {
      insights.push({
        id: `dataset-${Date.now()}`,
        type: 'dataset',
        title: 'Dataset para Backtesting',
        content: `Gerado dataset com ${narratorMessages.length} sinais do narrador e ${builderMessages.length} respostas do builder. Padrões detectados: ${extractPatterns(narratorMessages).join(', ')}`,
        priority: 'high',
        confidence: 85,
        created_at: new Date().toISOString(),
        metadata: {
          narrator_count: narratorMessages.length,
          builder_count: builderMessages.length,
          patterns_detected: extractPatterns(narratorMessages),
          learning_score: calculateLearningScore(narratorMessages, builderMessages)
        }
      });
    }

    // 2. Ajuste de Pesos
    const patternWeights = calculatePatternWeights(narratorMessages, builderMessages);
    if (Object.keys(patternWeights).length > 0) {
      insights.push({
        id: `weights-${Date.now()}`,
        type: 'weight_adjustment',
        title: 'Ajuste de Pesos de Aprendizado',
        content: `Pesos ajustados: ${Object.entries(patternWeights).map(([pattern, weight]) => `${pattern}: ${weight}%`).join(', ')}`,
        priority: 'high',
        confidence: 90,
        created_at: new Date().toISOString(),
        metadata: {
          narrator_count: narratorMessages.length,
          builder_count: builderMessages.length,
          patterns_detected: Object.keys(patternWeights),
          learning_score: calculateLearningScore(narratorMessages, builderMessages)
        }
      });
    }

    // 3. Resumo de Padrões
    const patternSummary = generatePatternSummary(narratorMessages);
    if (patternSummary.length > 0) {
      insights.push({
        id: `patterns-${Date.now()}`,
        type: 'pattern_summary',
        title: 'Resumo de Padrões Detectados',
        content: `Padrões mais frequentes: ${patternSummary.map(p => `${p.pattern} (${p.count}x)`).join(', ')}`,
        priority: 'medium',
        confidence: 80,
        created_at: new Date().toISOString(),
        metadata: {
          narrator_count: narratorMessages.length,
          builder_count: builderMessages.length,
          patterns_detected: patternSummary.map(p => p.pattern),
          learning_score: calculateLearningScore(narratorMessages, builderMessages)
        }
      });
    }

    // 4. Insight de Aprendizado
    const learningInsight = generateLearningInsight(narratorMessages, builderMessages);
    if (learningInsight) {
      insights.push({
        id: `learning-${Date.now()}`,
        type: 'learning_insight',
        title: 'Insight de Aprendizado',
        content: learningInsight,
        priority: 'high',
        confidence: 75,
        created_at: new Date().toISOString(),
        metadata: {
          narrator_count: narratorMessages.length,
          builder_count: builderMessages.length,
          patterns_detected: extractPatterns(narratorMessages),
          learning_score: calculateLearningScore(narratorMessages, builderMessages)
        }
      });
    }

    return insights;
  };

  // Funções auxiliares
  const extractPatterns = (messages: any[]): string[] => {
    const patterns = new Set<string>();
    messages.forEach(msg => {
      if (msg.metadata?.original_narrator_response?.pattern) {
        patterns.add(msg.metadata.original_narrator_response.pattern);
      }
    });
    return Array.from(patterns);
  };

  const calculateLearningScore = (narrator: any[], builder: any[]): number => {
    const totalInteractions = narrator.length + builder.length;
    const uniquePatterns = new Set(extractPatterns(narrator)).size;
    return Math.min(100, (totalInteractions * 10) + (uniquePatterns * 5));
  };

  const calculatePatternWeights = (narrator: any[], builder: any[]): Record<string, number> => {
    const weights: Record<string, number> = {};
    const patterns = extractPatterns(narrator);
    
    patterns.forEach(pattern => {
      const patternMessages = narrator.filter(msg => 
        msg.metadata?.original_narrator_response?.pattern === pattern
      );
      const successRate = patternMessages.length > 0 ? 
        (patternMessages.filter(msg => msg.metadata?.confidence > 70).length / patternMessages.length) * 100 : 0;
      weights[pattern] = Math.round(successRate);
    });
    
    return weights;
  };

  const generatePatternSummary = (messages: any[]): Array<{pattern: string, count: number}> => {
    const patternCounts: Record<string, number> = {};
    messages.forEach(msg => {
      const pattern = msg.metadata?.original_narrator_response?.pattern;
      if (pattern) {
        patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
      }
    });
    
    return Object.entries(patternCounts)
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const generateLearningInsight = (narrator: any[], builder: any[]): string => {
    const totalInteractions = narrator.length + builder.length;
    const uniquePatterns = new Set(extractPatterns(narrator)).size;
    const avgConfidence = narrator.reduce((sum, msg) => 
      sum + (msg.metadata?.confidence || 50), 0) / narrator.length || 50;
    
    if (totalInteractions < 5) {
      return `Sistema em fase inicial. Coletando dados para aprendizado (${totalInteractions} interações).`;
    } else if (uniquePatterns < 3) {
      return `Padrões limitados detectados (${uniquePatterns}). Recomenda-se mais diversidade de sinais.`;
    } else if (avgConfidence < 60) {
      return `Confiança média baixa (${Math.round(avgConfidence)}%). Ajustar parâmetros de detecção.`;
    } else {
      return `Sistema aprendendo bem! ${totalInteractions} interações, ${uniquePatterns} padrões únicos, confiança ${Math.round(avgConfidence)}%.`;
    }
  };

  // Carregar insights ao montar
  useEffect(() => {
    loadMetaInsights();
  }, [user, symbol]);

  // Processar conversas automaticamente a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      processConversations();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [user, symbol]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'dataset': return <Database className="h-4 w-4" />;
      case 'weight_adjustment': return <Target className="h-4 w-4" />;
      case 'pattern_summary': return <TrendingUp className="h-4 w-4" />;
      case 'learning_insight': return <Brain className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          Chat Meta / Consolidador
        </CardTitle>
        <div className="flex gap-2">
          <button
            onClick={processConversations}
            disabled={isProcessing}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm rounded-md transition-colors"
          >
            {isProcessing ? 'Processando...' : 'Processar Conversas'}
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
          <span>Analisando conversas Narrador + Builder</span>
        </div>

        {/* Insights */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-4 text-gray-400">Carregando insights...</div>
          ) : insights.length === 0 ? (
            <div className="text-center py-4 text-gray-400">
              Nenhum insight consolidado ainda. Clique em "Processar Conversas" para gerar.
            </div>
          ) : (
            insights.map((insight) => (
              <div
                key={insight.id}
                className="p-4 bg-slate-700 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getInsightIcon(insight.type)}
                    <span className="font-semibold text-white">{insight.title}</span>
                    <Badge className={getPriorityColor(insight.priority)}>
                      {insight.priority}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(insight.created_at).toLocaleString()}
                  </div>
                </div>
                
                <div className="text-sm text-gray-300 mb-3">
                  {insight.content}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>Confiança: {insight.confidence}%</span>
                  <span>Padrões: {insight.metadata.patterns_detected.length}</span>
                  <span>Score: {insight.metadata.learning_score}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
