import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("q") || "bolsa de valores";
    
    console.log(`Fetching news for query: ${query}`);

    const gnewsApiKey = Deno.env.get("GNEWS_API_KEY");
    if (!gnewsApiKey) {
      throw new Error("GNEWS_API_KEY not configured");
    }

    const resp = await fetch(
      `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=pt&max=10&token=${gnewsApiKey}`
    );

    if (!resp.ok) {
      throw new Error(`GNews API error: ${resp.status} ${resp.statusText}`);
    }

    const data = await resp.json();
    console.log(`Retrieved ${data.articles?.length || 0} articles`);

    return new Response(JSON.stringify(data.articles || []), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error('Error in noticias function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});