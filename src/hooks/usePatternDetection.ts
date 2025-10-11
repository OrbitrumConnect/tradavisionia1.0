import { useMemo } from 'react';
import { Candle } from './useTechnicalIndicators';

export interface PatternDetection {
  // Order Blocks
  orderBlockDetected: boolean;
  orderBlockType: 'bullish' | 'bearish' | null;
  orderBlockPrice: number | null;
  
  // Fair Value Gaps
  fvgDetected: boolean;
  fvgType: 'bullish' | 'bearish' | null;
  fvgUpper: number | null;
  fvgLower: number | null;
  
  // Wyckoff Patterns
  springDetected: boolean;
  upthrustDetected: boolean;
  
  // Market Structure
  bosDetected: boolean; // Break of Structure
  chochDetected: boolean; // Change of Character
  liquiditySweep: boolean;
  
  // Support/Resistance
  supportLevel: number | null;
  resistanceLevel: number | null;
  
  // 🆕 Advanced Geometric Patterns (Price Action Matemática)
  triangleDetected: boolean;
  triangleType: 'symmetric' | 'ascending' | 'descending' | null;
  triangleConvergence: number | null; // Número de candles até convergência
  triangleHeight: number | null;
  triangleTarget: number | null;
  
  bandeiraDetected: boolean;
  bandeiraType: 'bullish' | 'bearish' | null;
  bandeiraInclinacao: number | null; // Graus de inclinação
  bandeiraAlvo: number | null;
  
  cunhaDetected: boolean;
  cunhaType: 'rising' | 'falling' | null;
  cunhaConvergence: number | null;
  cunhaTarget: number | null;
  
  elliottDetected: boolean;
  elliottWave: number | null; // Número da onda (1-5, ou A, B, C)
  elliottTarget: number | null;
  elliottPhase: 'impulsive' | 'corrective' | null;
  
  // 🕯️ Candlestick Patterns (Padrões de Vela)
  candlePatternDetected: boolean;
  candlePatternType: string | null;
  candlePatternStrength: 'weak' | 'moderate' | 'strong' | null;
  candlePatternDirection: 'bullish' | 'bearish' | null;
  candlePatternMessage: string | null;
  
  // Pattern Name
  patternName: string | null;
  patternMessage: string | null; // 🆕 Mensagem explicativa automática
}

export const usePatternDetection = (candles: Candle[]) => {
  return useMemo(() => {
    if (candles.length < 50) return null;
    
    return detectPatterns(candles);
  }, [candles]);
};

// Detectar Order Blocks (último candle de momentum antes de reverter)
function detectOrderBlock(candles: Candle[]): {
  detected: boolean;
  type: 'bullish' | 'bearish' | null;
  price: number | null;
} {
  if (candles.length < 10) return { detected: false, type: null, price: null };
  
  const recent = candles.slice(-10);
  const last = recent[recent.length - 1];
  const prev = recent[recent.length - 2];
  
  // Bullish OB: candle de alta volume seguido de reversão
  const bullishOB = 
    prev.close > prev.open && // Candle verde
    (prev.high - prev.low) > (last.high - last.low) * 1.5 && // Alto range
    prev.volume > last.volume * 1.2 && // Alto volume
    last.close < prev.low; // Reversão
  
  if (bullishOB) {
    return {
      detected: true,
      type: 'bullish',
      price: prev.low
    };
  }
  
  // Bearish OB: candle de baixa volume seguido de reversão
  const bearishOB =
    prev.close < prev.open &&
    (prev.high - prev.low) > (last.high - last.low) * 1.5 &&
    prev.volume > last.volume * 1.2 &&
    last.close > prev.high;
  
  if (bearishOB) {
    return {
      detected: true,
      type: 'bearish',
      price: prev.high
    };
  }
  
  return { detected: false, type: null, price: null };
}

