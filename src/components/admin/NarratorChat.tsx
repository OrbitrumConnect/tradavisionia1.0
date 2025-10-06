import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Bot, 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Zap,
  RefreshCw,
  Play,
  Pause,
  Settings
} from 'lucide-react';

interface NarratorMessage {
  id: string;
  timestamp: string;
  symbol: string;
  pattern_detected: string | null;
  narrator_text: string;
  confidence_score: number;
  indicators: any;
  market_data: any;
  processed_flag: boolean;
}

interface NarratorChatProps {
  symbol: string;
  onMessageGenerated?: (message: NarratorMessage) => void;
}

export const NarratorChat = ({ symbol, onMessageGenerated }: NarratorChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<NarratorMessage[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastProcessedId, setLastProcessedId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Carregar mensagens existentes
  useEffect(() => {
    loadExistingMessages();
  }, [symbol]);

  // Escutar novas mensagens em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('narrator_output')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'narrator_output',
          filter: `symbol=eq.${symbol}`
        }, 
        (payload) => {
          console.log('🔄 Nova mensagem do narrador:', payload.new);
          const newMessage = payload.new as NarratorMessage;
          setMessages(prev => [newMessage, ...prev]);
          onMessageGenerated?.(newMessage);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [symbol, onMessageGenerated]);

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
  }, [messages]);

  const loadExistingMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('narrator_output')
        .select('*')
        .eq('symbol', symbol)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = () => {
    setIsActive(!isActive);
  };

  const handleRefresh = () => {
    loadExistingMessages();
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 80) return 'bg-green-500/20 text-green-400';
    if (score >= 60) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  const getPatternIcon = (pattern: string | null) => {
    if (!pattern) return <Target className="h-4 w-4" />;
    
    const patternLower = pattern.toLowerCase();
    if (patternLower.includes('bullish') || patternLower.includes('spring')) {
      return <TrendingUp className="h-4 w-4 text-green-400" />;
    }
    if (patternLower.includes('bearish') || patternLower.includes('upthrust')) {
      return <TrendingDown className="h-4 w-4 text-red-400" />;
    }
    return <Target className="h-4 w-4" />;
  };

  return (
    <Card className="h-full bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-400" />
            Narrador IA
            <Badge variant="outline" className="text-xs">
              {symbol}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleToggleActive}
              size="sm"
              className={isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isActive ? 'Pausar' : 'Ativar'}
            </Button>
            <Button
              onClick={handleRefresh}
              size="sm"
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
            {isActive ? 'Ativo' : 'Inativo'}
          </div>
          <div>{messages.length} mensagens</div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea ref={scrollAreaRef} className="h-96 px-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">Carregando mensagens...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Bot className="h-12 w-12 mb-4 opacity-50" />
              <p>Nenhuma mensagem do narrador ainda</p>
              <p className="text-sm">Ative o narrador para começar</p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="p-3 bg-slate-700 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getPatternIcon(message.pattern_detected)}
                      <span className="text-sm text-gray-400">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                      {message.pattern_detected && (
                        <Badge variant="outline" className="text-xs">
                          {message.pattern_detected}
                        </Badge>
                      )}
                    </div>
                    <Badge className={`text-xs ${getConfidenceBadge(message.confidence_score)}`}>
                      {message.confidence_score}%
                    </Badge>
                  </div>
                  
                  <div className="text-white text-sm leading-relaxed">
                    {message.narrator_text}
                  </div>
                  
                  {message.indicators && Object.keys(message.indicators).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-600">
                      <div className="text-xs text-gray-400 mb-1">Indicadores:</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(message.indicators).slice(0, 3).map(([key, value]) => (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key}: {typeof value === 'number' ? value.toFixed(2) : value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
