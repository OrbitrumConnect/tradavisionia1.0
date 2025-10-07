import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Clock, Target, AlertTriangle, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';

interface TradeAnalysis {
  id: string;
  symbol: string;
  timeframe: string;
  analysis_type: string;
  pattern_detected: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  result: string;
  probability: number;
  confidence_score: number;
  created_at: string;
  feedback_score: number;
}

export const AnalysisHistory = () => {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<TradeAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterResult, setFilterResult] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    loadAnalyses();
  }, [user, filterResult, currentPage]);

  // Reset página quando filtro mudar
  useEffect(() => {
    setCurrentPage(1);
  }, [filterResult]);

  const loadAnalyses = async () => {
    if (!user) return;
    
    setLoading(true);
    
    // Primeiro, contar o total de registros
    let countQuery = supabase
      .from('trade_analysis')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (filterResult !== 'all') {
      countQuery = countQuery.eq('result', filterResult);
    }

    const { count, error: countError } = await countQuery;
    
    if (countError) {
      console.error('Erro ao contar análises:', countError);
    } else {
      setTotalCount(count || 0);
    }

    // Depois, buscar os dados paginados
    const offset = (currentPage - 1) * itemsPerPage;
    let query = supabase
      .from('trade_analysis')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + itemsPerPage - 1);

    if (filterResult !== 'all') {
      query = query.eq('result', filterResult);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao carregar análises:', error);
    } else {
      setAnalyses(data || []);
    }
    setLoading(false);
  };

  const getResultBadge = (result: string) => {
    switch (result?.toLowerCase()) {
      case 'win':
      case 'ganho':
        return <Badge className="bg-success text-white">✓ Acertou</Badge>;
      case 'loss':
      case 'perda':
        return <Badge className="bg-destructive text-white">✗ Errou</Badge>;
      case 'breakeven':
        return <Badge variant="secondary">≈ Empate</Badge>;
      default:
        return <Badge variant="outline">⏳ Pendente</Badge>;
    }
  };

  const calculateStats = () => {
    const total = analyses.length;
    const wins = analyses.filter(a => ['win', 'ganho'].includes(a.result?.toLowerCase())).length;
    const losses = analyses.filter(a => ['loss', 'perda'].includes(a.result?.toLowerCase())).length;
    const accuracy = total > 0 ? ((wins / total) * 100).toFixed(1) : '0';
    
    return { total, wins, losses, accuracy };
  };

  const stats = calculateStats();

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Histórico de Análises
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {totalCount} análises
            </Badge>
          </div>
          <Select value={filterResult} onValueChange={setFilterResult}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="win">Acertos</SelectItem>
              <SelectItem value="loss">Erros</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="text-2xl font-bold text-success">{stats.wins}</div>
            <div className="text-xs text-muted-foreground">Acertos</div>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="text-2xl font-bold text-destructive">{stats.losses}</div>
            <div className="text-xs text-muted-foreground">Erros</div>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="text-2xl font-bold text-accent">{stats.accuracy}%</div>
            <div className="text-xs text-muted-foreground">Acurácia</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : analyses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma análise encontrada
          </div>
        ) : (
          <div className="space-y-4">
            {/* Lista de Análises */}
            <div className="space-y-3">
              {analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="p-4 bg-background/30 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{analysis.symbol}</span>
                      <Badge variant="outline" className="text-xs">{analysis.timeframe}</Badge>
                      {getResultBadge(analysis.result)}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(analysis.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  {analysis.pattern_detected && (
                    <div className="mb-2">
                      <span className="text-sm text-primary">📊 {analysis.pattern_detected}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-success" />
                      <span className="text-muted-foreground">Entry:</span>
                      <span className="font-mono">{analysis.entry_price}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <span className="text-muted-foreground">Stop:</span>
                      <span className="font-mono">{analysis.stop_loss}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4 text-accent" />
                      <span className="text-muted-foreground">Target:</span>
                      <span className="font-mono">{analysis.take_profit}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Probabilidade: </span>
                      <span className="font-semibold">{analysis.probability}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Confiança: </span>
                      <span className="font-semibold">{analysis.confidence_score}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginação */}
            {Math.ceil(totalCount / itemsPerPage) > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount} análises
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, Math.ceil(totalCount / itemsPerPage)) }, (_, i) => {
                      const page = i + 1;
                      const totalPages = Math.ceil(totalCount / itemsPerPage);
                      
                      // Mostrar páginas ao redor da página atual
                      if (totalPages > 5) {
                        const startPage = Math.max(1, currentPage - 2);
                        const endPage = Math.min(totalPages, startPage + 4);
                        
                        if (page >= startPage && page <= endPage) {
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          );
                        }
                        return null;
                      }
                      
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCount / itemsPerPage), prev + 1))}
                    disabled={currentPage === Math.ceil(totalCount / itemsPerPage)}
                    className="flex items-center gap-1"
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
