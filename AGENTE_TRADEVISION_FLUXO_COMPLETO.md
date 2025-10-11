# 🧠 AGENTE TRADEVISION IA - FLUXO COMPLETO DE PROCESSAMENTO

## Documentação Técnica Detalhada do Motor Conversacional

**Versão:** 9.0  
**Arquivo:** `supabase/functions/trade-chat/index.ts`  
**Linhas:** 2.024 linhas  
**Autor:** Pedro Galluf

---

## 📋 VISÃO GERAL

O **Agente TradeVision IA** é o cérebro central do sistema. Ele processa mensagens através de um pipeline sofisticado de 15+ etapas, combinando:

- 🔍 Busca semântica vetorial
- 📊 Dados reais da Binance
- 📚 Base de conhecimento técnico
- 🧠 Sistema Adaptativo Multi-Perfil
- 🎯 Simulação de cenários
- 📸 Análise de imagens (Gemini)
- 💾 Auto-aprendizado contínuo

---

## 🔄 FLUXO COMPLETO (15 ETAPAS)

```
╔═══════════════════════════════════════════════════════════╗
║     FLUXO AGENTE TRADEVISION IA - PROCESSAMENTO           ║
╚═══════════════════════════════════════════════════════════╝

📥 INPUT: Mensagem do Usuário ou Narrador
    │
    │ {
    │   message: string,
    │   image?: string (base64),
    │   userId: string,
    │   sessionId: string,
    │   realTimeContext?: object,
    │   userEmbedding?: number[384]
    │ }
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  [1] ENTRADA & VALIDAÇÃO                                 │
│  ────────────────────────────────────────────────────── │
│  Arquivo: index.ts (linha 1535-1560)                     │
│  Função: serve() handler                                 │
│                                                           │
│  Valida:                                                  │
│  ✅ message existe                                       │
│  ✅ userId existe                                        │
│  ✅ Conecta Supabase com SERVICE_ROLE_KEY                │
│  ✅ Instancia TradeVisionAI class                        │
│                                                           │
│  Tempo: ~5ms                                              │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  [2] ANÁLISE DE IMAGEM (se houver)                       │
│  ────────────────────────────────────────────────────── │
│  Arquivo: index.ts (linha 804-860)                       │
│  Função: generateResponse() - Bloco imagem               │
│                                                           │
│  if (image) {                                             │
│    → POST Lovable AI Gateway                             │
│    → Model: google/gemini-2.5-flash                      │
│    → Prompt: "Extraia dados técnicos objetivos..."       │
│    → Retorna: Análise textual da imagem                  │
│    → Prepend ao message original                         │
│  }                                                        │
│                                                           │
│  Tempo: ~4s (apenas se houver imagem)                    │
│  Custo: Grátis até out/2025                              │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  [3] DETECÇÃO DE TIPO (Consulta Narrador?)               │
│  ────────────────────────────────────────────────────── │
│  Arquivo: index.ts (linha 866-880)                       │
│  Função: Verifica realTimeContext.consultationType       │
│                                                           │
│  if (consultationType === 'narrator-signal-validation') {│
│    → Chama handleNarratorConsultation()                  │
│    → SISTEMA ADAPTATIVO ATIVA! 🧠                        │
│    → Retorna: GENERATE_SIGNAL ou WAIT                    │
│    → [PULA PARA ETAPA 15]                                │
│  }                                                        │
│                                                           │
│  Senão, continua fluxo normal (chat usuário)             │
│                                                           │
│  Tempo: ~1ms                                              │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  [4] BUSCA SEMÂNTICA (Histórico Similar)                 │
│  ────────────────────────────────────────────────────── │
│  Arquivo: TradeVisionAI.ts + index.ts                    │
│  Função: semanticSearch.findSimilarMessages()            │
│                                                           │
│  if (userEmbedding) {                                     │
│    → Chama match_messages(embedding, userId, 5)          │
│    → PostgreSQL: Busca vetorial (pgvector)               │
│    → Similaridade de cosseno > 0.7                       │
│    → Retorna: 5 mensagens mais similares                 │
│  }                                                        │
│                                                           │
│  Query SQL:                                               │
│  SELECT id, content, role, metadata,                      │
│         1 - (embedding <=> $1) AS similarity              │
│  FROM chat_messages                                       │
│  WHERE user_id = $2                                       │
│    AND 1 - (embedding <=> $1) > 0.7                      │
│  ORDER BY embedding <=> $1                                │
│  LIMIT 5;                                                 │
│                                                           │
│  Tempo: ~100ms                                            │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  [5] DADOS BINANCE (Preço Real)                          │
│  ────────────────────────────────────────────────────── │
│  Arquivo: index.ts (linha 44-74)                         │
│  Função: fetchBinanceData(symbol)                        │
│                                                           │
│  1. Verifica cache (30 segundos):                        │
│     if (cache válido) return cached;                     │
│                                                           │
│  2. Senão, fetch API Binance:                            │
│     GET https://api.binance.com/api/v3/ticker/24hr       │
│       ?symbol=BTCUSDT                                     │
│                                                           │
│  3. Parse dados:                                          │
│     {                                                     │
│       symbol: 'BTCUSDT',                                  │
│       price: 121423.45,                                   │
│       change24h: +2.34,                                   │
│       volume24h: 12345.67,                                │
│       high24h: 122000.00,                                 │
│       low24h: 120500.00                                   │
│     }                                                     │
│                                                           │
│  4. Atualiza cache                                        │
│                                                           │
│  Tempo: ~200ms (ou instant se cached)                    │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  [6] CONTEXTO MULTI-TIMEFRAME                            │
│  ────────────────────────────────────────────────────── │
│  Arquivo: index.ts (linha 181-230)                       │
│  Função: getMultiTimeframeContext(symbol, userId)        │
│                                                           │
│  Busca últimos registros:                                │
│  ├─ market_m1  (1 minuto)                                │
│  ├─ market_m5  (5 minutos)                               │
│  ├─ market_m15 (15 minutos)                              │
│  └─ market_m30 (30 minutos)                              │
│                                                           │
│  Query SQL (para cada timeframe):                        │
│  SELECT *                                                 │
│  FROM market_m1                                           │
│  WHERE symbol = $1 AND user_id = $2                      │
│  ORDER BY created_at DESC                                 │
│  LIMIT 1;                                                 │
│                                                           │
│  Retorna:                                                 │
│  {                                                        │
│    m1: { trend, analysis, indicators },                   │
│    m5: { trend, analysis, indicators },                   │
│    m15: { trend, analysis, indicators },                  │
│    m30: { trend, analysis, indicators }                   │
│  }                                                        │
│                                                           │
│  Tempo: ~300ms (4 queries paralelas)                     │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  [7] BUSCA CONHECIMENTO TÉCNICO                          │
│  ────────────────────────────────────────────────────── │
│  Arquivo: index.ts (linha 232-268)                       │
│  Função: findRelevantKnowledge(message)                  │
│                                                           │
│  1. Extrai palavras-chave da mensagem:                   │
│     ['order', 'block', 'fvg', 'spring', etc]             │
│                                                           │
│  2. Query SQL:                                            │
│     SELECT *                                              │
│     FROM bot_knowledge                                    │
│     WHERE (                                               │
│       topic ILIKE '%order%' OR                           │
│       topic ILIKE '%block%' OR                           │
│       content ILIKE '%order%' OR                         │
│       content ILIKE '%block%'                            │
│     )                                                     │
│     ORDER BY accuracy_score DESC                          │
│     LIMIT 3;                                              │
│                                                           │
│  3. Incrementa usage_count:                              │
│     UPDATE bot_knowledge                                  │
│     SET usage_count = usage_count + 1                     │
│     WHERE id IN (...)                                     │
│                                                           │
│  Tempo: ~150ms                                            │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  [8] SINAIS DO NARRADOR                                  │
│  ────────────────────────────────────────────────────── │
│  Arquivo: index.ts (linha 342-351)                       │
│  Função: getRecentNarratorSignals(userId)                │
│                                                           │
│  Query SQL:                                               │
│  SELECT *                                                 │
│  FROM narrator_signals                                    │
│  WHERE user_id = $1                                       │
│  ORDER BY created_at DESC                                 │
│  LIMIT 5;                                                 │
│                                                           │
│  Retorna últimos 5 sinais validados                      │
│                                                           │
│  Tempo: ~100ms                                            │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  [9] HISTÓRICO DE TRADES                                 │
│  ────────────────────────────────────────────────────── │
│  Arquivo: index.ts (linha 347-368)                       │
│  Função: getRecentTrades(userId, 10)                     │
│                                                           │
│  Query SQL:                                               │
│  SELECT *                                                 │
│  FROM ai_trades                                           │
│  WHERE user_id = $1                                       │
│  ORDER BY created_at DESC                                 │
│  LIMIT 10;                                                │
│                                                           │
│  Retorna trades recentes (win/loss)                      │
│                                                           │
│  Tempo: ~100ms                                            │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  [10] CÁLCULO DE INDICADORES                             │
│  ────────────────────────────────────────────────────── │
│  Arquivo: index.ts (linha 76-128)                        │
│  Função: calculateTechnicalIndicators()                  │
│                                                           │
│  Com dados da Binance, calcula:                          │
│  ├─ Fear & Greed Index (0-100)                           │
│  │  └─ RSI normalizado + Volume + Momentum               │
│  ├─ Market Pressure (-1 a +1)                            │
│  │  └─ Compradores vs Vendedores                         │
│  ├─ Buyer Dominance (0-100%)                             │
│  │  └─ Baseado em variação e volume                      │
│  └─ Trend (ALTA/BAIXA/LATERAL)                           │
│                                                           │
│  Retorna:                                                 │
│  {                                                        │
│    fearGreedIndex: 67,                                    │
│    buyerDominance: 64,                                    │
│    marketPressure: 'OTIMISTA',                           │
│    trend: 'ALTISTA'                                       │
│  }                                                        │
│                                                           │
│  Tempo: ~50ms                                             │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  [11] SIMULAÇÃO DE CENÁRIOS                              │
│  ────────────────────────────────────────────────────── │
│  Arquivo: index.ts (linha 130-180)                       │
│  Função: simulateTradeScenarios()                        │
│                                                           │
│  Simula 3 cenários:                                      │
│                                                           │
│  🟢 BULLISH (Alta):                                      │
│     if (price > EMA20 && RSI > 50) {                     │
│       Entry: preço + 0.2%                                │
│       Stop: EMA20                                         │
│       Target: +1% acima                                   │
│       R/R: 1:2.5                                          │
│       Prob: 60-85%                                        │
│     }                                                     │
│                                                           │
│  🔴 BEARISH (Baixa):                                     │
│     if (price < EMA20 && RSI < 50) {                     │
│       Entry: preço - 0.2%                                │
│       Stop: EMA20                                         │
│       Target: -1% abaixo                                  │
│       R/R: 1:2.5                                          │
│       Prob: 60-85%                                        │
│     }                                                     │
│                                                           │
│  🟡 NEUTRAL (Lateral):                                   │
│     else {                                                │
│       Recomendação: Aguardar                             │
│       Prob: Baixa                                         │
│     }                                                     │
│                                                           │
│  Tempo: ~80ms                                             │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  [12] SISTEMA ADAPTATIVO (NOVO!)                         │
│  ────────────────────────────────────────────────────── │
│  Arquivo: index.ts (linha 490-566)                       │
│  Função: detectMarketContext()                           │
│                                                           │
│  Analisa contexto do mercado:                            │
│                                                           │
│  1. VOLUME (peso 30%):                                   │
│     if (volume > 1.5) → +30 points                       │
│     elif (volume > 0.8) → +15 points                     │
│     else → +5 points                                      │
│                                                           │
│  2. VOLATILIDADE (peso 25%):                             │
│     volatility = |RSI - 50|                              │
│     if (volatility > 20) → +25 points                    │
│     elif (volatility > 10) → +12 points                  │
│     else → +3 points                                      │
│                                                           │
│  3. MOMENTUM (peso 25%):                                 │
│     macdStrength = |MACD.histogram|                      │
│     if (macdStrength > 50) → +25 points                  │
│     elif (macdStrength > 20) → +12 points                │
│     else → +5 points                                      │
│                                                           │
│  4. QUALIDADE PADRÃO (peso 20%):                         │
│     Order Block: +20 points                              │
│     CHOCH: +20 points                                     │
│     BOS: +18 points                                       │
│     FVG: +15 points                                       │
│     Default: +10 points                                   │
│                                                           │
│  Signal Strength Total: 0-100                            │
│                                                           │
│  Define PERFIL automaticamente:                          │
│  ├─ Score 70+: AGRESSIVO (threshold 55%)                 │
│  ├─ Score 50-70: BALANCEADO (threshold 60%)              │
│  └─ Score <50: CONSERVADOR (threshold 70%)               │
│                                                           │
│  Retorna:                                                 │
│  {                                                        │
│    baseConfidence: 50-75,                                 │
│    threshold: 55-70,                                      │
│    aggressiveness: 'aggressive' | 'balanced' | 'conservative',│
│    signalStrength: 23-95,                                 │
│    profile: 'AGRESSIVO' | 'BALANCEADO' | 'CONSERVADOR',  │
│    reasoning: "Mercado forte - Perfil AGRESSIVO"         │
│  }                                                        │
│                                                           │
│  Tempo: ~30ms                                             │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  [13] ANÁLISE TÉCNICA COMPLETA                           │
│  ────────────────────────────────────────────────────── │
│  Arquivo: index.ts (linha 586-700)                       │
│  Função: handleNarratorConsultation() ou generateResponse│
│                                                           │
│  Inicia com:                                              │
│  confidence = marketContext.baseConfidence (50-75)       │
│  analysis = ''                                            │
│  recommendation = 'WAIT'                                  │
│                                                           │
│  Analisa RSI (Sistema Adaptativo):                      │
│  ├─ if (RSI < 30) → confidence += 15                     │
│  ├─ elif (RSI > 70) → confidence += 15                   │
│  ├─ elif (RSI 40-60) → confidence += 8 ✅ NOVO!         │
│  ├─ elif (RSI 60-70) → confidence += 10 ✅ NOVO!        │
│  └─ elif (RSI 30-40) → confidence += 10 ✅ NOVO!        │
│                                                           │
│  Analisa MACD:                                            │
│  ├─ if (MACD.histogram > 50) → confidence += 15          │
│  ├─ elif (MACD.histogram > 0) → confidence += 10         │
│  ├─ elif (MACD.histogram < -50) → confidence += 15       │
│  ├─ elif (MACD.histogram < 0) → confidence += 10         │
│  └─ else → confidence += 3 ✅ NOVO!                      │
│                                                           │
│  Analisa Padrão:                                          │
│  switch (pattern.type) {                                  │
│    case 'Order Block': confidence += 20; break;          │
│    case 'FVG': confidence += 15; break;                  │
│    case 'CHOCH': confidence += 25; break;                │
│    case 'BOS': confidence += 20; break;                  │
│    default: confidence += (adaptativo 5-15) ✅ NOVO!     │
│  }                                                        │
│                                                           │
│  DECISÃO FINAL ADAPTATIVA:                               │
│  if (confidence >= marketContext.threshold) {            │
│    recommendation = 'GENERATE_SIGNAL';                   │
│    finalConfidence = min(confidence, 95);                │
│  } else {                                                 │
│    recommendation = 'WAIT';                               │
│  }                                                        │
│                                                           │
│  Exemplo:                                                 │
│  • Mercado forte: 65% vs 55% threshold = ✅ APROVADO     │
│  • Mercado fraco: 65% vs 70% threshold = ❌ WAIT         │
│                                                           │
│  Tempo: ~50ms                                             │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  [14] GERAÇÃO DE RESPOSTA                                │
│  ────────────────────────────────────────────────────── │
│  Arquivo: index.ts (linha 866-1050)                      │
│  Função: buildIntelligentResponse()                      │
│                                                           │
│  Monta resposta contextualizada baseada em tipo:         │
│                                                           │
│  switch (contextType) {                                   │
│    case 'greeting':                                       │
│      → "${getTimeBasedGreeting()}! Pronto para analisar?"│
│                                                           │
│    case 'analysis_start':                                │
│      → Análise completa estruturada:                     │
│        • Preço atual + variação                          │
│        • Indicadores (RSI, MACD, EMAs)                   │
│        • Padrões detectados                              │
│        • Sentimento (Fear & Greed)                       │
│        • Cenários probabilísticos                        │
│        • Recomendação                                     │
│        • Conhecimento relacionado                        │
│                                                           │
│    case 'question':                                       │
│      → Responde com conhecimento técnico                 │
│      → Exemplos práticos                                  │
│      → Referências                                        │
│                                                           │
│    case 'finalization':                                   │
│      → "Bons trades! Lembre-se: [insight]"              │
│                                                           │
│    case 'narrator-consultation':                         │
│      → Resposta específica para validação:               │
│        "🧠 ANÁLISE DO AGENTE [PROFILE]: ..."             │
│        "✅ RECOMENDO: Gerar sinal" OU                    │
│        "⏸️ AGUARDAR: Confiança insuficiente"             │
│  }                                                        │
│                                                           │
│  Tempo: ~50ms                                             │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  [15] AUTO-APRENDIZADO                                   │
│  ────────────────────────────────────────────────────── │
│  Arquivo: index.ts (linha 1370-1447)                     │
│  Função: extractAndSaveKnowledge()                       │
│                                                           │
│  Se feedback_score >= 4 (alta satisfação):               │
│                                                           │
│  1. Extrai tópico principal:                             │
│     topic = extractMainTopic(question, response)         │
│                                                           │
│  2. Categoriza conhecimento:                             │
│     category = categorizeKnowledge(response, contextType)│
│                                                           │
│  3. Extrai exemplos práticos:                            │
│     examples = extractExamples(response)                 │
│                                                           │
│  4. Salva no banco:                                       │
│     INSERT INTO bot_knowledge (                          │
│       topic,                                              │
│       category,                                           │
│       content: response,                                  │
│       examples: JSONB,                                    │
│       accuracy_score: 0.8,                                │
│       metadata: { source, timestamp, feedback }           │
│     )                                                     │
│     ON CONFLICT (topic) DO UPDATE                         │
│       SET accuracy_score = (old + 0.8) / 2              │
│                                                           │
│  Tempo: ~200ms (assíncrono)                              │
└─────────────────────────────────────────────────────────┘
    │
    ▼
📤 OUTPUT: Resposta Completa
    │
    {
      response: string (markdown formatado),
      contextType: string,
      referenceChunks: string[],
      conversationState: object,
      recommendation?: 'GENERATE_SIGNAL' | 'WAIT',
      confidence?: number
    }
```

