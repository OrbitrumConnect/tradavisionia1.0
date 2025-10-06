import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingUp, Award, Activity } from 'lucide-react';

interface PatternWeight {
  weight: number;
  total: number;
  successes: number;
  updated_at: string;
}

interface NeuralState {
  pattern_weights: Record<string, PatternWeight>;
  avg_accuracy: number;
  updated_at: string;
}

export const LearningProgress = () => {
  const [neuralState, setNeuralState] = useState<NeuralState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLearningState();
    
    // Atualizar a cada 1 minuto
    const interval = setInterval(loadLearningState, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadLearningState = async () => {
    try {
      const { data, error } = await supabase
        .from('tradevision_state')
        .select('pattern_weights, avg_accuracy, updated_at')
        .eq('symbol', 'BTC/USDT')
        .single();

      if (error) throw error;
      
      // Conversão segura de pattern_weights
      const patternWeights = data.pattern_weights && typeof data.pattern_weights === 'object'
        ? (data.pattern_weights as unknown as Record<string, PatternWeight>)
        : {};
      
      setNeuralState({
        avg_accuracy: data.avg_accuracy,
        updated_at: data.updated_at,
        pattern_weights: patternWeights
      });
    } catch (error) {
      console.error('Erro ao carregar estado de aprendizado:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (!neuralState || !neuralState.pattern_weights || Object.keys(neuralState.pattern_weights).length === 0) {
    return (
      <Card className="border-warning/50 bg-warning/5">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Aprendizado Neural
          </CardTitle>
          <CardDescription>
            O sistema está coletando dados para iniciar o aprendizado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p>🧠 Aguardando dados de feedback...</p>
            <p className="text-xs mt-2">
              O Narrador precisa de pelo menos 5 sinais com feedback para cada padrão antes de começar a aprender.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const patterns = Object.entries(neuralState.pattern_weights)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 6);

  const totalSignals = patterns.reduce((sum, [_, data]) => sum + data.total, 0);
  const totalSuccesses = patterns.reduce((sum, [_, data]) => sum + data.successes, 0);
  const overallAccuracy = totalSignals > 0 ? (totalSuccesses / totalSignals) * 100 : 0;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-5 w-5" />
            🧠 Aprendizado Neural Ativo
          </CardTitle>
          <CardDescription>
            O Narrador está aprendendo com {totalSignals} sinais validados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {overallAccuracy.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Acurácia Geral</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {totalSuccesses}
              </div>
              <div className="text-xs text-muted-foreground">Acertos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {patterns.length}
              </div>
              <div className="text-xs text-muted-foreground">Padrões</div>
            </div>
          </div>

          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-3">
              Última atualização: {new Date(neuralState.updated_at).toLocaleString('pt-BR')}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Padrões Aprendidos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {patterns.map(([pattern, data]) => {
            const accuracy = (data.weight * 100);
            const isGood = accuracy >= 60;
            
            return (
              <div key={pattern} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{pattern}</span>
                    <Badge 
                      variant={isGood ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {isGood ? <Award className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1" />}
                      {accuracy.toFixed(0)}%
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {data.successes}/{data.total}
                  </span>
                </div>
                <Progress value={accuracy} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {data.successes} acertos em {data.total} tentativas
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};