# Correlação Multi-Timeframe - Sistema Institucional de Análise Temporal

## 1. Hierarquia de Timeframes (Top-Down Analysis)

### 1.1 Sistema de Pesos TradeVision IA

```
┌─────────────────────────────────────────┐
│  M30: 25% - TENDÊNCIA MACRO             │
│  ↓                                       │
│  M15: 35% - CONFIRMAÇÃO ESTRUTURAL      │
│  ↓                                       │
│  M5:  25% - SETUP TÁTICO                │
│  ↓                                       │
│  M1:  15% - TIMING DE ENTRADA           │
└─────────────────────────────────────────┘
```

**Justificativa dos Pesos:**
- **M30 (25%)**: Define o viés direcional macro. Instituições operam primariamente neste timeframe.
- **M15 (35%)**: Peso MAIOR porque é o timeframe de estrutura - valida a tendência de M30 e fornece zonas de entrada precisas.
- **M5 (25%)**: Timeframe tático para confirmar setups antes da entrada.
- **M1 (15%)**: Apenas para timing preciso - NUNCA deve influenciar decisão principal.

### 1.2 Responsabilidades de Cada Timeframe

**M30 - Tendência Macro (Hold: 6-24h):**
- Define: Bullish, Bearish ou Ranging
- Identifica: Major OBs, FVGs macro, níveis de S/R institucionais
- Valida: ChoCh de reversão de tendência de longo prazo
- **Regra**: NUNCA trade contra M30. Se M30 bearish, só procurar vendas.

**M15 - Confirmação Estrutural (Hold: 2-8h):**
- Define: Estrutura de mercado (Higher Highs/Lower Lows)
- Identifica: OBs e FVGs de alta qualidade
- Valida: BOS/ChoCh que confirmam ou invalidam M30
- **Regra**: M15 é o "árbitro" - se divergir de M30, aguardar alinhamento.

**M5 - Setup Tático (Hold: 30min-3h):**
- Define: Zonas precisas de entrada
- Identifica: Padrões de reversão imediata
- Valida: Confluências com M15/M30
- **Regra**: M5 sozinho = sinal fraco. Precisa alinhamento com M15+.

**M1 - Timing de Entrada (Hold: 5-30min):**
- Define: Momento exato de entrada (ordem limit)
- Identifica: Micro padrões de rejeição
- Valida: Apenas execução, nunca decisão
- **Regra**: M1 NUNCA deve invalidar análise de timeframes superiores.

---

## 2. Regras de Confluência Multi-Timeframe

### 2.1 Alinhamento Perfeito (Cenário Ideal - 85%+ Win Rate)

**Configuração:**
```
M30: Bullish (BOS confirmado, acima de OB macro)
M15: Bullish (BOS recente, formando HH/HL)
M5:  Bullish (pullback a FVG, formando padrão de continuação)
M1:  Bullish (rejeição em suporte micro)
```

**Ação:**
- COMPRA AGRESSIVA
- Tamanho de posição: 2% de risco (máximo permitido)
- Confluência: 100% → Setup premium
- Expectativa: Hold de 4-12 horas

**Exemplo Prático:**
```
M30: BTC rompeu $60k (OB macro), tendência bullish clara
M15: Pullback a FVG em $60,500, BOS confirmando continuação
M5:  Formação de OB bullish em $60,450
M1:  Rejeição com volume em $60,430

→ ENTRADA: $60,450
→ STOP: $60,200 (abaixo OB de M15)
→ TP1: $61,500 (próximo FVG bearish em M15)
→ TP2: $62,000 (resistência de M30)
```

### 2.2 Alinhamento Parcial (65-75% Win Rate)

**Configuração A: M30 + M15 Alinhados, M5 Divergente**
```
M30: Bullish
M15: Bullish
M5:  Bearish (correção)
M1:  Mixed
```

**Ação:**
- AGUARDAR: M5 alinhar com M15/M30
- Não entrar até M5 formar BOS bullish
- Pode ser correção saudável (pullback)

**Configuração B: M15 + M5 Alinhados, M30 Divergente**
```
M30: Ranging/Bearish
M15: Bullish
M5:  Bullish
M1:  Bullish
```

**Ação:**
- EVITAR OU REDUZIR RISCO: Tamanho 0.5-1%
- M30 pode invalidar todo o setup
- Se trade, stops apertados e TP conservador
- Monitorar M30 para ChoCh

### 2.3 Divergência Total (Evitar - 30-40% Win Rate)

**Configuração:**
```
M30: Bearish
M15: Bullish
M5:  Bearish
M1:  Bullish
```

**Ação:**
- **NÃO TRADE**
- Mercado sem direção clara
- Alta probabilidade de whipsaw (vai e volta)
- Aguardar alinhamento de pelo menos M30+M15

---

## 3. Como Usar M1 para Timing de Entrada

