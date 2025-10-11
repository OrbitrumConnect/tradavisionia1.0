import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { LayoutDashboard, MessageSquare, Brain, BarChart3, LogOut, Wrench, Home, Bot } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { SimpleChatFlow } from './SimpleChatFlow';

interface AdminSidebarProps {
  activeView: string;
  setActiveView: (view: 'dashboard' | 'chat' | 'knowledge' | 'analytics' | 'builder' | 'chatflow' | 'learning') => void;
  selectedSymbol?: string;
}

export function AdminSidebar({ activeView, setActiveView, selectedSymbol = 'BTC/USDT' }: AdminSidebarProps) {
  const { state } = useSidebar();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const collapsed = state === 'collapsed';
  const [isChatsOpen, setIsChatsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', title: 'Agente TradeVision', icon: MessageSquare },
    { id: 'knowledge', title: 'Base de Conhecimento', icon: Brain },
    { id: 'analytics', title: 'Analytics', icon: BarChart3 },
    { id: 'builder', title: 'IA Builder', icon: Wrench },
    { id: 'chatflow', title: 'Chat Flow', icon: MessageSquare },
    { id: 'learning', title: 'Sistema de Aprendizado', icon: Brain },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-64"}
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "text-center" : ""}>
            {!collapsed && "Admin Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleGoHome} className="text-primary">
                  <Home className={collapsed ? "" : "mr-2 h-4 w-4"} />
                  {!collapsed && <span>Voltar ao Dashboard</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setActiveView(item.id as any)}
                    className={activeView === item.id ? "bg-primary/10 text-primary" : ""}
                  >
                    <item.icon className={collapsed ? "" : "mr-2 h-4 w-4"} />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut} className="text-destructive">
                  <LogOut className={collapsed ? "" : "mr-2 h-4 w-4"} />
                  {!collapsed && <span>Sair</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}