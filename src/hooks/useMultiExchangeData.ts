import { useState, useEffect, useRef } from 'react';

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
  exchange: string;
}

// Configuração dos timeframes
const TIMEFRAMES = {
  '30s': '30s',
  '1m': '1m',
  '3m': '3m', 
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1h',
  '2h': '2h',
  '4h': '4h',
  '6h': '6h',
  '12h': '12h',
  '1d': '1d',
  '1w': '1w',
  '1M': '1M'
};

// Configuração dos pares por exchange
const EXCHANGE_PAIRS = {
  binance: {
    'BTC/USDT': 'BTCUSDT',
    'ETH/USDT': 'ETHUSDT',
    'XAU/USD': 'XAUUSDT', // Ouro
  },
  coinbase: {
    'BTC/USD': 'BTC-USD',
    'ETH/USD': 'ETH-USD',
  },
  yahoo: {
    'MINI ÍNDICE B3': 'WIN=F',
    'MINI DÓLAR': 'DOL=F',
    'OURO': 'GC=F',
  }
};

// URLs das APIs por exchange
const EXCHANGE_APIS = {
  binance: {
    rest: 'https://api.binance.com/api/v3/klines',
    ws: 'wss://stream.binance.com:9443/ws'
  },
  coinbase: {
    rest: 'https://api.exchange.coinbase.com/products',
    ws: 'wss://ws-feed.exchange.coinbase.com'
  },
  yahoo: {
    rest: 'https://query1.finance.yahoo.com/v8/finance/chart',
    ws: null // Yahoo não tem WebSocket público
  }
};