### 3.1 Regra de Ouro do M1

**M1 É APENAS EXECUÇÃO, NÃO DECISÃO**

Se M15/M5 dão setup de COMPRA:
- Use M1 para identificar suporte micro
- Entre na rejeição de M1 dentro da zona de M5/M15
- NUNCA mude de ideia porque M1 está bearish temporariamente

### 3.2 Padrões de M1 para Entrada Precisa

**Para COMPRA (quando M15/M5 bullish):**

1. **Rejeição de Suporte em M1:**
   - Preço toca zona de M5/M15
   - Vela de M1 forma sombra inferior longa
   - Fechamento no terço superior da vela
   → ENTRADA: Próxima vela de M1

2. **BOS de M1 Dentro da Zona:**
   - Preço entra em FVG/OB de M5/M15
   - M1 forma pequeno BOS bullish (micro Higher High)
   → ENTRADA: No pullback de M1

3. **Engolfo Bullish em M1:**
   - Após pullback a zona de M5/M15
   - Vela bullish de M1 engole vela bearish anterior
   → ENTRADA: Imediatamente ou na próxima vela

**Benefício:**
- Stop mais apertado (baseado em M1)
- Melhor relação risco:recompensa
- Entrada precisa = menos drawdown inicial

### 3.3 Quando IGNORAR M1

**Situações para NÃO usar M1:**
- M15/M30 fortemente alinhados → Entre direto na zona de M15
- Alta volatilidade (news event) → M1 muito ruidoso
- Sessão asiática → M1 sem liquidez suficiente
- Setup de swing trade (hold >8h) → M1 irrelevante

---

## 4. Sinais Válidos com 3+ Timeframes Alinhados

### 4.1 Matriz de Validação

| M30 | M15 | M5 | M1 | Qualidade | Ação |
|-----|-----|----|----|-----------|------|
| ✓ | ✓ | ✓ | ✓ | **PREMIUM** (95%) | Trade agressivo, risco 2% |
| ✓ | ✓ | ✓ | ✗ | **ÓTIMO** (85%) | Trade agressivo, risco 1.5% |
| ✓ | ✓ | ✗ | - | **BOM** (75%) | Aguardar M5 alinhar |
| ✓ | ✗ | ✓ | ✓ | **MARGINAL** (60%) | Trade conservador, risco 0.5% |
| ✓ | ✗ | ✗ | - | **FRACO** (40%) | Evitar |
| ✗ | ✓ | ✓ | ✓ | **ARRISCADO** (45%) | Evitar ou risco 0.25% |
| ✗ | ✗ | - | - | **INVÁLIDO** (20%) | Não trade |

### 4.2 Regra dos 3 Timeframes

**Para trade válido, PRECISA DE:**
- **Mínimo**: M30 + M15 alinhados (65% win rate)
- **Ideal**: M30 + M15 + M5 alinhados (85% win rate)
- **Premium**: Todos os 4 timeframes alinhados (95% win rate)

**Se M30 diverge de M15:**
→ Aguardar até M30 alinhar OU
→ M15 formar ChoCh (reversão de M30)

---

## 5. Divergências Multi-TF - Como Interpretar

### 5.1 M1 Bullish vs M30 Bearish

**Interpretação:**
- M1 está em correção/ruído dentro de tendência bearish de M30
- **Ação**: IGNORAR M1. Aguardar M15/M30 alinharem.
- **Setup**: Procurar VENDA quando M5 alinhar com M30 bearish.

**Exemplo:**
```
M30: Bearish (abaixo de OB macro)
M15: Bearish (formando LL)
M5:  Ranging (consolidação)
M1:  Bullish (micro rally)

→ Aguardar M5 formar BOS bearish
→ Entrada: Venda no pullback de M5
```

### 5.2 M5 Diverge de M15 (Comum)

**Cenário A: M15 Bullish, M5 Bearish**
- M5 está em pullback/correção dentro de uptrend de M15
- **Ação**: Aguardar M5 formar BOS bullish (alinhamento)
- Setup de COMPRA quando M5 alinhar

**Cenário B: M15 Bearish, M5 Bullish**
- M5 está em rally técnico dentro de downtrend de M15
- **Ação**: Aguardar M5 formar BOS bearish
- Setup de VENDA quando M5 alinhar

### 5.3 Quando M15 e M30 Divergem (CRÍTICO)

**Situação:**
```
M30: Bullish (tendência macro)
M15: Bearish (ChoCh detectado)
```

**Interpretação:**
- M15 pode estar sinalizando reversão de M30
- **Ação**:
  1. Aguardar M15 confirmar com novo BOS bearish
  2. Se M15 continuar bearish por 6+ velas → Considerar reversão de M30
  3. Se M15 voltar bullish → Foi apenas correção

