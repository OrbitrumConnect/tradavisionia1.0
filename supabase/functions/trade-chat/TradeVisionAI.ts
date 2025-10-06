// Classe separada para busca semântica
export class SemanticSearch {
  constructor(private supabase: any) {}

  async findSimilarMessages(
    userEmbedding: number[],
    userId: string,
    limit: number = 5
  ): Promise<any[]> {
    if (!userEmbedding || userEmbedding.length === 0) return [];

    try {
      const { data, error } = await this.supabase.rpc('match_messages', {
        query_embedding: userEmbedding,
        match_threshold: 0.7,
        match_count: limit,
        user_id_filter: userId
      });

      if (error) {
        console.error('❌ Erro na busca semântica:', error);
        return [];
      }

      console.log('🔍 Busca semântica encontrou:', data?.length || 0, 'mensagens similares');
      return data || [];
    } catch (err) {
      console.warn('⚠️ Busca semântica não disponível:', err);
      return [];
    }
  }
}
