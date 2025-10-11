// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// Declaração de tipos para Deno
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configurações de trading
const TRADE_SIZE = 0.01; // BTC
const LEVERAGE = 50;
const STOP_LOSS_PERCENT = 0.5;
const TAKE_PROFIT_PERCENT = 1.0;
const TRADE_INTERVAL_MS = 180000; // 3 minutos

interface Trade {
  id: string;
  user_id: string;
  symbol: string;
  timeframe: string;
  type: 'BUY' | 'SELL';
  entry_price_num: number;
  stop_loss_num: number;
  take_profit_num: number;
  exit_price_num?: number;
  pnl_num?: number;
  result?: 'WIN' | 'LOSS';
  reason?: string;
  created_at: string;
  closed_at?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🤖 AUTO-TRADER: Iniciando ciclo...');

    // 1️⃣ VERIFICAR POSIÇÕES ABERTAS HÁ MAIS DE 3 MINUTOS
    const { data: openPositions } = await supabase
      .from('ai_trades')
      .select('*')
      .is('exit_price_num', null)
      .order('created_at', { ascending: true });

    if (openPositions && openPositions.length > 0) {
      console.log(`📊 ${openPositions.length} posições abertas encontradas`);

      for (const position of openPositions) {
        const openTime = new Date(position.created_at).getTime();
        const now = Date.now();
        const elapsedMs = now - openTime;

        // Se passou 3 minutos, fechar a posição
        if (elapsedMs >= TRADE_INTERVAL_MS) {
          console.log(`⏰ Fechando posição ${position.id} (aberta há ${Math.floor(elapsedMs / 1000)}s)`);

          // Buscar preço atual da Binance
          const binanceUrl = `https://api.binance.com/api/v3/ticker/price?symbol=${position.symbol.replace('/', '')}`;
          const binanceResponse = await fetch(binanceUrl);
          const binanceData = await binanceResponse.json();
          const currentPrice = parseFloat(binanceData.price);

          // Calcular P&L
          const entryPrice = parseFloat(position.entry_price_num);
          const priceChange = position.type === 'BUY'
            ? (currentPrice - entryPrice) / entryPrice
            : (entryPrice - currentPrice) / entryPrice;
          
          const investedCapital = entryPrice * TRADE_SIZE;
          const pnl = priceChange * investedCapital * LEVERAGE;

          // Determinar resultado
          let result: 'WIN' | 'LOSS' = 'LOSS';
          let reason = 'FECHAMENTO_AUTOMATICO_3MIN';

          if (position.type === 'BUY') {
            if (currentPrice >= parseFloat(position.take_profit_num)) {
              result = 'WIN';
              reason = 'TAKE_PROFIT';
            } else if (currentPrice <= parseFloat(position.stop_loss_num)) {
              result = 'LOSS';
              reason = 'STOP_LOSS';
            } else if (pnl > 0) {
              result = 'WIN';
            }
          } else {
            if (currentPrice <= parseFloat(position.take_profit_num)) {
              result = 'WIN';
              reason = 'TAKE_PROFIT';
            } else if (currentPrice >= parseFloat(position.stop_loss_num)) {
              result = 'LOSS';
              reason = 'STOP_LOSS';
            } else if (pnl > 0) {
              result = 'WIN';
            }
          }

          // Atualizar no banco
          await supabase
            .from('ai_trades')
            .update({
              exit_price_num: currentPrice,
              pnl_num: pnl,
              result: result,
              reason: reason,
              closed_at: new Date().toISOString()
            })
            .eq('id', position.id);

          console.log(`✅ Posição fechada: ${result} | P&L: ${pnl.toFixed(2)}`);
        }
      }
    }

    // 2️⃣ VERIFICAR SE PODE ABRIR NOVA POSIÇÃO
    const { data: recentTrades } = await supabase
      .from('ai_trades')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    let canOpenNewTrade = true;

