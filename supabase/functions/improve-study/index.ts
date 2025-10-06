import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, conversationContext, marketContext } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('📚 Buscando conhecimento da base de dados...');

    // Buscar todo o conhecimento disponível
    const { data: knowledge, error: knowledgeError } = await supabase
      .from('bot_knowledge')
      .select('*')
      .order('usage_count', { ascending: false })
      .limit(20);

    if (knowledgeError) {
      console.error('Erro ao buscar conhecimento:', knowledgeError);
    }

    const knowledgeContext = knowledge?.map(k => 
      `${k.category} - ${k.topic}:\n${k.content}\nExemplos: ${JSON.stringify(k.examples)}`
    ).join('\n\n---\n\n') || '';

    console.log('🤖 Gerando análise melhorada com IA...');

    // Chamar IA para gerar análise aprofundada
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em trading que analisa conversas e cruza com estratégias e conhecimento para gerar insights profundos.

CONHECIMENTO DISPONÍVEL:
${knowledgeContext}

CONTEXTO DE MERCADO ATUAL:
- Símbolo: ${marketContext.symbol}
- Preço: $${marketContext.price}
- Timeframe: ${marketContext.timeframe}
- Fear & Greed: ${marketContext.fearGreedIndex}
- Dominância de Compradores: ${marketContext.buyerDominance}%
- Pressão do Mercado: ${marketContext.marketPressure}

Sua tarefa é:
1. Analisar a conversa do usuário
2. Cruzar com as estratégias e conhecimento da base
3. Identificar padrões, oportunidades e riscos
4. Gerar um estudo completo e aprofundado
5. Extrair novos aprendizados para salvar na base de conhecimento

Formato da resposta:
## Análise Completa

[Sua análise detalhada aqui]

## Estratégias Aplicáveis

[Estratégias específicas do banco que se aplicam]

## Novos Insights

[Novos aprendizados extraídos desta análise]

## Recomendações

[Recomendações específicas baseadas no contexto completo]`
          },
          {
            role: 'user',
            content: `Analise esta conversa e gere um estudo completo:\n\n${conversationContext}`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices[0].message.content;

    console.log('💾 Salvando novo conhecimento...');

    // Extrair e salvar novos aprendizados
    const newKnowledge = {
      category: 'Análise Melhorada',
      topic: `Estudo ${marketContext.symbol} - ${new Date().toLocaleDateString()}`,
      content: analysis,
      metadata: {
        conversation_id: conversationId,
        market_context: marketContext,
        generated_at: new Date().toISOString(),
      },
      examples: [
        {
          context: `Mercado ${marketContext.symbol} em ${marketContext.timeframe}`,
          insight: analysis.slice(0, 500),
        }
      ],
    };

    const { error: saveError } = await supabase
      .from('bot_knowledge')
      .insert(newKnowledge);

    if (saveError) {
      console.error('Erro ao salvar conhecimento:', saveError);
    } else {
      console.log('✅ Conhecimento salvo com sucesso!');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        knowledge_saved: !saveError,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro em improve-study:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
