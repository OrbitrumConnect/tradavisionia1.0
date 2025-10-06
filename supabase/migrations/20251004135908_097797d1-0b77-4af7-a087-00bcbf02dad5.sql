-- Popular bot_knowledge com conteúdo técnico de day trade
-- WYCKOFF
INSERT INTO bot_knowledge (category, topic, content, examples, accuracy_score) VALUES
(
  'wyckoff',
  'Spring (Varrida de Liquidez)',
  'Spring é um movimento de varrida abaixo do suporte de uma estrutura de acumulação, seguido de retorno imediato acima do nível. Indica que o Smart Money coletou liquidez dos stops e está pronto para reverter. Confirma quando: 1) Volume baixo na varrida, 2) Retorno rápido acima da estrutura, 3) Candle de rejeição forte.',
  '[
    "BTC varre $60k (suporte) desce até $59.5k com volume baixo, depois retorna para $60.5k em 15min com volume alto = Spring confirmado",
    "ETH acumulando em range $3000-$3200. Varrida em $2980 (stops abaixo de $3k), retorno imediato para $3100 = Entrada long"
  ]'::jsonb,
  0.92
),
(
  'wyckoff',
  'BOS - Break of Structure',
  'Break of Structure (BOS) confirma mudança de intenção ao romper topo anterior (bullish) ou fundo anterior (bearish). É diferente de falso rompimento pois mantém-se acima/abaixo do nível com volume confirmatório. Checklist: 1) Rompe topo/fundo anterior, 2) Fecha acima/abaixo com corpo de vela, 3) Volume aumenta no rompimento, 4) Reteste do nível confirma.',
  '[
    "BTC forma topos em $62k, $63k, $64k. Rompe $64k e fecha em $64.5k com volume 2x maior = BOS bullish confirmado",
    "Tendência de baixa com fundos em $58k, $57k, $56k. Rompe $56k para baixo e fecha em $55.5k = BOS bearish"
  ]'::jsonb,
  0.88
),
(
  'wyckoff',
  'CHoCH - Change of Character',
  'Change of Character (CHoCH) indica reversão de tendência ao romper estrutura interna. Em alta: rompe último fundo. Em baixa: rompe último topo. É sinal de atenção, não entrada. Aguardar BOS para confirmar nova tendência. CHoCH + Spring = setup de alta probabilidade.',
  '[
    "Tendência de alta com topos e fundos ascendentes. Rompe último fundo = CHoCH bearish, aguardar BOS para entrada short",
    "Baixa com fundos descendentes. Rompe último topo = CHoCH bullish. Se seguido de Spring = entrada long"
  ]'::jsonb,
  0.85
),

-- ORDER BLOCKS & FVG
(
  'orderblock',
  'Order Block Institucional',
  'Order Block (OB) é zona de última ordem institucional antes de movimento forte. Identifica-se pela última vela antes de impulso com corpo grande (>70% da vela). OB atua como suporte/resistência forte. Para validar: 1) Vela antes de impulso >50 pips, 2) Movimento seguinte >100 pips, 3) Reteste da zona = oportunidade de entrada.',
  '[
    "BTC em $61k, última vela bullish fecha em $61.2k, seguida de impulso para $63k. OB = zona $61k-$61.2k. Reteste = entrada long",
    "ETH quebra $3200, impulso para $3000. Última vela bearish em $3180-$3200 = OB de resistência. Reteste = entrada short"
  ]'::jsonb,
  0.90
),
(
  'orderblock',
  'FVG - Fair Value Gap',
  'Fair Value Gap (FVG) é desequilíbrio de preço (gap) entre 3 velas consecutivas onde a sombra da vela 1 não toca o corpo da vela 3. Mercado tende a preencher 50-75% do gap. FVG em timeframe maior (H4/D1) tem maior probabilidade. Combinado com OB = confluência forte.',
  '[
    "Vela 1: $60k-$60.5k, Vela 2: impulso $60.5k-$61.5k, Vela 3: $61.5k-$62k. FVG = zona $60.5k-$61.5k não tocada. Retorno esperado para $60.8k-$61k",
    "FVG bearish: Vela 1 topo $3200, Vela 3 fundo $3100. Gap entre $3150-$3180 = zona de retorno esperada"
  ]'::jsonb,
  0.87
),

