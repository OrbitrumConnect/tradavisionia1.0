import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDecisionEngine } from '@/hooks/useDecisionEngine';
import {
  Brain,
  Play,
  Pause,
  RefreshCw,
  Lightbulb,
  ListChecks,
  Calendar,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';

/**
 * PAINEL DO NÚCLEO DE DECISÃO DINÂMICA
 * 
 * Visualiza e controla o agente autônomo:
 * - Status das rotinas periódicas
 * - Insights gerados
 * - Prioridades atuais
 * - Planos de ação
 * - Tarefas de background
 */

export function DecisionEnginePanel() {
  const {
    isActive,
    isLoading,
    lastMicroAnalysis,
    lastMesoAnalysis,
    lastMacroAnalysis,
    recentInsights,
    start,
    stop,
    runAnalysis,
    getInsights,
    getPriorities,
    getActivePlans,
    getAgentContext,
    getBackgroundTasks,
    submitInsightFeedback
  } = useDecisionEngine();

  const [insights, setInsights] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [context, setContext] = useState<any>(null);
  const [backgroundTasks, setBackgroundTasks] = useState<any[]>([]);

  // Carrega dados
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const [insightsData, prioritiesData, plansData, contextData, tasksData] = await Promise.all([
      getInsights(20),
      getPriorities(),
      getActivePlans(),
      getAgentContext(),
      getBackgroundTasks()
    ]);

    setInsights(insightsData);
    setPriorities(prioritiesData);
    setPlans(plansData);
    setContext(contextData);
    setBackgroundTasks(tasksData);
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return 'Nunca';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('pt-BR');
  };

  const formatRelativeTime = (date: string) => {
    const now = new Date().getTime();
    const then = new Date(date).getTime();
    const diff = now - then;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d atrás`;
    if (hours > 0) return `${hours}h atrás`;
    return `${minutes}m atrás`;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      CRITICAL: 'destructive',
      HIGH: 'default',
      MEDIUM: 'secondary',
      LOW: 'outline',
      BACKGROUND: 'outline'
    };
    return colors[priority as keyof typeof colors] || 'default';
  };

  const getInsightIcon = (type: string) => {
    const icons = {
      correlation: TrendingUp,
      pattern_discovery: Activity,
      performance_improvement: CheckCircle2,
      risk_alert: AlertCircle,
      opportunity: Lightbulb,
      hypothesis_validation: Info
    };
    return icons[type as keyof typeof icons] || Info;
  };

  return (
    <div className="space-y-4">
      {/* Header com Status e Controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6" />
              <CardTitle>Núcleo de Decisão Dinâmica</CardTitle>
              {isActive && (
                <Badge variant="default" className="ml-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Ativo
                  </div>
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              {!isActive ? (
                <Button onClick={start} disabled={isLoading}>
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar
                </Button>
              ) : (
                <Button onClick={stop} variant="destructive">
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {/* Micro-Análise */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Micro (5min)</p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(lastMicroAnalysis)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-6 text-xs"
                  onClick={() => runAnalysis('micro')}
                >
                  Executar Agora
                </Button>
              </div>
            </div>

            {/* Meso-Análise */}
            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <Activity className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Meso (1h)</p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(lastMesoAnalysis)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-6 text-xs"
                  onClick={() => runAnalysis('meso')}
                >
                  Executar Agora
                </Button>
              </div>
            </div>

            {/* Macro-Análise */}
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Macro (24h)</p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(lastMacroAnalysis)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-6 text-xs"
                  onClick={() => runAnalysis('macro')}
                >
                  Executar Agora
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contexto do Agente */}
      {context && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Contexto do Agente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{context.signals_generated_today || 0}</p>
                <p className="text-xs text-muted-foreground">Sinais Hoje</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{context.win_rate_24h?.toFixed(1) || 0}%</p>
                <p className="text-xs text-muted-foreground">Win Rate 24h</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{context.win_rate_7d?.toFixed(1) || 0}%</p>
                <p className="text-xs text-muted-foreground">Win Rate 7d</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{context.sharpe_ratio?.toFixed(2) || 0}</p>
                <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
              </div>
            </div>

            {context.current_focus && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm font-medium">Foco Atual:</p>
                <p className="text-sm text-muted-foreground">{context.current_focus}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs com Conteúdo */}
      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">
            <Lightbulb className="w-4 h-4 mr-2" />
            Insights ({insights.length})
          </TabsTrigger>
          <TabsTrigger value="priorities">
            <ListChecks className="w-4 h-4 mr-2" />
            Prioridades ({priorities.length})
          </TabsTrigger>
          <TabsTrigger value="plans">
            <Calendar className="w-4 h-4 mr-2" />
            Planos ({plans.length})
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <Clock className="w-4 h-4 mr-2" />
            Background ({backgroundTasks.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB: Insights */}
        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>Insights Autônomos</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {insights.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum insight gerado ainda
                    </p>
                  ) : (
                    insights.map((insight) => {
                      const Icon = getInsightIcon(insight.insight_type);
                      return (
                        <div
                          key={insight.id}
                          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-start gap-2">
                              <Icon className="w-5 h-5 mt-0.5" />
                              <div>
                                <h4 className="font-medium">{insight.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {insight.description}
                                </p>
                              </div>
                            </div>
                            <Badge variant={insight.validated ? 'default' : 'outline'}>
                              {(insight.confidence * 100).toFixed(0)}%
                            </Badge>
                          </div>

                          {insight.recommended_action && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded text-sm">
                              <span className="font-medium">Ação: </span>
                              {insight.recommended_action}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(insight.discovered_at)}
                            </span>
                            {!insight.validated && (
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <Button
                                    key={rating}
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => submitInsightFeedback(insight.id, rating)}
                                  >
                                    ⭐
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Prioridades */}
        <TabsContent value="priorities">
          <Card>
            <CardHeader>
              <CardTitle>Fila de Prioridades</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {priorities.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma tarefa prioritária pendente
                    </p>
                  ) : (
                    priorities.map((priority) => (
                      <div
                        key={priority.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={getPriorityColor(priority.priority) as any}>
                                {priority.priority}
                              </Badge>
                              <span className="text-sm font-medium">
                                {priority.task_type}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {priority.task_description}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              {priority.priority_score}
                            </div>
                            <div className="text-xs text-muted-foreground">score</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Planos */}
        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Planos de Ação</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {plans.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum plano ativo
                    </p>
                  ) : (
                    plans.map((plan) => (
                      <div
                        key={plan.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <Badge variant="outline" className="mb-2">
                              {plan.timeframe}
                            </Badge>
                            <h4 className="font-medium">{plan.objective}</h4>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              {(plan.progress * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-muted-foreground">progresso</div>
                          </div>
                        </div>

                        {plan.actions && plan.actions.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Ações:</p>
                            {plan.actions.map((action: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 text-sm text-muted-foreground"
                              >
                                <CheckCircle2 className="w-4 h-4 mt-0.5" />
                                <span>{action.description}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 text-xs text-muted-foreground">
                          Válido até: {new Date(plan.valid_until).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Tarefas Background */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Processamento em Background</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {backgroundTasks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma tarefa de background
                    </p>
                  ) : (
                    backgroundTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{task.task_name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {task.task_description || task.task_type}
                            </p>
                          </div>
                          <Badge
                            variant={
                              task.status === 'completed'
                                ? 'default'
                                : task.status === 'running'
                                ? 'secondary'
                                : task.status === 'failed'
                                ? 'destructive'
                                : 'outline'
                            }
                          >
                            {task.status}
                          </Badge>
                        </div>

                        {task.insights_generated > 0 && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium">{task.insights_generated}</span>{' '}
                            insights gerados
                          </div>
                        )}

                        {task.duration_ms && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Duração: {task.duration_ms}ms
                          </div>
                        )}

                        {task.next_run_at && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Próxima execução: {new Date(task.next_run_at).toLocaleString('pt-BR')}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

