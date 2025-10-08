import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Award, BarChart3, Clock } from 'lucide-react';

interface SignalStats {
  totalSignals: number;
  validatedSignals: number;
  wins: number;
  losses: number;
  neutrals: number;
  winRate: number;
  avgVariation: number;
  bestPattern: string;
  bestPatternWinRate: number;
}

interface PatternPerformance {
  pattern: string;
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  avgVariation: number;
}

export function SignalPerformance() {
  const [stats, setStats] = useState<SignalStats | null>(null);
  const [patternPerformance, setPatternPerformance] = useState<PatternPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceData();
    
    // Atualizar a cada 5 minutos
    const interval = setInterval(loadPerformanceData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);

      // Buscar todos os sinais
      const { data: allSignals, error: allError } = await supabase
        .from('narrator_signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (allError) throw allError;

      // Buscar sinais validados
      const { data: validatedSignals, error: validatedError } = await supabase
        .from('narrator_signals')
        .select('*')
        .not('result', 'is', null)
        .order('created_at', { ascending: false });

      if (validatedError) throw validatedError;

      if (!validatedSignals || validatedSignals.length === 0) {
        setStats({
          totalSignals: allSignals?.length || 0,
          validatedSignals: 0,
          wins: 0,
          losses: 0,
          neutrals: 0,
          winRate: 0,
          avgVariation: 0,
          bestPattern: 'N/A',
          bestPatternWinRate: 0
        });
        setLoading(false);
        return;
      }

      // Calcular estatísticas gerais
      const wins = validatedSignals.filter(s => s.result === 'WIN').length;
      const losses = validatedSignals.filter(s => s.result === 'LOSS').length;
      const neutrals = validatedSignals.filter(s => s.result === 'NEUTRAL').length;
      const winRate = validatedSignals.length > 0 ? (wins / validatedSignals.length) * 100 : 0;

      // Calcular variação média
      const variations = validatedSignals
        .filter(s => s.variation)
        .map(s => parseFloat(s.variation.replace('%', '').replace('+', '')));
      const avgVariation = variations.length > 0 
        ? variations.reduce((a, b) => a + b, 0) / variations.length 
        : 0;

      // Calcular performance por padrão
      const patternMap = new Map<string, PatternPerformance>();
      
      validatedSignals.forEach(signal => {
        const pattern = signal.pattern || 'Desconhecido';
        
        if (!patternMap.has(pattern)) {
          patternMap.set(pattern, {
            pattern,
            total: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            avgVariation: 0
          });
        }

        const perf = patternMap.get(pattern)!;
        perf.total++;
        if (signal.result === 'WIN') perf.wins++;
        if (signal.result === 'LOSS') perf.losses++;
        
        if (signal.variation) {
          const variation = parseFloat(signal.variation.replace('%', '').replace('+', ''));
          perf.avgVariation = ((perf.avgVariation * (perf.total - 1)) + variation) / perf.total;
        }
      });

      // Calcular win rate por padrão
      const patternPerf = Array.from(patternMap.values()).map(p => ({
        ...p,
        winRate: p.total > 0 ? (p.wins / p.total) * 100 : 0
      })).sort((a, b) => b.winRate - a.winRate);

      // Melhor padrão
      const bestPattern = patternPerf[0];

      setStats({
        totalSignals: allSignals?.length || 0,
        validatedSignals: validatedSignals.length,
        wins,
        losses,
        neutrals,
        winRate,
        avgVariation,
        bestPattern: bestPattern?.pattern || 'N/A',
        bestPatternWinRate: bestPattern?.winRate || 0
      });

      setPatternPerformance(patternPerf.slice(0, 5)); // Top 5 padrões

    } catch (error) {
      console.error('❌ Erro ao carregar performance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="text-center text-gray-400">Carregando performance...</div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="text-center text-gray-400">Nenhum dado disponível</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-blue-400 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Total Sinais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">{stats.totalSignals}</div>
            <div className="text-xs text-blue-300 mt-1">
              {stats.validatedSignals} validados
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-green-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">{stats.winRate.toFixed(1)}%</div>
            <div className="text-xs text-green-300 mt-1">
              {stats.wins} acertos
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-red-400 flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Perdas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400">{stats.losses}</div>
            <div className="text-xs text-red-300 mt-1">
              {stats.validatedSignals > 0 ? ((stats.losses / stats.validatedSignals) * 100).toFixed(1) : 0}% dos sinais
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-purple-400 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Variação Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats.avgVariation > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.avgVariation > 0 ? '+' : ''}{stats.avgVariation.toFixed(2)}%
            </div>
            <div className="text-xs text-purple-300 mt-1">
              Por sinal
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Melhor Padrão */}
      <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-400" />
            Melhor Padrão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold text-yellow-400">{stats.bestPattern}</div>
              <div className="text-sm text-gray-400 mt-1">Padrão mais assertivo</div>
            </div>
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-lg px-4 py-2">
              {stats.bestPatternWinRate.toFixed(1)}% Win Rate
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Performance por Padrão */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
            Performance por Padrão (Top 5)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {patternPerformance.map((pattern, index) => (
              <div key={pattern.pattern} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-gray-500">#{index + 1}</div>
                  <div>
                    <div className="text-sm font-medium text-white">{pattern.pattern}</div>
                    <div className="text-xs text-gray-400">
                      {pattern.total} sinais • {pattern.wins} wins • {pattern.losses} losses
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      pattern.winRate >= 70 ? 'text-green-400' :
                      pattern.winRate >= 50 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {pattern.winRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400">
                      {pattern.avgVariation > 0 ? '+' : ''}{pattern.avgVariation.toFixed(2)}% avg
                    </div>
                  </div>
                  <Badge className={`${
                    pattern.winRate >= 70 ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                    pattern.winRate >= 50 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                    'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}>
                    {pattern.winRate >= 70 ? 'Excelente' :
                     pattern.winRate >= 50 ? 'Bom' :
                     'Melhorar'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {patternPerformance.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aguardando validação de sinais...</p>
              <p className="text-sm mt-2">Os sinais são validados automaticamente após 15 minutos</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legenda */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span>WIN: Preço moveu na direção prevista (+0.1%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <span>LOSS: Preço moveu contra a previsão (-0.1%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span>NEUTRAL: Movimento insignificante (&lt;0.1%)</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>Validação automática após 15 minutos</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
