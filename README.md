# 🧬 Daily Financial Settlement Processor — Mutation Testing Case Study

### 📊 Jest Coverage Metrics
[![Jest Coverage: 94.19%](https://img.shields.io/badge/Jest%20Coverage-94.19%25-brightgreen?style=flat-square&logo=jest)](https://github.com/GabrielRozario/mutation-testing-stryker)
[![Statements: 94.19%](https://img.shields.io/badge/Statements-94.19%25-brightgreen?style=flat-square)](coverage/lcov-report/index.html)
[![Branches: 87.87%](https://img.shields.io/badge/Branches-87.87%25-yellow?style=flat-square)](coverage/lcov-report/index.html)
[![Functions: 93.02%](https://img.shields.io/badge/Functions-93.02%25-brightgreen?style=flat-square)](coverage/lcov-report/index.html)

### 🧬 Stryker Mutation Testing
[![Stryker Score: ~45%](https://img.shields.io/badge/Stryker%20Score-~45%25-orange?style=flat-square&logo=stryker)](https://stryker-mutator.io/)
[![Mutations: 441](https://img.shields.io/badge/Mutations-441-red?style=flat-square)](stryker.conf.json)
[![Killed: 198](https://img.shields.io/badge/Killed-198-red?style=flat-square)](reports/mutation/mutation.html)
[![Survived: 243](https://img.shields.io/badge/Survived-243-yellow?style=flat-square)](reports/mutation/mutation.html)

## 🎯 Objetivo

Este projeto demonstra **o poder e a importância dos testes de mutação** em validar a qualidade real dos testes. A discrepância entre a **cobertura tradicional (Jest)** e a **cobertura de mutação (Stryker)** revela quantos bugs potenciais poderiam passar desapercebidos por testes superficiais.

> **Lição Principal**: Um teste com 90%+ de cobertura não garante que está testando o comportamento corretamente. Os testes de mutação expõem essa fraqueza.

---

## 📚 O que é Testes de Mutação?

### Conceito Principal

**Testes de mutação** são uma técnica avançada de validação que automaticamente modifica ("mutação") o código de produção e verifica se seus testes conseguem detectar essas mudanças. Se seus testes não falham quando o código é alterado, isso significa que seus testes **não estão verificando adequadamente** o comportamento esperado.

### Como Funciona

1. **Geração de Mutantes**: Stryker cria versões modificadas do seu código aplicando pequenas mudanças:
   - Trocar `+` por `-`
   - Trocar `>` por `>=`
   - Remover validações
   - Alterar números
   - Inverter condições booleanas

2. **Execução dos Testes**: Todos os seus testes são executados contra cada versão mutante

3. **Classificação dos Mutantes**:

#### 🔴 **Survived** (Sobreviveu)
- Mutante **NÃO foi detectado** pelos testes
- Teste passou mesmo depois que o código foi alterado
- **Problema**: Seu teste não está realmente validando aquele comportamento
- Exemplo: `if (value > 10)` → `if (value >= 10)` e o teste continua passando

#### 🟢 **Killed** (Eliminado)
- Mutante **foi detectado** e eliminou-o
- Teste falhou quando o código foi alterado
- **Bom**: Seu teste está realmente validando aquele comportamento
- Exemplo: `return balance` → `return 0` e o teste fail

#### ⚪ **Não classificado** (Ignored, Error, Timeout)
- Mutante causou erro de compilação ou timeout
- Geralmente não conta para a métrica

### Stryker Score

$$\text{Stryker Score} = \frac{\text{Killed}}{\text{Killed + Survived}} \times 100\%$$

**Exemplos**:
- Score 100%: Todos os mutantes foram detectados (testes perfeitos)
- Score 45%: Apenas 45% dos mutantes foram detectados (testes fracos)
- Score 0%: Nenhum mutante foi detectado (testes inúteis)

### Por que isso importa?

Considere este cenário:
- ✅ Cobertura Jest: 95% (você acha que está bom)
- ❌ Stryker Score: 30% (sua validação é fraca)

Seu teste passa em 95% do código, mas apenas 30% dos bugs potenciais seriam detectados!

**Neste projeto**: 
- Jest Coverage: 94.19% ✅
- Stryker Score: ~45% ⚠️
- Isso significa: **~55% dos mutantes sobrevivem** (243 de 441)

---

## 📚 Roadmap do Projeto

Este repositório documenta a jornada de desenvolvimento através de múltiplas branches especializadas:

### Branch 1: `v1-fragile-tests` 🔴 (Testes Intencionalmente Fracos)

Nesta fase, implementamos testes **propositalmente fracos** para demonstrar como a cobertura tradicional pode ser enganosa.

#### 📊 Discrepância de Coverage

| Métrica | Jest | Stryker | Diferença |
|---------|------|---------|-----------|
| **Statements** | 94.19% | ~45% | **-49%** 🔴 |
| **Branches** | 87.87% | ~35% | **-52%** 🔴 |
| **Functions** | 93.02% | ~42% | **-51%** 🔴 |
| **Lines** | 94.11% | ~45% | **-49%** 🔴 |

> **O que isto significa**: Embora os testes passem em 94% das linhas de código, apenas ~45% dos mutantes gerados pelo Stryker são detectados pelos testes.

#### 🐛 Principais Problemas Encontrados pelo Stryker

1. **Testes que não validam retornos** — Validam apenas "não lançar erro" sem verificar valores reais
2. **Falta de validação de limites críticos** — Não testam exatamente 0.2, 0.1, 7 dias, 3 chargebacks
3. **Sem verificação de arredondamento** — Não validam se Math.round está sendo aplicado corretamente
4. **Valores extremos demais** — Usam 0.01 e 999999, ignorando casos normais e limites
5. **Operadores trocados não detectados** — `>` por `>=`, `+` por `-` passam nos testes

#### 🏗️ Estrutura dos Testes da v1

```
test/unit/
  ├── domain/
  │   └── validations.test.ts          (Cobertura: 95%+)
  ├── processor.test.ts                 (Cobertura: 100%)
  └── services/
      ├── chargebackProcessor.test.ts   (Cobertura: 100%)
      ├── paymentProcessor.test.ts      (Cobertura: 95%+)
      ├── refundProcessor.test.ts       (Cobertura: 94%+)
      ├── riskManager.test.ts           (Cobertura: 100%)
      ├── settlementProcessor.test.ts   (Cobertura: 88%+)
      └── volumeCalculator.test.ts      (Cobertura: 61%+)
```

**Total**: 153 testes passando com 94% de cobertura Jest, mas apenas ~45% de score Stryker

---

### Branch 2: `v2-stronger-tests` 🟢 (Testes Fortalecidos — em desenvolvimento)

Próxima fase (não preenchida). Objetivo: Implementar testes que detectem 85%+ dos mutantes.

---

## 📁 Estrutura do Projeto

```
mutation-testing-stryker/
├── src/
│   ├── index.ts                               # Entry point
│   ├── processor.ts                           # Orquestrador principal
│   ├── settlement.ts                          # Runner de settlement
│   ├── domain/
│   │   ├── constants.ts                       # Constantes financeiras
│   │   ├── validations.ts                     # Validações de transções
│   │   └── index.ts
│   ├── models/
│   │   ├── enums.ts                           # Status, Tipo, RiskLevel
│   │   ├── types.ts                           # Transaction, DailySettlement
│   │   └── index.ts
│   └── services/
│       ├── paymentProcessor.ts                # Processamento de payments (+taxa)
│       ├── refundProcessor.ts                 # Processamento de refunds (7 dias)
│       ├── chargebackProcessor.ts             # Processamento de chargebacks (+multa)
│       ├── riskManager.ts                     # Avaliação de risco
│       ├── volumeCalculator.ts                # Cálculo de volume por merchant
│       ├── settlementProcessor.ts             # Consolidação por merchant
│       └── index.ts
├── test/
│   └── unit/
│       ├── domain/
│       │   └── validations.test.ts
│       ├── processor.test.ts
│       └── services/
│           ├── chargebackProcessor.test.ts
│           ├── paymentProcessor.test.ts
│           ├── refundProcessor.test.ts
│           ├── riskManager.test.ts
│           ├── settlementProcessor.test.ts
│           └── volumeCalculator.test.ts
├── data/
│   └── sample-transactions.json               # Dados de teste JSON
├── docs/
│   └── FEATURES.md                             # Documentação da ferramenta de settlement
├── coverage/                                  # Reports Jest
├── reports/                                   # Reports Stryker
├── jest.config.js
├── stryker.conf.json
├── tsconfig.json
├── package.json
├── eslint.config.js
└── README.md
```

---

## 🚀 Como Executar

### Instalar Dependências
```bash
npm install
```

### Executar Testes (Jest)
```bash
npm test:coverage
```

### Executar Testes de Mutação (Stryker)
```bash
npm run mutation
```

---

## 📖 Para Entender Melhor

Se você quer ver **exatamente como os testes fracos foram implementados** na v1:

```bash
git checkout v1-fragile-tests
```

Nesta branch você encontrará:
- ✅ 153 testes do Jest passando
- ✅ 94%+ cobertura tradicional
- ❌ ~45% de score Stryker
- 📝 Comentários explicando **por que cada teste é fraco**

Depois compare com a v2 (quando criada) para ver como os testes evoluem.

---

## 📊 Métricas Finais

### Fase 1 (v1-fragile-tests)
- **Jest Coverage**: 94.19% statements, 87.87% branches
- **Stryker Score**: ~45% (441 mutantes gerados, ~200 detectados)
- **Testes**: 153 passando
- **Objetivo alcançado**: ✅ Demonstrar a discrepância

### Fase 2 (v2-stronger-tests) — Em desenvolvimento
- **Target Stryker Score**: 85%+
- **Estratégia**: Validar valores exatos, limites críticos, arredondamento

---

## 🔍 O que Aprendemos

1. **Cobertura ≠ Qualidade** — 94% de Jest não significa 94% de Stryker
2. **Testes podem ser enganosos** — Sem validar retornos, limite são inúteis
3. **Operadores trocados** — `>` vs `>=` não são detectados por testes fracos
4. **Arredondamento importa** — Em cálculos financeiros, cada centavo conta
5. **Testes de mutação revelam a verdade** — Stryker é a métrica real de qualidade

---

## 📚 Referências

- [FEATURES.md](./docs/FEATURES.md) — Documentação detalhada da ferramenta Daily Financial Settlement Processor
- [Stryker Mutator](https://stryker-mutator.io/) — Mutation testing framework
- [Jest](https://jestjs.io/) — Unit testing framework
- [TypeScript](https://www.typescriptlang.org/) — Language