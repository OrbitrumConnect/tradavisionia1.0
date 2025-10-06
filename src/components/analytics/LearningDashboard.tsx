import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAutonomousLearning } from '@/hooks/useAutonomousLearning';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';

interface LearningDashboardProps {
  symbol: string;
  onLearningComplete?: (results: any) => void;
}

export const LearningDashboard = ({ symbol, onLearningComplete }: LearningDashboardProps) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1m');
  const [selectedDays, setSelectedDays] = useState(30);
  const [isLearningActive, setIsLearningActive] = useState(false);
  const [learningResults, setLearningResults] = useState<any>(null);
  
  const {
    learningProgress,
    loading,
    error,
    executeAutonomousBacktesting,
    applyLearningToNarrator,
    startContinuousLearning
  } = useAutonomousLearning(symbol);
  

  // Função para iniciar aprendizado
  const handleStartLearning = async () => {
    setIsLearningActive(true);
    const results = await executeAutonomousBacktesting(selectedDays);
    if (results) {
      setLearningResults(results);
      onLearningComplete?.(results);
    }
    setIsLearningActive(false);
  };

  // Função para aplicar aprendizado
  const handleApplyLearning = async () => {
    await applyLearningToNarrator();
  };

  // Função para iniciar aprendizado contínuo
  const handleStartContinuousLearning = async () => {
    const stopLearning = await startContinuousLearning(60); // A cada 1 hora
    return stopLearning;
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">🧠 Dashboard de Aprendizado Autônomo</h2>
          <p className="text-gray-400">Sistema de treinamento automático da IA</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleStartLearning}
            disabled={loading || isLearningActive}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading || isLearningActive ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {isLearningActive ? 'Aprendendo...' : 'Iniciar Aprendizado'}
          </Button>
          <Button
            onClick={handleApplyLearning}
            disabled={!learningProgress}
            variant="outline"
          >
            <Zap className="h-4 w-4 mr-2" />
            Aplicar ao Narrador
          </Button>
        </div>
      </div>

      {/* Configurações */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">⚙️ Configurações de Aprendizado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Símbolo</label>
              <input
                type="text"
                value={symbol}
                disabled
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Timeframe</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
              >
                <option value="1m">1 Minuto</option>
                <option value="5m">5 Minutos</option>
                <option value="15m">15 Minutos</option>
                <option value="1h">1 Hora</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Dias de Dados</label>
              <select
                value={selectedDays}
                onChange={(e) => setSelectedDays(Number(e.target.value))}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
              >
                <option value={7}>7 Dias</option>
                <option value={30}>30 Dias</option>
                <option value={90}>90 Dias</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status do Aprendizado */}
      {learningProgress && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Status do Aprendizado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{learningResults?.wins ? Math.round((learningResults.wins / learningResults.totalTrades) * 100) : 0}%</div>
                <div className="text-sm text-gray-400">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{learningResults?.totalTrades || 0}</div>
                <div className="text-sm text-gray-400">Total Trades</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${learningResults?.totalPnL || 0 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {learningResults?.totalPnL || 0 >= 0 ? '+' : ''}{learningResults?.totalPnL || 0}%
                </div>
                <div className="text-sm text-gray-400">PnL Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{learningResults?.maxDrawdown || 0}%</div>
                <div className="text-sm text-gray-400">Max Drawdown</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs de Análise */}
      <Tabs defaultValue="patterns" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-700">
          <TabsTrigger value="patterns">Padrões</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Tab: Padrões */}
        <TabsContent value="patterns" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">🎯 Análise de Padrões</CardTitle>
              <CardDescription className="text-gray-400">
                Performance de cada padrão detectado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {learningResults?.patternWeights ? (
                <div className="space-y-3">
                  {Object.entries(learningResults?.patternWeights || {}).map(([pattern, stats]: [string, any]) => (
                    <div key={pattern} className="flex items-center justify-between p-3 bg-slate-700 rounded">
                      <div className="flex-1">
                        <div className="font-medium text-white">{pattern}</div>
                        <div className="text-sm text-gray-400">
                          {stats.totalTrades} trades • {stats.wins} vitórias
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-400">
                          {Math.round(stats.successRate * 100)}%
                        </div>
                        <div className="text-sm text-gray-400">
                          {stats.avgPnL >= 0 ? '+' : ''}{stats.avgPnL.toFixed(1)}% PnL
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  Nenhum padrão analisado ainda. Execute o aprendizado primeiro.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Insights */}
        <TabsContent value="insights" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">💡 Insights de Aprendizado</CardTitle>
              <CardDescription className="text-gray-400">
                Descobertas automáticas da IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              {learningResults?.insights && learningResults.insights.length > 0 ? (
                <div className="space-y-3">
                  {learningResults.insights.map((insight, index) => (
                    <Alert key={index} className={`${
                      insight.type === 'success' ? 'border-green-500 bg-green-500/10' :
                      insight.type === 'warning' ? 'border-yellow-500 bg-yellow-500/10' :
                      'border-blue-500 bg-blue-500/10'
                    }`}>
                      <div className="flex items-start gap-2">
                        {insight.type === 'success' && <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />}
                        {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />}
                        {insight.type === 'insight' && <Lightbulb className="h-4 w-4 text-blue-400 mt-0.5" />}
                        <AlertDescription className="text-white">
                          {insight.message}
                          {insight.pattern && (
                            <Badge variant="outline" className="ml-2">
                              {insight.pattern}
                            </Badge>
                          )}
                        </AlertDescription>
                      </div>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  Nenhum insight gerado ainda. Execute o aprendizado primeiro.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Performance */}
        <TabsContent value="performance" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">📊 Métricas de Performance</CardTitle>
              <CardDescription className="text-gray-400">
                Análise detalhada do aprendizado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {learningProgress ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-2">Win Rate</div>
                      <Progress value={learningResults?.wins ? Math.round((learningResults.wins / learningResults.totalTrades) * 100) : 0} className="h-2" />
                      <div className="text-sm text-gray-400 mt-1">{learningResults?.wins ? Math.round((learningResults.wins / learningResults.totalTrades) * 100) : 0}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-2">PnL Total</div>
                      <div className={`text-2xl font-bold ${learningResults?.totalPnL || 0 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {learningResults?.totalPnL || 0 >= 0 ? '+' : ''}{learningResults?.totalPnL || 0}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-2">Total de Trades</div>
                      <div className="text-2xl font-bold text-blue-400">{learningResults?.totalTrades || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-2">PnL Médio</div>
                      <div className={`text-2xl font-bold ${(learningResults?.totalPnL || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(learningResults?.totalPnL || 0) >= 0 ? '+' : ''}{(learningResults?.totalPnL || 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Max Drawdown</div>
                    <div className="text-2xl font-bold text-yellow-400">{learningResults?.maxDrawdown || 0}%</div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  Nenhuma métrica disponível. Execute o aprendizado primeiro.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Erro */}
      {error && (
        <Alert className="border-red-500 bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-400">
            {error}
          </AlertDescription>
        </Alert>
      )}

    </div>
  );
};
