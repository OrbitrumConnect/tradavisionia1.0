import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminChat } from '@/components/admin/AdminChat';
import { AdminKnowledge } from '@/components/admin/AdminKnowledge';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { AdminBuilder } from '@/components/admin/AdminBuilder';
import { IntegratedThreeChats } from '@/components/admin/IntegratedThreeChats';
import { RealLearningSystem } from '@/components/admin/RealLearningSystem';
import { AgentAnalysis } from '@/components/admin/AgentAnalysis';
import { useMultiExchangeData } from '@/hooks/useMultiExchangeData';
import { useTechnicalIndicators } from '@/hooks/useTechnicalIndicators';
import { usePatternDetection } from '@/hooks/usePatternDetection';
import { Loader2 } from 'lucide-react';

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'chat' | 'knowledge' | 'analytics' | 'builder' | 'threechats' | 'learning' | 'agentanalysis'>('dashboard');
  const [isChatsSidebarOpen, setIsChatsSidebarOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState('3m');

  // Dados de mercado para compartilhar entre componentes
  const { liveData, candles, loading } = useMultiExchangeData('binance', selectedSymbol, selectedTimeframe);
  
  // Formatar candles para os hooks
  const formattedCandles = candles?.map(c => ({
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
    timestamp: c.time
  })) || [];
  
  const technicalIndicators = useTechnicalIndicators(formattedCandles);
  const patterns = usePatternDetection(formattedCandles);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      try {
        // Verificar se usuário é admin
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) {
          console.error('Error checking admin status:', error);
          navigate('/');
          return;
        }

        if (!data) {
          // Usuário não é admin
          navigate('/');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Error:', error);
        navigate('/');
      } finally {
        setAdminLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, navigate]);

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-dark">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-dark">
        <AdminSidebar 
          activeView={activeView} 
          setActiveView={setActiveView} 
          selectedSymbol={selectedSymbol}
        />
        
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border bg-card/50 backdrop-blur-lg flex items-center px-4">
            <SidebarTrigger />
            <h1 className="ml-4 text-lg font-semibold text-foreground">
              Admin Dashboard - TradeVision IA
            </h1>
          </header>

          <main className="flex-1 overflow-auto p-6">
            {activeView === 'dashboard' && <AdminDashboard />}
            {activeView === 'chat' && <AdminChat />}
            {activeView === 'agentanalysis' && (
              <AgentAnalysis 
                selectedSymbol={selectedSymbol}
                liveData={liveData}
                candles={formattedCandles}
                technicalIndicators={technicalIndicators}
                patterns={patterns}
              />
            )}
            {activeView === 'knowledge' && <AdminKnowledge />}
            {activeView === 'analytics' && <AdminAnalytics />}
            {activeView === 'builder' && <AdminBuilder />}
            {activeView === 'threechats' && <IntegratedThreeChats symbol={selectedSymbol} />}
            {activeView === 'learning' && <RealLearningSystem />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;