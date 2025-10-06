import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  MessageSquare, 
  Bot, 
  Brain, 
  Zap,
  Play,
  Pause,
  Settings,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target
} from 'lucide-react';
import { NarratorChat } from './NarratorChat';
import { AgentChat } from './AgentChat';
import { MetaChat } from './MetaChat';

interface ThreeChatsSidebarProps {
  symbol: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ThreeChatsSidebar = ({ symbol, isOpen, onOpenChange }: ThreeChatsSidebarProps) => {
  const [activeTab, setActiveTab] = useState('narrator');
  const [narratorActive, setNarratorActive] = useState(false);
  const [agentActive, setAgentActive] = useState(false);
  const [metaActive, setMetaActive] = useState(false);

  const handleNarratorMessage = (message: any) => {
    console.log('📝 Mensagem do narrador recebida:', message);
    // O agente será notificado automaticamente via WebSocket
  };

  const handleAgentInsight = (insight: any) => {
    console.log('🧠 Insight do agente recebido:', insight);
    // O meta chat será notificado automaticamente via WebSocket
  };

  const handleMetaConsolidation = (consolidation: any) => {
    console.log('🔄 Consolidação do meta chat recebida:', consolidation);
    // Aqui pode disparar backtesting ou outras ações
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Ativo' : 'Inativo';
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
          <MessageSquare className="h-4 w-4 mr-2" />
          Sistema de Chats
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full max-w-6xl bg-slate-900 border-slate-700">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-400" />
            Sistema de Chats Inteligentes
            <Badge variant="outline" className="text-xs">
              {symbol}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {/* Status dos Chats */}
          <Card className="mb-4 bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Status dos Chats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(narratorActive)}`}></div>
                  <span className="text-sm text-gray-400">Narrador</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(agentActive)}`}></div>
                  <span className="text-sm text-gray-400">Agente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(metaActive)}`}></div>
                  <span className="text-sm text-gray-400">Meta Chat</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs dos Chats */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-700">
              <TabsTrigger value="narrator" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Narrador IA
              </TabsTrigger>
              <TabsTrigger value="agent" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Agente IA
              </TabsTrigger>
              <TabsTrigger value="meta" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Meta Chat
              </TabsTrigger>
            </TabsList>

            {/* Tab: Narrador IA */}
            <TabsContent value="narrator" className="mt-4">
              <div className="h-96">
                <NarratorChat 
                  symbol={symbol} 
                  onMessageGenerated={handleNarratorMessage}
                />
              </div>
            </TabsContent>

            {/* Tab: Agente IA */}
            <TabsContent value="agent" className="mt-4">
              <div className="h-96">
                <AgentChat 
                  symbol={symbol} 
                  onInsightGenerated={handleAgentInsight}
                />
              </div>
            </TabsContent>

            {/* Tab: Meta Chat */}
            <TabsContent value="meta" className="mt-4">
              <div className="h-96">
                <MetaChat 
                  symbol={symbol} 
                  onConsolidationComplete={handleMetaConsolidation}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Controles Globais */}
          <Card className="mt-4 bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Controles Globais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => {
                    setNarratorActive(!narratorActive);
                    setAgentActive(!agentActive);
                    setMetaActive(!metaActive);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {narratorActive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {narratorActive ? 'Pausar Todos' : 'Ativar Todos'}
                </Button>
                <Button
                  onClick={() => {
                    setNarratorActive(false);
                    setAgentActive(false);
                    setMetaActive(false);
                  }}
                  variant="outline"
                  className="border-red-500 text-red-400 hover:bg-red-500/10"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Parar Todos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card className="mt-4 bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Estatísticas do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">3</div>
                  <div className="text-sm text-gray-400">Chats Ativos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">Real-time</div>
                  <div className="text-sm text-gray-400">Comunicação</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};
