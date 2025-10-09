# 🧠 NÚCLEO DE DECISÃO DINÂMICA - TradeVision IA v9.0

## 📋 Visão Geral

O **Núcleo de Decisão Dinâmica** transforma o TradeVision IA em um **agente verdadeiramente autônomo** que:

- ✅ **Pensa entre tarefas** - Não apenas reage, mas analisa continuamente
- ✅ **Aprende sozinho** - Descobre padrões e gera insights automaticamente
- ✅ **Planeja o futuro** - Define objetivos e cria planos de ação
- ✅ **Prior

iza tarefas** - Foca no que é mais importante
- ✅ **Evolui constantemente** - Melhora com o tempo sem intervenção

---

## 🏗️ Arquitetura

```
╔═══════════════════════════════════════════════════════════╗
║         NÚCLEO DE DECISÃO DINÂMICA (Nível 2 IA)           ║
╚═══════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────┐
│  1️⃣ ROTINAS PERIÓDICAS DE ANÁLISE                       │
├─────────────────────────────────────────────────────────┤
│  • Micro (5 min):  Ajustes em tempo real                 │
│  • Meso (1 hora):  Descoberta de padrões                 │
│  • Macro (24h):    Consolidação e relatórios             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  2️⃣ MEMÓRIA CONTEXTUAL VETORIZADA                       │
├─────────────────────────────────────────────────────────┤
│  • Short-term:  Últimas 24h (expires_at)                 │
│  • Mid-term:    Última semana (consolidado)              │
│  • Long-term:   Histórico comprimido                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  3️⃣ SISTEMA DE PRIORIDADES                              │
├─────────────────────────────────────────────────────────┤
│  • CRITICAL:    Alertas de risco (score: 100)            │
│  • HIGH:        Sinais importantes (score: 75)           │
│  • MEDIUM:      Análises normais (score: 50)             │
│  • LOW:         Melhorias (score: 25)                    │
│  • BACKGROUND:  Consolidação (score: 10)                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  4️⃣ PLANEJAMENTO AUTÔNOMO                               │
├─────────────────────────────────────────────────────────┤
│  • 5min:   O que monitorar agora                         │
│  • 1hour:  Quais padrões focar                           │
│  • 1day:   Objetivos e metas                             │
│  • 1week:  Estratégias de evolução                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  5️⃣ PROCESSAMENTO EM BACKGROUND                         │
├─────────────────────────────────────────────────────────┤
│  • Análise de correlações                                │
│  • Mineração de padrões                                  │
│  • Teste de hipóteses                                    │
│  • Simulação de cenários                                 │
│  • Geração de insights                                   │
│  • Consolidação de conhecimento                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ Tabelas Criadas

### 1. **agent_memory** - Memória Contextual
Armazena experiências do agente com busca semântica vetorial.

```sql
- memory_type: short_term | mid_term | long_term
- content: Texto da memória
- embedding: VECTOR(384) para busca
- importance_score: 0.0 - 1.0
- access_count: Quantas vezes foi acessada
- expires_at: Data de expiração
```

### 2. **agent_context** - Estado Atual
Contexto em tempo real para tomada de decisões.

```sql
- market_state: Tendência, volatilidade atual
- signals_generated_today: Contagem
- win_rate_24h, win_rate_7d: Performance
- current_focus: Objetivo atual
- recent_insights: Últimas descobertas
```

### 3. **agent_insights** - Descobertas Autônomas
Insights gerados autonomamente pelo agente.

```sql
- insight_type: correlation | pattern_discovery | risk_alert | opportunity
- title, description: Conteúdo
- confidence: 0.0 - 1.0
- recommended_action: O que fazer
- validated: Validado pelo usuário
```

### 4. **agent_priorities** - Fila de Tarefas
Sistema de priorização inteligente.

```sql
- priority: CRITICAL | HIGH | MEDIUM | LOW | BACKGROUND
- priority_score: 1-100
- task_type, task_description: Detalhes
- status: pending | in_progress | completed
```

### 5. **agent_actions_plan** - Planos de Ação
Planos estratégicos por timeframe.

```sql
- timeframe: 5min | 1hour | 1day | 1week
- objective: Objetivo do plano
- actions: Array de ações
- progress: 0.0 - 1.0
```

### 6. **agent_background_tasks** - Processamento Background
Tarefas que rodam quando não há input do usuário.

```sql
- task_type: correlation_analysis | pattern_mining | hypothesis_testing
- status: queued | running | completed | failed
- discoveries: Resultados encontrados
- run_frequency: once | 5min | 1hour | 1day
```

---

## 🚀 Como Usar

### 1. **Ativar o Núcleo de Decisão**

```typescript
import { useDecisionEngine } from '@/hooks/useDecisionEngine';