// Detectar Fair Value Gaps (gaps entre candles)
function detectFVG(candles: Candle[]): {
  detected: boolean;
  type: 'bullish' | 'bearish' | null;
  upper: number | null;
  lower: number | null;
} {
  if (candles.length < 3) return { detected: false, type: null, upper: null, lower: null };
  
  const recent = candles.slice(-3);
  const [c1, c2, c3] = recent;
  
  // Bullish FVG: gap entre low de c3 e high de c1
  const bullishGap = c3.low > c1.high;
  if (bullishGap) {
    return {
      detected: true,
      type: 'bullish',
      upper: c3.low,
      lower: c1.high
    };
  }
  
  // Bearish FVG: gap entre high de c3 e low de c1
  const bearishGap = c3.high < c1.low;
  if (bearishGap) {
    return {
      detected: true,
      type: 'bearish',
      upper: c1.low,
      lower: c3.high
    };
  }
  
  return { detected: false, type: null, upper: null, lower: null };
}

// Detectar Spring (Wyckoff - sweep de liquidez + reversão)
function detectSpring(candles: Candle[]): boolean {
  if (candles.length < 20) return false;
  
  const recent = candles.slice(-20);
  
  // Encontrar suporte recente
  const lows = recent.map(c => c.low);
  const support = Math.min(...lows.slice(0, -5)); // Suporte dos primeiros 15
  
  const last5 = recent.slice(-5);
  const sweep = last5.some(c => c.low < support * 0.998); // Sweep abaixo
  
  if (!sweep) return false;
  
  // Verificar reversão forte
  const lastCandle = recent[recent.length - 1];
  const recoveryAboveSupport = lastCandle.close > support;
  const highVolume = lastCandle.volume > recent.slice(-10, -1).reduce((sum, c) => sum + c.volume, 0) / 9;
  
  return recoveryAboveSupport && highVolume;
}

// Detectar Upthrust (inverso do Spring)
function detectUpthrust(candles: Candle[]): boolean {
  if (candles.length < 20) return false;
  
  const recent = candles.slice(-20);
  
  const highs = recent.map(c => c.high);
  const resistance = Math.max(...highs.slice(0, -5));
  
  const last5 = recent.slice(-5);
  const sweep = last5.some(c => c.high > resistance * 1.002);
  
  if (!sweep) return false;
  
  const lastCandle = recent[recent.length - 1];
  const rejectionBelowResistance = lastCandle.close < resistance;
  const highVolume = lastCandle.volume > recent.slice(-10, -1).reduce((sum, c) => sum + c.volume, 0) / 9;
  
  return rejectionBelowResistance && highVolume;
}

// Detectar Break of Structure (quebra de estrutura de mercado)
function detectBOS(candles: Candle[]): boolean {
  if (candles.length < 30) return false;
  
  const recent = candles.slice(-30);
  const highs = recent.map(c => c.high);
  const lows = recent.map(c => c.low);
  
  // Encontrar último high/low significativo
  const recentHigh = Math.max(...highs.slice(-10, -3));
  const recentLow = Math.min(...lows.slice(-10, -3));
  
  const currentPrice = recent[recent.length - 1].close;
  
  // Bullish BOS: quebra de high anterior
  const bullishBOS = currentPrice > recentHigh * 1.01;
  
  // Bearish BOS: quebra de low anterior  
  const bearishBOS = currentPrice < recentLow * 0.99;
  
  return bullishBOS || bearishBOS;
}

// Detectar Change of Character (mudança de comportamento)
function detectChoCh(candles: Candle[]): boolean {
  if (candles.length < 20) return false;
  
  const recent = candles.slice(-20);
  const first10 = recent.slice(0, 10);
  const last10 = recent.slice(-10);
  
  // Calcular momentum das duas metades
  const firstMomentum = (first10[9].close - first10[0].close) / first10[0].close;
  const lastMomentum = (last10[9].close - last10[0].close) / last10[0].close;
  
  // ChoCh: reversão de momentum
  const momentumReversed = (firstMomentum > 0.01 && lastMomentum < -0.01) ||
                           (firstMomentum < -0.01 && lastMomentum > 0.01);
  
  return momentumReversed;
}

// Detectar Liquidity Sweep
function detectLiquiditySweep(candles: Candle[]): boolean {
  if (candles.length < 15) return false;
  
  const recent = candles.slice(-15);
  const lows = recent.map(c => c.low);
  const highs = recent.map(c => c.high);
  
  const recentLow = Math.min(...lows.slice(0, -3));
  const recentHigh = Math.max(...highs.slice(0, -3));
  
  const last3 = recent.slice(-3);
  
  // Sweep de lows seguido de reversão
  const lowSweep = last3.some(c => c.low < recentLow * 0.998) &&
                   last3[2].close > recentLow * 1.001;
  
  // Sweep de highs seguido de reversão
  const highSweep = last3.some(c => c.high > recentHigh * 1.002) &&
                    last3[2].close < recentHigh * 0.999;
  
  return lowSweep || highSweep;
}

