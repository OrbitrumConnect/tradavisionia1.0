import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, Brain, TrendingUp, Star } from 'lucide-react';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    totalKnowledge: 0,
    totalAnalysis: 0,
    avgFeedback: 0,
  });

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
  }, []);

  const statCards = [
    {
      title: 'Total de Usuários',
      value: stats.totalUsers,
      icon: Users,
      description: 'Usuários cadastrados',
    },
    {
      title: 'Mensagens no Chat',
      value: stats.totalMessages,
      icon: MessageSquare,
      description: 'Total de interações',
    },
    {
      title: 'Base de Conhecimento',
      value: stats.totalKnowledge,
      icon: Brain,
      description: 'Artigos técnicos',
    },
    {
      title: 'Análises Realizadas',
      value: stats.totalAnalysis,
      icon: TrendingUp,
      description: 'Total de trades analisados',
    },
    {
      title: 'Média de Feedback',
      value: stats.avgFeedback.toFixed(1),
      icon: Star,
      description: 'De 5 estrelas',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Dashboard Admin</h2>
        <p className="text-muted-foreground">Visão geral do sistema TradeVision IA</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title} className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle>Últimas Atividades</CardTitle>
          <CardDescription>Acompanhe as interações recentes com o bot</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sistema de monitoramento em tempo real será implementado aqui
          </p>
        </CardContent>
      </Card>
    </div>
  );
}