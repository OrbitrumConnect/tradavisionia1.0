import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, TrendingUp, TrendingDown, Brain, Loader2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

export function TradeRegistration() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  // Form state
  const [tradeType, setTradeType] = useState<'paper' | 'real'>('paper');
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [strategy, setStrategy] = useState('');
  const [notes, setNotes] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');

  const calculatePnL = () => {
    if (!entryPrice || !exitPrice || !quantity) return { pnl: 0, pnl_percent: 0 };
    
    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const qty = parseFloat(quantity);
    
    const pnl = side === 'BUY' 
      ? (exit - entry) * qty 
      : (entry - exit) * qty;
    
    const pnl_percent = ((exit - entry) / entry) * 100 * (side === 'BUY' ? 1 : -1);
    
    return { pnl, pnl_percent };
  };

  const handleSubmit = async () => {
    if (!entryPrice || !quantity) {
      toast.error('Preencha pelo menos preço de entrada e quantidade');
      return;
    }

    setLoading(true);

    const { pnl, pnl_percent } = calculatePnL();
    const status = exitPrice ? 'closed' : 'open';

    const tradeData = {
      user_id: user!.id,
      symbol,
      side,
      entry_price: parseFloat(entryPrice),
      exit_price: exitPrice ? parseFloat(exitPrice) : null,
      quantity: parseFloat(quantity),
      stop_loss: stopLoss ? parseFloat(stopLoss) : null,
      take_profit: takeProfit ? parseFloat(takeProfit) : null,
      status,
      pnl: exitPrice ? pnl : null,
      pnl_percent: exitPrice ? pnl_percent : null,
      strategy_used: strategy || null,
      notes: notes || null,
      lessons_learned: lessonsLearned || null,
      metadata: {
        trade_type: tradeType,
        registered_manually: true
      }
    };

    const { data: insertedTrade, error } = await supabase
      .from('paper_trades')
      .insert(tradeData)
      .select()
      .single();

    if (error) {
      toast.error('Erro ao registrar operação');
      console.error(error);
      setLoading(false);
      return;
    }

    // Análise com IA após salvar
    setAnalyzing(true);
    try {
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-trade', {
        body: { 
          trade: { ...tradeData, id: insertedTrade.id, pnl, pnl_percent },
          userId: user!.id 
        }
      });

      if (analysisError) {
        console.error('Erro na análise:', analysisError);
        toast.warning('Operação salva, mas análise falhou');
      } else {
        setAnalysis(analysisData);
        setShowAnalysis(true);
        toast.success('Operação registrada e analisada!');
      }
    } catch (err) {
      console.error('Erro ao analisar:', err);
      toast.warning('Operação salva, mas análise falhou');
    }

    setAnalyzing(false);
    setLoading(false);
    
    // Trigger refresh na tela de resultados
    window.dispatchEvent(new Event('trade-registered'));
  };

  const resetForm = () => {
    setSymbol('BTCUSDT');
    setSide('BUY');
    setEntryPrice('');
    setExitPrice('');
    setQuantity('');
    setStopLoss('');
    setTakeProfit('');
    setStrategy('');
    setNotes('');
    setLessonsLearned('');
    setAnalysis(null);
    setShowAnalysis(false);
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const { pnl, pnl_percent } = calculatePnL();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Registrar Operação
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📊 Registrar Operação</DialogTitle>
          <DialogDescription>
            Registre suas operações (reais ou simuladas) para acompanhar seu desempenho e receber análise automática
          </DialogDescription>
        </DialogHeader>

        {showAnalysis && analysis ? (
          // Tela de análise
          <div className="space-y-6">
            <Alert className="bg-primary/10 border-primary">
              <CheckCircle2 className="h-5 w-5" />
              <AlertDescription>
                <strong>Operação analisada com sucesso!</strong>
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Análise da Operação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="whitespace-pre-wrap text-sm">
                  {analysis.analysis}
                </div>
              </CardContent>
            </Card>

            {analysis.key_learnings && analysis.key_learnings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">✅ Aprendizados-Chave</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {analysis.key_learnings.map((learning: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-500">•</span>
                        <span>{learning}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {analysis.areas_to_improve && analysis.areas_to_improve.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">⚠️ Áreas para Melhorar</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {analysis.areas_to_improve.map((area: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-yellow-500">•</span>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {analysis.recommended_studies && analysis.recommended_studies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">📚 Estudos Recomendados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.recommended_studies.map((study: string, i: number) => (
                      <Badge key={i} variant="outline">{study}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2 justify-end">
              <Button onClick={handleClose}>
                Fechar
              </Button>
              <Button variant="outline" onClick={() => {
                setShowAnalysis(false);
                resetForm();
              }}>
                Registrar Outra
              </Button>
            </div>
          </div>
        ) : (
          // Formulário de registro
        <div className="space-y-6">
          {/* Tipo de operação */}
          <div className="space-y-2">
            <Label>Tipo de Operação</Label>
            <div className="flex gap-2">
              <Button
                variant={tradeType === 'paper' ? 'default' : 'outline'}
                onClick={() => setTradeType('paper')}
                className="flex-1"
              >
                📝 Paper Trading (Simulado)
              </Button>
              <Button
                variant={tradeType === 'real' ? 'default' : 'outline'}
                onClick={() => setTradeType('real')}
                className="flex-1"
              >
                💰 Real
              </Button>
            </div>
          </div>

          {/* Símbolo e lado */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Símbolo</Label>
              <Input
                id="symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="BTCUSDT"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="side">Direção</Label>
              <Select value={side} onValueChange={(v) => setSide(v as 'BUY' | 'SELL')}>
                <SelectTrigger id="side">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      COMPRA
                    </div>
                  </SelectItem>
                  <SelectItem value="SELL">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      VENDA
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preços */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry">Preço Entrada*</Label>
              <Input
                id="entry"
                type="number"
                step="0.01"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exit">Preço Saída</Label>
              <Input
                id="exit"
                type="number"
                step="0.01"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade*</Label>
              <Input
                id="quantity"
                type="number"
                step="0.001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.000"
              />
            </div>
          </div>

          {/* Stop Loss e Take Profit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sl">Stop Loss</Label>
              <Input
                id="sl"
                type="number"
                step="0.01"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tp">Take Profit</Label>
              <Input
                id="tp"
                type="number"
                step="0.01"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Preview P&L */}
          {entryPrice && exitPrice && quantity && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Preview do Resultado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">P&L:</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={pnl >= 0 ? 'default' : 'destructive'} className="font-mono">
                      ${pnl.toFixed(2)}
                    </Badge>
                    <Badge variant={pnl >= 0 ? 'default' : 'destructive'} className="font-mono">
                      {pnl_percent.toFixed(2)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estratégia */}
          <div className="space-y-2">
            <Label htmlFor="strategy">Estratégia Utilizada</Label>
            <Input
              id="strategy"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              placeholder="Ex: SMC, Order Block, Breakout..."
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas / Contexto</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="O que você observou no mercado? Por que entrou?"
              rows={3}
            />
          </div>

          {/* Lições aprendidas (se já fechou) */}
          {exitPrice && (
            <div className="space-y-2">
              <Label htmlFor="lessons">Lições Aprendidas</Label>
              <Textarea
                id="lessons"
                value={lessonsLearned}
                onChange={(e) => setLessonsLearned(e.target.value)}
                placeholder="O que funcionou? O que pode melhorar?"
                rows={3}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose} disabled={loading || analyzing}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading || analyzing}>
              {loading || analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {analyzing ? 'Analisando com IA...' : 'Salvando...'}
                </>
              ) : (
                'Registrar & Analisar'
              )}
            </Button>
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
