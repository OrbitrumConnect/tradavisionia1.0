import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface LiveData {
  symbol: string;
  price: string;
  change: string;
  volume: string;
  timestamp: number;
}

export const useBinanceData = (symbol: string = 'BTCUSDT', interval: string = '1m') => {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch historical data and 24h ticker
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setLoading(true);
        
        // Fetch 24h ticker for accurate change percentage
        const tickerResponse = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
        const tickerData = await tickerResponse.json();
        
        // Fetch klines
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=500`);
        const data = await response.json();
        
        const candleData = data.map((kline: any[]) => ({
          time: kline[0],
          open: parseFloat(kline[1]),
          high: parseFloat(kline[2]),
          low: parseFloat(kline[3]),
          close: parseFloat(kline[4]),
          volume: parseFloat(kline[5])
        }));
        
        setCandles(candleData);
        
        // Set initial live data with real 24h change
        if (candleData.length > 0) {
          const lastCandle = candleData[candleData.length - 1];
          const change24h = parseFloat(tickerData.priceChangePercent || '0');
          
          setLiveData({
            symbol,
            price: lastCandle.close.toFixed(2),
            change: `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`,
            volume: (parseFloat(tickerData.volume || lastCandle.volume) / 1000000).toFixed(1) + 'B',
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error('Error fetching historical data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, [symbol, interval]);

  // WebSocket connection for real-time data directly to Binance
  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        console.log('Connected to Binance WebSocket');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const kline = message.k;
          
          if (!kline) return;
          
          // Update live market data
          const price = parseFloat(kline.c);
          const prevClose = candles.length > 0 ? candles[candles.length - 1].close : price;
          const change = ((price - prevClose) / prevClose * 100).toFixed(2);
          
          setLiveData({
            symbol: kline.s,
            price: price.toFixed(2),
            change: `${change.startsWith('-') ? '' : '+'}${change}%`,
            volume: (parseFloat(kline.v) / 1000000).toFixed(1) + 'M',
            timestamp: Date.now()
          });

          // Update candles if it's a closed candle
          if (kline.x) { // x indicates if kline is closed
            setCandles(prev => {
              const newCandles = [...prev];
              const newCandle = {
                time: kline.t,
                open: parseFloat(kline.o),
                high: parseFloat(kline.h),
                low: parseFloat(kline.l),
                close: parseFloat(kline.c),
                volume: parseFloat(kline.v)
              };
              
              const lastCandle = newCandles[newCandles.length - 1];
              
              if (lastCandle && lastCandle.time === newCandle.time) {
                // Update existing candle
                newCandles[newCandles.length - 1] = newCandle;
              } else {
                // Add new candle
                newCandles.push(newCandle);
                
                // Keep only last 500 candles
                if (newCandles.length > 500) {
                  newCandles.shift();
                }
              }
              
              return newCandles;
            });
          }
        } catch (error) {
          console.error('Error processing WebSocket data:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket disconnected');
        
        // Reconnect after 3 seconds
        setTimeout(() => {
          if (wsRef.current?.readyState === WebSocket.CLOSED) {
            connectWebSocket();
          }
        }, 3000);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [symbol, interval]);

  return {
    candles,
    liveData,
    isConnected,
    loading
  };
};