// ═══════════════════════════════════════════════════════════════
// 🧮 UTILIT ÁRIOS MATEMÁTICOS (Price Action)
// ═══════════════════════════════════════════════════════════════

// Regressão linear simples: y = mx + b
function linearRegression(points: Array<{x: number, y: number}>): { m: number, b: number } {
  const n = points.length;
  if (n < 2) return { m: 0, b: 0 };
  
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);
  
  const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const b = (sumY - m * sumX) / n;
  
  return { m, b };
}

// Calcular métricas de candle
function candleMetrics(c: Candle) {
  return {
    body: Math.abs(c.close - c.open),
    upperShadow: c.high - Math.max(c.open, c.close),
    lowerShadow: Math.min(c.open, c.close) - c.low,
    height: c.high - c.low,
    isBullish: c.close > c.open
  };
}

// ═══════════════════════════════════════════════════════════════
// 🕯️ PADRÕES DE VELA (Candlestick Patterns)
// ═══════════════════════════════════════════════════════════════

interface CandlePattern {
  detected: boolean;
  type: string | null;
  strength: 'weak' | 'moderate' | 'strong' | null;
  direction: 'bullish' | 'bearish' | null;
  message: string | null;
}

function detectCandlePatterns(candles: Candle[]): CandlePattern {
  if (candles.length < 3) {
    return { detected: false, type: null, strength: null, direction: null, message: null };
  }

  const recent = candles.slice(-3);
  const [prev2, prev, current] = recent.map(candleMetrics);
  const [c2, c1, c0] = recent; // Raw candles

  // 🕯️ DOJI (indecisão)
  const isDoji = current.body < current.height * 0.1; // Corpo < 10% da altura
  if (isDoji) {
    const isLongLegged = current.upperShadow > current.body * 3 && current.lowerShadow > current.body * 3;
    return {
      detected: true,
      type: isLongLegged ? 'Long-Legged Doji' : 'Doji',
      strength: 'moderate',
      direction: null, // Doji é neutro
      message: 'Doji detectado - indecisão no mercado. Possível reversão ou consolidação.'
    };
  }

  // 🔨 HAMMER (reversão bullish)
  const isHammer = 
    current.lowerShadow > current.body * 2 && // Sombra inferior > 2x corpo
    current.upperShadow < current.body * 0.3 && // Sombra superior pequena
    current.body < current.height * 0.3 && // Corpo pequeno
    c0.close < c1.low; // Preço abaixo da baixa anterior
  
  if (isHammer) {
    return {
      detected: true,
      type: 'Hammer',
      strength: 'strong',
      direction: 'bullish',
      message: 'Hammer detectado - forte reversão bullish. Rejeição de baixa + possível fundo.'
    };
  }

  // 🔫 SHOOTING STAR (reversão bearish)
  const isShootingStar = 
    current.upperShadow > current.body * 2 &&
    current.lowerShadow < current.body * 0.3 &&
    current.body < current.height * 0.3 &&
    c0.close > c1.high;
  
  if (isShootingStar) {
    return {
      detected: true,
      type: 'Shooting Star',
      strength: 'strong',
      direction: 'bearish',
      message: 'Shooting Star detectada - forte reversão bearish. Rejeição de alta + possível topo.'
    };
  }

  // 🐻 ENGULFING BULLISH (2 velas)
  const isBullishEngulfing = 
    !prev.isBullish && // Vela anterior bearish
    current.isBullish && // Vela atual bullish
    c0.open < c1.close && // Abre abaixo do close anterior
    c0.close > c1.open && // Fecha acima do open anterior
    current.body > prev.body; // Corpo maior
  
  if (isBullishEngulfing) {
    return {
      detected: true,
      type: 'Bullish Engulfing',
      strength: 'strong',
      direction: 'bullish',
      message: 'Bullish Engulfing - vela de alta engole vela de baixa. Forte reversão bullish.'
    };
  }

  // 🐂 ENGULFING BEARISH (2 velas)
  const isBearishEngulfing = 
    prev.isBullish &&
    !current.isBullish &&
    c0.open > c1.close &&
    c0.close < c1.open &&
    current.body > prev.body;
  
  if (isBearishEngulfing) {
    return {
      detected: true,
      type: 'Bearish Engulfing',
      strength: 'strong',
      direction: 'bearish',
      message: 'Bearish Engulfing - vela de baixa engole vela de alta. Forte reversão bearish.'
    };
  }

  // ⭐ MORNING STAR (3 velas - reversão bullish)
  const isMorningStar = 
    !prev2.isBullish && // 1ª vela bearish
    prev.body < prev2.body * 0.5 && // 2ª vela pequena (indecisão)
    current.isBullish && // 3ª vela bullish
    c0.close > c2.close + (c2.open - c2.close) * 0.5; // Fecha acima do meio da 1ª vela
  
  if (isMorningStar) {
    return {
      detected: true,
      type: 'Morning Star',
      strength: 'strong',
      direction: 'bullish',
      message: 'Morning Star - padrão de 3 velas indicando forte reversão bullish após queda.'
    };
  }

  // 🌙 EVENING STAR (3 velas - reversão bearish)
  const isEveningStar = 
    prev2.isBullish &&
    prev.body < prev2.body * 0.5 &&
    !current.isBullish &&
    c0.close < c2.close - (c2.close - c2.open) * 0.5;
  
  if (isEveningStar) {
    return {
      detected: true,
      type: 'Evening Star',
      strength: 'strong',
      direction: 'bearish',
      message: 'Evening Star - padrão de 3 velas indicando forte reversão bearish após alta.'
    };
  }

  // 📍 PIN BAR (pavio longo em uma direção)
  const isPinBar = 
    (current.lowerShadow > current.body * 2.5 || current.upperShadow > current.body * 2.5) &&
    current.body > current.height * 0.15; // Corpo não tão pequeno quanto Doji
  
  if (isPinBar) {
    const direction = current.lowerShadow > current.upperShadow ? 'bullish' : 'bearish';
    return {
      detected: true,
      type: 'Pin Bar',
      strength: 'moderate',
      direction,
      message: `Pin Bar ${direction} - rejeição forte em ${direction === 'bullish' ? 'baixa' : 'alta'}. Possível reversão.`
    };
  }

  // 📦 INSIDE BAR (vela dentro da anterior)
  const isInsideBar = 
    c0.high < c1.high &&
    c0.low > c1.low;
  
  if (isInsideBar) {
    return {
      detected: true,
      type: 'Inside Bar',
      strength: 'weak',
      direction: null,
      message: 'Inside Bar - consolidação/compressão. Aguardar rompimento para definir direção.'
    };
  }

  return { detected: false, type: null, strength: null, direction: null, message: null };
}