---

## 📊 **ORDEM DAS QUERIES NO BANCO:**

```
SEQUÊNCIA DE QUERIES (ordem cronológica):

1️⃣ match_messages() - Busca semântica
   └─ SELECT ... FROM chat_messages WHERE ... (~100ms)

2️⃣ bot_knowledge - Conhecimento técnico
   └─ SELECT ... FROM bot_knowledge WHERE topic ILIKE ... (~150ms)

3️⃣ narrator_signals - Sinais recentes
   └─ SELECT ... FROM narrator_signals WHERE user_id ... (~100ms)

4️⃣ market_m1 - Timeframe M1
   └─ SELECT ... FROM market_m1 WHERE symbol ... (~75ms)

5️⃣ market_m5 - Timeframe M5
   └─ SELECT ... FROM market_m5 WHERE symbol ... (~75ms)

6️⃣ market_m15 - Timeframe M15
   └─ SELECT ... FROM market_m15 WHERE symbol ... (~75ms)

7️⃣ market_m30 - Timeframe M30
   └─ SELECT ... FROM market_m30 WHERE symbol ... (~75ms)

8️⃣ ai_trades - Histórico de trades
   └─ SELECT ... FROM ai_trades WHERE user_id ... (~100ms)

9️⃣ UPDATE bot_knowledge - Incrementa usage_count
   └─ UPDATE bot_knowledge SET usage_count = usage_count + 1 (~50ms)

🔟 INSERT bot_knowledge - Auto-aprendizado (se feedback alto)
   └─ INSERT INTO bot_knowledge ... ON CONFLICT ... (~200ms)

═══════════════════════════════════════════════════════════
TEMPO TOTAL QUERIES: ~700-1000ms
TEMPO TOTAL RESPOSTA: ~1500-2000ms (com processamento)
```

