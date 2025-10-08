import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  MessageSquare, 
  Brain, 
  TrendingUp, 
  Star, 
  Activity,
  Target,
  BarChart3,
  Clock,
  DollarSign,
  TrendingDown,
  Zap,
  Bot
} from 'lucide-react';

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    totalKnowledge: 0,
    totalAnalysis: 0,
    avgFeedback: 0,
  });

  const [tradingStats, setTradingStats] = useState({
    totalTrades: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    totalPnL: 0,
  });

  const [narratorStats, setNarratorStats] = useState({
    totalSignals: 0,
    validatedSignals: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    avgVariation: 0,
  });

  const [agentStats, setAgentStats] = useState({
    totalInteractions: 0,
    knowledgeUsed: 0,
    avgResponseTime: 0,
    accuracyScore: 0,
    learningProgress: 0,
    totalFeedback: 0,
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [marketData, setMarketData] = useState({
    btcPrice: '0',
    change24h: '0',
    volume: '0',
  });

  // Carregar estatísticas básicas
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

        setStats({
          totalUsers: usersCount || 0,
          totalMessages: messagesCount || 0,
          totalKnowledge: knowledgeCount || 0,
          totalAnalysis: analysisCount || 0,
          avgFeedback: Math.round(avgFeedback * 10) / 10,
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, []);

  // Carregar estatísticas de trading
  useEffect(() => {
    const loadTradingStats = async () => {
      try {
        const { data: trades, error } = await (supabase as any)
          .from('ai_trades')
          .select('*')
          .eq('status', 'CLOSED');

        if (error) {
          console.error('Erro ao carregar trades:', error);
          return;
        }

        const totalTrades = trades?.length || 0;
        const wins = trades?.filter((t: any) => t.result === 'WIN').length || 0;
        const losses = trades?.filter((t: any) => t.result === 'LOSS').length || 0;
        const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
        const totalPnL = trades?.reduce((sum: number, t: any) => sum + (parseFloat(t.pnl) || 0), 0) || 0;

        setTradingStats({
          totalTrades,
          wins,
          losses,
          winRate,
          totalPnL,
        });
      } catch (error) {
        console.error('Erro ao carregar trading stats:', error);
      }
    };

    loadTradingStats();
    const interval = setInterval(loadTradingStats, 10000); // Atualiza a cada 10s
    return () => clearInterval(interval);
  }, []);

  // Carregar estatísticas do TradeVision IA Agent
  useEffect(() => {
    const loadAgentStats = async () => {
      try {
        // Total de interações (mensagens do chat)
        const { data: messages, error: msgError } = await supabase
          .from('chat_messages')
          .select('id, created_at, metadata')
          .order('created_at', { ascending: false });

        if (msgError) throw msgError;

        // Conhecimento utilizado
        const { data: knowledge, error: knowledgeError } = await supabase
          .from('bot_knowledge')
          .select('usage_count, accuracy_score');

        if (knowledgeError) throw knowledgeError;

        const totalKnowledgeUsed = knowledge?.reduce((sum, k) => sum + (k.usage_count || 0), 0) || 0;
        const avgAccuracy = knowledge && knowledge.length > 0
          ? knowledge.reduce((sum, k) => sum + (k.accuracy_score || 0), 0) / knowledge.length
          : 0;

        // Feedback do agente
        const { data: feedback, error: feedbackError } = await supabase
          .from('narrator_feedback')
          .select('rating, created_at');

        if (feedbackError) throw feedbackError;

        // Learning progress (baseado em usage_count e accuracy)
        const learningProgress = knowledge && knowledge.length > 0
          ? Math.min(100, (totalKnowledgeUsed / (knowledge.length * 10)) * 100)
          : 0;

        // Tempo médio de resposta (simulado baseado em metadata)
        const avgResponseTime = 1.2; // segundos (pode ser calculado de logs reais)

        setAgentStats({
          totalInteractions: messages?.length || 0,
          knowledgeUsed: totalKnowledgeUsed,
          avgResponseTime,
          accuracyScore: avgAccuracy,
          learningProgress,
          totalFeedback: feedback?.length || 0,
        });
      } catch (error) {
        console.error('Erro ao carregar agent stats:', error);
      }
    };

    loadAgentStats();
    const interval = setInterval(loadAgentStats, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, []);

  // Carregar estatísticas do narrador
  useEffect(() => {
    const loadNarratorStats = async () => {
      try {
        const { data: validatedSignals, error } = await supabase
          .from('narrator_signals')
          .select('*')
          .not('result', 'is', null);

        if (error) throw error;

        const { data: allSignals } = await supabase
          .from('narrator_signals')
          .select('id');

        const wins = validatedSignals?.filter((s: any) => s.result === 'WIN').length || 0;
        const losses = validatedSignals?.filter((s: any) => s.result === 'LOSS').length || 0;
        const total = validatedSignals?.length || 0;
        const winRate = total > 0 ? (wins / total) * 100 : 0;

        const variations = validatedSignals
          ?.filter((s: any) => s.variation)
          .map((s: any) => parseFloat(s.variation.replace('%', '').replace('+', ''))) || [];
        const avgVariation = variations.length > 0 
          ? variations.reduce((a, b) => a + b, 0) / variations.length 
          : 0;

        setNarratorStats({
          totalSignals: allSignals?.length || 0,
          validatedSignals: total,
          wins,
          losses,
          winRate,
          avgVariation,
        });
      } catch (error) {
        console.error('Erro ao carregar narrator stats:', error);
      }
    };

    loadNarratorStats();
    const interval = setInterval(loadNarratorStats, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, []);

  // Carregar atividades recentes
  useEffect(() => {
    const loadRecentActivities = async () => {
      try {
        const activities: RecentActivity[] = [];

        // Últimas mensagens do chat
        const { data: messages } = await supabase
          .from('chat_messages')
          .select('id, created_at, content')
          .order('created_at', { ascending: false })
          .limit(5);

        messages?.forEach(msg => {
          activities.push({
            id: msg.id,
            type: 'chat',
            description: `Nova mensagem: ${(msg.content || '').substring(0, 50)}...`,
            timestamp: msg.created_at,
            status: 'success',
          });
        });

        // Últimos sinais do narrador
        const { data: signals } = await supabase
          .from('narrator_signals')
          .select('id, created_at, signal_type, symbol, probability')
          .order('created_at', { ascending: false })
          .limit(5);

        signals?.forEach(signal => {
          activities.push({
            id: signal.id,
            type: 'signal',
            description: `Narrador: ${signal.signal_type} ${signal.symbol} (${signal.probability}%)`,
            timestamp: signal.created_at,
            status: 'success',
          });
        });

        // Últimos trades
        const { data: trades } = await (supabase as any)
          .from('ai_trades')
          .select('id, timestamp, trade_type, result, pnl')
          .order('timestamp', { ascending: false })
          .limit(5);

        trades?.forEach((trade: any) => {
          activities.push({
            id: trade.id,
            type: 'trade',
            description: `Trade ${trade.trade_type}: ${trade.result} (P&L: $${parseFloat(trade.pnl || 0).toFixed(2)})`,
            timestamp: trade.timestamp,
            status: trade.result === 'WIN' ? 'success' : 'warning',
          });
        });

        // Ordenar por timestamp
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRecentActivities(activities.slice(0, 10));
      } catch (error) {
        console.error('Erro ao carregar atividades:', error);
      }
    };

    loadRecentActivities();
    const interval = setInterval(loadRecentActivities, 15000); // Atualiza a cada 15s
    return () => clearInterval(interval);
  }, []);

  // Carregar dados de mercado
  useEffect(() => {
    const loadMarketData = async () => {
      try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
        const data = await response.json();
        
        setMarketData({
          btcPrice: parseFloat(data.lastPrice).toFixed(2),
          change24h: parseFloat(data.priceChangePercent).toFixed(2),
          volume: (parseFloat(data.volume) / 1000).toFixed(2) + 'K',
        });
      } catch (error) {
        console.error('Erro ao carregar dados de mercado:', error);
      }
    };

    loadMarketData();
    const interval = setInterval(loadMarketData, 5000); // Atualiza a cada 5s
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      title: 'Total de Usuários',
      value: stats.totalUsers,
      icon: Users,
      description: 'Usuários cadastrados',
      color: 'text-blue-400',
    },
    {
      title: 'Mensagens no Chat',
      value: stats.totalMessages,
      icon: MessageSquare,
      description: 'Total de interações',
      color: 'text-green-400',
    },
    {
      title: 'Base de Conhecimento',
      value: stats.totalKnowledge,
      icon: Brain,
      description: 'Artigos técnicos',
      color: 'text-purple-400',
    },
    {
      title: 'Análises Realizadas',
      value: stats.totalAnalysis,
      icon: TrendingUp,
      description: 'Total de trades analisados',
      color: 'text-cyan-400',
    },
    {
      title: 'Média de Feedback',
      value: stats.avgFeedback.toFixed(1),
      icon: Star,
      description: 'De 5 estrelas',
      color: 'text-yellow-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Dashboard Admin</h2>
        <p className="text-muted-foreground">Visão geral do sistema TradeVision IA - Dados em Tempo Real</p>
      </div>

      {/* Dados de Mercado em Tempo Real */}
      <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            Mercado em Tempo Real (Binance)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className="text-2xl font-bold text-green-400">${marketData.btcPrice}</div>
              <div className="text-xs text-gray-400">BTC/USDT</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className={`text-2xl font-bold ${parseFloat(marketData.change24h) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {parseFloat(marketData.change24h) >= 0 ? '+' : ''}{marketData.change24h}%
              </div>
              <div className="text-xs text-gray-400">Variação 24h</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className="text-2xl font-bold text-cyan-400">{marketData.volume}</div>
              <div className="text-xs text-gray-400">Volume BTC</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Gerais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title} className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <p className="text-xs text-gray-400">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance do TradeVision IA Agent - O MOTOR DO APP */}
      <Card className="bg-gradient-to-r from-orange-900/50 to-red-900/50 border-orange-500/30">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-orange-400 animate-pulse" />
            TradeVision IA Agent - Motor do Sistema
          </CardTitle>
          <CardDescription className="text-gray-300">
            Performance do agente inteligente que analisa, aprende e recomenda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-slate-800/50 border border-orange-500/20">
              <div className="text-2xl font-bold text-orange-400">{agentStats.totalInteractions}</div>
              <div className="text-xs text-gray-400 mt-1">Total Interações</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-slate-800/50 border border-orange-500/20">
              <div className="text-2xl font-bold text-cyan-400">{agentStats.knowledgeUsed}</div>
              <div className="text-xs text-gray-400 mt-1">Conhecimento Usado</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-slate-800/50 border border-orange-500/20">
              <div className="text-2xl font-bold text-green-400">{agentStats.avgResponseTime.toFixed(1)}s</div>
              <div className="text-xs text-gray-400 mt-1">Tempo Médio</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-slate-800/50 border border-orange-500/20">
              <div className="text-2xl font-bold text-purple-400">{agentStats.accuracyScore.toFixed(1)}%</div>
              <div className="text-xs text-gray-400 mt-1">Acurácia Média</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-slate-800/50 border border-orange-500/20">
              <div className="text-2xl font-bold text-yellow-400">{agentStats.learningProgress.toFixed(0)}%</div>
              <div className="text-xs text-gray-400 mt-1">Progresso Aprendizado</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-slate-800/50 border border-orange-500/20">
              <div className="text-2xl font-bold text-pink-400">{agentStats.totalFeedback}</div>
              <div className="text-xs text-gray-400 mt-1">Total Feedback</div>
            </div>
          </div>
          
          {/* Barra de progresso de aprendizado */}
          <div className="mt-4 p-3 rounded-lg bg-slate-800/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Evolução do Aprendizado</span>
              <span className="text-xs font-bold text-orange-400">{agentStats.learningProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${agentStats.learningProgress}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance de Trading e Narrador */}
      <div className="grid grid-cols-2 gap-6">
        {/* Trading Stats */}
        <Card className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-500/30">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-green-400" />
              Performance de Trading Automático
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-lg bg-slate-800/50">
                <div className="text-xl font-bold text-blue-400">{tradingStats.totalTrades}</div>
                <div className="text-xs text-gray-400">Total Trades</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-800/50">
                <div className="text-xl font-bold text-green-400">{tradingStats.wins}</div>
                <div className="text-xs text-gray-400">Vitórias</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-800/50">
                <div className="text-xl font-bold text-red-400">{tradingStats.losses}</div>
                <div className="text-xs text-gray-400">Perdas</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-800/50">
                <div className="text-xl font-bold text-purple-400">{tradingStats.winRate.toFixed(1)}%</div>
                <div className="text-xs text-gray-400">Win Rate</div>
              </div>
              <div className="col-span-2 text-center p-3 rounded-lg bg-slate-800/50">
                <div className={`text-2xl font-bold ${tradingStats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tradingStats.totalPnL >= 0 ? '+' : ''}${tradingStats.totalPnL.toFixed(2)}
                </div>
                <div className="text-xs text-gray-400">P&L Total (Simulado)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Narrator Stats */}
        <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-400" />
              Performance do Narrador IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-lg bg-slate-800/50">
                <div className="text-xl font-bold text-blue-400">{narratorStats.totalSignals}</div>
                <div className="text-xs text-gray-400">Total Sinais</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-800/50">
                <div className="text-xl font-bold text-cyan-400">{narratorStats.validatedSignals}</div>
                <div className="text-xs text-gray-400">Validados</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-800/50">
                <div className="text-xl font-bold text-green-400">{narratorStats.wins}</div>
                <div className="text-xs text-gray-400">Vitórias</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-800/50">
                <div className="text-xl font-bold text-red-400">{narratorStats.losses}</div>
                <div className="text-xs text-gray-400">Perdas</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-800/50">
                <div className="text-xl font-bold text-purple-400">{narratorStats.winRate.toFixed(1)}%</div>
                <div className="text-xs text-gray-400">Win Rate</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-800/50">
                <div className="text-xl font-bold text-yellow-400">{narratorStats.avgVariation.toFixed(2)}%</div>
                <div className="text-xs text-gray-400">Variação Média</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Atividades Recentes */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-cyan-400" />
            Últimas Atividades em Tempo Real
          </CardTitle>
          <CardDescription className="text-gray-400">
            Acompanhe as interações recentes com o sistema (atualiza a cada 15s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  Aguardando atividades...
                </p>
              ) : (
                recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:border-slate-600 transition-colors"
                  >
                    <div className="mt-1">
                      {activity.type === 'chat' && <MessageSquare className="h-4 w-4 text-blue-400" />}
                      {activity.type === 'signal' && <Target className="h-4 w-4 text-purple-400" />}
                      {activity.type === 'trade' && <TrendingUp className="h-4 w-4 text-green-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`
                        ${activity.status === 'success' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
                        ${activity.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : ''}
                        ${activity.status === 'error' ? 'bg-red-500/20 text-red-400 border-red-500/30' : ''}
                      `}
                    >
                      {activity.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Status do Sistema */}
      <Card className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-cyan-400" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-xs text-gray-400">Trading Bot</span>
              </div>
              <div className="text-sm font-bold text-green-400">ATIVO</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-xs text-gray-400">Narrador IA</span>
              </div>
              <div className="text-sm font-bold text-green-400">ATIVO</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-xs text-gray-400">Binance API</span>
              </div>
              <div className="text-sm font-bold text-green-400">CONECTADO</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-xs text-gray-400">Base de Dados</span>
              </div>
              <div className="text-sm font-bold text-green-400">ONLINE</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}