    if (recentTrades && recentTrades.length > 0) {
      const lastTrade = recentTrades[0];
      const lastTradeTime = new Date(lastTrade.created_at).getTime();
      const timeSinceLastTrade = Date.now() - lastTradeTime;

      // Só pode abrir novo trade se:
      // - Último trade foi fechado (exit_price_num não é null)
      // - OU passou pelo menos 3 minutos desde o último trade
      if (!lastTrade.exit_price_num && timeSinceLastTrade < TRADE_INTERVAL_MS) {
        canOpenNewTrade = false;
        console.log('⏳ Aguardando: posição aberta ou intervalo de 3min não atingido');
      }
    }

    if (!canOpenNewTrade) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Aguardando intervalo ou fechamento de posição',
          positionsChecked: openPositions?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3️⃣ BUSCAR DADOS DA BINANCE
    console.log('📡 Buscando dados da Binance...');
    const symbol = 'BTCUSDT';
    const timeframe = '3m';
    
    const candlesUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=50`;
    const candlesResponse = await fetch(candlesUrl);
    const candlesData = await candlesResponse.json();

    const candles = candlesData.map((k: any) => ({
      timestamp: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5])
    }));

    const currentPrice = candles[candles.length - 1].close;
    console.log(`💰 Preço atual: $${currentPrice}`);

    // 4️⃣ CONSULTAR TRADE-CHAT IA
    console.log('🤖 Consultando TradeVision IA...');
    const tradeChatUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/trade-chat`;
    const tradeChatResponse = await fetch(tradeChatUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({
        body: {
          message: `🤖 AUTO-TRADER - EXECUTAR TRADE AGORA:
          
⏰ Hora: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
📊 Par: BTC/USDT
💰 Preço: $${currentPrice.toFixed(2)}
📈 Timeframe: 3m
🕒 Ciclo: 3 minutos

Baseado nos dados atuais, DEVE executar BUY ou SELL?`,
          conversationId: 'auto-trader-system'
        }
      })
    });

    const iaResponse = await tradeChatResponse.json();
    console.log('🧠 Resposta da IA:', iaResponse);

    // 5️⃣ EXTRAIR DECISÃO DA IA
    let tradeType: 'BUY' | 'SELL' = 'BUY';
    const responseText = iaResponse.content?.toLowerCase() || '';
    
    if (responseText.includes('sell') || responseText.includes('venda')) {
      tradeType = 'SELL';
    }

    // Se a IA disse HOLD/NEUTRAL, não executa
    if (responseText.includes('hold') || responseText.includes('aguardar')) {
      console.log('⏸️ IA recomendou HOLD - não executando trade');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'IA recomendou HOLD',
          iaResponse: responseText
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6️⃣ CALCULAR NÍVEIS
    const stopLossPrice = tradeType === 'BUY'
      ? currentPrice * (1 - STOP_LOSS_PERCENT / 100)
      : currentPrice * (1 + STOP_LOSS_PERCENT / 100);

    const takeProfitPrice = tradeType === 'BUY'
      ? currentPrice * (1 + TAKE_PROFIT_PERCENT / 100)
      : currentPrice * (1 - TAKE_PROFIT_PERCENT / 100);

    // 7️⃣ SALVAR TRADE NO BANCO
    const newTrade = {
      id: crypto.randomUUID(),
      user_id: '00000000-0000-0000-0000-000000000000', // System user
      symbol: 'BTC/USDT',
      timeframe: '3m',
      type: tradeType,
      entry_price_num: currentPrice,
      stop_loss_num: stopLossPrice,
      take_profit_num: takeProfitPrice,
      ia_recommendation: iaResponse.content,
      created_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('ai_trades')
      .insert([newTrade]);

    if (insertError) {
      console.error('❌ Erro ao salvar trade:', insertError);
      throw insertError;
    }

    console.log(`✅ Trade ${tradeType} aberto em $${currentPrice.toFixed(2)}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        trade: {
          type: tradeType,
          entryPrice: currentPrice,
          stopLoss: stopLossPrice,
          takeProfit: takeProfitPrice,
          timestamp: new Date().toISOString()
        },
        message: `Trade ${tradeType} executado com sucesso!`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro no auto-trader:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