---

## 🔍 **DETALHAMENTO: BUSCA SEMÂNTICA**

```sql
-- Função: match_messages (PostgreSQL + pgvector)
-- Arquivo: Migration que cria a função

CREATE OR REPLACE FUNCTION match_messages(
  query_embedding VECTOR(384),
  match_user_id UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  role TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    chat_messages.id,
    chat_messages.content,
    chat_messages.role,
    chat_messages.metadata,
    1 - (chat_messages.embedding <=> query_embedding) AS similarity
  FROM chat_messages
  WHERE chat_messages.user_id = match_user_id
    AND 1 - (chat_messages.embedding <=> query_embedding) > match_threshold
  ORDER BY chat_messages.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Como funciona:
-- 1. Recebe vetor [384 dimensões] da mensagem atual
-- 2. Compara com TODOS os embeddings de chat_messages do usuário
-- 3. Calcula similaridade de cosseno (1 - distância)
-- 4. Filtra apenas > 0.7 (70% similaridade mínima)
-- 5. Ordena por similaridade (mais similar primeiro)
-- 6. Retorna top 5

-- Performance:
-- Com pgvector: ~100ms para milhares de mensagens
-- Sem pgvector: ~500ms+ (scan completo)
```

---

## 🗄️ **TABELAS CONSULTADAS (EM ORDEM):**