// ═══════════════════════════════════════════════════════════════
// 🔺 TRIÂNGULO (Convergência de linhas)
// ═══════════════════════════════════════════════════════════════

function detectTriangle(candles: Candle[]): {
  detected: boolean;
  type: 'symmetric' | 'ascending' | 'descending' | null;
  convergence: number | null;
  height: number | null;
  target: number | null;
  message: string | null;
} {
  if (candles.length < 20) {
    return { detected: false, type: null, convergence: null, height: null, target: null, message: null };
  }
  
  const recent = candles.slice(-20);
  
  // Extrair máximos e mínimos
  const highs = recent.map((c, i) => ({ x: i, y: c.high }));
  const lows = recent.map((c, i) => ({ x: i, y: c.low }));
  
  // Regressão linear nos máximos e mínimos
  const upperLine = linearRegression(highs);
  const lowerLine = linearRegression(lows);
  
  const m_sup = upperLine.m;
  const b_sup = upperLine.b;
  const m_inf = lowerLine.m;
  const b_inf = lowerLine.b;
  
  // Verificar se está convergindo (linhas se aproximando)
  const isConverging = Math.abs(m_sup - m_inf) > 0.001 && 
                       ((m_sup < 0 && m_inf > 0) || // Triângulo simétrico
                        (m_sup < -0.1 && m_inf < -0.05) || // Descendente
                        (m_sup > 0.05 && m_inf > 0.1)); // Ascendente
  
  if (!isConverging) {
    return { detected: false, type: null, convergence: null, height: null, target: null, message: null };
  }
  
  // Calcular ponto de convergência
  const x_convergence = (b_inf - b_sup) / (m_sup - m_inf);
  const candlesUntilConvergence = Math.round(x_convergence - 19);
  
  // Altura atual do triângulo
  const lastX = 19;
  const y_sup_last = m_sup * lastX + b_sup;
  const y_inf_last = m_inf * lastX + b_inf;
  const currentHeight = y_sup_last - y_inf_last;
  
  // Determinar tipo
  let type: 'symmetric' | 'ascending' | 'descending' = 'symmetric';
  if (m_sup < -0.1 && m_inf > -0.05 && m_inf < 0.05) type = 'descending';
  else if (m_sup > -0.05 && m_sup < 0.05 && m_inf > 0.1) type = 'ascending';
  
  // Projetar alvo (altura + preço de rompimento)
  const currentPrice = recent[recent.length - 1].close;
  const target = currentPrice + currentHeight;
  
  // Mensagem automática
  const message = `Triângulo ${type === 'symmetric' ? 'simétrico' : type === 'ascending' ? 'ascendente' : 'descendente'} em formação há ${recent.length} velas. Convergência prevista em ${candlesUntilConvergence > 0 ? candlesUntilConvergence : 'breve'}. Altura atual: ${currentHeight.toFixed(2)} pontos. Provável rompimento ${type === 'ascending' ? 'para alta' : type === 'descending' ? 'para baixa' : 'na direção da tendência'}.`;
  
  return {
    detected: true,
    type,
    convergence: candlesUntilConvergence > 0 ? candlesUntilConvergence : null,
    height: currentHeight,
    target,
    message
  };
}