function MyComponent() {
  const { start, stop, isActive } = useDecisionEngine();

  return (
    <Button onClick={start}>
      {isActive ? 'Pausar' : 'Iniciar'} Núcleo de Decisão
    </Button>
  );
}
```

### 2. **Forçar Análise Específica**

```typescript
const { runAnalysis } = useDecisionEngine();

// Micro-análise (5 min)
await runAnalysis('micro');

// Meso-análise (1 hora)
await runAnalysis('meso');

// Macro-análise (24 horas)
await runAnalysis('macro');
```

### 3. **Buscar Insights Gerados**

```typescript
const { getInsights } = useDecisionEngine();

const insights = await getInsights(20); // Últimos 20
```

### 4. **Visualizar Prioridades**

```typescript
const { getPriorities } = useDecisionEngine();

const priorities = await getPriorities(); // Tarefas pendentes
```

### 5. **Dar Feedback em Insights**

```typescript
const { submitInsightFeedback } = useDecisionEngine();

// Usuário avalia de 1-5 estrelas
await submitInsightFeedback(insightId, 5);
```

---

## 📊 Fluxo Completo

```
┌──────────────────────────────────────────────────────────┐
│  USUÁRIO ATIVA O NÚCLEO                                   │
└──────────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────┐
│  INICIA ROTINAS PERIÓDICAS                                │
│  ├─ Micro-análise: a cada 5 minutos                       │
│  ├─ Meso-análise: a cada 1 hora                           │
│  └─ Macro-análise: a cada 24 horas                        │
└──────────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────┐
│  MICRO-ANÁLISE (5 min)                                    │
│  ├─ Revisa sinais recentes                                │
│  ├─ Avalia performance                                    │
│  ├─ Detecta mudanças de tendência                         │
│  ├─ Ajusta probabilidades                                 │
│  └─ Gera insights críticos                                │
└──────────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────┐
│  MESO-ANÁLISE (1 hora)                                    │
│  ├─ Identifica padrões recorrentes                        │
│  ├─ Avalia contexto macro                                 │
│  ├─ Gera plano para próxima hora                          │
│  └─ Salva descobertas importantes                         │
└──────────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────┐
│  MACRO-ANÁLISE (24 horas)                                 │
│  ├─ Consolida aprendizado do dia                          │
│  ├─ Calcula win rate e sharpe ratio                       │
│  ├─ Compara com dias anteriores                           │
│  ├─ Gera relatório autônomo                               │
│  ├─ Atualiza base de conhecimento                         │
│  └─ Define objetivos para amanhã                          │
└──────────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────┐
│  PROCESSAMENTO EM BACKGROUND                              │
│  (Roda quando não há input do usuário)                    │
│  ├─ Analisa correlações ocultas                           │
│  ├─ Minera padrões não óbvios                             │
│  ├─ Testa hipóteses automaticamente                       │
│  ├─ Simula cenários futuros                               │
│  └─ Gera insights proativos                               │
└──────────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────┐
│  SISTEMA DE PRIORIDADES                                   │
│  ├─ Ordena tarefas por importância                        │
│  ├─ Processa tarefas CRITICAL primeiro                    │
│  ├─ Executa planos de ação                                │
│  └─ Salva resultados na memória                           │
└──────────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────┐
│  APRESENTA INSIGHTS AO USUÁRIO                            │
│  ├─ Notificação de descobertas importantes                │
│  ├─ Alertas proativos                                     │
│  └─ Recomendações de ação                                 │
└──────────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────┐
│  USUÁRIO DÁ FEEDBACK (1-5 estrelas)                       │
│  └─ Sistema aprende e ajusta confidence                   │
└──────────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────┐
│  CICLO CONTÍNUO DE EVOLUÇÃO                               │
│  └─ Agente fica cada vez mais inteligente                 │
└──────────────────────────────────────────────────────────┘
```

---

## 💡 Exemplos de Insights Gerados

### 1. **Descoberta de Padrão**
```
💡 Padrão Recorrente Descoberto

Tipo: pattern_discovery
Confiança: 87%

Descobri que quando Order Block + FVG aparecem juntos
entre 10h-12h, você tem 78% de win rate.

Ação Recomendada:
Priorizar detecção deste padrão neste horário.
```

### 2. **Correlação Encontrada**
```
📊 Correlação Identificada

Tipo: correlation
Confiança: 92%

Existe forte correlação (0.85) entre volume acima 
de 1.5B e probabilidade de rompimento bem-sucedido.

Ação Recomendada:
Aumentar confidence de sinais quando volume > 1.5B
```

### 3. **Alerta de Risco**
```
⚠️ Mudança de Contexto Detectada

Tipo: risk_alert
Confiança: 95%

Detectei mudança de tendência: ALTISTA → LATERAL

Últimos 5 sinais tiveram performance abaixo do esperado.

Ação Recomendada:
Reduzir position size até confirmação de nova tendência.
```

### 4. **Oportunidade Identificada**
```
🎯 Oportunidade de Melhoria

