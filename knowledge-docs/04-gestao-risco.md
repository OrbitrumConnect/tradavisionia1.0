# Gestão de Risco Institucional - Sistema TradeVision IA

## 1. Position Sizing - Cálculo Institucional

### 1.1 Regra de Ouro: 1-2% de Risco
- **NUNCA** arriscar mais de 2% do capital em um único trade
- **Setup premium** (95% win rate): 2% de risco
- **Setup bom** (85% win rate): 1.5% de risco
- **Setup marginal** (65% win rate): 0.5-1% de risco

### 1.2 Cálculo de Tamanho de Posição
```
Tamanho = (Capital × % Risco) / (Distância do Stop em %)

Exemplo:
Capital: $10,000
Risco: 1% = $100
Entrada: $60,000
Stop: $59,400 (1% de distância)
Tamanho: $100 / 0.01 = $10,000 (posição completa de 1%)
```

### 1.3 Ajustes por Volatilidade (ATR)
- **ATR alto** (>3% do preço): Reduzir tamanho 50%
- **ATR médio** (1-3%): Tamanho normal
- **ATR baixo** (<1%): Pode aumentar levemente (+25%)

## 2. Stop Loss - Placement Institucional

### 2.1 Stops Baseados em Estrutura
**NUNCA usar stops fixos** (ex: -2%, -$500)

**Stops corretos:**
- Abaixo de OB (compra) / Acima de OB (venda)
- Além de FVG mitigado
- Abaixo de swing low / Acima de swing high
- Além da sombra de liquidity sweep

### 2.2 Como Evitar Stop Hunting
- Stops 0.5-1% além da zona óbvia
- Evitar números redondos ($60,000, $1.2000)
- Usar stops de M15, não de M5/M1
- Considerar volatilidade (ATR)

### 2.3 Trailing Stops em Tendências
**Ativação:**
- Após atingir 1:1 (risco = lucro)
- Move stop para breakeven

**Trailing:**
- Em uptrend: Stop abaixo de cada novo swing low
- Em downtrend: Stop acima de cada novo swing high
- Distância mínima: 1x ATR

## 3. Take Profit - Estratégias Institucionais

### 3.1 TP Baseado em Estrutura
**Níveis prioritários:**
1. FVG não preenchido no caminho
2. OB de timeframe superior
3. Liquidity pools (swing highs/lows)
4. Zonas de resistência/suporte históricas

### 3.2 TP Parcial (Scale Out)
**Sistema recomendado:**
- **TP1** (50% posição): 1:1.5 ou primeiro obstáculo
- **TP2** (30% posição): 1:3 ou segundo obstáculo
- **TP3** (20% posição): 1:5+ ou deixar correr com trailing

### 3.3 Risk:Reward Mínimo
- **Setup premium**: 1:2 mínimo
- **Setup bom**: 1:2.5 mínimo
- **Setup marginal**: 1:3 mínimo (compensa menor win rate)

## 4. Drawdown e Recuperação

### 4.1 Drawdown Máximo Aceitável
- **-5%**: Alerta amarelo - revisar últimas 5 trades
- **-10%**: Alerta vermelho - parar de tradear 24-48h
- **-15%**: STOP TOTAL - revisar estratégia completa

### 4.2 Recuperação de Drawdown
**NUNCA aumentar risco para "recuperar rápido"**

```
Drawdown → Ganho necessário para recuperar
-5%     → +5.3%
-10%    → +11.1%
-20%    → +25%
-30%    → +42.9%
-50%    → +100%
```

**Estratégia:**
- Reduzir risco pela metade após -10%
- Voltar ao risco normal após 3 trades vencedores consecutivos

## 5. Diversificação

### 5.1 Máximo de Trades Simultâneos
- **Experiente**: Até 3 trades simultâneos
- **Intermediário**: Máximo 2 trades
- **Iniciante**: 1 trade por vez

### 5.2 Correlação de Ativos
**Evitar trades em ativos correlacionados:**
- BTC + ETH = correlação 85%+ (contar como 1 trade)
- EUR/USD + GBP/USD = correlação 70%+
- S&P500 + Nasdaq = correlação 95%+

## 6. Regras de Disciplina

1. **NUNCA** mover stop loss contra você
2. **NUNCA** adicionar a posição perdedora (average down)
3. **SEMPRE** respeitar tamanho de posição calculado
4. **SEMPRE** ter stop definido ANTES de entrar
5. **EVITAR** tradear após 2 perdas consecutivas
6. **PARAR** após -5% no dia
7. **JOURNAL** todas as operações (wins e losses)
8. **REVISAR** semanalmente performance e erros