// ═══════════════════════════════════════════════════════════════
// 🚩 BANDEIRA (Canal paralelo de continuação)
// ═══════════════════════════════════════════════════════════════

function detectBandeira(candles: Candle[]): {
  detected: boolean;
  type: 'bullish' | 'bearish' | null;
  inclinacao: number | null;
  alvo: number | null;
  message: string | null;
} {
  if (candles.length < 15) {
    return { detected: false, type: null, inclinacao: null, alvo: null, message: null };
  }
  
  // Tendência anterior (primeiros 10 candles)
  const trend = candles.slice(-15, -5);
  const trendChange = (trend[trend.length - 1].close - trend[0].close) / trend[0].close;
  
  if (Math.abs(trendChange) < 0.02) {
    return { detected: false, type: null, inclinacao: null, alvo: null, message: null };
  }
  
  const type: 'bullish' | 'bearish' = trendChange > 0 ? 'bullish' : 'bearish';
  
  // Bandeira (últimos 5 candles)
  const flag = candles.slice(-5);
  const highs = flag.map((c, i) => ({ x: i, y: c.high }));
  const lows = flag.map((c, i) => ({ x: i, y: c.low }));
  
  const upperLine = linearRegression(highs);
  const lowerLine = linearRegression(lows);
  
  // Verificar se linhas são paralelas (slopes similares)
  const isParallel = Math.abs(upperLine.m - lowerLine.m) < 0.5;
  
  if (!isParallel) {
    return { detected: false, type: null, inclinacao: null, alvo: null, message: null };
  }
  
  // Inclinação média (em graus aproximados)
  const avgSlope = (upperLine.m + lowerLine.m) / 2;
  const inclinacao = Math.atan(avgSlope) * (180 / Math.PI);
  
  // Verificar se inclinação é contra a tendência
  const isCounterTrend = (type === 'bullish' && avgSlope < 0) || (type === 'bearish' && avgSlope > 0);
  
  if (!isCounterTrend) {
    return { detected: false, type: null, inclinacao: null, alvo: null, message: null };
  }
  
  // Altura da bandeira
  const flagHeight = Math.abs(upperLine.b - lowerLine.b);
  
  // Altura da haste (movimento anterior)
  const poleHeight = Math.abs(trend[trend.length - 1].close - trend[0].close);
  
  // Alvo = preço atual + altura da haste
  const currentPrice = flag[flag.length - 1].close;
  const alvo = type === 'bullish' ? currentPrice + poleHeight : currentPrice - poleHeight;
  
  // Mensagem
  const message = `Bandeira de ${type === 'bullish' ? 'alta' : 'baixa'} formada em ${flag.length} velas. Inclinação: ${inclinacao.toFixed(1)}°. Alvo projetado: ${type === 'bullish' ? '+' : '-'}${poleHeight.toFixed(2)} pontos (${alvo.toFixed(2)}).`;
  
  return {
    detected: true,
    type,
    inclinacao,
    alvo,
    message
  };
}