```
╔═══════════════════════════════════════════════════════════╗
║  TABELA              QUERY                    TEMPO       ║
╠═══════════════════════════════════════════════════════════╣
║  chat_messages       match_messages()         ~100ms      ║
║  bot_knowledge       WHERE topic ILIKE        ~150ms      ║
║  narrator_signals    ORDER BY created_at      ~100ms      ║
║  market_m1           WHERE symbol + user_id   ~75ms       ║
║  market_m5           WHERE symbol + user_id   ~75ms       ║
║  market_m15          WHERE symbol + user_id   ~75ms       ║
║  market_m30          WHERE symbol + user_id   ~75ms       ║
║  ai_trades           WHERE user_id            ~100ms      ║
╚═══════════════════════════════════════════════════════════╝

TOTAL: 8 tabelas | ~750ms
```

---

## 🎯 **CONTEXTO MONTADO PARA RESPOSTA:**

```javascript
// O que o Agente "vê" antes de responder:

const contextForResponse = {
  // 1. Mensagem do usuário
  userMessage: "Analise BTC agora",
  
  // 2. Busca semântica (histórico)
  semanticContext: [
    { content: "Análise anterior similar...", similarity: 0.85 },
    { content: "Outra análise relacionada...", similarity: 0.78 }
  ],
  
  // 3. Dados Binance real-time
  binanceData: {
    symbol: 'BTCUSDT',
    price: 121423.45,
    change24h: +2.34,
    volume24h: 12345.67,
    high24h: 122000,
    low24h: 120500
  },
  
  // 4. Indicadores calculados
  indicators: {
    fearGreedIndex: 67,
    buyerDominance: 64,
    marketPressure: 'OTIMISTA',
    trend: 'ALTISTA'
  },
  
  // 5. Multi-timeframe
  multiTimeframe: {
    m1: { trend: 'bullish', analysis: '...' },
    m5: { trend: 'bullish', analysis: '...' },
    m15: { trend: 'neutral', analysis: '...' },
    m30: { trend: 'bullish', analysis: '...' }
  },
  
  // 6. Conhecimento técnico
  knowledge: [
    { topic: 'Order Blocks', content: '...', accuracy_score: 0.9 },
    { topic: 'FVG', content: '...', accuracy_score: 0.85 }
  ],
  
  // 7. Sinais do Narrador
  narratorSignals: [
    { type: 'BUY', probability: 85, pattern: 'Order Block + FVG' }
  ],
  
  // 8. Cenários simulados
  scenarios: [
    { type: 'BULLISH', prob: 75%, entry: 121650, sl: 121400, tp: 123500 },
    { type: 'BEARISH', prob: 20%, ... },
    { type: 'NEUTRAL', prob: 5%, ... }
  ],
  
  // 9. Sistema Adaptativo
  adaptiveContext: {
    profile: 'AGRESSIVO',
    threshold: 55,
    signalStrength: 82,
    baseConfidence: 65
  },
  
  // 10. Histórico de trades
  tradesHistory: [
    { type: 'WIN', pnl: +50, pattern: 'Order Block' },
    { type: 'WIN', pnl: +30, pattern: 'FVG' }
  ]
};

// Com TUDO isso, o Agente gera uma resposta ULTRA contextualizada!
```

