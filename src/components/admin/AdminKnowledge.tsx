import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, ChevronLeft, ChevronRight, Upload, FileText, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [uploading, setUploading] = useState(false);
  const itemsPerPage = 10;
  const { toast } = useToast();

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato não suportado",
        description: "Por favor, envie apenas arquivos PDF ou DOCX",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Criar FormData para enviar arquivo
      const formData = new FormData();
      formData.append('file', file);

      // Processar documento via Edge Function
      const { data, error } = await supabase.functions.invoke('process-document', {
        body: formData,
      });

      if (error) throw error;

      toast({
        title: "Upload concluído!",
        description: `Documento processado: ${data.chunksCreated} chunks criados`,
      });

      // Recarregar conhecimento
      setCurrentPage(1);
      const loadKnowledge = async () => {
        setLoading(true);
        try {
          const { count } = await supabase
            .from('bot_knowledge')
            .select('*', { count: 'exact', head: true });

          setTotalCount(count || 0);

          const { data: knowledgeData, error } = await supabase
            .from('bot_knowledge')
            .select('*')
            .order('usage_count', { ascending: false })
            .range(0, itemsPerPage - 1);

          if (error) throw error;
          setKnowledge(knowledgeData || []);
        } catch (error) {
          console.error('Error loading knowledge:', error);
        } finally {
          setLoading(false);
        }
      };
      await loadKnowledge();

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível processar o documento",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Limpar input
      event.target.value = '';
    }
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()} disabled={uploading}>
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? 'Processando...' : 'Upload PDF/DOCX'}
          </Button>
          <input
            id="file-upload"
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Manual
          </Button>
        </div>
      </div>

      {/* Formatos Suportados */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <File className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-1">Formatos Suportados</p>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-red-500/10 text-red-300 border-red-500/30">
                  <FileText className="h-3 w-3 mr-1" />
                  PDF
                </Badge>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30">
                  <FileText className="h-3 w-3 mr-1" />
                  DOCX
                </Badge>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30">
                  <FileText className="h-3 w-3 mr-1" />
                  DOC
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Os documentos serão automaticamente processados e indexados para uso pelo TradeVision IA
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {uploading && (
        <Card className="bg-blue-500/10 border-blue-500/30 animate-pulse">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
              <div>
                <p className="text-sm font-medium text-blue-300">Processando documento...</p>
                <p className="text-xs text-blue-400">Extraindo e indexando conteúdo automaticamente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : knowledge.length === 0 ? (
        <Card className="bg-card/30 border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">Nenhum conhecimento encontrado</p>
            <p className="text-sm text-muted-foreground">Faça upload de um PDF ou DOCX para começar</p>
          </CardContent>
        </Card>
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
                      <React.Fragment key={page}>
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="min-w-[2.5rem]"
                        >
                          {page}
                        </Button>
                      </React.Fragment>
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
};