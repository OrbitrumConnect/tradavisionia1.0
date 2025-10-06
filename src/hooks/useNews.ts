import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  image: string;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

export const useNews = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async (query: string = "bolsa de valores") => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: funcError } = await supabase.functions.invoke('noticias', {
        body: { q: query }
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      setArticles(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar notícias';
      setError(errorMessage);
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    articles,
    loading,
    error,
    fetchNews
  };
};