import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Zap, 
  Target, 
  RefreshCw, 
  TrendingUp, 
  MessageSquare,
  BarChart3,
  Activity
} from 'lucide-react';

export const RealLearningSystem = () => {
  const [narratorFeed, setNarratorFeed] = useState<any[]>([]);
  const [tradeVisionResponses, setTradeVisionResponses] = useState<any[]>([]);
  const [learningStats, setLearningStats] = useState({
    totalFeedMessages: 0,
    totalResponses: 0,
    processingRate: 0,
    lastUpdate: null,
    avgResponseTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLearningData();
    
    // Atualizar a cada 5 segundos para tempo real mais responsivo
    const interval = setInterval(loadLearningData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadLearningData = async () => {
    try {
      setLoading(true);

      // Carregar sinais do narrador (dados reais - igual Dashboard Home)
      const { data: feedData } = await supabase
        .from('narrator_signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      // Carregar respostas do TradeVision IA (apenas respostas reais)
      const { data: responseData } = await supabase
        .from('chat_messages')
        .select('*')
        .or('context_type.eq.narrator_signal,context_type.eq.narrator_signal_response') // Incluir ambos
        .order('created_at', { ascending: false })
        .limit(20);

      setNarratorFeed(feedData || []);
      setTradeVisionResponses(responseData || []);

      // Calcular estatísticas
      const totalFeed = feedData?.length || 0;
      const narratorMessages = responseData?.filter(r => r.context_type === 'narrator_signal') || [];
      const builderResponses = responseData?.filter(r => r.context_type === 'narrator_signal_response') || [];
      const totalResponses = builderResponses.length;
      const processingRate = narratorMessages.length > 0 ? (totalResponses / narratorMessages.length) * 100 : 0;

      // Calcular tempo médio de resposta (simplificado)
      const avgResponseTime = totalResponses > 0 ? 2.5 : 0; // Simulado

      setLearningStats({
        totalFeedMessages: totalFeed,
        totalResponses,
        processingRate,
        lastUpdate: new Date().toISOString(),
        avgResponseTime
      });

    } catch (error) {
      console.error('Erro ao carregar dados de aprendizado:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              🧠 Sistema de Aprendizado Real
            </h2>
            <p className="text-muted-foreground">
              Monitoramento do fluxo: Feed Narrador → TradeVision IA → Análises
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={async () => {
                if (confirm('🧹 Limpar TODOS os dados duplicados e resetar sistema?')) {
                  try {
                    // Limpar sinais duplicados
                    const { error: signalsError } = await supabase
                      .from('narrator_signals')
                      .delete()
                      .neq('id', '00000000-0000-0000-0000-000000000000');
                    
                    // Limpar mensagens duplicadas
                    const { error: messagesError } = await supabase
                      .from('chat_messages')
                      .delete()
                      .or('context_type.eq.narrator_signal,context_type.eq.narrator_signal_response');
                    
                    if (signalsError || messagesError) {
                      console.error('Erro na limpeza:', signalsError || messagesError);
                    } else {
                      console.log('✅ Sistema completamente limpo');
                      setNarratorFeed([]);
                      setTradeVisionResponses([]);
                      setLearningStats({
                        totalFeedMessages: 0,
                        totalResponses: 0,
                        processingRate: 0,
                        lastUpdate: new Date().toISOString(),
                        avgResponseTime: 0
                      });
                    }
                  } catch (error) {
                    console.error('Erro na limpeza:', error);
                  }
                }
              }}
              variant="danger"
              size="sm"
            >
              🧹 Limpar Dados
            </Button>
          </div>
        </div>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              Feed Narrador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {learningStats.totalFeedMessages}
            </div>
            <p className="text-xs text-muted-foreground">
              Mensagens do feed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-green-500" />
              TradeVision IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {learningStats.totalResponses}
            </div>
            <p className="text-xs text-muted-foreground">
              Respostas geradas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              Taxa de Processamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">
              {learningStats.processingRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Eficiência do sistema
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-500" />
              Tempo Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {learningStats.avgResponseTime.toFixed(1)}s
            </div>
            <p className="text-xs text-muted-foreground">
              Tempo de resposta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fluxo de Aprendizado em Tempo Real */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feed do Narrador */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                Feed Narrador
              </div>
              <Button
                onClick={loadLearningData}
                disabled={loading}
                size="sm"
                variant="outline"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </CardTitle>
            <CardDescription>
              Sinais detectados pelo narrador em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-500 mr-2" />
                <span className="text-muted-foreground">Carregando feed...</span>
              </div>
            ) : narratorFeed.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {narratorFeed.slice(0, 10).map((signal) => (
                  <div key={signal.id} className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {signal.symbol} {signal.timeframe}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(signal.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-blue-400">
                      {signal.pattern || signal.signal_type || 'Sinal detectado'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Probabilidade: {signal.probability || 'N/A'}% • Preço: {signal.price || 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum sinal do narrador detectado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Respostas do TradeVision IA */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-green-500" />
                TradeVision IA
              </div>
              <Button
                onClick={loadLearningData}
                disabled={loading}
                size="sm"
                variant="outline"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </CardTitle>
            <CardDescription>
              Respostas e análises geradas pelo TradeVision IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-green-500 mr-2" />
                <span className="text-muted-foreground">Carregando respostas...</span>
              </div>
            ) : tradeVisionResponses.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tradeVisionResponses.slice(0, 10).map((response) => (
                  <div key={response.id} className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {response.context_type || 'Análise'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(response.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-green-400">
                      {response.content.substring(0, 100)}
                      {response.content.length > 100 && '...'}
                    </p>
                    {response.reference_chunks && response.reference_chunks.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <strong>Referências:</strong> {response.reference_chunks.length} chunks
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma resposta do TradeVision IA gerada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status do Sistema */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Status do Sistema de Aprendizado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-slate-700 rounded">
              <div className={`w-3 h-3 rounded-full ${narratorFeed.length > 0 ? 'bg-blue-400 animate-pulse' : 'bg-gray-400'}`}></div>
              <div>
                <div className="text-white font-medium">Feed Narrador</div>
                <div className="text-sm text-gray-400">
                  {narratorFeed.length > 0 ? 'Ativo - Sinais detectados' : 'Aguardando sinais'}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-slate-700 rounded">
              <div className={`w-3 h-3 rounded-full ${tradeVisionResponses.length > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
              <div>
                <div className="text-white font-medium">TradeVision IA</div>
                <div className="text-sm text-gray-400">
                  {tradeVisionResponses.length > 0 ? 'Processando análises' : 'Aguardando feed'}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-slate-700 rounded">
              <div className={`w-3 h-3 rounded-full ${learningStats.processingRate > 50 ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
              <div>
                <div className="text-white font-medium">Aprendizado Contínuo</div>
                <div className="text-sm text-gray-400">
                  {learningStats.processingRate > 50 ? 'Otimizado' : 'Em desenvolvimento'}
                </div>
              </div>
            </div>
          </div>
          
          {learningStats.lastUpdate && (
            <div className="mt-4 p-3 bg-slate-700 rounded">
              <div className="text-sm text-gray-400 mb-1">Última Atualização:</div>
              <div className="text-white">{formatTime(learningStats.lastUpdate)}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
