# 📊 Daily Financial Settlement Processor — Relatório de Consolidação Financeira

## 🎯 Visão Geral

O **Daily Financial Settlement Processor** é uma ferramenta que processa transações financeiras diárias de múltiplos comerciantes (merchants) e gera um relatório de consolidação de settlement (liquidação).

### Objetivo Principal

Processar todas as transações de um dia, aplicar lógica de negócio complexa (taxas, refunds, chargebacks, penalidades) e gerar um relatório final por merchant mostrando:
- Valor bruto (gross)
- Taxas aplicadas
- Refunds processados
- Chargebacks deduzidos
- Penalidades por risco
- Valor líquido final
- Nível de risco

---

## 📋 Tipos de Transações Suportadas

### 1. **PAYMENT** 💳
Transação de pagamento original de um cliente para um comerciante.

```typescript
{
  id: "pay-001",
  merchantId: "merchant-01",
  type: "payment",
  amount: 100.00,
  status: "approved",  // approved | pending | failed
  createdAt: "2025-01-01T10:00:00Z"
}
```

**Processamento:**
- Apenas payments com `status = approved` são contabilizados
- Aplicar taxa (5% padrão, 4.2% se volume > $10.000)
- Incluir no grossAmount

### 2. **REFUND** ↩️
Devolução de um pagamento anterior (reembolso total ou parcial).

```typescript
{
  id: "refund-001",
  merchantId: "merchant-01",
  type: "refund",
  amount: 50.00,
  status: "approved",
  createdAt: "2025-01-05T14:30:00Z",
  originalTransactionId: "pay-001"  // Referência ao payment original
}
```

**Lógica de Refund (Janela de 7 dias):**

| Cenário | Quando | Taxa Devolvida | Tipo |
|---------|--------|---|---|
| **Refund Completo** | ≤ 7 dias após payment | ✅ Sim | Full Refund |
| **Refund Parcial** | > 7 dias após payment | ❌ Não | Partial Refund |

**Exemplo:**
- Payment original: $100 com taxa de $5
- Refund em 2 dias: Devolver $100 + $5 de taxa
- Refund em 10 dias: Devolver apenas $100 (taxa não devolvida)

### 3. **CHARGEBACK** 🚫
Disputa/contestação de um pagamento pelo cliente junto ao banco.

```typescript
{
  id: "cb-001",
  merchantId: "merchant-01",
  type: "chargeback",
  amount: 100.00,  // Sempre o valor completo do payment original
  status: "approved",
  createdAt: "2025-01-02T09:15:00Z",
  originalTransactionId: "pay-001"  // Deve referenciar um payment APROVADO
}
```

**Processamento:**
- Deduzir valor total do chargeback
- Aplicar multa fixa de $15
- Incrementar contador de chargebacks do merchant
- Alto número de chargebacks = Risco elevado

### 4. **CHARGEBACK_REVERSED** ↩️🔄
Reversão de um chargeback anterior (cliente resolveu a disputa).

```typescript
{
  id: "cbr-001",
  merchantId: "merchant-01",
  type: "chargebackReversed",
  amount: 100.00,
  status: "approved",
  createdAt: "2025-01-03T11:00:00Z",
  originalTransactionId: "cb-001"  // Referência ao chargeback original
}
```

**Processamento:**
- Devolver valor do chargeback
- Remover multa aplicada
- Decrementar contador de chargebacks

---

## 💹 Lógica de Cálculo de Taxas (Fee Rate)

A taxa é **progressiva** baseada no volume total de payments aprovados:

```
Volume Total de Payments Aprovados:
├─ ≤ $10.000    → Taxa: 5.0%
└─> $10.000     → Taxa: 4.2% (redução por volume)
```

### Exemplo de Cálculo de Taxa

```
Payment 1: $5.000 → Fee: $5.000 × 5% = $250
Payment 2: $6.000 → Fee: $6.000 × 4.2% = $252
(Volume total: $11.000, aplica taxa reduzida a ambos)

Net Amount:
├─ Payment 1: $5.000 - $250 = $4.750
└─ Payment 2: $6.000 - $252 = $5.748
```

---

## ⚠️ Avaliação de Risco por Chargeback Ratio

O sistema calcula um **chargeback ratio** (proporção de chargebacks) para determinar o nível de risco do merchant:

