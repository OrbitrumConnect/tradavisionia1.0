import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Conversation {
  id: string;
  title: string;
  summary: string | null;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

interface ConversationsSidebarProps {
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
}

export function ConversationsSidebar({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationsSidebarProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, [user, currentConversationId]); // Recarregar quando mudar a conversa atual

  const loadConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('🔍 Carregando conversas para usuário:', user.id);
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar conversas:', error);
        throw error;
      }

      console.log('✅ Conversas encontradas:', data?.length || 0);

      // Buscar contagem de mensagens para cada conversa
      const conversationsWithCount = await Promise.all(
        (data || []).map(async (conv) => {
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);

          return {
            ...conv,
            message_count: count || 0,
          };
        })
      );

      console.log('📊 Conversas com contagem:', conversationsWithCount);
      setConversations(conversationsWithCount);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      toast.error('Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      toast.success('Conversa excluída');
      loadConversations();
      
      if (currentConversationId === conversationId) {
        onNewConversation();
      }
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      toast.error('Erro ao excluir conversa');
    }
  };

  return (
    <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-4 w-4" />
            Conversas
          </CardTitle>
          <Button
            onClick={onNewConversation}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-280px)]">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma conversa ainda.
              <br />
              Clique em "Nova" para começar!
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-colors border ${
                    currentConversationId === conv.id
                      ? 'bg-primary/10 border-primary/50'
                      : 'hover:bg-muted border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {conv.title}
                      </p>
                      {conv.summary && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {conv.summary}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {conv.message_count} msgs
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(conv.updated_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={(e) => deleteConversation(conv.id, e)}
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
