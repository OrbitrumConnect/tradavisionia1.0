import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from './use-toast';

/**
 * HOOK: useDecisionEngine
 * 
 * Orquestra o núcleo de decisão dinâmica do TradeVision IA
 * - Rotinas periódicas automáticas
 * - Memória contextual
 * - Prioridades e planejamento
 * - Processamento em background
 */

interface DecisionEngineState {
  isActive: boolean;
  lastMicroAnalysis: Date | null;
  lastMesoAnalysis: Date | null;
  lastMacroAnalysis: Date | null;
  recentInsights: any[];
  currentPriorities: any[];
  activePlans: any[];
  backgroundTasks: any[];
}

export function useDecisionEngine() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [state, setState] = useState<DecisionEngineState>({
    isActive: false,
    lastMicroAnalysis: null,
    lastMesoAnalysis: null,
    lastMacroAnalysis: null,
    recentInsights: [],
    currentPriorities: [],
    activePlans: [],
    backgroundTasks: []
  });

  const [isLoading, setIsLoading] = useState(false);

  // Refs para intervalos
  const microIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mesoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const macroIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // INICIALIZAÇÃO
  // ============================================================================

  /**
   * Inicia o núcleo de decisão dinâmica
   */
  const start = useCallback(async () => {
    if (!user) return;

    console.log('🧠 Iniciando Núcleo de Decisão Dinâmica...');
    setIsLoading(true);

    try {
      // 1. Inicia processamento em background
      await callDecisionEngine('start_background', {});

      // 2. Agenda rotinas periódicas
      scheduleMicroAnalysis();
      scheduleMesoAnalysis();
      scheduleMacroAnalysis();

      setState(prev => ({ ...prev, isActive: true }));

      toast({
        title: "🧠 Núcleo de Decisão Ativado",
        description: "O agente autônomo está pensando e planejando continuamente",
      });

    } catch (error) {
      console.error('Erro ao iniciar Decision Engine:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o núcleo de decisão",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  /**
   * Para o núcleo de decisão dinâmica
   */
  const stop = useCallback(() => {
    console.log('🛑 Parando Núcleo de Decisão Dinâmica...');

    // Limpa intervalos
    if (microIntervalRef.current) clearInterval(microIntervalRef.current);
    if (mesoIntervalRef.current) clearInterval(mesoIntervalRef.current);
    if (macroIntervalRef.current) clearInterval(macroIntervalRef.current);

    setState(prev => ({ ...prev, isActive: false }));

    toast({
      title: "Núcleo de Decisão Desativado",
      description: "O agente autônomo foi pausado",
    });
  }, [toast]);

  // ============================================================================
  // ROTINAS PERIÓDICAS
  // ============================================================================

  /**
   * Agenda micro-análise (5 minutos)
   */
  const scheduleMicroAnalysis = useCallback(() => {
    if (microIntervalRef.current) clearInterval(microIntervalRef.current);

    const runMicroAnalysis = async () => {
      console.log('🔍 Executando micro-análise...');
      
      try {
        const result = await callDecisionEngine('micro_analysis', {});
        
        setState(prev => ({
          ...prev,
          lastMicroAnalysis: new Date(),
          recentInsights: [...result.insights, ...prev.recentInsights].slice(0, 10)
        }));

        // Se há insights críticos, notifica usuário
        const criticalInsights = result.insights.filter((i: any) => i.priority === 'HIGH');
        if (criticalInsights.length > 0) {
          toast({
            title: "⚠️ Insight Crítico",
            description: criticalInsights[0].finding,
          });
        }

      } catch (error) {
        console.error('Erro na micro-análise:', error);
      }
    };

    // Executa imediatamente e depois a cada 5 minutos
    runMicroAnalysis();
    microIntervalRef.current = setInterval(runMicroAnalysis, 5 * 60 * 1000);
  }, [toast]);

  /**
   * Agenda meso-análise (1 hora)
   */
  const scheduleMesoAnalysis = useCallback(() => {
    if (mesoIntervalRef.current) clearInterval(mesoIntervalRef.current);

    const runMesoAnalysis = async () => {
      console.log('📊 Executando meso-análise...');
      
      try {
        const result = await callDecisionEngine('meso_analysis', {});
        
        setState(prev => ({
          ...prev,
          lastMesoAnalysis: new Date(),
          recentInsights: [...result.insights, ...prev.recentInsights].slice(0, 10)
        }));

        // Notifica descobertas de padrões
        if (result.patterns && result.patterns.length > 0) {
          toast({
            title: "🔍 Padrões Descobertos",
            description: `Encontrados ${result.patterns.length} padrões recorrentes`,
          });
        }

      } catch (error) {
        console.error('Erro na meso-análise:', error);
      }
    };

    // Executa após 10 minutos e depois a cada 1 hora
    setTimeout(() => {
      runMesoAnalysis();
      mesoIntervalRef.current = setInterval(runMesoAnalysis, 60 * 60 * 1000);
    }, 10 * 60 * 1000);
  }, [toast]);

  /**
   * Agenda macro-análise (24 horas)
   */
  const scheduleMacroAnalysis = useCallback(() => {
    if (macroIntervalRef.current) clearInterval(macroIntervalRef.current);

    const runMacroAnalysis = async () => {
      console.log('🌍 Executando macro-análise...');
      
      try {
        const result = await callDecisionEngine('macro_analysis', {});
        
        setState(prev => ({
          ...prev,
          lastMacroAnalysis: new Date()
        }));

        // Notifica relatório diário
        toast({
          title: "📊 Relatório Diário Gerado",
          description: "Análise completa das últimas 24 horas disponível",
        });

      } catch (error) {
        console.error('Erro na macro-análise:', error);
      }
    };

    // Executa à meia-noite e depois a cada 24 horas
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    setTimeout(() => {
      runMacroAnalysis();
      macroIntervalRef.current = setInterval(runMacroAnalysis, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }, [toast]);

  // ============================================================================
  // FUNÇÕES PÚBLICAS
  // ============================================================================

  /**
   * Força execução de análise específica
   */
  const runAnalysis = useCallback(async (type: 'micro' | 'meso' | 'macro') => {
    if (!user) return;

    const actionMap = {
      'micro': 'micro_analysis',
      'meso': 'meso_analysis',
      'macro': 'macro_analysis'
    };

    try {
      const result = await callDecisionEngine(actionMap[type], {});
      
      toast({
        title: `${type === 'micro' ? '🔍' : type === 'meso' ? '📊' : '🌍'} Análise Concluída`,
        description: `${result.insights?.length || 0} insights gerados`,
      });

      return result;
    } catch (error) {
      console.error(`Erro na ${type}-análise:`, error);
      throw error;
    }
  }, [user, toast]);

  /**
   * Busca insights recentes
   */
  const getInsights = useCallback(async (limit: number = 10) => {
    if (!user) return [];

    try {
      const { data } = await supabase
        .from('agent_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('discovered_at', { ascending: false })
        .limit(limit);

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar insights:', error);
      return [];
    }
  }, [user]);

  /**
   * Busca prioridades atuais
   */
  const getPriorities = useCallback(async () => {
    if (!user) return [];

    try {
      const { data } = await supabase
        .from('agent_priorities')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('priority_score', { ascending: false })
        .limit(10);

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar prioridades:', error);
      return [];
    }
  }, [user]);

  /**
   * Busca planos ativos
   */
  const getActivePlans = useCallback(async () => {
    if (!user) return [];

    try {
      const { data } = await supabase
        .from('agent_actions_plan')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      return [];
    }
  }, [user]);

  /**
   * Busca contexto do agente
   */
  const getAgentContext = useCallback(async () => {
    if (!user) return null;

    try {
      const { data } = await supabase
        .from('agent_context')
        .select('*')
        .eq('user_id', user.id)
        .single();

      return data;
    } catch (error) {
      console.error('Erro ao buscar contexto do agente:', error);
      return null;
    }
  }, [user]);

  /**
   * Busca tarefas de background
   */
  const getBackgroundTasks = useCallback(async () => {
    if (!user) return [];

    try {
      const { data } = await supabase
        .from('agent_background_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar tarefas de background:', error);
      return [];
    }
  }, [user]);

  /**
   * Adiciona insight manualmente ao feedback loop
   */
  const submitInsightFeedback = useCallback(async (insightId: string, rating: number, notes?: string) => {
    if (!user) return;

    try {
      await supabase
        .from('agent_insights')
        .update({
          user_feedback: rating,
          validated: rating >= 4,
          validation_score: rating / 5,
          action_taken: true
        })
        .eq('id', insightId);

      toast({
        title: "Feedback Enviado",
        description: "O agente vai aprender com sua avaliação",
      });
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
    }
  }, [user, toast]);

  // ============================================================================
  // REALTIME SUBSCRIPTIONS
  // ============================================================================

  useEffect(() => {
    if (!user) return;

    // Subscreve a insights novos
    const insightsSubscription = supabase
      .channel('agent-insights')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_insights',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newInsight = payload.new;
          
          setState(prev => ({
            ...prev,
            recentInsights: [newInsight, ...prev.recentInsights].slice(0, 10)
          }));

          // Notifica apenas insights importantes
          if (newInsight.confidence > 0.7) {
            toast({
              title: `💡 ${newInsight.title}`,
              description: newInsight.description,
            });
          }
        }
      )
      .subscribe();

    return () => {
      insightsSubscription.unsubscribe();
    };
  }, [user, toast]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (microIntervalRef.current) clearInterval(microIntervalRef.current);
      if (mesoIntervalRef.current) clearInterval(mesoIntervalRef.current);
      if (macroIntervalRef.current) clearInterval(macroIntervalRef.current);
    };
  }, []);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  async function callDecisionEngine(action: string, params: any) {
    const { data, error } = await supabase.functions.invoke('decision-engine', {
      body: { action, params }
    });

    if (error) throw error;
    return data.result;
  }

  // ============================================================================
  // RETORNO
  // ============================================================================

  return {
    // Estado
    isActive: state.isActive,
    isLoading,
    lastMicroAnalysis: state.lastMicroAnalysis,
    lastMesoAnalysis: state.lastMesoAnalysis,
    lastMacroAnalysis: state.lastMacroAnalysis,
    recentInsights: state.recentInsights,

    // Ações
    start,
    stop,
    runAnalysis,

    // Queries
    getInsights,
    getPriorities,
    getActivePlans,
    getAgentContext,
    getBackgroundTasks,
    
    // Feedback
    submitInsightFeedback
  };
}

