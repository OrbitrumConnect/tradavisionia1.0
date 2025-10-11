# 🚀 Deploy do Auto-Trader

## 📋 PRÉ-REQUISITOS

1. Supabase CLI instalado: `npm install -g supabase`
2. Login feito: `npx supabase login`

## 🔧 PASSOS PARA DEPLOY

### 1. Fazer Login no Supabase
```bash
npx supabase login
```

### 2. Linkar o Projeto
```bash
npx supabase link --project-ref krjpvdllsbxeuuncmitt
```

### 3. Deploy da Function
```bash
npx supabase functions deploy auto-trader --no-verify-jwt
```

---

## ⚙️ CONFIGURAR CRON JOB (EXECUTAR A CADA 3 MINUTOS)

### Via Dashboard Supabase:

1. Acesse: **Database** → **Extensions**
2. Habilite: `pg_cron`

3. Vá em: **SQL Editor**
4. Execute:

```sql
-- Criar cron job para executar a cada 3 minutos
SELECT cron.schedule(
  'auto-trader-job',
  '*/3 * * * *', -- A cada 3 minutos
  $$
  SELECT
    net.http_post(
      url:='https://krjpvdllsbxeuuncmitt.supabase.co/functions/v1/auto-trader',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body:='{}'::jsonb
    );
  $$
);
```

5. **IMPORTANTE:** Substitua a URL pela sua URL real da Edge Function

---

## 🧪 TESTAR MANUALMENTE

Execute no terminal ou Postman:

```bash
curl -X POST \
  https://krjpvdllsbxeuuncmitt.supabase.co/functions/v1/auto-trader \
  -H "Authorization: Bearer SEU_ANON_KEY" \
  -H "Content-Type: application/json"
```

---

## 📊 MONITORAR LOGS

1. Acesse: **Edge Functions** → **auto-trader** → **Logs**
2. Veja a execução em tempo real

---

## ✅ O QUE O AUTO-TRADER FAZ:

1. ✅ Verifica posições abertas há mais de 3 minutos
2. ✅ Fecha automaticamente com WIN/LOSS
3. ✅ Consulta TradeVision IA para decisão
4. ✅ Abre novo trade (BUY/SELL)
5. ✅ Salva tudo em `ai_trades`
6. ✅ Sistema aprende com os resultados

---

## 🔄 ALTERNATIVA SEM CRON (Usar frontend temporariamente)

Se não conseguir configurar o cron, você pode adicionar isso no `AITrading.tsx`:

```typescript
useEffect(() => {
  if (isTrading) {
    const interval = setInterval(async () => {
      // Chamar a Edge Function
      await supabase.functions.invoke('auto-trader');
    }, 180000); // 3 minutos
    
    return () => clearInterval(interval);
  }
}, [isTrading]);
```

Mas isso só funciona com a página aberta.

---

## 🎯 CONFIGURAÇÃO IDEAL:

**✅ Edge Function + Cron Job = Trading 24/7 automático**

Sem precisar deixar navegador aberto!

