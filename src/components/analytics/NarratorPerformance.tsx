import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Target, Activity, Award } from 'lucide-react';

interface SignalStats {
  totalSignals: number;
  avgProbability: number;
  byPattern: Record<string, { count: number; avgProb: number }>;
  byTimeframe: Record<string, { count: number; avgProb: number }>;
  bySignalType: { BUY: number; SELL: number };
  evolution: Array<{ date: string; avgProb: number; count: number }>;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const NarratorPerformance = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<SignalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      try {
        const { data: signals, error } = await supabase
          .from('narrator_signals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(500);

        if (error) throw error;
        if (!signals || signals.length === 0) {
          setStats({
            totalSignals: 0,
            avgProbability: 0,
            byPattern: {},
            byTimeframe: {},
            bySignalType: { BUY: 0, SELL: 0 },
            evolution: []
          });
          setLoading(false);
          return;
        }

        // Calcular métricas
        const totalSignals = signals.length;
        const avgProbability = signals.reduce((acc, s) => acc + s.probability, 0) / totalSignals;

        // Por padrão
        const byPattern: Record<string, { count: number; avgProb: number }> = {};
        signals.forEach(s => {
          const pattern = s.figure || s.pattern || 'Desconhecido';
          if (!byPattern[pattern]) {
            byPattern[pattern] = { count: 0, avgProb: 0 };
          }
          byPattern[pattern].count++;
          byPattern[pattern].avgProb += s.probability;
        });

        Object.keys(byPattern).forEach(p => {
          byPattern[p].avgProb = Math.round(byPattern[p].avgProb / byPattern[p].count);
        });

        // Por timeframe
        const byTimeframe: Record<string, { count: number; avgProb: number }> = {};
        signals.forEach(s => {
          const tf = s.timeframe || '1M';
          if (!byTimeframe[tf]) {
            byTimeframe[tf] = { count: 0, avgProb: 0 };
          }
          byTimeframe[tf].count++;
          byTimeframe[tf].avgProb += s.probability;
        });

        Object.keys(byTimeframe).forEach(tf => {
          byTimeframe[tf].avgProb = Math.round(byTimeframe[tf].avgProb / byTimeframe[tf].count);
        });

        // Por tipo de sinal
        const bySignalType = {
          BUY: signals.filter(s => s.signal_type === 'BUY').length,
          SELL: signals.filter(s => s.signal_type === 'SELL').length
        };

        // Evolução ao longo do tempo (últimos 7 dias)
        const evolution: Array<{ date: string; avgProb: number; count: number }> = [];
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toISOString().split('T')[0];
        });

        last7Days.forEach(date => {
          const daySignals = signals.filter(s => s.created_at.startsWith(date));
          if (daySignals.length > 0) {
            evolution.push({
              date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
              avgProb: Math.round(daySignals.reduce((acc, s) => acc + s.probability, 0) / daySignals.length),
              count: daySignals.length
            });
          } else {
            evolution.push({
              date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
              avgProb: 0,
              count: 0
            });
          }
        });

        setStats({
          totalSignals,
          avgProbability: Math.round(avgProbability),
          byPattern,
          byTimeframe,
          bySignalType,
          evolution
        });
      } catch (err) {
        console.error('Erro ao carregar estatísticas:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    // Atualizar a cada 30s
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Carregando estatísticas...</div>
      </div>
    );
  }

  if (!stats || stats.totalSignals === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum sinal gerado ainda.</p>
            <p className="text-sm mt-2">Ative o Feed Narrador para começar a coletar dados.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const topPatterns = Object.entries(stats.byPattern)
    .sort((a, b) => b[1].avgProb - a[1].avgProb)
    .slice(0, 5)
    .map(([name, data]) => ({ name, ...data }));

  const timeframeData = Object.entries(stats.byTimeframe).map(([name, data]) => ({ name, ...data }));

  const signalTypeData = [
    { name: 'BUY', value: stats.bySignalType.BUY },
    { name: 'SELL', value: stats.bySignalType.SELL }
  ];

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Sinais</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSignals}</div>
            <p className="text-xs text-muted-foreground">Últimos 500 sinais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Probabilidade Média</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProbability}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.avgProbability >= 70 ? (
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Alta qualidade
                </span>
              ) : stats.avgProbability >= 55 ? (
                <span className="text-yellow-600 flex items-center gap-1">
                  <Activity className="h-3 w-3" /> Qualidade média
                </span>
              ) : (
                <span className="text-red-600 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" /> Baixa qualidade
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Melhor Padrão</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topPatterns[0]?.name || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {topPatterns[0]?.avgProb || 0}% de probabilidade média
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sinais BUY vs SELL</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div>
                <Badge variant="default" className="bg-green-600">BUY</Badge>
                <div className="text-xl font-bold mt-1">{stats.bySignalType.BUY}</div>
              </div>
              <div>
                <Badge variant="default" className="bg-red-600">SELL</Badge>
                <div className="text-xl font-bold mt-1">{stats.bySignalType.SELL}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top 5 Padrões por Probabilidade */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Padrões por Probabilidade</CardTitle>
            <CardDescription>Padrões com maior taxa de probabilidade média</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topPatterns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgProb" fill="#10b981" name="Prob. Média (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição por Timeframe */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Timeframe</CardTitle>
            <CardDescription>Sinais gerados por intervalo de tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeframeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Evolução da Probabilidade (7 dias) */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Evolução da Probabilidade Média</CardTitle>
            <CardDescription>Últimos 7 dias de sinais</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.evolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="avgProb" stroke="#10b981" strokeWidth={2} name="Prob. Média (%)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição BUY vs SELL */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Sinais</CardTitle>
            <CardDescription>BUY vs SELL</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={signalTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {signalTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'BUY' ? '#10b981' : '#ef4444'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de todos os padrões */}
      <Card>
        <CardHeader>
          <CardTitle>Todos os Padrões Detectados</CardTitle>
          <CardDescription>Estatísticas completas de cada padrão</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Padrão</th>
                  <th className="text-center p-2">Quantidade</th>
                  <th className="text-center p-2">Prob. Média</th>
                  <th className="text-center p-2">Qualidade</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.byPattern)
                  .sort((a, b) => b[1].avgProb - a[1].avgProb)
                  .map(([pattern, data]) => (
                    <tr key={pattern} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{pattern}</td>
                      <td className="text-center p-2">{data.count}</td>
                      <td className="text-center p-2 font-bold">{data.avgProb}%</td>
                      <td className="text-center p-2">
                        {data.avgProb >= 70 ? (
                          <Badge className="bg-green-600">Alta</Badge>
                        ) : data.avgProb >= 55 ? (
                          <Badge className="bg-yellow-600">Média</Badge>
                        ) : (
                          <Badge className="bg-red-600">Baixa</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
