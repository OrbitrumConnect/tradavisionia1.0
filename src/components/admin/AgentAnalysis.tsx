import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  Target, 
  Brain,
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAgentAnalysis } from '@/hooks/useAgentAnalysis';

interface AgentAnalysisProps {
  selectedSymbol?: string;
  liveData?: any;
  candles?: any[];
  technicalIndicators?: any;
  patterns?: any;
}

export function AgentAnalysis({ 
  selectedSymbol = 'BTC/USDT',
  liveData,
  candles,
  technicalIndicators,
  patterns
}: AgentAnalysisProps) {
  const [isActive, setIsActive] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('3m');
  const [currentPage, setCurrentPage] = useState(1);
  const signalsPerPage = 5;

  // Debug logs
  useEffect(() => {
    console.log('🔍 AgentAnalysis Debug:', {
      selectedSymbol,
      selectedTimeframe,
      liveData,
      candles: candles?.length,
      technicalIndicators,
      patterns
    });
  }, [selectedSymbol, selectedTimeframe, liveData, candles, technicalIndicators, patterns]);
  
  // Análise independente do Agente
  const {
    signals,
    isAnalyzing,
    lastAnalysis,
    startAnalysis,
    stopAnalysis,
    clearSignals
  } = useAgentAnalysis({
    symbol: selectedSymbol,
    timeframe: selectedTimeframe,
    liveData,
    technicalIndicators,
    patterns,
    enabled: isActive
  });

  // Iniciar análise automaticamente
  useEffect(() => {
    if (isActive && liveData && !isAnalyzing) {
      startAnalysis();
    }
  }, [isActive, liveData, isAnalyzing, startAnalysis]);

  // Lógica de paginação
  const totalPages = Math.ceil(signals.length / signalsPerPage);
  const startIndex = (currentPage - 1) * signalsPerPage;
  const endIndex = startIndex + signalsPerPage;
  const currentSignals = signals.slice(startIndex, endIndex);

  // Resetar página quando limpar sinais
  const handleClearSignals = () => {
    clearSignals();
    setCurrentPage(1);
  };

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'BUY': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'SELL': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSignalBadge = (type: string) => {
    switch (type) {
      case 'BUY': return <Badge className="bg-green-500 hover:bg-green-600">BUY</Badge>;
      case 'SELL': return <Badge className="bg-red-500 hover:bg-red-600">SELL</Badge>;
      default: return <Badge variant="secondary">ANALYSIS</Badge>;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-500" />
            Análise do Agente TradeVision IA
          </h1>
          <p className="text-muted-foreground">
            Análise independente do mercado em tempo real - {selectedSymbol} ({selectedTimeframe})
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={isActive ? "destructive" : "default"}
            onClick={() => {
              setIsActive(!isActive);
              if (isActive) {
                stopAnalysis();
              } else {
                startAnalysis();
              }
            }}
            className="flex items-center gap-2"
          >
            {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isActive ? 'Pausar' : 'Iniciar'} Análise
          </Button>
          
          <Button
            variant="outline"
            onClick={handleClearSignals}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {isActive ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              {isActive ? 'Ativo' : 'Pausado'}
            </div>
            <p className="text-xs text-muted-foreground">
              {isAnalyzing ? 'Analisando...' : 'Aguardando dados'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sinais Gerados</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{signals.length}</div>
            <p className="text-xs text-muted-foreground">
              Última análise: {lastAnalysis ? new Date(lastAnalysis).toLocaleTimeString() : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preço Atual</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveData?.price ? `$${Number(liveData.price).toLocaleString()}` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {liveData?.change24h || '0%'} (24h)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timeframe</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedTimeframe}</div>
            <p className="text-xs text-muted-foreground">
              Análise a cada 1 minuto
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Painel Único Organizado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Indicadores Técnicos e Padrões */}
        <div className="space-y-4">
          {/* Indicadores Técnicos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Indicadores Técnicos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {technicalIndicators ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <span className="text-sm font-medium text-blue-200">RSI (14)</span>
                    <span className="text-lg font-bold text-blue-400">
                      {technicalIndicators?.rsi14?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <span className="text-sm font-medium text-green-200">MACD Hist</span>
                    <span className="text-lg font-bold text-green-400">
                      {technicalIndicators?.macdHistogram?.toFixed(4) || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                    <span className="text-sm font-medium text-purple-200">EMA (9)</span>
                    <span className="text-lg font-bold text-purple-400">
                      ${technicalIndicators?.ema9?.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                    <span className="text-sm font-medium text-orange-200">EMA (20)</span>
                    <span className="text-lg font-bold text-orange-400">
                      ${technicalIndicators?.ema20?.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Carregando indicadores...
                </p>
              )}
            </CardContent>
          </Card>

          {/* Padrões Detectados */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Padrões Detectados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patterns ? (
                <div className="space-y-2">
                  <div className={`flex justify-between items-center p-3 rounded-lg border ${
                    patterns.orderBlockDetected ? 'bg-green-900/20 border-green-500/30' : 'bg-gray-800/20 border-gray-600/30'
                  }`}>
                    <span className="text-sm font-medium text-gray-200">Order Block</span>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      patterns.orderBlockDetected ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'
                    }`}>
                      {patterns.orderBlockDetected ? 'SIM' : 'NÃO'}
                    </span>
                  </div>
                  
                  <div className={`flex justify-between items-center p-3 rounded-lg border ${
                    patterns.fvgDetected ? 'bg-green-900/20 border-green-500/30' : 'bg-gray-800/20 border-gray-600/30'
                  }`}>
                    <span className="text-sm font-medium text-gray-200">Fair Value Gap</span>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      patterns.fvgDetected ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'
                    }`}>
                      {patterns.fvgDetected ? 'SIM' : 'NÃO'}
                    </span>
                  </div>
                  
                  <div className={`flex justify-between items-center p-3 rounded-lg border ${
                    patterns.bosDetected ? 'bg-green-900/20 border-green-500/30' : 'bg-gray-800/20 border-gray-600/30'
                  }`}>
                    <span className="text-sm font-medium text-gray-200">Break of Structure</span>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      patterns.bosDetected ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'
                    }`}>
                      {patterns.bosDetected ? 'SIM' : 'NÃO'}
                    </span>
                  </div>
                  
                  <div className={`flex justify-between items-center p-3 rounded-lg border ${
                    patterns.chochDetected ? 'bg-green-900/20 border-green-500/30' : 'bg-gray-800/20 border-gray-600/30'
                  }`}>
                    <span className="text-sm font-medium text-gray-200">Change of Character</span>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      patterns.chochDetected ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'
                    }`}>
                      {patterns.chochDetected ? 'SIM' : 'NÃO'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Carregando padrões...
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna 2 e 3: Sinais em Tempo Real */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Sinais Autênticos do Agente
              </CardTitle>
              <CardDescription>
                Análise independente sem interferência do Narrador
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[700px]">
                {signals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mb-2" />
                    <p>Nenhum sinal gerado ainda</p>
                    <p className="text-sm">Aguardando análise do mercado...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentSignals.map((signal, index) => (
                      <Card key={signal.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                          {/* Header do Sinal */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {getSignalIcon(signal.type)}
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  {getSignalBadge(signal.type)}
                                  <span className="font-semibold">{signal.symbol}</span>
                                  <span className="text-sm text-muted-foreground">({signal.timeframe})</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(signal.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className={`text-lg font-bold ${getConfidenceColor(signal.confidence)}`}>
                                {signal.confidence}%
                              </div>
                              <p className="text-sm text-muted-foreground">Confiança</p>
                            </div>
                          </div>
                          
                          {/* Panorama Compacto */}
                          {signal.panorama && (
                            <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 p-4 rounded-lg border border-blue-500/30 mb-3">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div className="text-center">
                                  <div className="text-xs text-blue-200 mb-2">Tendência</div>
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                    signal.panorama.trendDirection === 'ALTA' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                    signal.panorama.trendDirection === 'BAIXA' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                    'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                  }`}>
                                    {signal.panorama.trendDirection}
                                  </span>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-blue-200 mb-2">Força</div>
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                    signal.panorama.signalStrength === 'FORTE' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                    signal.panorama.signalStrength === 'MÉDIO' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                    'bg-red-500/20 text-red-400 border-red-500/30'
                                  }`}>
                                    {signal.panorama.signalStrength}
                                  </span>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-blue-200 mb-2">Acurácia</div>
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                    signal.panorama.accuracy >= 80 ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                    signal.panorama.accuracy >= 60 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                    'bg-red-500/20 text-red-400 border-red-500/30'
                                  }`}>
                                    {signal.panorama.accuracy}%
                                  </span>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-blue-200 mb-2">Risco</div>
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                    signal.risk === 'BAIXO' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                    signal.risk === 'MÉDIO' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                    'bg-red-500/20 text-red-400 border-red-500/30'
                                  }`}>
                                    {signal.risk}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          
                          {/* Análise Detalhada do Agente */}
                          <div className="bg-gray-800/20 border border-gray-600/30 p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-3">
                              <span className="font-medium text-sm text-gray-200">Análise Completa do Agente:</span>
                              <span className="text-sm text-gray-400">{signal.pattern}</span>
                            </div>
                            <div className="text-sm text-gray-300 leading-relaxed max-h-32 overflow-y-auto">
                              {signal.analysis}
                            </div>
                            {signal.panorama?.nextLevels && (
                              <div className="mt-3 pt-3 border-t border-gray-600/30">
                                <span className="text-xs font-medium text-gray-300">Próximos Níveis Importantes:</span>
                                <p className="text-xs text-gray-400 mt-1">{signal.panorama.nextLevels}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              {/* Controles de Paginação */}
              {signals.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-600/30">
                  <div className="text-sm text-gray-400">
                    Mostrando {startIndex + 1}-{Math.min(endIndex, signals.length)} de {signals.length} sinais
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1"
                    >
                      <span>←</span>
                      Anterior
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1"
                    >
                      Próxima
                      <span>→</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
