import { useState, useEffect, useRef } from 'react';
import { pipeline, env } from '@huggingface/transformers';

// Configurar transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

export interface EmbeddingResult {
  text: string;
  embedding: number[];
  similarity?: number;
}

export const useLocalEmbeddings = () => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const pipelineRef = useRef<any>(null);

  useEffect(() => {
    const initPipeline = async () => {
      try {
        setIsLoading(true);
        // Usar modelo leve de embeddings
        pipelineRef.current = await pipeline(
          'feature-extraction',
          'Xenova/all-MiniLM-L6-v2',
          { device: 'wasm' } // Funciona em qualquer browser
        );
        setIsReady(true);
      } catch (error) {
        console.error('Failed to load embeddings model:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initPipeline();
  }, []);

  const getEmbedding = async (text: string): Promise<number[]> => {
    if (!pipelineRef.current) throw new Error('Pipeline not ready');
    
    const result = await pipelineRef.current(text, {
      pooling: 'mean',
      normalize: true,
    });
    
    return Array.from(result.data);
  };

  const cosineSimilarity = (a: number[], b: number[]): number => {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  };

  const findMostSimilar = async (
    query: string,
    items: EmbeddingResult[],
    topK: number = 3
  ): Promise<EmbeddingResult[]> => {
    if (!isReady || items.length === 0) return [];
    
    const queryEmbedding = await getEmbedding(query);
    
    const withSimilarity = items.map(item => ({
      ...item,
      similarity: cosineSimilarity(queryEmbedding, item.embedding),
    }));
    
    return withSimilarity
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
      .slice(0, topK);
  };

  return {
    isReady,
    isLoading,
    getEmbedding,
    findMostSimilar,
    cosineSimilarity,
  };
};
