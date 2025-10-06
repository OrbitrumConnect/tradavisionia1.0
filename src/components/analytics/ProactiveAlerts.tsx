import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProactiveAlert {
  id: string;
  alert_type: string;
  message: string;
  trigger_condition: any;
  triggered_at: string;
  acknowledged: boolean;
  metadata: any;
}

export const ProactiveAlerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<ProactiveAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    loadAlerts();
    
    // Realtime subscription para novos alertas
    const channel = supabase
      .channel('proactive-alerts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'proactive_alerts',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newAlert = payload.new as ProactiveAlert;
          setAlerts(prev => [newAlert, ...prev]);
          
          // Mostrar toast de notificação
          toast.info('🔔 Novo Alerta!', {
            description: newAlert.message,
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadAlerts = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('proactive_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('triggered_at', { ascending: false })
      .limit(30);

    if (error) {
      console.error('Erro ao carregar alertas:', error);
    } else {
      setAlerts(data || []);
    }
    setLoading(false);
  };

  const acknowledgeAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('proactive_alerts')
      .update({ acknowledged: true })
      .eq('id', alertId);

    if (error) {
      toast.error('Erro ao marcar alerta');
      console.error(error);
    } else {
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId ? { ...alert, acknowledged: true } : alert
        )
      );
      toast.success('Alerta marcado como lido');
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'price':
        return '💰';
      case 'volume':
        return '📊';
      case 'pattern':
        return '🎯';
      case 'fear_greed':
        return '😱';
      default:
        return '🔔';
    }
  };

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Alertas Proativos
            {unacknowledgedCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unacknowledgedCount}
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8">
            <BellOff className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Nenhum alerta recebido ainda</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border transition-all ${
                  alert.acknowledged
                    ? 'bg-background/20 border-border/30 opacity-60'
                    : 'bg-background/50 border-primary/50 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getAlertIcon(alert.alert_type)}</span>
                      <Badge variant={alert.acknowledged ? 'secondary' : 'default'}>
                        {alert.alert_type}
                      </Badge>
                      {!alert.acknowledged && (
                        <Badge variant="destructive" className="text-xs">Novo</Badge>
                      )}
                    </div>
                    
                    <p className="text-sm mb-2">{alert.message}</p>
                    
                    {alert.metadata?.high && alert.metadata?.low && (
                      <div className="flex gap-4 mb-2 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Máxima:</span>
                          <span className="font-semibold text-green-500">
                            ${parseFloat(alert.metadata.high).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Mínima:</span>
                          <span className="font-semibold text-red-500">
                            ${parseFloat(alert.metadata.low).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      {new Date(alert.triggered_at).toLocaleString('pt-BR')}
                    </div>
                  </div>

                  {!alert.acknowledged && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
