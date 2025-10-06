import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import heroImage from '@/assets/hero-trading.jpg';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signUp, signIn, user } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (!error) {
          navigate('/');
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (!error) {
          // For signup, user gets notification to check email
          setEmail('');
          setPassword('');
          setFullName('');
          setIsLogin(true); // Switch to login mode
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={goBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">TradeVision AI</h1>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant={isLogin ? "default" : "ghost"} 
              onClick={() => setIsLogin(true)}
              disabled={loading}
            >
              Entrar
            </Button>
            <Button 
              variant={!isLogin ? "hero" : "ghost"} 
              onClick={() => setIsLogin(false)}
              disabled={loading}
            >
              Cadastrar
            </Button>
          </div>
        </div>
      </header>

      {/* Auth Section */}
      <section className="relative overflow-hidden min-h-[calc(100vh-88px)]">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="AI Trading Platform" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/60 to-background/80" />
        </div>
        
        <div className="relative container mx-auto px-4 py-20">
          <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <Card className="w-full max-w-md bg-card/90 backdrop-blur-lg border-border/50 shadow-glow">
              <CardContent className="p-8 space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold">
                    {isLogin ? 'Entrar na Plataforma' : 'Criar Conta Premium'}
                  </h2>
                  <p className="text-muted-foreground">
                    {isLogin 
                      ? 'Acesse seu dashboard de trading' 
                      : 'Comece a usar nossa IA avançada'
                    }
                  </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nome Completo</Label>
                      <Input 
                        id="fullName"
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Seu nome completo"
                        required={!isLogin}
                        disabled={loading}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email"
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      disabled={loading}
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
                      disabled={loading}
                      minLength={6}
                    />
                    {!isLogin && (
                      <p className="text-xs text-muted-foreground">
                        Mínimo de 6 caracteres
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    variant="hero" 
                    size="lg" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isLogin ? 'Entrando...' : 'Criando conta...'}
                      </>
                    ) : (
                      isLogin ? 'Entrar no Dashboard' : 'Criar Conta Premium'
                    )}
                  </Button>
                </form>

                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setEmail('');
                      setPassword('');
                      setFullName('');
                    }}
                    className="text-primary hover:text-primary-glow transition-colors"
                    disabled={loading}
                  >
                    {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
                  </button>
                </div>

                {!isLogin && (
                  <div className="space-y-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <h4 className="font-semibold text-sm">Incluso no plano Premium:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-success">
                        <Check className="h-4 w-4" />
                        <span>Upload e análise de prints</span>
                      </div>
                      <div className="flex items-center gap-2 text-success">
                        <Check className="h-4 w-4" />
                        <span>Sinais ML + probabilidade</span>
                      </div>
                      <div className="flex items-center gap-2 text-success">
                        <Check className="h-4 w-4" />
                        <span>Narrador inteligente</span>
                      </div>
                      <div className="flex items-center gap-2 text-success">
                        <Check className="h-4 w-4" />
                        <span>Gestão financeira completa</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Auth;