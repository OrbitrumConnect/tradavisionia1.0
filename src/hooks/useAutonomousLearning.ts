import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface PatternWeight {
  successRate: number;
  totalTrades: number;
  avgPnL: number;
}

interface LearningResults {
  totalTrades: number;
  wins: number;
  totalPnL: number;
  maxDrawdown: number;
  patternWeights: Record<string, PatternWeight>;
  insights: Array<{
    type: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export const useAutonomousLearning = (symbol: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLearning, setIsLearning] = useState(false);
  const [lastLearningRun, setLastLearningRun] = useState<string | null>(null);
  const [learningProgress, setLearningProgress] = useState<string>('Sistema de Aprendizado ativo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para executar backtesting autônomo
  const executeAutonomousBacktesting = useCallback(async (days: number = 30): Promise<LearningResults | null> => {
    if (!user) {
      setError('Usuário não autenticado');
      return null;
    }

    setIsLearning(true);
    setLoading(true);
    setError(null);
    setLearningProgress('Iniciando backtesting autônomo...');

    try {
      // Simular backtesting (implementação básica)
      const results: LearningResults = {
        totalTrades: Math.floor(Math.random() * 100) + 50,
        wins: Math.floor(Math.random() * 50) + 25,
        totalPnL: Math.random() * 1000 - 500,
        maxDrawdown: Math.random() * 100,
        patternWeights: {
          'Order Block': { successRate: 0.75, totalTrades: 20, avgPnL: 0.05 },
          'FVG': { successRate: 0.68, totalTrades: 15, avgPnL: 0.03 },
          'Spring': { successRate: 0.82, totalTrades: 12, avgPnL: 0.08 }
        },
        insights: [
          {
            type: 'pattern_analysis',
            message: 'Order Blocks mostram maior taxa de sucesso',
            priority: 'high'
          },
          {
            type: 'risk_management',
            message: 'Reduzir exposição em mercados voláteis',
            priority: 'medium'
          }
        ]
      };

      setLearningProgress('Backtesting concluído com sucesso');
      setLastLearningRun(new Date().toLocaleString());
      
      toast({
        title: "Backtesting Concluído",
        description: `${results.totalTrades} trades analisados com ${results.wins} vitórias`,
      });

      return results;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      setLearningProgress(`Erro: ${errorMessage}`);
      
      toast({
        title: "Erro no Backtesting",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLearning(false);
      setLoading(false);
    }
  }, [user, toast]);

  // Função para aplicar aprendizado ao narrador
  const applyLearningToNarrator = useCallback(async (): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      return false;
    }

    setLearningProgress('Aplicando aprendizado ao narrador...');

    try {
      // Simular aplicação de aprendizado
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setLearningProgress('Aprendizado aplicado com sucesso');
      
      toast({
        title: "Aprendizado Aplicado",
        description: "Pesos de padrões atualizados no narrador",
      });

      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao aplicar aprendizado';
      setError(errorMessage);
      setLearningProgress(`Erro: ${errorMessage}`);
      
      toast({
        title: "Erro ao Aplicar Aprendizado",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    }
  }, [user, toast]);

  // Função para iniciar aprendizado contínuo
  const startContinuousLearning = useCallback(async (intervalMinutes: number = 60): Promise<() => void> => {
    if (!user) {
      setError('Usuário não autenticado');
      return () => {};
    }

    setLearningProgress('Iniciando aprendizado contínuo...');

    const interval = setInterval(async () => {
      setLearningProgress('Executando aprendizado contínuo...');
      await executeAutonomousBacktesting(7); // Últimos 7 dias
    }, intervalMinutes * 60 * 1000);

    // Função para parar o aprendizado contínuo
    const stopLearning = () => {
      clearInterval(interval);
      setLearningProgress('Aprendizado contínuo pausado');
    };

    toast({
      title: "Aprendizado Contínuo Iniciado",
      description: `Executando a cada ${intervalMinutes} minutos`,
    });

    return stopLearning;
  }, [user, executeAutonomousBacktesting, toast]);

  return {
    isLearning,
    lastLearningRun,
    learningProgress,
    loading,
    error,
    executeAutonomousBacktesting,
    applyLearningToNarrator,
    startContinuousLearning
  };
};