---

## 📝 **EXEMPLO DE RESPOSTA GERADA:**

```markdown
Bom dia! Vamos ver o BTC/USDT agora:

📊 **ANÁLISE TÉCNICA**

**Contexto Atual:**
- Preço: $121,423.45 (+2.34% 24h)
- Tendência: ALTISTA
- Momentum: Forte
- Volatilidade: Moderada

**Indicadores:**
- RSI(14): 65 - Zona saudável, espaço para subir
- MACD: +45.3 - Cruzamento bullish confirmado
- EMAs: 9>20>21>50>100>200 - Alinhamento altista perfeito

**Padrões Detectados:**
- Order Block bullish em $121,400 - suporte forte
- FVG preenchido - zona de demanda confirmada

**Sentimento:**
- Fear & Greed: 67 (Ganância) - mercado otimista
- Compradores: 64% - domínio comprador

**Cenários Probabilísticos:**
🟢 BULLISH (75%): Rompimento $121,650 → $123,500
🟡 NEUTRAL (20%): Consolidação $121,400-$121,650
🔴 BEARISH (5%): Improvável

**[PERFIL AGRESSIVO ATIVO - Threshold 55%]**

**Recomendação:**
Setup válido para entrada long acima $121,650.
Stop técnico: $121,400 | R/R: 1:3

💡 **Conhecimento:** Order Blocks são zonas de interesse 
institucional onde smart money acumula posições...
```

