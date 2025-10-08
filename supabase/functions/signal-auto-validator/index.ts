import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Iniciando validação automática de sinais...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar sinais não validados com mais de 15 minutos
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const { data: signals, error: fetchError } = await supabase
      .from('narrator_signals')
      .select('*')
      .is('result', null)
      .lt('created_at', fifteenMinutesAgo)
      .order('created_at', { ascending: true })
      .limit(50); // Processar 50 por vez

    if (fetchError) {
      console.error('❌ Erro ao buscar sinais:', fetchError);
      throw fetchError;
    }

    if (!signals || signals.length === 0) {
      console.log('✅ Nenhum sinal para validar');
      return new Response(
        JSON.stringify({ 
          message: 'Nenhum sinal para validar',
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Validando ${signals.length} sinais...`);

    let processed = 0;
    let wins = 0;
    let losses = 0;
    let neutrals = 0;

    for (const signal of signals) {
      try {
        // Buscar preço atual da Binance
        const symbol = signal.symbol.replace('/', '');
        const binanceUrl = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;
        
        const response = await fetch(binanceUrl);
        if (!response.ok) {
          console.warn(`⚠️ Erro ao buscar preço para ${signal.symbol}`);
          continue;
        }

        const binanceData = await response.json();
        const currentPrice = parseFloat(binanceData.lastPrice);
        const entryPrice = parseFloat(signal.price);

        // Calcular variação
        const variation = ((currentPrice - entryPrice) / entryPrice) * 100;

        // Determinar resultado baseado no tipo de sinal
        let result = 'NEUTRAL';
        const threshold = 0.1; // 0.1% de variação mínima

        if (signal.signal_type === 'BUY') {
          if (variation > threshold) {
            result = 'WIN';
            wins++;
          } else if (variation < -threshold) {
            result = 'LOSS';
            losses++;
          } else {
            result = 'NEUTRAL';
            neutrals++;
          }
        } else if (signal.signal_type === 'SELL') {
          if (variation < -threshold) {
            result = 'WIN';
            wins++;
          } else if (variation > threshold) {
            result = 'LOSS';
            losses++;
          } else {
            result = 'NEUTRAL';
            neutrals++;
          }
        }

        // Calcular tempo de validação
        const createdAt = new Date(signal.created_at);
        const now = new Date();
        const minutesElapsed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));

        // Atualizar sinal no banco
        const { error: updateError } = await supabase
          .from('narrator_signals')
          .update({
            result: result,
            exit_price: currentPrice.toString(),
            variation: `${variation > 0 ? '+' : ''}${variation.toFixed(2)}%`,
            validated_at: new Date().toISOString(),
            validation_time: `${minutesElapsed}min`
          })
          .eq('id', signal.id);

        if (updateError) {
          console.error(`❌ Erro ao atualizar sinal ${signal.id}:`, updateError);
          continue;
        }

        console.log(`✅ Sinal ${signal.id} validado: ${result} (${variation.toFixed(2)}%)`);
        processed++;

        // Atualizar accuracy do padrão no bot_knowledge
        if (result === 'WIN' || result === 'LOSS') {
          await updatePatternAccuracy(supabase, signal.pattern, result);
        }

      } catch (error) {
        console.error(`❌ Erro ao processar sinal ${signal.id}:`, error);
      }
    }

    console.log(`🎯 Validação concluída: ${processed} sinais processados`);
    console.log(`📊 Resultados: ${wins} WIN, ${losses} LOSS, ${neutrals} NEUTRAL`);

    return new Response(
      JSON.stringify({ 
        success: true,
        processed,
        results: {
          wins,
          losses,
          neutrals,
          winRate: processed > 0 ? ((wins / processed) * 100).toFixed(2) : 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Erro na validação automática:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Função auxiliar para atualizar accuracy do padrão
async function updatePatternAccuracy(supabase: any, pattern: string, result: string) {
  try {
    // Buscar conhecimento relacionado ao padrão
    const { data: knowledge } = await supabase
      .from('bot_knowledge')
      .select('*')
      .ilike('topic', `%${pattern.split(' ')[0]}%`)
      .single();

    if (knowledge) {
      // Calcular novo accuracy_score
      const currentScore = knowledge.accuracy_score || 0.7;
      const adjustment = result === 'WIN' ? 0.02 : -0.02; // +2% ou -2%
      const newScore = Math.max(0.1, Math.min(1.0, currentScore + adjustment));

      // Atualizar
      await supabase
        .from('bot_knowledge')
        .update({
          accuracy_score: newScore,
          usage_count: (knowledge.usage_count || 0) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', knowledge.id);

      console.log(`📈 Padrão "${pattern}" accuracy atualizado: ${currentScore.toFixed(2)} → ${newScore.toFixed(2)}`);
    }
  } catch (error) {
    console.warn('⚠️ Erro ao atualizar accuracy do padrão:', error);
  }
}
