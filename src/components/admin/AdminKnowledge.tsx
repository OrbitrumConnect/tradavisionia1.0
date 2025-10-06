import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

interface Knowledge {
  id: string;
  category: string;
  topic: string;
  content: string;
  accuracy_score: number;
  usage_count: number;
  created_at: string;
}

export function AdminKnowledge() {
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    const loadKnowledge = async () => {
      setLoading(true);
      try {
        // Buscar contagem total
        const { count } = await supabase
          .from('bot_knowledge')
          .select('*', { count: 'exact', head: true });

        setTotalCount(count || 0);

        // Buscar dados paginados
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data, error } = await supabase
          .from('bot_knowledge')
          .select('*')
          .order('usage_count', { ascending: false })
          .range(from, to);

        if (error) throw error;

        setKnowledge(data || []);
      } catch (error) {
        console.error('Error loading knowledge:', error);
      } finally {
        setLoading(false);
      }
    };

    loadKnowledge();
  }, [currentPage]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const categoryColors: Record<string, string> = {
    wyckoff: 'bg-blue-500/20 text-blue-300',
    halving: 'bg-purple-500/20 text-purple-300',
    etf: 'bg-green-500/20 text-green-300',
    liquidez: 'bg-yellow-500/20 text-yellow-300',
    gestao: 'bg-red-500/20 text-red-300',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Base de Conhecimento</h2>
          <p className="text-muted-foreground">Gerencie o conhecimento técnico do bot</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Conhecimento
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : knowledge.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum conhecimento encontrado</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {knowledge.map((item) => (
              <Card key={item.id} className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{item.topic}</CardTitle>
                      <CardDescription>{item.category}</CardDescription>
                    </div>
                    <Badge className={categoryColors[item.category] || 'bg-gray-500/20'}>
                      {item.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {item.content}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">
                        {item.usage_count} usos
                      </span>
                    </div>
                    {item.accuracy_score > 0 && (
                      <div className="text-muted-foreground">
                        Precisão: {(item.accuracy_score * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount} itens
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Mostrar primeira, última e páginas ao redor da atual
                      return page === 1 || 
                             page === totalPages || 
                             (page >= currentPage - 1 && page <= currentPage + 1);
                    })
                    .map((page, idx, arr) => (
                      <>
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span key={`ellipsis-${page}`} className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="min-w-[2.5rem]"
                        >
                          {page}
                        </Button>
                      </>
                    ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}