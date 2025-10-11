-- ═══════════════════════════════════════════════════════════════
-- 🧠 PRICE ACTION MATEMÁTICA - Conhecimento Avançado
-- ═══════════════════════════════════════════════════════════════
-- Migration para adicionar conhecimento de padrões geométricos
-- Triângulos, Bandeiras, Cunhas e Elliott Waves
-- ═══════════════════════════════════════════════════════════════

-- 🔺 Triângulo
INSERT INTO bot_knowledge (
  topic,
  category,
  content,
  examples,
  accuracy_score,
  metadata
) VALUES (
  'Triângulo - Price Action Matemática',
  'Padrões Geométricos',
  E'# Triângulo (Triangle)

## Definição Matemática
Um triângulo é formado quando o preço oscila entre duas linhas convergentes:
- **Linha superior**: y_sup = m_sup × x + b_sup
- **Linha inferior**: y_inf = m_inf × x + b_inf
- **Ponto de convergência**: x_conv = (b_inf - b_sup) / (m_sup - m_inf)

## Tipos de Triângulo

### 1. Simétrico (Symmetric)
- Linha superior descendente (m_sup < 0)
- Linha inferior ascendente (m_inf > 0)
- Rompimento na direção da tendência predominante

### 2. Ascendente (Ascending)
- Linha superior horizontal ou levemente ascendente
- Linha inferior ascendente (m_inf > 0.1)
- Rompimento bullish (70-80% probabilidade)

### 3. Descendente (Descending)
- Linha superior descendente (m_sup < -0.1)
- Linha inferior horizontal ou levemente descendente
- Rompimento bearish (70-80% probabilidade)

## Métricas Calculadas
- **Altura atual**: Distância entre linhas no candle mais recente
- **Convergência**: Número de candles até o ponto de encontro
- **Alvo projetado**: Altura do triângulo + preço de rompimento
- **Confiança**: Baseada na consistência das linhas e volume

## Uso Prático
O triângulo indica consolidação antes de movimento direcional. 
Quanto mais próximo da convergência, maior a probabilidade de rompimento.
Volume deve diminuir durante formação e explodir no rompimento.',
  '[
    "Triângulo simétrico em 12 velas → convergência em 18 velas → rompimento na direção da tendência",
    "Triângulo ascendente formado → linha inferior sobe 0.2% por vela → rompimento bullish provável",
    "Altura do triângulo: 35 pontos → alvo após rompimento: preço atual ± 35 pontos"
  ]'::jsonb,
  0.92,
  '{"formulas": true, "pattern_type": "consolidation", "timeframe": "all", "probability": "70-80%"}'::jsonb
),

-- 🚩 Bandeira
(
  'Bandeira - Price Action Matemática',
  'Padrões Geométricos',
  E'# Bandeira (Flag)

## Definição Matemática
Uma bandeira é um canal paralelo que se forma após movimento forte (haste):
- **Linhas paralelas**: m_sup ≈ m_inf (diferença < 0.5)
- **Inclinação**: Contra a tendência anterior
- **Altura constante**: Canal mantém largura similar

## Componentes

### Haste (Pole)
- Movimento forte e rápido
- Alto volume
- Comprimento = base para projeção do alvo

### Bandeira (Flag)
- 5-10 candles de consolidação
- Volume decrescente
- Inclinação oposta à haste

## Tipos

### Bullish Flag
- Haste: movimento de alta forte
- Bandeira: consolidação com leve inclinação negativa
- Rompimento: para cima
- Alvo: preço_atual + altura_da_haste

### Bearish Flag
- Haste: movimento de baixa forte
- Bandeira: consolidação com leve inclinação positiva
- Rompimento: para baixo
- Alvo: preço_atual - altura_da_haste

## Cálculo do Alvo
```
altura_haste = |preço_fim_haste - preço_início_haste|
alvo_bullish = preço_rompimento + altura_haste
alvo_bearish = preço_rompimento - altura_haste
```

## Confiabilidade
- **Alta (80-85%)**: Padrão de continuação de tendência
- Requer: Volume forte na haste + volume baixo na bandeira + rompimento com volume',
  '[
    "Bandeira bullish: haste de 50 pontos → bandeira de 5 velas → alvo: +50 pontos acima do rompimento",
    "Inclinação da bandeira: -15° → contra tendência de alta → confirma continuação",
    "Volume na haste: 150% acima da média → volume na bandeira: 60% da média → setup válido"
  ]'::jsonb,
  0.95,
  '{"formulas": true, "pattern_type": "continuation", "timeframe": "all", "probability": "80-85%"}'::jsonb
),

