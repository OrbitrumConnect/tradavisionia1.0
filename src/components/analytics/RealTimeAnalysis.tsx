import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';
import { TechnicalIndicators } from '@/hooks/useTechnicalIndicators';
import { PatternDetection } from '@/hooks/usePatternDetection';

interface RealTimeAnalysisProps {
  indicators: TechnicalIndicators | null;
  patterns: PatternDetection | null;
  currentPrice: number;
}

export const RealTimeAnalysis = ({ indicators, patterns, currentPrice }: RealTimeAnalysisProps) => {
  if (!indicators || !patterns) {
    return (
      <Card className="bg-card/80 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4" />
            Análise Técnica em Tempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Aguardando dados...</p>
        </CardContent>
      </Card>
    );
  }

  const getRSIStatus = (rsi: number) => {
    if (rsi < 30) return { label: 'Sobrevendido', color: 'text-success', bg: 'bg-success/10' };
    if (rsi > 70) return { label: 'Sobrecomprado', color: 'text-danger', bg: 'bg-danger/10' };
    return { label: 'Neutro', color: 'text-muted-foreground', bg: 'bg-muted/10' };
  };

  const rsiStatus = getRSIStatus(indicators.rsi14);

  return (
    <Card className="bg-card/80 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Análise em Tempo Real
          </span>
          {patterns.patternName && (
            <Badge variant="default" className="text-xs">
              {patterns.patternName}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Padrões Detectados */}
        {(patterns.orderBlockDetected || patterns.fvgDetected || 
          patterns.springDetected || patterns.upthrustDetected) && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-primary">🎯 Padrões Wyckoff/SMC</h4>
            <div className="grid grid-cols-2 gap-2">
              {patterns.orderBlockDetected && (
                <div className={`p-2 rounded text-xs ${
                  patterns.orderBlockType === 'bullish' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                }`}>
                  <div className="font-semibold">Order Block</div>
                  <div className="text-xs opacity-80">
                    {patterns.orderBlockType === 'bullish' ? '📈 Bullish' : '📉 Bearish'}
                  </div>
                </div>
              )}
              
              {patterns.fvgDetected && (
                <div className={`p-2 rounded text-xs ${
                  patterns.fvgType === 'bullish' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                }`}>
                  <div className="font-semibold">FVG</div>
                  <div className="text-xs opacity-80">
                    {patterns.fvgType === 'bullish' ? '📈 Gap Alta' : '📉 Gap Baixa'}
                  </div>
                </div>
              )}
              
              {patterns.springDetected && (
                <div className="p-2 rounded text-xs bg-success/10 text-success">
                  <div className="font-semibold">✅ Spring</div>
                  <div className="text-xs opacity-80">Reversão Alta</div>
                </div>
              )}
              
              {patterns.upthrustDetected && (
                <div className="p-2 rounded text-xs bg-danger/10 text-danger">
                  <div className="font-semibold">⛔ Upthrust</div>
                  <div className="text-xs opacity-80">Reversão Baixa</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Market Structure */}
        {(patterns.bosDetected || patterns.chochDetected || patterns.liquiditySweep) && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-accent">📊 Estrutura de Mercado</h4>
            <div className="flex flex-wrap gap-2">
              {patterns.bosDetected && (
                <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30">
                  BOS - Break of Structure
                </Badge>
              )}
              {patterns.chochDetected && (
                <Badge variant="outline" className="text-xs bg-warning/10 border-warning/30">
                  ChoCh - Change of Character
                </Badge>
              )}
              {patterns.liquiditySweep && (
                <Badge variant="outline" className="text-xs bg-info/10 border-info/30">
                  💧 Liquidity Sweep
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Indicadores Principais */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold">📈 Indicadores</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`p-2 rounded ${rsiStatus.bg}`}>
              <div className="text-muted-foreground">RSI (14)</div>
              <div className={`font-bold ${rsiStatus.color}`}>
                {indicators.rsi14.toFixed(1)}
              </div>
              <div className="text-xs opacity-70">{rsiStatus.label}</div>
            </div>
            
            <div className="p-2 rounded bg-muted/10">
              <div className="text-muted-foreground">ADX</div>
              <div className={`font-bold ${indicators.adx > 25 ? 'text-success' : 'text-muted-foreground'}`}>
                {indicators.adx.toFixed(1)}
              </div>
              <div className="text-xs opacity-70">
                {indicators.adx > 25 ? 'Tendência Forte' : 'Fraco'}
              </div>
            </div>
            
            <div className="p-2 rounded bg-muted/10">
              <div className="text-muted-foreground">MACD</div>
              <div className={`font-bold ${indicators.macdHistogram > 0 ? 'text-success' : 'text-danger'}`}>
                {indicators.macdHistogram > 0 ? '📈' : '📉'} {Math.abs(indicators.macdHistogram).toFixed(2)}
              </div>
            </div>
            
            {indicators.volumeSpike && (
              <div className="p-2 rounded bg-warning/10 border border-warning/30">
                <div className="font-bold text-warning">🔥 Volume Spike!</div>
                <div className="text-xs">Z-Score: {indicators.volumeZScore.toFixed(2)}</div>
              </div>
            )}
          </div>
        </div>

        {/* EMAs Alignment */}
        <div className="space-y-1">
          <h4 className="text-xs font-semibold">📏 EMAs</h4>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">EMA 9:</span>
            <span className="font-mono">{indicators.ema9.toFixed(2)}</span>
            {currentPrice > indicators.ema9 ? <TrendingUp className="h-3 w-3 text-success" /> : <TrendingDown className="h-3 w-3 text-danger" />}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">EMA 20:</span>
            <span className="font-mono">{indicators.ema20.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">EMA 50:</span>
            <span className="font-mono">{indicators.ema50.toFixed(2)}</span>
          </div>
          
          {indicators.ema9 > indicators.ema20 && indicators.ema20 > indicators.ema50 && (
            <Badge variant="default" className="text-xs bg-success/20 text-success">
              ✅ Alinhamento Bullish
            </Badge>
          )}
          
          {indicators.ema9 < indicators.ema20 && indicators.ema20 < indicators.ema50 && (
            <Badge variant="default" className="text-xs bg-danger/20 text-danger">
              ⛔ Alinhamento Bearish
            </Badge>
          )}
        </div>

        {/* Suporte/Resistência */}
        {(patterns.supportLevel || patterns.resistanceLevel) && (
          <div className="space-y-1 pt-2 border-t border-border/50">
            <h4 className="text-xs font-semibold flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Níveis Chave
            </h4>
            {patterns.supportLevel && (
              <div className="flex justify-between text-xs">
                <span className="text-success">Suporte:</span>
                <span className="font-mono">${patterns.supportLevel.toFixed(2)}</span>
              </div>
            )}
            {patterns.resistanceLevel && (
              <div className="flex justify-between text-xs">
                <span className="text-danger">Resistência:</span>
                <span className="font-mono">${patterns.resistanceLevel.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