Tipo: opportunity
Confiança: 73%

Sinais gerados entre 14h-16h têm 15% melhor performance
que média geral.

Ação Recomendada:
Aumentar frequência de análise neste período.
```

---

## 🎯 Planos de Ação Gerados

### Plano 5 Minutos
```json
{
  "timeframe": "5min",
  "objective": "Monitorar sinais ativos e ajustar probabilidades",
  "actions": [
    {
      "action": "monitor_active_signals",
      "description": "Verificar performance dos últimos 3 sinais",
      "priority": "HIGH"
    },
    {
      "action": "detect_trend_changes",
      "description": "Detectar mudanças súbitas de tendência",
      "priority": "HIGH"
    }
  ]
}
```

### Plano 1 Hora
```json
{
  "timeframe": "1hour",
  "objective": "Focar em padrões com 75%+ win rate",
  "actions": [
    {
      "action": "analyze_patterns",
      "description": "Order Block + FVG, Spring + Volume Spike",
      "priority": "MEDIUM",
      "data": {
        "patterns": ["Order Block + FVG", "Spring + Volume Spike"]
      }
    },
    {
      "action": "evaluate_performance",
      "description": "Calcular win rate da última hora",
      "priority": "MEDIUM"
    }
  ]
}
```

### Plano 1 Dia
```json
{
  "timeframe": "1day",
  "objective": "Superar performance de hoje (73% → 77% win rate)",
  "actions": [
    {
      "action": "consolidate_learning",
      "description": "Consolidar padrões bem-sucedidos",
      "priority": "MEDIUM"
    },
    {
      "action": "generate_report",
      "description": "Gerar relatório diário autônomo",
      "priority": "LOW"
    },
    {
      "action": "update_knowledge_base",
      "description": "Adicionar descobertas à bot_knowledge",
      "priority": "LOW"
    }
  ]
}
```

---

## 🔧 Configuração

### 1. Aplicar Migrations

```bash
cd supabase
supabase db push
```

### 2. Deploy da Edge Function

```bash
supabase functions deploy decision-engine
```

### 3. Adicionar ao Admin Dashboard

```typescript
// src/pages/Admin.tsx
import { DecisionEnginePanel } from '@/components/admin/DecisionEnginePanel';

// Adicionar nova aba:
<Tabs value={activeTab} onValueChange={setActiveTab}>
  {/* ... outras tabs ... */}
  <TabsTrigger value="decision-engine">
    <Brain className="w-4 h-4 mr-2" />
    Núcleo de Decisão
  </TabsTrigger>
</Tabs>

<TabsContent value="decision-engine">
  <DecisionEnginePanel />
</TabsContent>
```

---

## 📈 Benefícios

### 1. **Autonomia Real**
- Não depende apenas de inputs do usuário
- "Pensa" continuamente sobre o mercado
- Descobre padrões que humanos não veem

### 2. **Evolução Contínua**
- Aprende sozinho com resultados
- Ajusta estratégias automaticamente
- Melhora performance com o tempo

### 3. **Priorização Inteligente**
- Foca no que é mais importante
- Não perde tempo com ruído
- Executa tarefas na ordem certa

### 4. **Planejamento Estratégico**
- Define objetivos claros
- Cria planos de ação
- Mede progresso automaticamente

### 5. **Insights Proativos**
- Alerta sobre riscos antes que aconteçam
- Identifica oportunidades ocultas
- Recomenda ações específicas

---

## 🚀 Próximos Passos

### Fase 1: Implementação Básica (Atual)
- ✅ Tabelas criadas
- ✅ Edge Function principal
- ✅ Hook React
- ✅ Componente UI

### Fase 2: Algoritmos Avançados
- [ ] Implementar algoritmos reais de correlação
- [ ] Mineração de padrões com ML
- [ ] Teste de hipóteses estatístico
- [ ] Simulação Monte Carlo

### Fase 3: Aprendizado Profundo
- [ ] Integrar modelo de reinforcement learning
- [ ] Auto-ajuste de hiperparâmetros
- [ ] Transfer learning de outros traders
- [ ] Meta-learning (aprender a aprender)

### Fase 4: AGI Trading
- [ ] Raciocínio causal
- [ ] Planejamento multi-step
- [ ] Criatividade (gerar novas estratégias)
- [ ] Explicabilidade (XAI)

---

## 🎉 Conclusão

O **Núcleo de Decisão Dinâmica** transforma o TradeVision IA de um **assistente reativo** para um **agente autônomo inteligente** que:

- Pensa continuamente
- Aprende sozinho
- Planeja o futuro
- Prioriza tarefas
- Evolui constantemente

**É o próximo nível de inteligência artificial aplicada ao trading!** 🚀🧠

---

**Versão:** 9.0  
**Data:** Janeiro 2025  
**Desenvolvido por:** Pedro Galluf

