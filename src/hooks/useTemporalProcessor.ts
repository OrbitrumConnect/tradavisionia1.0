import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TemporalProcessorProps {
  symbol: string;
  candles: CandleData[];
  liveData: any;
}

export const useTemporalProcessor = ({ symbol, candles, liveData }: TemporalProcessorProps) => {
  const lastProcessedM1 = useRef<number>(0);
  const m1Count = useRef<number>(0);
  const m5Count = useRef<number>(0);
  const m15Count = useRef<number>(0);

  useEffect(() => {
    if (!candles || candles.length === 0 || !liveData) return;

    const processTemporalData = async () => {
      try {
        const lastCandle = candles[candles.length - 1];
        const currentTime = Math.floor(lastCandle.time / 60000) * 60000; // Arredondar para minuto

        // Evitar processar a mesma vela múltiplas vezes
        if (currentTime === lastProcessedM1.current) return;
        lastProcessedM1.current = currentTime;

        console.log('🕐 Processando M1...', { symbol, time: new Date(currentTime).toISOString() });

        // 1. PROCESSAR M1 - A CADA 1 MINUTO
        const m1Response = await supabase.functions.invoke('temporal-processor-m1', {
          body: {
            symbol: symbol.replace('/', ''),
            marketData: {
              open: lastCandle.open,
              high: lastCandle.high,
              low: lastCandle.low,
              close: lastCandle.close,
              volume: lastCandle.volume,
              timestamp: new Date(currentTime).toISOString()
            },
            technicalIndicators: {
              rsi_14: calculateRSI(candles, 14),
              ema_9: calculateEMA(candles, 9),
              ema_20: calculateEMA(candles, 20)
            },
            patternsDetected: []
          }
        });

        if (m1Response.error) {
          console.error('❌ Erro ao processar M1:', m1Response.error);
          return;
        }

        console.log('✅ M1 processado:', m1Response.data);
        m1Count.current++;

        // 2. PROCESSAR M5 - A CADA 5 MINUTOS (5 velas M1)
        if (m1Count.current % 5 === 0) {
          console.log('🕐 Processando M5...', { symbol, m1Count: m1Count.current });
          
          const m5Response = await supabase.functions.invoke('temporal-processor-m5', {
            body: { symbol: symbol.replace('/', '') }
          });

          if (m5Response.error) {
            console.error('❌ Erro ao processar M5:', m5Response.error);
          } else {
            console.log('✅ M5 processado:', m5Response.data);
            m5Count.current++;
          }
        }

        // 3. PROCESSAR M15 - A CADA 15 MINUTOS (3 velas M5)
        if (m5Count.current > 0 && m5Count.current % 3 === 0 && m1Count.current % 15 === 0) {
          console.log('🕐 Processando M15...', { symbol, m5Count: m5Count.current });
          
          const m15Response = await supabase.functions.invoke('temporal-processor-m15', {
            body: { symbol: symbol.replace('/', '') }
          });

          if (m15Response.error) {
            console.error('❌ Erro ao processar M15:', m15Response.error);
          } else {
            console.log('✅ M15 processado:', m15Response.data);
            m15Count.current++;
          }
        }

        // 4. PROCESSAR M30 - A CADA 30 MINUTOS (2 velas M15)
        if (m15Count.current > 0 && m15Count.current % 2 === 0 && m1Count.current % 30 === 0) {
          console.log('🕐 Processando M30...', { symbol, m15Count: m15Count.current });
          
          const m30Response = await supabase.functions.invoke('temporal-processor-m30', {
            body: { symbol: symbol.replace('/', '') }
          });

          if (m30Response.error) {
            console.error('❌ Erro ao processar M30:', m30Response.error);
          } else {
            console.log('✅ M30 processado:', m30Response.data);
          }
        }

      } catch (error) {
        console.error('❌ Erro no processamento temporal:', error);
      }
    };

    processTemporalData();
  }, [candles, liveData, symbol]);

  return { m1Count: m1Count.current, m5Count: m5Count.current, m15Count: m15Count.current };
};

// Utilitários para cálculo de indicadores
function calculateRSI(candles: CandleData[], period: number = 14): number {
  if (candles.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = candles.length - period; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateEMA(candles: CandleData[], period: number): number {
  if (candles.length < period) return candles[candles.length - 1]?.close || 0;
  
  const multiplier = 2 / (period + 1);
  let ema = candles[candles.length - period].close;
  
  for (let i = candles.length - period + 1; i < candles.length; i++) {
    ema = (candles[i].close - ema) * multiplier + ema;
  }
  
  return ema;
}
