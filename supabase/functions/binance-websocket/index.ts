import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  const url = new URL(req.url);
  const symbol = url.searchParams.get('symbol') || 'btcusdt';
  const interval = url.searchParams.get('interval') || '1m';
  
  const binanceWs = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);
  
  binanceWs.onopen = () => {
    console.log('Connected to Binance WebSocket');
  };

  binanceWs.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const kline = data.k;
      
      if (kline) {
        const candleData = {
          symbol: kline.s,
          time: Math.floor(kline.t / 1000),
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
          volume: parseFloat(kline.v),
          isClosed: kline.x, // Whether this kline is closed
          timestamp: Date.now()
        };
        
        socket.send(JSON.stringify(candleData));
      }
    } catch (error) {
      console.error('Error processing Binance data:', error);
    }
  };

  binanceWs.onerror = (error) => {
    console.error('Binance WebSocket error:', error);
    socket.close();
  };

  binanceWs.onclose = () => {
    console.log('Binance WebSocket closed');
    socket.close();
  };

  socket.onclose = () => {
    binanceWs.close();
  };

  return response;
});