---

## 🚀 **PARA CRIAR UM NOVO SISTEMA BASEADO NESSE:**

### **Arquitetura Recomendada:**

```
1. CLASSE PRINCIPAL (como TradeVisionAI):
   ├─ private supabase: Client
   ├─ private cache: Map<string, any>
   ├─ private semanticSearch: SemanticSearch
   └─ async generateResponse(message, userId, context)

2. MÉTODOS ESSENCIAIS:
   ├─ detectContextType() - Identifica tipo de mensagem
   ├─ fetchRealTimeData() - Busca dados externos
   ├─ findRelevantKnowledge() - Busca no bot_knowledge
   ├─ getSemanticContext() - Busca semântica
   ├─ calculateIndicators() - Cálculos técnicos
   ├─ simulateScenarios() - Probabilidades
   ├─ buildResponse() - Monta resposta
   └─ saveKnowledge() - Auto-aprendizado

3. PIPELINE:
   Input → Validate → Search → Calculate → Decide → Respond → Learn

4. OTIMIZAÇÕES:
   ├─ Cache (30s-5min)
   ├─ Queries paralelas
   ├─ Limites (top 3-5)
   └─ Fallbacks inteligentes
```

---

**Quer que eu crie um template base para você começar um novo sistema?** 🚀

---

