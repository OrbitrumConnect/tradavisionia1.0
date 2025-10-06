import { createContext, useContext, useState, ReactNode } from 'react';
import { NarratorSignal } from '@/hooks/useNarrator';

interface MarketContextType {
  // Dados do gráfico
  symbol: string;
  price: string;
  timeframe: string;
  
  // Indicadores
  fearGreedIndex: number;
  buyerDominance: number;
  marketPressure: string;
  
  // Feed do narrador
  narratorFeed: NarratorSignal[];
  
  // Métodos para atualizar
  updateMarketData: (data: Partial<MarketContextType>) => void;
  addNarratorSignal: (signal: NarratorSignal) => void;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export function MarketProvider({ children }: { children: ReactNode }) {
  const [marketData, setMarketData] = useState<Omit<MarketContextType, 'updateMarketData' | 'addNarratorSignal'>>({
    symbol: 'BTC/USDT',
    price: '0',
    timeframe: '1m',
    fearGreedIndex: 50,
    buyerDominance: 50,
    marketPressure: 'NEUTRO',
    narratorFeed: [],
  });

  const updateMarketData = (data: Partial<MarketContextType>) => {
    setMarketData(prev => ({ ...prev, ...data }));
  };

  const addNarratorSignal = (signal: NarratorSignal) => {
    setMarketData(prev => ({
      ...prev,
      narratorFeed: [signal, ...prev.narratorFeed.slice(0, 9)] // Mantém últimos 10
    }));
  };

  return (
    <MarketContext.Provider value={{ ...marketData, updateMarketData, addNarratorSignal }}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarketContext() {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error('useMarketContext must be used within MarketProvider');
  }
  return context;
}
