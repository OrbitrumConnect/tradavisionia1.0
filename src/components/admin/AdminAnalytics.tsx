import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface AnalysisStats {
  total: number;
  wins: number;
  losses: number;
  pending: number;
  avgProbability: number;
  avgConfidence: number;
  topPatterns: Array<{ pattern: string; count: number }>;
}

export function AdminAnalytics() {
  const [stats, setStats] = useState<AnalysisStats>({
    total: 0,
    wins: 0,
    losses: 0,
    pending: 0,
    avgProbability: 0,
    avgConfidence: 0,
    topPatterns: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        // Limpar dados antigos primeiro
        const { error: deleteError } = await supabase
          .from('trade_analysis')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
        if (deleteError) {
          console.warn('Erro ao limpar trade_analysis:', deleteError);
        } else {
          console.log('✅ trade_analysis limpo');
        }

        const { data, error } = await supabase
          .from('trade_analysis')
          .select('*');

        if (error) throw error;

        const analyses = data || [];
        
        const wins = analyses.filter(a => a.result === 'win').length;
        const losses = analyses.filter(a => a.result === 'loss').length;
        const pending = analyses.filter(a => a.result === 'pending').length;

        const probabilities = analyses
          .filter(a => a.probability !== null)
          .map(a => Number(a.probability));
        
        const confidences = analyses
          .filter(a => a.confidence_score !== null)
          .map(a => Number(a.confidence_score));

        const avgProbability = probabilities.length > 0
          ? probabilities.reduce((a, b) => a + b, 0) / probabilities.length
          : 0;

        const avgConfidence = confidences.length > 0
          ? confidences.reduce((a, b) => a + b, 0) / confidences.length
          : 0;

        // Contar padrões mais usados
        const patternCounts: Record<string, number> = {};
        analyses.forEach(a => {
          if (a.pattern_detected) {
            patternCounts[a.pattern_detected] = (patternCounts[a.pattern_detected] || 0) + 1;
          }
        });

        const topPatterns = Object.entries(patternCounts)
          .map(([pattern, count]) => ({ pattern, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setStats({
          total: analyses.length,
          wins,
          losses,
          pending,
          avgProbability: Math.round(avgProbability * 100) / 100,
          avgConfidence: Math.round(avgConfidence * 100) / 100,
          topPatterns,
        });
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const winRate = (stats.wins + stats.losses) > 0
    ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Analytics</h2>
        <p className="text-muted-foreground">Métricas de desempenho do bot</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Análises</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.pending} pendentes
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Acerto</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{winRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats.wins} wins / {stats.losses} losses
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confiança Média</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {(stats.avgConfidence * 100).toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Prob. média: {(stats.avgProbability * 100).toFixed(0)}%
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Padrões Mais Detectados</CardTitle>
              <CardDescription>Top 5 padrões identificados pelo bot</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.topPatterns.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum padrão detectado ainda</p>
              ) : (
                <div className="space-y-2">
                  {stats.topPatterns.map((pattern, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">{pattern.pattern}</span>
                      <span className="text-sm text-muted-foreground">{pattern.count} vezes</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}