## 🤖 **APÊNDICE: QUAL LLM O TRADEVISION USA?**

### **RESPOSTA CURTA: Google Gemini 2.5 Flash (via Lovable AI Gateway)**

### **DETALHES TÉCNICOS:**

```typescript
// Arquivo: supabase/functions/trade-chat/index.ts
// Linhas: 370-395 (visão) e 501-540 (conversação)

const llmResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'google/gemini-2.5-flash',  // ← MODELO USADO
    messages: [...],
    temperature: 0.3,
  }),
});
```

---

### **COMPARAÇÃO: ATUAL vs OLLAMA + LLAMA 3.1**

```
╔════════════════════════════════════════════════════════════════════════════╗
║  CRITÉRIO              │  ATUAL (Gemini)          │  OLLAMA + LLAMA 3.1     ║
╠════════════════════════════════════════════════════════════════════════════╣
║  Onde roda?            │  Serverless (Deno Edge)  │  Seu servidor           ║
║  Infraestrutura?       │  Zero                    │  GPU/CPU dedicado       ║
║  Custo mensal?         │  Grátis (até out/2025)   │  Servidor ~$50-200/mês  ║
║  Latência?             │  ~1-2s                   │  ~2-5s (dependendo CPU) ║
║  Escalabilidade?       │  Automática (infinita)   │  Limitada (RAM/GPU)     ║
║  Manutenção?           │  Zero                    │  Updates, monitoring    ║
║  Qualidade resposta?   │  Alta (GPT-4 level)      │  Boa (GPT-3.5 level)    ║
║  Contexto?             │  1M tokens               │  128k tokens            ║
║  Visão (imagem)?       │  ✅ Sim (nativo)         │  ❌ Não (precisa modelo extra) ║
║  Privacidade?          │  Google processa         │  100% privado           ║
║  Setup inicial?        │  5 minutos (var env)     │  2-4 horas              ║
╚════════════════════════════════════════════════════════════════════════════╝
```

---

### **ARQUITETURA ATUAL (GEMINI):**

```
┌─────────────────────────────────────────────────────────────┐
│  Usuário envia mensagem                                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  TradeVision IA (Edge Function)                              │
│  ├─ Busca dados (Supabase, Binance)                         │
│  ├─ Busca semântica (pgvector)                              │
│  ├─ Calcula indicadores                                      │
│  ├─ Monta contexto rico                                      │
│  └─ Envia para Gemini 2.5 Flash                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Lovable AI Gateway (OpenRouter)                            │
│  └─ Roteia para Google Gemini API                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Google Gemini 2.5 Flash                                     │
│  ├─ Processa contexto (1M tokens)                           │
│  ├─ Gera resposta humanizada                                │
│  └─ Retorna JSON                                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Resposta para usuário                                       │
│  Tempo total: ~1.5-2s                                        │
└─────────────────────────────────────────────────────────────┘

💰 CUSTO: Grátis até out/2025
🚀 ESCALABILIDADE: Infinita (serverless)
⚡ LATÊNCIA: ~1-2s
```

