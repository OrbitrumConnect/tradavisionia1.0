import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Award, MessageSquare, Target } from 'lucide-react';

export const PerformanceDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    narratorAccuracy: 0,
    totalSignals: 0,
    analysisSuccess: 0,
    totalAnalyses: 0,
    avgChatFeedback: 0,
    totalFeedbacks: 0,
  });

  useEffect(() => {
    if (!user) return;
    loadPerformanceData();
  }, [user]);

  const loadPerformanceData = async () => {
    if (!user) return;
    
    setLoading(true);

    // Buscar estatísticas dos sinais do narrador
    const { data: signals } = await supabase
      .from('narrator_signals')
      .select('id')
      .eq('user_id', user.id);

    const { data: feedbacks } = await supabase
      .from('narrator_feedback')
      .select('was_accurate')
      .eq('user_id', user.id);

    const accurateSignals = feedbacks?.filter(f => f.was_accurate).length || 0;
    const totalSignals = feedbacks?.length || 0;

    // Buscar estatísticas de análises
    const { data: analyses } = await supabase
      .from('trade_analysis')
      .select('result')
      .eq('user_id', user.id);

    const successfulAnalyses = analyses?.filter(a => 
      ['win', 'ganho'].includes(a.result?.toLowerCase())
    ).length || 0;

    // Buscar média de feedback do chat
    const { data: chatFeedbacks } = await supabase
      .from('chat_messages')
      .select('feedback_score')
      .eq('user_id', user.id)
      .not('feedback_score', 'is', null);

    const avgFeedback = chatFeedbacks?.length 
      ? chatFeedbacks.reduce((sum, f) => sum + (f.feedback_score || 0), 0) / chatFeedbacks.length
      : 0;

    setStats({
      narratorAccuracy: totalSignals > 0 ? (accurateSignals / totalSignals) * 100 : 0,
      totalSignals: signals?.length || 0,
      analysisSuccess: analyses?.length ? (successfulAnalyses / analyses.length) * 100 : 0,
      totalAnalyses: analyses?.length || 0,
      avgChatFeedback: avgFeedback,
      totalFeedbacks: chatFeedbacks?.length || 0,
    });

    setLoading(false);
  };

  const accuracyData = [
    { name: 'Sinais', value: Math.round(stats.narratorAccuracy) },
    { name: 'Análises', value: Math.round(stats.analysisSuccess) },
    { name: 'Chat', value: Math.round(stats.avgChatFeedback * 20) }, // Convert 1-5 to 0-100
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--accent))'];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              Sinais do Narrador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {stats.narratorAccuracy.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalSignals} sinais gerados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/20 to-success/5 border-success/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Taxa de Acerto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {stats.analysisSuccess.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalAnalyses} análises
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Satisfação Chat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">
              {stats.avgChatFeedback.toFixed(1)}/5
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalFeedbacks} avaliações
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="w-4 h-4" />
              Desempenho Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {((stats.narratorAccuracy + stats.analysisSuccess) / 2).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Média combinada
            </p>
          </CardContent>
        </Card>
      </div>

      {!loading && stats.totalAnalyses > 0 && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Comparativo de Acurácia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
