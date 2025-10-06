import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, Target, Award, BookOpen, DollarSign, BarChart3 } from "lucide-react";
import { TradeRegistration } from "./TradeRegistration";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LearningProgress {
  topic: string;
  skill_level: number;
  mistakes_count: number;
  successes_count: number;
  improvement_notes: string | null;
}

interface PaperTrade {
  symbol: string;
  side: string;
  entry_price: number;
  exit_price: number | null;
  pnl: number | null;
  pnl_percent: number | null;
  status: string;
  lessons_learned: string | null;
  entry_time: string;
}

interface BacktestSession {
  session_name: string;
  symbol: string;
  timeframe: string;
  results: any;
  status: string;
  created_at: string;
}

interface StudySession {
  topic: string;
  duration_minutes: number | null;
  key_learnings: any;
  concepts_mastered: any;
  created_at: string;
}

export function StudyResults() {
  const { user } = useAuth();
  const [learningProgress, setLearningProgress] = useState<LearningProgress[]>([]);
  const [paperTrades, setPaperTrades] = useState<PaperTrade[]>([]);
  const [backtestSessions, setBacktestSessions] = useState<BacktestSession[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAllData();
    }

    // Listener para recarregar quando um trade for registrado
    const handleTradeRegistered = () => loadAllData();
    window.addEventListener('trade-registered', handleTradeRegistered);
    
    return () => window.removeEventListener('trade-registered', handleTradeRegistered);
  }, [user]);

  const loadAllData = async () => {
    setLoading(true);
    
    const [progressData, tradesData, backtestsData, studiesData] = await Promise.all([
      supabase.from('learning_progress').select('*').eq('user_id', user!.id).order('skill_level', { ascending: false }),
      supabase.from('paper_trades').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('backtesting_sessions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('study_sessions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(10)
    ]);

    if (progressData.data) setLearningProgress(progressData.data as any);
    if (tradesData.data) setPaperTrades(tradesData.data as any);
    if (backtestsData.data) setBacktestSessions(backtestsData.data as any);
    if (studiesData.data) setStudySessions(studiesData.data as any);
    
    setLoading(false);
  };

  const calculateWinRate = () => {
    const closedTrades = paperTrades.filter(t => t.status === 'closed' && t.pnl !== null);
    if (closedTrades.length === 0) return 0;
    const wins = closedTrades.filter(t => t.pnl! > 0).length;
    return Math.round((wins / closedTrades.length) * 100);
  };

  const calculateTotalPnL = () => {
    return paperTrades
      .filter(t => t.pnl !== null)
      .reduce((sum, t) => sum + (t.pnl || 0), 0);
  };

  const getAverageSkillLevel = () => {
    if (learningProgress.length === 0) return 0;
    const total = learningProgress.reduce((sum, p) => sum + p.skill_level, 0);
    return Math.round(total / learningProgress.length);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando resultados...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de registro */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">📊 Seus Resultados & Métricas</h3>
          <p className="text-sm text-muted-foreground">
            Registre suas operações manualmente para acompanhar seu desempenho
          </p>
        </div>
        <TradeRegistration />
      </div>

      {/* Info sobre registro manual */}
      <Alert>
        <AlertDescription className="text-sm">
          💡 <strong>Como funciona:</strong> Registre manualmente suas operações (reais ou simuladas) 
          após executá-las em sua corretora. O sistema calculará automaticamente seu P&L, win rate e métricas de evolução.
        </AlertDescription>
      </Alert>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Nível Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageSkillLevel()}%</div>
            <p className="text-xs text-muted-foreground">Habilidade geral</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateWinRate()}%</div>
            <p className="text-xs text-muted-foreground">Paper Trading</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              P&L Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${calculateTotalPnL() >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${calculateTotalPnL().toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Paper Trading</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Estudos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studySessions.length}</div>
            <p className="text-xs text-muted-foreground">Sessões completas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com detalhes */}
      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="progress">Progresso</TabsTrigger>
          <TabsTrigger value="paper-trading">Paper Trading</TabsTrigger>
          <TabsTrigger value="backtesting">Backtesting</TabsTrigger>
          <TabsTrigger value="studies">Estudos</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          <ScrollArea className="h-[400px]">
            {learningProgress.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum progresso registrado ainda
              </div>
            ) : (
              <div className="space-y-4 pr-4">
                {learningProgress.map((item, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{item.topic}</CardTitle>
                        <Badge variant={item.skill_level >= 70 ? "default" : "secondary"}>
                          {item.skill_level}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Progress value={item.skill_level} className="h-2" />
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1 text-green-500">
                          <TrendingUp className="h-3 w-3" />
                          {item.successes_count} acertos
                        </span>
                        <span className="flex items-center gap-1 text-red-500">
                          <TrendingDown className="h-3 w-3" />
                          {item.mistakes_count} erros
                        </span>
                      </div>
                      {item.improvement_notes && (
                        <p className="text-xs text-muted-foreground italic">{item.improvement_notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="paper-trading" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              {paperTrades.length} operações registradas
            </p>
          </div>
          <ScrollArea className="h-[400px]">
            {paperTrades.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum paper trade registrado ainda
              </div>
            ) : (
              <div className="space-y-4 pr-4">
                {paperTrades.map((trade, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{trade.symbol}</CardTitle>
                        <Badge variant={trade.status === 'closed' ? 'default' : 'secondary'}>
                          {trade.side}
                        </Badge>
                      </div>
                      <CardDescription>
                        {new Date(trade.entry_time).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Entrada:</span>
                          <span className="ml-2 font-medium">${trade.entry_price}</span>
                        </div>
                        {trade.exit_price && (
                          <div>
                            <span className="text-muted-foreground">Saída:</span>
                            <span className="ml-2 font-medium">${trade.exit_price}</span>
                          </div>
                        )}
                      </div>
                      {trade.pnl !== null && (
                        <div className={`text-sm font-bold ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          P&L: ${trade.pnl.toFixed(2)} ({trade.pnl_percent?.toFixed(2)}%)
                        </div>
                      )}
                      {trade.lessons_learned && (
                        <p className="text-xs text-muted-foreground italic border-l-2 pl-2 mt-2">
                          {trade.lessons_learned}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="backtesting" className="space-y-4">
          <ScrollArea className="h-[400px]">
            {backtestSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma sessão de backtesting registrada
              </div>
            ) : (
              <div className="space-y-4 pr-4">
                {backtestSessions.map((session, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{session.session_name}</CardTitle>
                        <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                          {session.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        {session.symbol} • {session.timeframe}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BarChart3 className="h-4 w-4" />
                        {new Date(session.created_at).toLocaleDateString('pt-BR')}
                      </div>
                      {session.results && Object.keys(session.results).length > 0 && (
                        <div className="mt-3 p-2 bg-muted rounded-md text-xs">
                          <pre>{JSON.stringify(session.results, null, 2)}</pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="studies" className="space-y-4">
          <ScrollArea className="h-[400px]">
            {studySessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma sessão de estudo registrada
              </div>
            ) : (
              <div className="space-y-4 pr-4">
                {studySessions.map((session, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="text-base">{session.topic}</CardTitle>
                      <CardDescription>
                        {session.duration_minutes} minutos • {new Date(session.created_at).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Array.isArray(session.concepts_mastered) && session.concepts_mastered.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Conceitos Dominados:</h4>
                          <div className="flex flex-wrap gap-1">
                            {session.concepts_mastered.map((concept: any, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {concept}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {Array.isArray(session.key_learnings) && session.key_learnings.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Aprendizados-Chave:</h4>
                          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                            {session.key_learnings.map((learning: any, i: number) => (
                              <li key={i}>{learning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