---

### **SE VOCÊ MIGRAR PARA OLLAMA + LLAMA 3.1:**

```
┌─────────────────────────────────────────────────────────────┐
│  Usuário envia mensagem                                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  TradeVision IA (Edge Function)                              │
│  ├─ Busca dados (Supabase, Binance)                         │
│  ├─ Busca semântica (pgvector)                              │
│  ├─ Calcula indicadores                                      │
│  ├─ Monta contexto rico                                      │
│  └─ Envia para SEU SERVIDOR Ollama                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  SEU SERVIDOR (VPS/Dedicado)                                 │
│  ├─ Ollama rodando 24/7                                      │
│  ├─ LLaMA 3.1 carregado (7GB RAM)                           │
│  ├─ CPU/GPU processando                                      │
│  └─ Retorna resposta                                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Resposta para usuário                                       │
│  Tempo total: ~2-5s (dependendo do hardware)                │
└─────────────────────────────────────────────────────────────┘

💰 CUSTO: Servidor ~$50-200/mês + manutenção
🚀 ESCALABILIDADE: Limitada (RAM/GPU)
⚡ LATÊNCIA: ~2-5s (CPU) ou ~1-2s (GPU)

📋 REQUISITOS MÍNIMOS:
├─ CPU: 8+ cores
├─ RAM: 16GB+ (8GB para modelo + 8GB sistema)
├─ GPU: Opcional (acelera 3-5x)
├─ Storage: 50GB+ (modelos)
└─ Sistema: Ubuntu 22.04+ ou Docker
```

---

### **VANTAGENS E DESVANTAGENS:**

#### **✅ GEMINI (ATUAL):**
**Vantagens:**
- ✅ Zero infraestrutura
- ✅ Zero manutenção
- ✅ Escalabilidade infinita
- ✅ Latência baixa (1-2s)
- ✅ Visão (imagens) nativa
- ✅ Contexto gigante (1M tokens)
- ✅ Grátis até out/2025
- ✅ Sempre atualizado
- ✅ Qualidade GPT-4 level

**Desvantagens:**
- ❌ Google processa dados
- ❌ Dependência externa
- ❌ Custo futuro (porém baixo)

---

#### **🏠 OLLAMA + LLAMA 3.1:**
**Vantagens:**
- ✅ 100% privado
- ✅ Zero dependência externa
- ✅ Customizável (fine-tuning)
- ✅ Custo previsível

**Desvantagens:**
- ❌ Precisa servidor dedicado
- ❌ Manutenção constante
- ❌ Custo servidor ($50-200/mês)
- ❌ Latência maior (2-5s CPU)
- ❌ Escalabilidade limitada
- ❌ Sem visão de imagens (precisa modelo extra)
- ❌ Contexto menor (128k tokens)
- ❌ Qualidade inferior (GPT-3.5 level)
- ❌ Setup complexo (2-4 horas)

---

### **QUANDO FARIA SENTIDO MIGRAR PARA OLLAMA?**

```
✅ SE:
├─ Você tem servidor dedicado disponível
├─ Precisa de 100% privacidade (dados sensíveis)
├─ Quer customizar/treinar modelo
├─ Tem equipe técnica para manutenção
└─ Volume altíssimo (>100k msgs/mês)

❌ NÃO MIGRE SE:
├─ Quer simplicidade (atual é perfeito)
├─ Não quer gerenciar servidor
├─ Custo atual é OK (grátis até out/2025)
├─ Qualidade atual atende
└─ Não tem expertise em DevOps/LLMs
```

---

### **RECOMENDAÇÃO FINAL:**

**MANTENHA O GEMINI** pelo menos até outubro/2025. Motivos:

1. **Grátis** por mais 10 meses
2. **Zero manutenção** (mais tempo para features)
3. **Escalabilidade infinita** (não se preocupe com carga)
4. **Qualidade superior** (Gemini >> LLaMA 3.1 8B)
5. **Visão nativa** (seu sistema analisa imagens!)
6. **1M tokens de contexto** (vs 128k do LLaMA)

💡 **Se o custo ficar alto depois de out/2025, DAÍI você avalia migração.**

Mas por enquanto, você tem o **melhor setup possível**: serverless, escalável, poderoso e grátis! 🚀
