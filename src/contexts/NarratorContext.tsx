import React, { createContext, useContext, useState, ReactNode } from 'react';
import { NarratorSignal } from '@/hooks/useNarrator';

interface NarratorContextType {
  narratorSignals: NarratorSignal[];
  setNarratorSignals: (signals: NarratorSignal[]) => void;
  addNarratorSignal: (signal: NarratorSignal) => void;
}

const NarratorContext = createContext<NarratorContextType | undefined>(undefined);

export const useNarratorContext = () => {
  const context = useContext(NarratorContext);
  if (!context) {
    throw new Error('useNarratorContext must be used within a NarratorProvider');
  }
  return context;
};

interface NarratorProviderProps {
  children: ReactNode;
}

export const NarratorProvider: React.FC<NarratorProviderProps> = ({ children }) => {
  const [narratorSignals, setNarratorSignals] = useState<NarratorSignal[]>([]);

  const addNarratorSignal = (signal: NarratorSignal) => {
    setNarratorSignals(prev => [signal, ...prev.slice(0, 49)]);
  };

  return (
    <NarratorContext.Provider value={{
      narratorSignals,
      setNarratorSignals,
      addNarratorSignal
    }}>
      {children}
    </NarratorContext.Provider>
  );
};