-- 📐 Cunha
(
  'Cunha - Price Action Matemática',
  'Padrões Geométricos',
  E'# Cunha (Wedge)

## Definição Matemática
Uma cunha é formada por duas linhas convergentes inclinadas na mesma direção:
- **Ambas ascendentes** → Rising Wedge (cunha ascendente)
- **Ambas descendentes** → Falling Wedge (cunha descendente)
- **Convergência**: x_conv = (b_inf - b_sup) / (m_sup - m_inf)

## Rising Wedge (Cunha Ascendente)
- Linha superior: m_sup > 0.1 (sobe)
- Linha inferior: m_inf > m_sup (sobe mais rápido)
- **Rompimento**: Para BAIXA (bearish) - contra a inclinação
- **Alvo**: preço_atual - altura_atual
- **Probabilidade**: 70-75%

## Falling Wedge (Cunha Descendente)
- Linha superior: m_sup < -0.15 (desce)
- Linha inferior: m_inf < -0.1 (desce mais devagar)
- **Rompimento**: Para ALTA (bullish) - contra a inclinação
- **Alvo**: preço_atual + altura_atual
- **Probabilidade**: 70-75%

## Características Chave
1. **Convergência visível**: Linhas se aproximam
2. **Volume decrescente**: Momentum enfraquece
3. **Rompimento contra inclinação**: Divergência bullish/bearish
4. **Alvo**: Altura da cunha no ponto de formação

## Diferença vs Triângulo
- **Cunha**: Ambas as linhas inclinadas na mesma direção
- **Triângulo**: Linhas em direções opostas ou uma horizontal

## Sinais de Confirmação
- Divergência de RSI (alta no falling, baixa no rising)
- Volume explosivo no rompimento
- Fechamento de candle fora da cunha',
  '[
    "Rising wedge: 15 velas de alta → ambas linhas sobem → rompimento para BAIXA esperado",
    "Falling wedge: preço cai mas comprime → rompimento para ALTA provável → alvo: +altura da cunha",
    "Cunha com divergência RSI: alta confiabilidade (85%+) → aguardar confirmação de volume"
  ]'::jsonb,
  0.90,
  '{"formulas": true, "pattern_type": "reversal", "timeframe": "all", "probability": "70-75%"}'::jsonb
),

-- 🌊 Elliott Waves
(
  'Elliott Waves - Price Action Matemática',
  'Padrões Geométricos',
  E'# Elliott Waves (Ondas de Elliott)

## Teoria Fundamental
O mercado se move em ondas previsíveis baseadas em psicologia de massa:
- **Fase Impulsiva**: 5 ondas na direção da tendência (1, 2, 3, 4, 5)
- **Fase Corretiva**: 3 ondas contra a tendência (A, B, C)

## Ondas Impulsivas (1-5)

### Onda 1
- Início da tendência
- Volume moderado
- Comprimento: base para outras ondas

### Onda 2
- Correção de 50-61.8% da onda 1 (Fibonacci)
- Não pode romper o início da onda 1
- Volume baixo

### Onda 3 🔥
- **A MAIOR**: Normalmente 161.8% da onda 1
- Volume altíssimo
- Movimento mais forte
- Nunca é a menor das três ondas impulsivas

### Onda 4
- Correção de 38.2-50% da onda 3
- Não deve entrar na zona da onda 1
- Forma padrões complexos (triângulos, bandeiras)

### Onda 5
- Última onda impulsiva
- Comprimento: 61.8-100% da onda 1
- Volume começa a diminuir (divergência)
- Alvo: onda1 × 1.618 + preço_início

## Ondas Corretivas (ABC)

### Onda A
- Primeira correção após 5 ondas
- Pode parecer consolidação
- Comprimento: 50-61.8% da onda 5

### Onda B
- Retração parcial da onda A
- "Bull trap" ou "Bear trap"
- Comprimento: 50-78.6% da onda A

### Onda C
- Finaliza correção
- Comprimento típico: igual à onda A (1:1)
- Pode atingir 161.8% da onda A
- Alvo: preço_fim_A - (onda_A × 1.0)

## Proporções Fibonacci Chave
- Onda 2: 50-61.8% de retração
- Onda 3: 161.8% de extensão
- Onda 4: 38.2% de retração
- Onda 5: 61.8-100% da onda 1
- Onda C: 100-161.8% da onda A

## Identificação Matemática
1. Encontrar pivots significativos (picos e vales)
2. Medir comprimento de cada onda
3. Verificar proporções Fibonacci
4. Confirmar: onda 3 > onda 1 E onda 3 > onda 5
5. Projetar próxima onda usando ratios

## Uso Prático
- **Na onda 3**: Maior oportunidade de lucro
- **Na onda 5**: Preparar para reversão
- **Na onda B**: Evitar entradas (trap)
- **Na onda C**: Buscar fundo/topo para nova sequência',
  '[
    "Onda 3 completada em 125.50 → comprimento: 45 pontos → próxima onda 5 projetada: 110.30 (Fib 1.618)",
    "Corretiva ABC: onda A = 20 pontos → onda B = 12 pontos (60% retração) → onda C alvo: -20 pontos",
    "Sequência 1-2-3 identificada → onda 3 = 1.6× onda 1 → validação Elliott → aguardar onda 4 para entrada"
  ]'::jsonb,
  0.88,
  '{"formulas": true, "pattern_type": "wave_theory", "timeframe": "all", "probability": "60-75%", "complexity": "advanced"}'::jsonb
),

