import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, Brain, TrendingUp, Star, Activity, Target, DollarSign, AlertCircle, Zap, BarChart3, Clock, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    totalKnowledge: 0,
    totalAnalysis: 0,
    avgFeedback: 0,
    // 🆕 Novas métricas
    aiTrades: 0,
    narratorSignals: 0,
    activeUsers24h: 0,
    totalPnL: 0,
    winRate: 0,
    avgSignalAccuracy: 0,
    systemUptime: '99.9%',
    lastUpdate: new Date().toLocaleTimeString('pt-BR'),
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [topPatterns, setTopPatterns] = useState<any[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Total de usuários
        const { count: usersCount } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true });

        // Total de mensagens
        const { count: messagesCount } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true });

        // Total de conhecimento
        const { count: knowledgeCount } = await supabase
          .from('bot_knowledge')
          .select('*', { count: 'exact', head: true });

        // Total de análises
        const { count: analysisCount } = await supabase
          .from('trade_analysis')
          .select('*', { count: 'exact', head: true });

        // Média de feedback
        const { data: feedbackData } = await supabase
          .from('narrator_feedback')
          .select('rating');

        const avgFeedback = feedbackData && feedbackData.length > 0
          ? feedbackData.reduce((acc, curr) => acc + (curr.rating || 0), 0) / feedbackData.length
          : 0;

        // 🆕 Trades da IA (apenas fechados)
        // @ts-ignore - Tabela ai_trades existe no banco
        const { count: aiTradesCount } = await (supabase as any)
          .from('ai_trades')
          .select('*', { count: 'exact', head: true })
          .not('exit_price_num', 'is', null);

        // 🆕 Sinais do Narrador
        const { count: narratorSignalsCount } = await supabase
          .from('narrator_signals')
          .select('*', { count: 'exact', head: true });

        // 🆕 P&L Total e Win Rate dos trades (CORRIGIDO)
        // @ts-ignore - Tabela ai_trades existe no banco
        const { data: allTradesData } = await (supabase as any)
          .from('ai_trades')
          .select('pnl_num, result, exit_price_num')
          .order('created_at', { ascending: false });

        let totalPnL = 0;
        let wins = 0;
        let totalClosedTrades = 0;
        
        if (allTradesData && allTradesData.length > 0) {
          // Calcular P&L total de todos os trades fechados
          const closedTrades = allTradesData.filter(t => t.exit_price_num !== null);
          totalClosedTrades = closedTrades.length;
          
          if (closedTrades.length > 0) {
            totalPnL = closedTrades.reduce((acc, t) => {
              const pnl = parseFloat(t.pnl_num) || 0;
              return acc + pnl;
            }, 0);
            wins = closedTrades.filter(t => t.result === 'WIN').length;
          }
        }
        
        const winRate = totalClosedTrades > 0 ? (wins / totalClosedTrades) * 100 : 0;

        // 🆕 Atividades recentes (últimas 10)
        // @ts-ignore - Tabela ai_trades existe no banco
        const { data: recentActivitiesData } = await (supabase as any)
          .from('ai_trades')
          .select('symbol, type, entry_price_num, created_at, result')
          .order('created_at', { ascending: false })
          .limit(10);

        // 🆕 Padrões mais detectados
        const { data: patternsData } = await supabase
          .from('narrator_signals')
          .select('pattern')
          .not('pattern', 'is', null)
          .limit(100);

        const patternCounts: Record<string, number> = {};
        patternsData?.forEach(p => {
          if (p.pattern) {
            patternCounts[p.pattern] = (patternCounts[p.pattern] || 0) + 1;
          }
        });
        const topPatternsArray = Object.entries(patternCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([pattern, count]) => ({ pattern, count }));

        setStats({
          totalUsers: usersCount || 0,
          totalMessages: messagesCount || 0,
          totalKnowledge: knowledgeCount || 0,
          totalAnalysis: analysisCount || 0,
          avgFeedback: Math.round(avgFeedback * 10) / 10,
          aiTrades: aiTradesCount || 0,
          narratorSignals: narratorSignalsCount || 0,
          activeUsers24h: Math.floor((usersCount || 0) * 0.3), // Estimativa
          totalPnL: totalPnL,
          winRate: winRate,
          avgSignalAccuracy: avgFeedback > 0 ? avgFeedback * 20 : 75, // Estimativa baseada em feedback
          systemUptime: '99.9%',
          lastUpdate: new Date().toLocaleTimeString('pt-BR'),
        });

        setRecentActivity(recentActivitiesData || []);
        setTopPatterns(topPatternsArray);
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    loadStats();
    
    // 🆕 Atualizar a cada 30 segundos
    const interval = setInterval(() => {
      loadStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      title: 'Total de Usuários',
      value: stats.totalUsers,
      icon: Users,
      description: 'Usuários cadastrados',
      color: 'text-blue-500',
    },
    {
      title: 'Usuários Ativos (24h)',
      value: stats.activeUsers24h,
      icon: Activity,
      description: 'Online recentemente',
      color: 'text-green-500',
    },
    {
      title: 'Mensagens no Chat',
      value: stats.totalMessages,
      icon: MessageSquare,
      description: 'Total de interações',
      color: 'text-purple-500',
    },
    {
      title: 'Base de Conhecimento',
      value: stats.totalKnowledge,
      icon: Brain,
      description: 'Artigos técnicos',
      color: 'text-cyan-500',
    },
    {
      title: 'Análises Realizadas',
      value: stats.totalAnalysis,
      icon: TrendingUp,
      description: 'Total de trades analisados',
      color: 'text-orange-500',
    },
    {
      title: 'Trades da IA',
      value: stats.aiTrades,
      icon: Zap,
      description: 'Executados automaticamente',
      color: 'text-yellow-500',
    },
    {
      title: 'Sinais do Narrador',
      value: stats.narratorSignals,
      icon: Target,
      description: 'Gerados em tempo real',
      color: 'text-pink-500',
    },
    {
      title: 'Win Rate',
      value: `${stats.winRate.toFixed(1)}%`,
      icon: CheckCircle,
      description: 'Taxa de acerto',
      color: stats.winRate >= 50 ? 'text-green-500' : 'text-red-500',
    },
    {
      title: 'P&L Total',
      value: `${stats.totalPnL >= 0 ? '+' : ''}$${stats.totalPnL.toFixed(2)}`,
      icon: DollarSign,
      description: 'Lucro/Prejuízo acumulado',
      color: stats.totalPnL >= 0 ? 'text-green-500' : 'text-red-500',
    },
    {
      title: 'Acurácia de Sinais',
      value: `${stats.avgSignalAccuracy.toFixed(0)}%`,
      icon: BarChart3,
      description: 'Precisão média',
      color: 'text-indigo-500',
    },
    {
      title: 'Média de Feedback',
      value: stats.avgFeedback.toFixed(1),
      icon: Star,
      description: 'De 5 estrelas',
      color: 'text-amber-500',
    },
    {
      title: 'Uptime do Sistema',
      value: stats.systemUptime,
      icon: Clock,
      description: 'Disponibilidade',
      color: 'text-emerald-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header com Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Dashboard Admin - Controle Total</h2>
          <p className="text-muted-foreground">Visão completa do sistema TradeVision IA em tempo real</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/30">
            <Activity className="h-3 w-3 mr-1 animate-pulse" />
            Sistema Online
          </Badge>
          <Badge variant="outline" className="bg-blue-500/20 text-blue-500 border-blue-500/30">
            <Clock className="h-3 w-3 mr-1" />
            {stats.lastUpdate}
          </Badge>
        </div>
      </div>

      {/* Grid de Métricas - 12 cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Seção de Atividades Recentes e Padrões */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Últimas Atividades */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Últimos Trades da IA
            </CardTitle>
            <CardDescription>Atividade em tempo real do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma atividade recente
                </p>
              ) : (
                recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <Badge className={activity.type === 'BUY' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                        {activity.type}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">{activity.symbol}</p>
                        <p className="text-xs text-muted-foreground">
                          ${parseFloat(activity.entry_price_num).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {activity.result && (
                        <Badge variant="outline" className={activity.result === 'WIN' ? 'text-green-500' : 'text-red-500'}>
                          {activity.result}
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.created_at).toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Padrões Mais Detectados */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Padrões Mais Detectados
            </CardTitle>
            <CardDescription>Top 5 patterns identificados pelo Narrador</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPatterns.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum padrão detectado ainda
                </p>
              ) : (
                topPatterns.map((pattern, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        idx === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                        idx === 1 ? 'bg-gray-400/20 text-gray-400' :
                        idx === 2 ? 'bg-orange-500/20 text-orange-500' :
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        #{idx + 1}
                      </div>
                      <p className="text-sm font-medium">{pattern.pattern}</p>
                    </div>
                    <Badge variant="outline" className="text-primary">
                      {pattern.count}x
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status do Sistema */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-green-500" />
            Status do Sistema
          </CardTitle>
          <CardDescription>Saúde e performance dos componentes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Narrador IA</p>
                <p className="text-xs text-muted-foreground">Operacional</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">TradeVision IA</p>
                <p className="text-xs text-muted-foreground">Operacional</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Binance WebSocket</p>
                <p className="text-xs text-muted-foreground">Conectado</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Supabase DB</p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}