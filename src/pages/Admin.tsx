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
import { ChatFlowView } from '@/components/admin/ChatFlowView';
import { RealLearningSystem } from '@/components/admin/RealLearningSystem';
import { Loader2 } from 'lucide-react';

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'chat' | 'knowledge' | 'analytics' | 'builder' | 'chatflow' | 'learning'>('dashboard');
  const [isChatsSidebarOpen, setIsChatsSidebarOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');

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
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, navigate]);

  if (loading) {
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
            {activeView === 'knowledge' && <AdminKnowledge />}
            {activeView === 'analytics' && <AdminAnalytics />}
            {activeView === 'builder' && <AdminBuilder />}
            {activeView === 'chatflow' && <ChatFlowView symbol={selectedSymbol} />}
            {activeView === 'learning' && <RealLearningSystem />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;