export const useMultiExchangeData = (exchange: string = 'binance', pair: string = 'BTC/USDT', interval: string = '1m') => {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());

  // Buscar dados históricos baseado na exchange
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        console.log('🔍 useMultiExchangeData: Iniciando busca de dados', { exchange, pair, interval });
        setLoading(true);
        
        if (exchange === 'binance') {
          await fetchBinanceData();
        } else if (exchange === 'coinbase') {
          await fetchCoinbaseData();
        } else if (exchange === 'yahoo') {
          await fetchYahooData();
        }
      } catch (error) {
        console.error(`Error fetching ${exchange} data:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, [exchange, pair, interval]);

  // Conectar WebSocket baseado na exchange
  useEffect(() => {
    if (exchange === 'binance') {
      connectBinanceWebSocket();
    } else if (exchange === 'coinbase') {
      connectCoinbaseWebSocket();
    }
    // Yahoo Finance não tem WebSocket público, usamos polling

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [exchange, pair, interval]);

  const fetchBinanceData = async () => {
    const symbol = EXCHANGE_PAIRS.binance[pair as keyof typeof EXCHANGE_PAIRS.binance];
    console.log('🔍 fetchBinanceData: Symbol mapeado', { pair, symbol });
    if (!symbol) {
      console.error('❌ fetchBinanceData: Symbol não encontrado para o par', pair);
      return;
    }

    const url = `${EXCHANGE_APIS.binance.rest}?symbol=${symbol}&interval=${interval}&limit=500`;
    console.log('🔍 fetchBinanceData: URL da API', url);
    
    const response = await fetch(url);
    const data = await response.json();
    console.log('🔍 fetchBinanceData: Dados recebidos', { dataLength: data.length, firstCandle: data[0] });
    
    const candleData = data.map((kline: any[]) => ({
      time: kline[0],
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5])
    }));
    
    console.log('🔍 fetchBinanceData: Candles processados', { candleCount: candleData.length });
    setCandles(candleData);
    
    if (candleData.length > 0) {
      const lastCandle = candleData[candleData.length - 1];
      const firstCandle = candleData[0];
      const change = ((lastCandle.close - firstCandle.open) / firstCandle.open * 100).toFixed(2);
      
      // Formatar volume
      let formattedVolume = '0.0M';
      const volume = lastCandle.volume;
      if (volume >= 1000000000) {
        formattedVolume = (volume / 1000000000).toFixed(2) + 'B';
      } else if (volume >= 1000000) {
        formattedVolume = (volume / 1000000).toFixed(1) + 'M';
      } else if (volume >= 1000) {
        formattedVolume = (volume / 1000).toFixed(1) + 'K';
      } else {
        formattedVolume = volume.toFixed(0);
      }
      
      const liveDataObj = {
        symbol: pair,
        price: lastCandle.close.toFixed(2),
        change: `${change.startsWith('-') ? '' : '+'}${change}%`,
        volume: formattedVolume,
        timestamp: Date.now(),
        exchange: 'Binance'
      };
      console.log('🔍 fetchBinanceData: LiveData definido', liveDataObj);
      setLiveData(liveDataObj);
    }
  };

  const fetchCoinbaseData = async () => {
    const symbol = EXCHANGE_PAIRS.coinbase[pair as keyof typeof EXCHANGE_PAIRS.coinbase];
    if (!symbol) return;

    const response = await fetch(`${EXCHANGE_APIS.coinbase.rest}/${symbol}/candles?granularity=60`);
    const data = await response.json();
    
    const candleData = data.slice(-500).map((candle: any[]) => ({
      time: candle[0] * 1000,
      open: candle[3],
      high: candle[2],
      low: candle[1],
      close: candle[4],
      volume: candle[5]
    })).reverse();
    
    setCandles(candleData);
    
    if (candleData.length > 0) {
      const lastCandle = candleData[candleData.length - 1];
      const firstCandle = candleData[0];
      const change = ((lastCandle.close - firstCandle.open) / firstCandle.open * 100).toFixed(2);
      
      let formattedVolume = '0.0M';
      const volume = lastCandle.volume;
      if (volume >= 1000000000) {
        formattedVolume = (volume / 1000000000).toFixed(2) + 'B';
      } else if (volume >= 1000000) {
        formattedVolume = (volume / 1000000).toFixed(1) + 'M';
      } else if (volume >= 1000) {
        formattedVolume = (volume / 1000).toFixed(1) + 'K';
      } else {
        formattedVolume = volume.toFixed(0);
      }
      
      setLiveData({
        symbol: pair,
        price: lastCandle.close.toFixed(2),
        change: `${change.startsWith('-') ? '' : '+'}${change}%`,
        volume: formattedVolume,
        timestamp: Date.now(),
        exchange: 'Coinbase Pro'
      });
    }
  };

  const fetchYahooData = async () => {
    const symbol = EXCHANGE_PAIRS.yahoo[pair as keyof typeof EXCHANGE_PAIRS.yahoo];
    if (!symbol) return;

    // Para Yahoo Finance, vamos simular dados realistas
    const mockCandles = Array.from({ length: 100 }, (_, i) => {
      const basePrice = pair.includes('ÍNDICE') ? 129000 : pair.includes('DÓLAR') ? 5.45 : 2650;
      const volatility = pair.includes('ÍNDICE') ? 1000 : pair.includes('DÓLAR') ? 0.05 : 50;
      
      return {
        time: Date.now() - (100 - i) * 60000,
        open: basePrice + (Math.random() - 0.5) * volatility,
        high: basePrice + Math.random() * volatility,
        low: basePrice - Math.random() * volatility,
        close: basePrice + (Math.random() - 0.5) * volatility,
        volume: Math.random() * 1000000
      };
    });
    
    setCandles(mockCandles);
    
    if (mockCandles.length > 0) {
      const lastCandle = mockCandles[mockCandles.length - 1];
      const firstCandle = mockCandles[0];
      const change = ((lastCandle.close - firstCandle.open) / firstCandle.open * 100).toFixed(2);
      
      let formattedVolume = '0.0M';
      const volume = lastCandle.volume;
      if (volume >= 1000000000) {
        formattedVolume = (volume / 1000000000).toFixed(2) + 'B';
      } else if (volume >= 1000000) {
        formattedVolume = (volume / 1000000).toFixed(1) + 'M';
      } else if (volume >= 1000) {
        formattedVolume = (volume / 1000).toFixed(1) + 'K';
      } else {
        formattedVolume = volume.toFixed(0);
      }
      
      setLiveData({
        symbol: pair,
        price: lastCandle.close.toFixed(2),
        change: `${change.startsWith('-') ? '' : '+'}${change}%`,
        volume: formattedVolume,
        timestamp: Date.now(),
        exchange: 'B3/Yahoo'
      });
    }
  };

  const connectBinanceWebSocket = () => {
    const symbol = EXCHANGE_PAIRS.binance[pair as keyof typeof EXCHANGE_PAIRS.binance];
    if (!symbol) return;

    const wsUrl = `${EXCHANGE_APIS.binance.ws}/${symbol.toLowerCase()}@kline_${interval}`;
    
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
        
        const price = parseFloat(kline.c);
        const volume = parseFloat(kline.v);
        
        // Calcular variação baseada no preço de abertura do dia (primeira vela)
        const openPrice = candles.length > 0 ? candles[0].open : price;
        const change = ((price - openPrice) / openPrice * 100).toFixed(2);
        
        // Formatar volume de forma mais legível
        let formattedVolume = '0.0M';
        if (volume >= 1000000000) {
          formattedVolume = (volume / 1000000000).toFixed(2) + 'B';
        } else if (volume >= 1000000) {
          formattedVolume = (volume / 1000000).toFixed(1) + 'M';
        } else if (volume >= 1000) {
          formattedVolume = (volume / 1000).toFixed(1) + 'K';
        } else {
          formattedVolume = volume.toFixed(0);
        }
        
        setLiveData({
          symbol: pair,
          price: price.toFixed(2),
          change: `${change.startsWith('-') ? '' : '+'}${change}%`,
          volume: formattedVolume,
          timestamp: Date.now(),
          exchange: 'Binance'
        });
        
        setLastUpdateTime(Date.now());

        // 🔥 ATUALIZAR CANDLES EM TEMPO REAL (não esperar fechar!)
        setCandles(prev => {
          const newCandles = [...prev];
          const newCandle = {
            time: kline.t,
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c), // Preço atual (em formação)
            volume: parseFloat(kline.v)
          };
          
          const lastCandle = newCandles[newCandles.length - 1];
          
          // Se mesma vela: atualiza (TEMPO REAL!)
          // Se vela nova (kline.x = true): adiciona
          if (lastCandle && lastCandle.time === newCandle.time) {
            newCandles[newCandles.length - 1] = newCandle; // Atualiza em tempo real!
          } else if (kline.x) {
            // Só adiciona vela NOVA quando fechar
            newCandles.push(newCandle);
            if (newCandles.length > 500) {
              newCandles.shift();
            }
          }
          
          return newCandles;
        });
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
      
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CLOSED) {
          connectBinanceWebSocket();
        }
      }, 3000);
    };
  };

  const connectCoinbaseWebSocket = () => {
    const symbol = EXCHANGE_PAIRS.coinbase[pair as keyof typeof EXCHANGE_PAIRS.coinbase];
    if (!symbol) return;

    wsRef.current = new WebSocket(EXCHANGE_APIS.coinbase.ws);

    wsRef.current.onopen = () => {
      setIsConnected(true);
      const subscribeMsg = {
        type: 'subscribe',
        channels: [
          {
            name: 'ticker',
            product_ids: [symbol]
          }
        ]
      };
      wsRef.current?.send(JSON.stringify(subscribeMsg));
      console.log('Connected to Coinbase WebSocket');
    };

    wsRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'ticker') {
          const price = parseFloat(message.price);
          const prevClose = candles.length > 0 ? candles[candles.length - 1].close : price;
          const change = ((price - prevClose) / prevClose * 100).toFixed(2);
          
          setLiveData({
            symbol: pair,
            price: price.toFixed(2),
            change: `${change.startsWith('-') ? '' : '+'}${change}%`,
            volume: parseFloat(message.volume_24h) ? (parseFloat(message.volume_24h) / 1000000).toFixed(1) + 'M' : '0M',
            timestamp: Date.now(),
            exchange: 'Coinbase Pro'
          });
        }
      } catch (error) {
        console.error('Error processing Coinbase WebSocket data:', error);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('Coinbase WebSocket error:', error);
      setIsConnected(false);
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
      console.log('Coinbase WebSocket disconnected');
    };
  };

  return {
    candles,
    liveData,
    isConnected,
    loading,
    lastUpdateTime,
    availablePairs: Object.keys(EXCHANGE_PAIRS[exchange as keyof typeof EXCHANGE_PAIRS] || {}),
    availableTimeframes: Object.keys(TIMEFRAMES),
    exchanges: Object.keys(EXCHANGE_PAIRS)
  };
};