import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Signal {
  id: string;
  signal_type: string;
  pattern: string;
  probability: number;
  price: string;
  created_at: string;
  metadata?: {
    validated?: boolean;
    was_accurate?: boolean;
    price_change_percent?: number;
  };
}

interface SignalFeedbackProps {
  signal: Signal;
  onFeedbackSubmitted?: () => void;
}

export const SignalFeedback = ({ signal, onFeedbackSubmitted }: SignalFeedbackProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleFeedback = async (wasAccurate: boolean) => {
    if (!user) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('narrator_feedback')
        .insert({
          signal_id: signal.id,
          user_id: user.id,
          was_accurate: wasAccurate,
          rating: wasAccurate ? 5 : 2,
          notes: `Feedback manual do usuário`
        });

      if (error) throw error;

      toast({
        title: "✅ Feedback registrado!",
        description: "O Narrador está aprendendo com seu feedback",
      });

      onFeedbackSubmitted?.();
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      toast({
        title: "Erro ao enviar feedback",
        description: "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isValidated = signal.metadata?.validated;
  const wasAccurate = signal.metadata?.was_accurate;
  const priceChange = signal.metadata?.price_change_percent;

  return (
    <Card className="border-border/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge 
              variant={
                signal.signal_type === 'BUY' ? 'default' :
                signal.signal_type === 'SELL' ? 'destructive' : 'secondary'
              }
              className="text-xs"
            >
              {signal.signal_type === 'BUY' && <TrendingUp className="w-3 h-3 mr-1" />}
              {signal.signal_type === 'SELL' && <TrendingDown className="w-3 h-3 mr-1" />}
              {(signal.signal_type === 'NEUTRAL' || signal.signal_type === 'WAIT') && <Minus className="w-3 h-3 mr-1" />}
              {signal.signal_type}
            </Badge>
            <span className="text-sm font-medium">{signal.pattern}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(signal.created_at).toLocaleString('pt-BR')}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-muted-foreground">Probabilidade:</span>
            <span className="ml-2 font-bold">{signal.probability}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Preço:</span>
            <span className="ml-2 font-mono">${parseFloat(signal.price).toFixed(2)}</span>
          </div>
        </div>

        {isValidated && (
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Auto-validação:</span>
              <div className="flex items-center gap-2">
                {wasAccurate ? (
                  <Badge variant="default" className="bg-success text-xs">
                    ✅ Acertou
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    ❌ Errou
                  </Badge>
                )}
                {priceChange !== undefined && (
                  <span className={`text-xs font-mono ${priceChange > 0 ? 'text-success' : 'text-danger'}`}>
                    {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {!isValidated && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-success/30 hover:bg-success/10"
              onClick={() => handleFeedback(true)}
              disabled={submitting}
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              Acertou
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-danger/30 hover:bg-danger/10"
              onClick={() => handleFeedback(false)}
              disabled={submitting}
            >
              <ThumbsDown className="w-4 h-4 mr-1" />
              Errou
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};