**Setup de Reversão Válido:**
- M15 ChoCh + M5 BOS bearish + M1 rejeição = Possível reversão de M30
- Aguardar M30 formar ChoCh para confirmação total
- Trade conservador até M30 confirmar

---

## 6. Padrões de Exaustão em Cada Timeframe

### 6.1 Exaustão de M30 (Reversão de Longo Prazo)

**Sinais:**
- Múltiplos retests de resistência sem rompimento (5+ vezes)
- Volume decrescente em cada tentativa de rompimento
- ChoCh em M30 após uptrend longo (>2 semanas)
- Divergência de RSI em M30 (preço faz HH, RSI faz LH)

**Ação:**
- Aguardar confirmação de M15 (BOS bearish)
- Primeira entrada conservadora (risco 0.5%)
- Segunda entrada após pullback a FVG de M30 (risco 1.5%)

### 6.2 Exaustão de M15 (Reversão de Médio Prazo)

**Sinais:**
- ChoCh em M15 após tendência de 12+ horas
- Volume spike em máximo/mínimo seguido de rejeição
- Formação de swing failure pattern (SFP)
- M5 já formou ChoCh antes de M15

**Ação:**
- Entrada em pullback a FVG/OB de M15
- Stop acima/abaixo do ChoCh
- TP em próximo OB de M30 na direção oposta

### 6.3 Exaustão de M5 (Correção Tática)

**Sinais:**
- 3+ ondas impulsivas sem pullback significativo
- M1 formando divergências de momentum
- Padrão de 5 ondas (Elliott Wave)

**Ação:**
- **Se M15/M30 ainda alinhados**: Aguardar pullback de M5 para COMPRAR
- **Se M15 divergente**: Possível reversão → aguardar confirmação

---

## 7. Estratégias de Trading Multi-TF

### 7.1 Swing Trade (Hold: 8-24h)

**Timeframes:**
- Análise: M30 + M15
- Entrada: M15 ou M5
- Timing: M5 (opcional M1)

**Setup:**
1. M30 define viés (bullish/bearish)
2. M15 forma FVG/OB de qualidade
3. M5 confirma entrada com BOS
4. Entrada em pullback de M5 ou direto em zona de M15

**Gestão:**
- Stop: Abaixo/acima de OB de M15
- TP1: Próximo FVG de M15 (50% da posição)
- TP2: Próximo OB de M30 (restante)

### 7.2 Day Trade (Hold: 2-6h)

**Timeframes:**
- Análise: M15 + M5
- Entrada: M5
- Timing: M1

**Setup:**
1. M15 alinhado com M30 (conferir contexto)
2. M5 forma padrão de continuação (BOS)
3. M1 dá entrada precisa em pullback de M5

**Gestão:**
- Stop: Abaixo/acima de zona de M5
- TP1: Próximo swing de M5
- TP2: Próximo FVG de M15

### 7.3 Scalp (Hold: 10-60min)

**Timeframes:**
- Análise: M5
- Entrada: M1
- Timing: M1

**Setup:**
1. M5 fortemente alinhado com M15+
2. M1 forma padrão de reversão em zona de M5
3. Entrada agressiva em rejeição de M1

**Gestão:**
- Stop: 0.5% (fixo)
- TP: 1:1.5 ou 1:2 (scaling rápido)
- Trailing stop após 1:1

---

## 8. Checklist de Análise Multi-TF

Antes de cada trade:

**Contexto Macro:**
- [ ] M30 está em tendência clara (não ranging)?
- [ ] M30 tem FVG/OB de qualidade na direção do trade?
- [ ] M30 sem ChoCh recente (< 24h)?

**Estrutura:**
- [ ] M15 alinhado com M30?
- [ ] M15 formou BOS recente (< 8h)?
- [ ] M15 tem FVG/OB de entrada?

**Setup Tático:**
- [ ] M5 confirma direção de M15/M30?
- [ ] M5 tem confluência (FVG+OB, Sweep, etc.)?
- [ ] M5 não está em exaustão (3+ ondas)?

**Timing:**
- [ ] M1 dá entrada precisa (opcional)?
- [ ] Relação risco:recompensa > 1:2?
- [ ] Confluência de 3+ timeframes?

**Se 10+ itens = SIM → Trade**
**Se 7-9 itens = SIM → Trade conservador**
**Se <7 itens = SIM → Evitar**

---

## 9. Erros Comuns Multi-TF (EVITAR)

1. **Trade contra M30** → Win rate <30%
2. **M1 ditando decisão** → Whipsaw constante
3. **Ignorar divergências M15/M30** → Perder reversões importantes
4. **Entrar sem 3 TFs alinhados** → Risco excessivo
5. **Não aguardar confirmação de M15** → Entradas prematuras
6. **Trocar de timeframe após perda** → Falta de disciplina
7. **Usar apenas 1 timeframe** → Visão míope do mercado
8. **Esquecer contexto macro (M30)** → Trade no escuro