### Fórmula
```
Chargeback Ratio = Total de Chargebacks / Total de Payments Aprovados
```

### Níveis de Risco

| Ratio | Nível | Penalidade | Descrição |
|-------|-------|-----------|-----------|
| < 0.1 | 🟢 **LOW** | $0 | Merchant seguro |
| 0.1 - 0.2 | 🟡 **MEDIUM** | $0 | Atenção necessária |
| > 0.2 | 🔴 **HIGH** | $50 | Risco elevado! |

### Exemplo de Avaliação de Risco

```
Cenário 1: Merchant com LOW Risk
├─ Payments aprovados: 100
├─ Chargebacks: 5
├─ Ratio: 5 / 100 = 0.05 (< 0.1)
├─ Risk Level: LOW 🟢
└─ Penalidade Adicional: $0

Cenário 2: Merchant com HIGH Risk
├─ Payments aprovados: 100
├─ Chargebacks: 30
├─ Ratio: 30 / 100 = 0.30 (> 0.2)
├─ Risk Level: HIGH 🔴
└─ Penalidade Adicional: $50
```

---

## 🔄 Fluxo de Processamento Completo

```
ENTRADA: Array de Transações do Dia
           ↓
┌─────────────────────────────────────┐
│ 1. VALIDAÇÃO                        │
│   ├─ Amount não pode ser negativo   │
│   ├─ Datas válidas                  │
│   ├─ Refunds referenciam payments   │
│   └─ Chargebacks referenciam pagto  │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 2. CÁLCULO DE VOLUME                │
│   └─ Soma de payments aprovados     │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 3. PROCESSAR PAYMENTS APROVADOS     │
│   ├─ Determinar taxa (5% ou 4.2%)   │
│   ├─ Calcular net amount            │
│   └─ Armazenar fee por payment      │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 4. PROCESSAR REFUNDS                │
│   ├─ Validar payment original       │
│   ├─ Checar janela de 7 dias        │
│   ├─ Devolver taxa se aplicável     │
│   └─ Armazenar fee devolvido        │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 5. PROCESSAR CHARGEBACKS            │
│   ├─ Validar payment aprovado       │
│   ├─ Aplicar multa fixa ($15)       │
│   ├─ Incrementar contador           │
│   └─ Armazenar penalidade           │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 6. PROCESSAR CHARGEBACKS REVERSED   │
│   ├─ Devolver valor do chargeback   │
│   ├─ Remover multa                  │
│   ├─ Decrementar contador           │
│   └─ Armazenar penalidade negativa  │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 7. CALCULAR RISCO E PENALIDADES     │
│   ├─ Chargeback ratio               │
│   ├─ Determinar risk level          │
│   └─ Aplicar penalidade adicional   │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 8. CONSOLIDAR POR MERCHANT          │
│   ├─ Aggregate all totals           │
│   ├─ Calculate net amount           │
│   ├─ Assign risk level              │
│   └─ Sort by merchantId             │
└─────────────────────────────────────┘
           ↓
SAÍDA: Array de DailySettlement
```

---

## 📊 Estrutura de Saída (DailySettlement)

```typescript
interface DailySettlement {
  merchantId: string;              // Ex: "merchant-01"
  grossAmount: number;              // Soma de todos os payments aprovados
  totalFees: number;                // Taxas cobradas - taxas devolvidas
  totalRefunds: number;             // Soma de todos os refunds
  totalChargebacks: number;         // Soma de todos os chargebacks
  totalPenalties: number;           // Multas + penalidades por risco
  netAmount: number;                // Valor final líquido
  riskLevel: "LOW" | "MEDIUM" | "HIGH";  // Nível de risco
}
```

### Fórmula do Net Amount

```
Net Amount = Gross Amount 
           - Total Fees 
           - Total Refunds 
           - Total Chargebacks 
           - Total Penalties
```

---

## 💰 Exemplo Prático Completo

### Cenário: Processamento do Dia para "merchant-01"