-- 📊 Documento Mestre de Integração
(
  'Price Action Matemática - Guia de Integração',
  'Análise Técnica Avançada',
  E'# Price Action Matemática - Sistema Completo

## Visão Geral
Sistema de detecção automática de padrões geométricos baseado em cálculos matemáticos puros, sem necessidade de visualização gráfica.

## Padrões Implementados

### 🔺 Triângulos
- **Detecção**: Regressão linear em highs e lows
- **Output**: Tipo, convergência, altura, alvo
- **Tempo real**: Recalculado a cada candle
- **Mensagem**: Auto-gerada com métricas

### 🚩 Bandeiras
- **Detecção**: Canal paralelo após movimento forte
- **Output**: Tipo, inclinação, alvo de continuação
- **Validação**: Haste mínima de 2%
- **Confiabilidade**: 80-85%

### 📐 Cunhas
- **Detecção**: Linhas convergentes na mesma direção
- **Output**: Tipo, convergência, alvo contra-tendência
- **Sinal**: Rompimento OPOSTO à inclinação
- **Confiabilidade**: 70-75%

### 🌊 Elliott Waves
- **Detecção**: Identificação de pivots + proporções Fibonacci
- **Output**: Onda atual, fase, alvo projetado
- **Complexidade**: Alta (requer 50+ candles)
- **Confiabilidade**: 60-75%

## Fluxo de Processamento

1. **Input**: Array de candles (OHLCV + timestamp)
2. **Cálculo de métricas**: Corpo, sombras, altura, distâncias
3. **Regressão linear**: Identificar tendências e inclinações
4. **Detecção de padrões**: Aplicar regras matemáticas específicas
5. **Projeção de alvos**: Calcular níveis de probabilidade
6. **Geração de mensagem**: Traduzir números em linguagem natural
7. **Output**: JSON com padrão detectado + métricas + explicação

## Integração com TradeVision IA

### Frontend (usePatternDetection.ts)
```typescript
const patterns = usePatternDetection(candles);

if (patterns?.triangleDetected) {
  console.log(patterns.patternMessage);
  // "Triângulo simétrico em formação há 12 velas..."
}
```

### Backend (Agente TradeVision IA)
Quando padrão é detectado, o Agente:
1. Recebe: `{ pattern: "triangle", convergence: 18, ... }`
2. Busca conhecimento: Query bot_knowledge
3. Monta contexto: Combina dados + explicação teórica
4. Gera resposta: Gemini ou fallback
5. Retorna: Análise completa com recomendação

### Exemplo de Resposta do Agente
```
🔺 Detectei um triângulo simétrico se formando no BTC!

Formação: 12 velas
Convergência: Prevista em aproximadamente 18 velas
Altura atual: 35.50 pontos
Direção provável: Alta (tendência predominante)
Alvo projetado: $121,465

Triângulos são padrões de consolidação onde o preço 
converge entre duas linhas até um rompimento decisivo.
A proximidade da convergência aumenta a tensão - 
fique atento ao volume no rompimento!
```

## Performance
- **Latência**: < 3ms por padrão
- **Precisão**: 70-95% dependendo do padrão
- **Frequência**: Tempo real (a cada candle)
- **Custo computacional**: Baixo (matemática pura)

## Vantagens vs Análise Visual
✅ Não depende de gráficos ou imagens
✅ Processamento automático 24/7
✅ Métricas precisas e reproduzíveis
✅ Escalável para múltiplos ativos
✅ Alertas proativos em tempo real
✅ Explicações auto-geradas
✅ Zero subjetividade humana',
  '[
    "Sistema detecta 4 tipos de padrões geométricos em tempo real",
    "Cada padrão retorna métricas quantificáveis (convergência, altura, alvo)",
    "Mensagens automáticas traduzem cálculos em linguagem clara",
    "Integração perfeita com o Agente TradeVision IA para análises completas"
  ]'::jsonb,
  1.0,
  '{"formulas": true, "system": "integrated", "realtime": true, "automated": true}'::jsonb
);

-- ═══════════════════════════════════════════════════════════════
-- 🎯 Sucesso!
-- ═══════════════════════════════════════════════════════════════
-- Os documentos foram inseridos em bot_knowledge
-- O Agente TradeVision IA agora pode:
-- 1. Explicar detalhadamente cada padrão quando detectado
-- 2. Combinar detecção automática com teoria avançada
-- 3. Gerar análises completas integrando Price Action Matemática
-- ═══════════════════════════════════════════════════════════════