// ═══════════════════════════════════════════════════════════════
// 📐 CUNHA (Wedge - convergência inclinada)
// ═══════════════════════════════════════════════════════════════

function detectCunha(candles: Candle[]): {
  detected: boolean;
  type: 'rising' | 'falling' | null;
  convergence: number | null;
  target: number | null;
  message: string | null;
} {
  if (candles.length < 15) {
    return { detected: false, type: null, convergence: null, target: null, message: null };
  }
  
  const recent = candles.slice(-15);
  
  const highs = recent.map((c, i) => ({ x: i, y: c.high }));
  const lows = recent.map((c, i) => ({ x: i, y: c.low }));
  
  const upperLine = linearRegression(highs);
  const lowerLine = linearRegression(lows);
  
  const m_sup = upperLine.m;
  const m_inf = lowerLine.m;
  
  // Cunha: ambas as linhas inclinadas na mesma direção + convergindo
  const isRisingWedge = m_sup > 0.1 && m_inf > 0.15 && m_sup < m_inf; // Inferior sobe mais
  const isFallingWedge = m_sup < -0.15 && m_inf < -0.1 && m_sup < m_inf; // Superior desce mais
  
  if (!isRisingWedge && !isFallingWedge) {
    return { detected: false, type: null, convergence: null, target: null, message: null };
  }
  
  const type: 'rising' | 'falling' = isRisingWedge ? 'rising' : 'falling';
  
  // Convergência
  const x_convergence = (lowerLine.b - upperLine.b) / (m_sup - m_inf);
  const candlesUntilConvergence = Math.round(x_convergence - 14);
  
  // Altura atual
  const lastX = 14;
  const y_sup_last = m_sup * lastX + upperLine.b;
  const y_inf_last = m_inf * lastX + lowerLine.b;
  const currentHeight = y_sup_last - y_inf_last;
  
  // Alvo (rompimento CONTRA a inclinação)
  const currentPrice = recent[recent.length - 1].close;
  const target = type === 'rising' ? currentPrice - currentHeight : currentPrice + currentHeight;
  
  // Mensagem
  const message = `Cunha ${type === 'rising' ? 'ascendente' : 'descendente'} em formação há ${recent.length} velas. Convergência em ${candlesUntilConvergence > 0 ? candlesUntilConvergence : 'breve'}. Provável rompimento ${type === 'rising' ? 'para BAIXA' : 'para ALTA'} (contra inclinação). Alvo: ${target.toFixed(2)}.`;
  
  return {
    detected: true,
    type,
    convergence: candlesUntilConvergence > 0 ? candlesUntilConvergence : null,
    target,
    message
  };
}

// ═══════════════════════════════════════════════════════════════
// 🌊 ELLIOTT WAVES (Ondas 1-5 e ABC)
// ═══════════════════════════════════════════════════════════════

