import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Auto-validação de sinais iniciada...');

    // Buscar sinais dos últimos 10 minutos sem feedback
    const { data: pendingSignals, error } = await supabase
      .from('narrator_signals')
      .select('*')
      .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .is('metadata->validated', null)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!pendingSignals || pendingSignals.length === 0) {
      console.log('✅ Nenhum sinal pendente para validar');
      return new Response(JSON.stringify({ validated: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📊 Validando ${pendingSignals.length} sinais...`);
    let validatedCount = 0;

    for (const signal of pendingSignals) {
      // Pular se foi criado há menos de 5 minutos
      const signalAge = Date.now() - new Date(signal.created_at).getTime();
      if (signalAge < 5 * 60 * 1000) {
        console.log(`⏱️ Sinal ${signal.id} muito recente (${Math.round(signalAge / 1000)}s)`);
        continue;
      }

      // Buscar preço atual do símbolo
      const { data: currentData } = await supabase
        .from('market_m1')
        .select('close')
        .eq('symbol', signal.symbol)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (!currentData) {
        console.log(`❌ Sem dados atuais para ${signal.symbol}`);
        continue;
      }

      const entryPrice = parseFloat(signal.price);
      const currentPrice = currentData.close;
      const priceChange = ((currentPrice - entryPrice) / entryPrice) * 100;

      // Validar sinal baseado no tipo
      let wasAccurate = false;
      let actualResult = 'NEUTRAL';

      if (signal.signal_type === 'BUY') {
        wasAccurate = priceChange > 0.15; // +0.15% = acerto
        actualResult = priceChange > 0.15 ? 'BUY' : priceChange < -0.15 ? 'SELL' : 'NEUTRAL';
      } else if (signal.signal_type === 'SELL') {
        wasAccurate = priceChange < -0.15; // -0.15% = acerto
        actualResult = priceChange < -0.15 ? 'SELL' : priceChange > 0.15 ? 'BUY' : 'NEUTRAL';
      } else if (signal.signal_type === 'NEUTRAL' || signal.signal_type === 'WAIT') {
        wasAccurate = Math.abs(priceChange) < 0.15; // Consolidação = acerto
        actualResult = Math.abs(priceChange) < 0.15 ? 'NEUTRAL' : priceChange > 0 ? 'BUY' : 'SELL';
      }

      console.log(`${wasAccurate ? '✅' : '❌'} Sinal ${signal.signal_type} - Var: ${priceChange.toFixed(2)}%`);

      // Salvar feedback automático
      await supabase.from('narrator_feedback').insert({
        signal_id: signal.id,
        user_id: signal.user_id,
        was_accurate: wasAccurate,
        rating: wasAccurate ? 5 : 2,
        notes: `Auto-validação: ${signal.signal_type} → Preço ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%`,
      });

      // Atualizar metadata do sinal
      await supabase
        .from('narrator_signals')
        .update({
          metadata: {
            ...signal.metadata,
            validated: true,
            validation_time: new Date().toISOString(),
            entry_price: entryPrice,
            exit_price: currentPrice,
            price_change_percent: priceChange,
            was_accurate: wasAccurate,
            actual_result: actualResult,
          }
        })
        .eq('id', signal.id);

      validatedCount++;
    }

    console.log(`🎯 Auto-validação completa: ${validatedCount} sinais validados`);

    return new Response(JSON.stringify({ 
      validated: validatedCount,
      total: pendingSignals.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro na auto-validação:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