-- GESTÃO DE RISCO
(
  'risco',
  'Stop Loss Técnico',
  'Stop loss SEMPRE baseado em estrutura técnica, NUNCA em % fixo. Posicionar: 1) Abaixo/acima de OB + buffer ATR, 2) Além da liquidez óbvia (evitar stop hunting), 3) Considerar spread + volatilidade. RR mínimo 1:2, ideal 1:3+. Stop muito apertado = ruído tira você fora. Stop muito largo = risco excessivo.',
  '[
    "Entrada long em $60k. OB em $59.5k-$59.8k. ATR = 0.3%. Stop = $59.4k (abaixo OB + buffer). TP1 = $61.2k (RR 1:2)",
    "Entrada short $3200. Última liquidez em $3220. Stop = $3230 (acima liquidez + spread). TP = $3050 (RR 1:5)"
  ]'::jsonb,
  0.95
),
(
  'risco',
  'Risk-Reward Ratio',
  'Risk-Reward (RR) mede relação entre risco e lucro potencial. RR 1:2 = para cada $1 arriscado, objetivo $2 lucro. Nunca operar abaixo de 1:2. Setups de alta probabilidade (Spring + OB + FVG) justificam RR 1:3 ou maior. Win rate 40% com RR 1:3 = lucrativo a longo prazo.',
  '[
    "Risco $100 (stop $60k → $59.9k). TP1 $200 lucro ($60k → $60.2k) = RR 1:2",
    "Risco 1% conta ($1000). TP 3% ($3000) = RR 1:3. Com 50% win rate: 5 wins $15k, 5 losses $5k = +$10k líquido"
  ]'::jsonb,
  0.93
),

-- CONTEXTO MACRO
(
  'macro',
  'Halving Bitcoin',
  'Halving reduz recompensa de mineração pela metade (~cada 4 anos). Reduz oferta nova de BTC em 50%. Histórico: bull run ocorre 12-18 meses PÓS-halving, não durante. Ciclo: Halving → Acumulação institucional → Distribuição varejista → Topo. Último halving: Abril 2024. Esperar movimento forte Q4 2025 - Q2 2026.',
  '[
    "Halving 2020 (Maio): Topo do ciclo Nov 2021 ($69k) = 18 meses depois",
    "Halving 2024 (Abril): Projeção topo Q4 2025 / Q1 2026 baseado em ciclos anteriores"
  ]'::jsonb,
  0.80
),
(
  'macro',
  'ETFs Spot & Liquidez Institucional',
  'ETFs Spot (aprovados Jan 2024) compram BTC físico, drenam liquidez de exchanges. Fluxo positivo = pressão compradora. Acompanhar: 1) Fluxos diários (>$100M/dia = bullish), 2) Total AUM crescendo = demanda institucional, 3) Correlação: fluxos altos + baixa volatilidade = acumulação silenciosa. ETFs + halving = super ciclo potencial.',
  '[
    "Jan-Mar 2024: ETFs absorvem 200k BTC. Preço sobe $40k → $73k mesmo com venda Mt.Gox = poder institucional",
    "Fluxo semanal: BlackRock +$500M, Fidelity +$300M = $800M entrada institucional = setup bullish H4/D1"
  ]'::jsonb,
  0.82
),

-- PADRÕES GRÁFICOS
(
  'padroes',
  'Triângulo Ascendente (Bullish)',
  'Formado por: 1) Resistência horizontal (topos no mesmo nível), 2) Suporte ascendente (fundos cada vez mais altos), 3) Volume diminui durante formação, aumenta no breakout. Rompimento acima da resistência = entrada long. Alvo: altura da base do triângulo projetada do breakout. Falha: rompe suporte = reversão bearish.',
  '[
    "BTC: Resistência $65k testada 3x, suporte sobe $62k → $63k → $64k. Breakout $65.5k com volume = alvo $68k ($65k + $3k altura)",
    "ETH: Topo $3500 flat, fundos $3200 → $3300 → $3400. Rompe $3500 = entrada, alvo $3800"
  ]'::jsonb,
  0.86
),
(
  'padroes',
  'Bandeira (Flag) - Continuação',
  'Padrão de continuação após movimento forte: 1) Mastro (impulso forte), 2) Bandeira (consolidação em canal paralelo contrário ao movimento), 3) Breakout na direção do mastro. Alta probabilidade quando: volume alto no mastro, baixo na bandeira, breakout com volume. Alvo = altura do mastro projetada.',
  '[
    "BTC impulso $58k → $62k (mastro $4k). Consolida $61k-$62k em canal descendente por 6h. Rompe $62k = alvo $66k",
    "Flag bearish: Queda $3500 → $3200 (mastro $300). Consolida $3250-$3300 (canal ascendente). Rompe $3200 = alvo $2900"
  ]'::jsonb,
  0.84
);

-- Criar índices para melhor performance nas buscas
CREATE INDEX IF NOT EXISTS idx_bot_knowledge_category ON bot_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_bot_knowledge_usage ON bot_knowledge(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_bot_knowledge_accuracy ON bot_knowledge(accuracy_score DESC);