function detectElliott(candles: Candle[]): {
  detected: boolean;
  wave: number | null;
  target: number | null;
  phase: 'impulsive' | 'corrective' | null;
  message: string | null;
} {
  if (candles.length < 50) {
    return { detected: false, wave: null, target: null, phase: null, message: null };
  }
  
  const recent = candles.slice(-50);
  
  // Identificar picos e vales significativos (simplificado)
  const pivots: Array<{index: number, price: number, type: 'high' | 'low'}> = [];
  
  for (let i = 5; i < recent.length - 5; i++) {
    const isHigh = recent[i].high > recent[i-1].high && 
                   recent[i].high > recent[i+1].high &&
                   recent[i].high > recent[i-2].high &&
                   recent[i].high > recent[i+2].high;
    
    const isLow = recent[i].low < recent[i-1].low && 
                  recent[i].low < recent[i+1].low &&
                  recent[i].low < recent[i-2].low &&
                  recent[i].low < recent[i+2].low;
    
    if (isHigh) pivots.push({ index: i, price: recent[i].high, type: 'high' });
    if (isLow) pivots.push({ index: i, price: recent[i].low, type: 'low' });
  }
  
  if (pivots.length < 5) {
    return { detected: false, wave: null, target: null, phase: null, message: null };
  }
  
  // Calcular comprimentos das ondas
  const waves: number[] = [];
  for (let i = 1; i < pivots.length; i++) {
    waves.push(Math.abs(pivots[i].price - pivots[i-1].price));
  }
  
  // Verificar sequência Elliott (ondas 1, 3, 5 impulsivas; 2, 4 corretivas)
  if (waves.length >= 5) {
    // Onda 3 deve ser maior (normalmente a maior)
    const wave3 = waves[2];
    const wave1 = waves[0];
    const wave5 = waves[4];
    
    const isElliott = wave3 > wave1 && wave3 > wave5;
    
    if (isElliott) {
      // Projeção da onda 5 usando Fibonacci
      const fibRatio = 1.618;
      const currentPrice = recent[recent.length - 1].close;
      const target = currentPrice + (wave1 * fibRatio);
      
      const message = `Elliott Wave detectada! Onda 3 completada (${wave3.toFixed(2)} pts). Próxima onda 5 projetada até ${target.toFixed(2)}, seguindo proporção Fibonacci 1.618.`;
      
      return {
        detected: true,
        wave: 5,
        target,
        phase: 'impulsive',
        message
      };
    }
  }
  
  // Verificar fase corretiva ABC
  if (waves.length >= 3) {
    const waveA = waves[waves.length - 3];
    const waveB = waves[waves.length - 2];
    const waveC = waves[waves.length - 1];
    
    // Retração típica: B = 50-61.8% de A, C = 100-161.8% de A
    const retracaoB = waveB / waveA;
    const isCorrectiveABC = retracaoB > 0.4 && retracaoB < 0.7;
    
    if (isCorrectiveABC) {
      const currentPrice = recent[recent.length - 1].close;
      const target = currentPrice - (waveA * 1.0); // C = A (padrão comum)
      
      const message = `Elliott corretiva ABC detectada. Onda B completada (${retracaoB.toFixed(2)}% de A). Próxima onda C projetada até ${target.toFixed(2)}.`;
      
      return {
        detected: true,
        wave: 3, // C é a terceira onda corretiva
        target,
        phase: 'corrective',
        message
      };
    }
  }
  
  return { detected: false, wave: null, target: null, phase: null, message: null };
}

// Calcular suporte/resistência
function findSupportResistance(candles: Candle[]): {
  support: number | null;
  resistance: number | null;
} {
  if (candles.length < 50) return { support: null, resistance: null };
  
  const recent = candles.slice(-50);
  const lows = recent.map(c => c.low);
  const highs = recent.map(c => c.high);
  
  // Support: média dos 3 menores lows
  const sortedLows = [...lows].sort((a, b) => a - b);
  const support = sortedLows.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  
  // Resistance: média dos 3 maiores highs
  const sortedHighs = [...highs].sort((a, b) => b - a);
  const resistance = sortedHighs.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  
  return { support, resistance };
}