```
TRANSAÇÕES DO DIA:
1. Payment: $100 (approved)      → Fee: $5
2. Payment: $50 (approved)       → Fee: $2.50
3. Refund: $30 (day 2)           → Ref fee back: $1.50
4. Chargeback: $100 (referencia payment 1)
                                 → Penalty: $15
5. Chargeback: $50 (referencia payment 2)
                                 → Penalty: $15

CÁLCULOS:
├─ Volume total: $100 + $50 = $150 (< $10k, taxa 5%)
│
├─ Gross Amount: $150
│
├─ Total Fees: $5 + $2.50 - $1.50 = $6
│  (Devolveu taxa do refund de $1.50)
│
├─ Total Refunds: $30
│
├─ Total Chargebacks: $100 + $50 = $150
│
├─ Risk Level Calculation:
│  ├─ Chargebacks: 2
│  ├─ Approved Payments: 2
│  ├─ Ratio: 2/2 = 1.0 (> 0.2)
│  ├─ Risk Level: HIGH 🔴
│  └─ Risk Penalty: $50
│
├─ Total Penalties: $15 + $15 + $50 = $80
│
└─ Net Amount: $150 - $6 - $30 - $150 - $80 = -$116

RESULTADO FINAL:
{
  merchantId: "merchant-01",
  grossAmount: 150.00,
  totalFees: 6.00,
  totalRefunds: 30.00,
  totalChargebacks: 150.00,
  totalPenalties: 80.00,
  netAmount: -116.00,
  riskLevel: "HIGH"
}
```

*Obs: Este merchant tem saldo negativo e alto risco! 🔴*

---

## 🔐 Invariantes e Regras de Negócio

1. **Validação Obrigatória**
   - Todos os amounts devem ser ≥ 0
   - Todos os refunds devem referenciar payments existentes
   - Todos os chargebacks devem referenciar payments aprovados
   - Todas as datas devem ser válidas

2. **Arredondamento**
   - Todos os cálculos financeiros usam 2 casas decimais
   - Função: `Math.round(value * 100) / 100`

3. **Taxa Progressiva**
   - Se volume > $10.000, aplicar 4.2% a TODOS os payments
   - Se volume ≤ $10.000, aplicar 5% padrão

4. **Refund com Prazo**
   - Dentro de 7 dias: Taxa devolvida
   - Após 7 dias: Taxa NÃO devolvida

5. **Penalidades**
   - Cada chargeback: $15 de multa fixa
   - Ratio alto (> 0.2): $50 adicional

6. **Consolidação**
   - Resultados ordenados por merchantId (alfabético)
   - Um settlement por merchant

---

## 📈 Casos de Uso Reais

### Caso 1: E-commerce Saudável
```
10 payments de $100 each
1 refund de $50 (dia 3)
0 chargebacks

Resultado:
├─ Gross: $1.000
├─ Fees: $50
├─ Refunds: $50
├─ Chargebacks: $0
├─ Penalties: $0
├─ Net: $900 ✅ (Valor positivo, risco baixo)
└─ Risk: LOW
```

### Caso 2: Fraud Suspeito
```
5 payments de $100 each
2 chargebacks
2 chargebacks reversed
1 novo chargeback

Resultado:
├─ Charges/Payments: 1/5 = 0.2 (borderline)
├─ Risk: MEDIUM ⚠️
├─ Penalidades significativas
└─ Monitoramento recomendado
```

### Caso 3: Merchant em Risco
```
10 payments de $100 each
7 chargebacks
Alto volume de problemas

Resultado:
├─ Charges/Payments: 7/10 = 0.7 (crítico!)
├─ Risk: HIGH 🔴
├─ Penalidade de $50 + todas as multas
├─ Net muito negativo
└─ Ação: Suspender merchant
```

---

## 🚀 Como Usar

```bash
# Executar o settlement processor
npm start

# Executar com dados customizados
import { DailySettlementProcessor } from './src/processor';

const processor = new DailySettlementProcessor();
const transactions = [ /* suas transações */ ];
const settlements = processor.process(transactions);

// settlements é um array de DailySettlement
console.log(settlements);
```

---

## 📝 Notas Importantes

- Todos os cálculos são **determinísticos** (mesmos inputs = mesmos outputs)
- Não há persistência em banco de dados (dados em memória)
- Funções são **puras** (sem efeitos colaterais)
- Compatível com TypeScript strict mode
- Testado com 94%+ de cobertura Jest (Fase 1)

---

## 🔗 Referências

- [Documentação Principal](./prd.md) — Requisitos detalhados
- [Checklist](./CHECKLIST.md) — Progresso da implementação
- [README](../README.md) — Visão geral do projeto
