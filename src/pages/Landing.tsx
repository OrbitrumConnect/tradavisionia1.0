import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain, TrendingUp, Shield, Zap, Upload, BarChart3, Target, Volume2, Check } from 'lucide-react';
import heroImage from '@/assets/hero-trading.jpg';

interface LandingProps {
  onLogin: () => void;
}

const Landing = ({ onLogin }: LandingProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">TradeVision AI</h1>
          </div>
          
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Entrar
            </Button>
            <Button variant="hero" onClick={() => navigate('/auth')}>
              Cadastrar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="AI Trading Platform" 
            className="w-full h-full object-cover animate-pulse-sophisticated"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/50 to-transparent" />
        </div>
        
        <div className="relative container mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-slide-up">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium">
                  <Zap className="h-4 w-4" />
                  Análise Inteligente de Trading
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
                    TradeVision AI
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Analise gráficos por print, receba sinais inteligentes com probabilidade, risco, stop, TP e gestão financeira do seu capital — 100% consultivo, sem executar trades.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-success">
                  <Check className="h-5 w-5" />
                  <span>Multi-feed em tempo real</span>
                </div>
                <div className="flex items-center gap-2 text-success">
                  <Check className="h-5 w-5" />
                  <span>IA com 70%+ precisão</span>
                </div>
                <div className="flex items-center gap-2 text-success">
                  <Check className="h-5 w-5" />
                  <span>Gestão de risco avançada</span>
                </div>
              </div>

              <div className="flex gap-4">
                <Button size="xl" variant="hero" className="animate-pulse-ultra-slow" onClick={() => navigate('/auth')}>
                  Começar Agora - R$ 14,90/mês
                </Button>
                <Button size="xl" variant="outline" onClick={() => navigate('/auth')}>
                  Ver Demo Gratuita
                </Button>
              </div>
            </div>

            {/* Auth Form */}
            <div className="lg:ml-auto">
              <Card className="w-full min-w-[460px] max-w-[460px] bg-card/80 backdrop-blur-lg border-border/50 shadow-glow">
                <CardContent className="p-6 space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold">{isLogin ? 'Entrar' : 'Cadastrar'}</h3>
                    <p className="text-muted-foreground">
                      {isLogin ? 'Acesse sua conta' : 'Crie sua conta premium'}
                    </p>
                  </div>

                  <form onSubmit={handleAuth} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email"
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input 
                        id="password"
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    <Button type="submit" variant="hero" size="lg" className="w-full">
                      {isLogin ? 'Entrar no Dashboard' : 'Criar Conta Premium'}
                    </Button>
                  </form>

                  <div className="text-center">
                    <button 
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-primary hover:text-primary-glow transition-colors"
                    >
                      {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold">Funcionalidades Avançadas</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tecnologia de ponta para análise precisa de mercado
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="bg-card/50 border-border/50 hover:shadow-glow transition-all duration-300 hover:-translate-y-2">
              <CardContent className="p-6 text-center space-y-4">
                <div className="p-3 bg-gradient-primary rounded-lg w-fit mx-auto">
                  <Upload className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Upload de Print</h3>
                <p className="text-muted-foreground">
                  Análise instantânea de gráficos via OCR e Computer Vision
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 hover:shadow-glow transition-all duration-300 hover:-translate-y-2">
              <CardContent className="p-6 text-center space-y-4">
                <div className="p-3 bg-gradient-success rounded-lg w-fit mx-auto">
                  <Brain className="h-8 w-8 text-success-foreground" />
                </div>
                <h3 className="text-xl font-semibold">IA Avançada</h3>
                <p className="text-muted-foreground">
                  Machine Learning com 70%+ de precisão em sinais
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 hover:shadow-glow transition-all duration-300 hover:-translate-y-2">
              <CardContent className="p-6 text-center space-y-4">
                <div className="p-3 bg-gradient-danger rounded-lg w-fit mx-auto">
                  <Shield className="h-8 w-8 text-danger-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Gestão de Risco</h3>
                <p className="text-muted-foreground">
                  Cálculo automático de stop, TP e gestão do capital
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 hover:shadow-glow transition-all duration-300 hover:-translate-y-2">
              <CardContent className="p-6 text-center space-y-4">
                <div className="p-3 bg-primary/20 rounded-lg w-fit mx-auto">
                  <Volume2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Narrador Inteligente</h3>
                <p className="text-muted-foreground">
                  Sinais consolidados a cada 30s com TTS em português
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold">Planos Simples</h2>
            <p className="text-xl text-muted-foreground">
              Escolha o plano ideal para seu perfil de trader
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Plano Free</h3>
                  <p className="text-muted-foreground">Para conhecer a plataforma</p>
                  <div className="text-3xl font-bold">Gratuito</div>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>Visualização da plataforma</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>Interface completa (somente visualização)</span>
                  </li>
                  <li className="flex items-center gap-3 opacity-50">
                    <div className="h-5 w-5 rounded-full border-2 border-muted" />
                    <span>Upload de prints</span>
                  </li>
                  <li className="flex items-center gap-3 opacity-50">
                    <div className="h-5 w-5 rounded-full border-2 border-muted" />
                    <span>Sinais IA</span>
                  </li>
                </ul>

                <Button variant="outline" size="lg" className="w-full" onClick={() => navigate('/auth')}>
                  Começar Grátis
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="bg-gradient-hero border-primary/50 shadow-glow relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-warning text-warning-foreground px-3 py-1 rounded-full text-sm font-semibold">
                Mais Popular
              </div>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Plano Premium</h3>
                  <p className="text-foreground/80">Acesso completo à plataforma</p>
                  <div className="text-3xl font-bold">R$ 14,90<span className="text-lg font-normal">/mês</span></div>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>Upload e análise de prints</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>Sinais ML + probabilidade</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>Narrador inteligente (30s)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>Gestão financeira completa</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>Multi-feed em tempo real</span>
                  </li>
                </ul>

                <Button variant="hero" size="lg" className="w-full" onClick={() => navigate('/auth')}>
                  Assinar Premium
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Brain className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">TradeVision AI</span>
            </div>
            
            <p className="text-muted-foreground text-center">
              © 2024 TradeVision AI. Plataforma 100% consultiva - não executamos trades.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;