// Função principal de detecção de padrões
function detectPatterns(candles: Candle[]): PatternDetection {
  const ob = detectOrderBlock(candles);
  const fvg = detectFVG(candles);
  const spring = detectSpring(candles);
  const upthrust = detectUpthrust(candles);
  const bos = detectBOS(candles);
  const choch = detectChoCh(candles);
  const liquiditySweep = detectLiquiditySweep(candles);
  const { support, resistance } = findSupportResistance(candles);
  
  // 🆕 Novos padrões geométricos
  const triangle = detectTriangle(candles);
  const bandeira = detectBandeira(candles);
  const cunha = detectCunha(candles);
  const elliott = detectElliott(candles);
  
  // 🕯️ Padrões de vela
  const candlePattern = detectCandlePatterns(candles);
  
  // Determinar nome do padrão mais relevante (prioridade atualizada)
  let patternName: string | null = null;
  let patternMessage: string | null = null;
  
  // Prioridade para padrões geométricos avançados
  if (triangle.detected) {
    patternName = `Triângulo ${triangle.type === 'symmetric' ? 'Simétrico' : triangle.type === 'ascending' ? 'Ascendente' : 'Descendente'}`;
    patternMessage = triangle.message;
  } else if (bandeira.detected) {
    patternName = `Bandeira ${bandeira.type === 'bullish' ? 'Alta' : 'Baixa'}`;
    patternMessage = bandeira.message;
  } else if (cunha.detected) {
    patternName = `Cunha ${cunha.type === 'rising' ? 'Ascendente' : 'Descendente'}`;
    patternMessage = cunha.message;
  } else if (elliott.detected) {
    patternName = `Elliott Wave ${elliott.phase === 'impulsive' ? 'Impulsiva' : 'Corretiva'}`;
    patternMessage = elliott.message;
  } 
  // 🕯️ Padrões de vela (prioridade média)
  else if (candlePattern.detected && candlePattern.strength === 'strong') {
    patternName = candlePattern.type;
    patternMessage = candlePattern.message;
  }
  // Padrões clássicos (menor prioridade)
  else if (spring) {
    patternName = 'Wyckoff Spring';
    patternMessage = 'Sweep de liquidez abaixo do suporte seguido de reversão forte. Padrão bullish de alta confiabilidade.';
  } else if (upthrust) {
    patternName = 'Wyckoff Upthrust';
    patternMessage = 'Sweep de liquidez acima da resistência seguido de rejeição. Padrão bearish de alta confiabilidade.';
  } else if (ob.detected && fvg.detected) {
    patternName = `${ob.type === 'bullish' ? 'Bullish' : 'Bearish'} OB + FVG`;
    patternMessage = `Order Block ${ob.type === 'bullish' ? 'de alta' : 'de baixa'} combinado com Fair Value Gap. Zona de interesse institucional.`;
  } else if (ob.detected) {
    patternName = `${ob.type === 'bullish' ? 'Bullish' : 'Bearish'} Order Block`;
    patternMessage = `Order Block em $${ob.price?.toFixed(2)}. Zona onde instituições acumularam posições.`;
  } else if (fvg.detected) {
    patternName = `${fvg.type === 'bullish' ? 'Bullish' : 'Bearish'} FVG`;
    patternMessage = `Fair Value Gap entre $${fvg.lower?.toFixed(2)} e $${fvg.upper?.toFixed(2)}. Zona de ineficiência de preço.`;
  } else if (bos) {
    patternName = 'Break of Structure';
    patternMessage = 'Quebra de estrutura de mercado. Possível mudança de tendência.';
  } else if (choch) {
    patternName = 'Change of Character';
    patternMessage = 'Mudança de comportamento do mercado. Momentum reverteu.';
  } else if (liquiditySweep) {
    patternName = 'Liquidity Sweep';
    patternMessage = 'Sweep de liquidez detectado. Possível reversão após captura de stops.';
  }
  
  return {
    orderBlockDetected: ob.detected,
    orderBlockType: ob.type,
    orderBlockPrice: ob.price,
    fvgDetected: fvg.detected,
    fvgType: fvg.type,
    fvgUpper: fvg.upper,
    fvgLower: fvg.lower,
    springDetected: spring,
    upthrustDetected: upthrust,
    bosDetected: bos,
    chochDetected: choch,
    liquiditySweep,
    supportLevel: support,
    resistanceLevel: resistance,
    
    // 🆕 Novos padrões
    triangleDetected: triangle.detected,
    triangleType: triangle.type,
    triangleConvergence: triangle.convergence,
    triangleHeight: triangle.height,
    triangleTarget: triangle.target,
    
    bandeiraDetected: bandeira.detected,
    bandeiraType: bandeira.type,
    bandeiraInclinacao: bandeira.inclinacao,
    bandeiraAlvo: bandeira.alvo,
    
    cunhaDetected: cunha.detected,
    cunhaType: cunha.type,
    cunhaConvergence: cunha.convergence,
    cunhaTarget: cunha.target,
    
    elliottDetected: elliott.detected,
    elliottWave: elliott.wave,
    elliottTarget: elliott.target,
    elliottPhase: elliott.phase,
    
    // 🕯️ Padrões de vela
    candlePatternDetected: candlePattern.detected,
    candlePatternType: candlePattern.type,
    candlePatternStrength: candlePattern.strength,
    candlePatternDirection: candlePattern.direction,
    candlePatternMessage: candlePattern.message,
    
    patternName,
    patternMessage
  };
}
