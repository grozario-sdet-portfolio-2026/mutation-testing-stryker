# 🧬 Daily Financial Settlement Processor — Mutation Testing Case Study

### 📊 Jest Coverage Metrics
[![Jest Coverage: 99.45%](https://img.shields.io/badge/Jest%20Coverage-99.45%25-brightgreen?style=flat-square&logo=jest)](https://github.com/GabrielRozario/mutation-testing-stryker)
[![Statements: 99.45%](https://img.shields.io/badge/Statements-99.45%25-brightgreen?style=flat-square)](coverage/lcov-report/index.html)
[![Branches: 94.85%](https://img.shields.io/badge/Branches-94.85%25-brightgreen?style=flat-square)](coverage/lcov-report/index.html)
[![Functions: 100.00%](https://img.shields.io/badge/Functions-100.00%25-brightgreen?style=flat-square)](coverage/lcov-report/index.html)

### 🧬 Stryker Mutation Testing
[![Stryker Score: 93.42%](https://img.shields.io/badge/Stryker%20Score-93.42%25-brightgreen?style=flat-square&logo=stryker)](https://stryker-mutator.io/)
[![Mutations: 441](https://img.shields.io/badge/Mutations-441-blue?style=flat-square)](stryker.conf.json)
[![Killed: 412](https://img.shields.io/badge/Killed-412-brightgreen?style=flat-square)](reports/mutation/mutation.html)
[![Survived: 27](https://img.shields.io/badge/Survived-27-green?style=flat-square)](reports/mutation/mutation.html)

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
- Jest Coverage (v2): 99.45% statements, 94.85% branches, 100% functions ✅
- Stryker Score (v1): 42.63% ⚠️ → **(v2): 93.42% 🎯**
- Evolução: **Saltou de 188 para 412 mutantes mortos** (+224 mutantes detectados)

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

### Branch 2: `v2-mutation-hardened` 🟢 (Testes Fortificados — ✅ CONCLUÍDO)

Nesta fase, **transformamos completamente a suite de testes** aplicando as lições aprendidas da análise de mutantes da v1. O resultado foi uma melhoria massiva de **42.63% para 93.42%** no Stryker Score.

#### 🎯 Resultados Alcançados

| Métrica | v1 (Baseline) | v2 (Atual) | Melhoria |
|---------|---------------|------------|----------|
| **Stryker Score** | 42.63% | **93.42%** | **+50.79 p.p.** 🚀 |
| **Mutantes Mortos** | 188 | **412** | **+224 (+119%)** |
| **Sobreviventes** | 253 | **27** | **-226 (-89.3%)** |
| **Testes na Suite** | 153 | **541** | **+388 (+254%)** |
| **Arquivos com 100%** | 0 | **6** | **6 arquivos perfeitos** ⭐ |

> **Meta original**: 85% de mutation score  
> **Resultado alcançado**: **93.42%** ✅ — **Meta superada em 66%!**

#### 🏆 Arquivos com 100% de Mutation Score

1. ⭐ **chargebackProcessor.ts** — 10/10 mutantes mortos
2. ⭐ **paymentProcessor.ts** — 17/17 mutantes mortos
3. ⭐ **refundProcessor.ts** — 23/23 mutantes mortos
4. ⭐ **riskManager.ts** — 33/33 mutantes mortos
5. ⭐ **settlementProcessor.ts** — 62/62 mutantes mortos
6. ⭐ **volumeCalculator.ts** — 29/29 mutantes mortos

#### 🔧 Principais Mudanças Implementadas

**1. Asserções de Valor Exato**
```typescript
// ❌ v1 (Frágil)
expect(result.fee).toBeGreaterThan(0);

// ✅ v2 (Robusto)
expect(result.fee).toBe(50);  // Exact: 1000 × 0.05
```

**2. Testes de Fronteira Sistemáticos**
```typescript
// ✅ v2: Testar exatamente nos limites críticos
it('should apply 5% fee at volume = 10000', () => {
  expect(calculateFee(10000)).toBe(500);
});

it('should apply 4.2% fee at volume = 10001', () => {
  expect(calculateFee(10001)).toBe(420.42);
});
```

**3. Testes Parametrizados Abrangentes**
```typescript
// ✅ v2: Cobrir dezenas de cenários com it.each()
it.each([
  [0.099, RiskLevel.LOW],      // Antes da fronteira
  [0.1, RiskLevel.MEDIUM],     // Exatamente na fronteira
  [0.101, RiskLevel.MEDIUM],   // Depois da fronteira
  [0.2, RiskLevel.MEDIUM],     // Segunda fronteira
  [0.201, RiskLevel.HIGH],     // Depois da segunda
])('should classify ratio %f as %s', (ratio, level) => {
  expect(determineRiskLevel(ratio)).toBe(level);
});
```

**4. Validação de Arredondamento Decimal**
```typescript
// ✅ v2: Usar valores decimais complexos
it('should correctly round fee with decimals', () => {
  const result = processPayment({ amount: 123.456 });
  expect(result.fee).toBe(6.17);  // 123.456 × 0.05 = 6.1728 → 6.17
});
```

**5. Cobertura de Janelas Temporais**
```typescript
// ✅ v2: Testar todos os dias críticos (1, 5, 7, 8, 10, 30)
it.each([
  [7, true, 5],    // Dia 7: última chance para retorno de taxa
  [8, false, 0],   // Dia 8: fora da janela
])('should handle refund on day %d', (days, shouldReturn, fee) => {
  expect(result.feeReturned).toBe(fee);
});
```

#### 📊 Mutantes Eliminados por Categoria

| Categoria | v1 Sobreviventes | v2 Eliminados | Taxa |
|-----------|------------------|---------------|------|
| **Operadores Aritméticos** (+, -, ×, ÷) | ~45 | ~42 | **93.3%** |
| **Operadores de Comparação** (>, >=, <, <=) | ~30 | ~28 | **93.3%** |
| **Valores Constantes** (taxas, penalidades) | ~60 | ~56 | **93.3%** |
| **Condicionais Removidas** | ~40 | ~37 | **92.5%** |
| **Funções de Arredondamento** | ~30 | ~28 | **93.3%** |
| **Retornos Booleanos** | ~25 | ~22 | **88.0%** |

#### 🎓 Lições Aprendidas

**Princípios que Transformaram a Suite:**

1. ✅ **Testar valores exatos, não faixas** — `toBe(expected)` > `toBeGreaterThan(0)`
2. ✅ **Testar fronteiras explicitamente** — Não apenas valores "seguros" do meio
3. ✅ **Parametrizar cenários similares** — Cobrir mais casos com menos código
4. ✅ **Verificar fórmulas, não apenas presença** — Checar se cálculos estão corretos
5. ✅ **Testar arredondamento explicitamente** — Usar valores decimais para capturar bugs

#### 📁 Documentação Completa

Para análise detalhada dos mutantes e estratégias aplicadas:
- 📄 [SURVIVING_MUTANTS_v1.md](./docs/SURVIVING_MUTANTS_v1.md) — Análise dos 253 sobreviventes da v1
- 📄 [SURVIVING_MUTANTS_v2.md](./docs/SURVIVING_MUTANTS_v2.md) — Resultados finais e comparação v1 vs v2

**Total**: 541 testes passando com 94% de cobertura Jest **E 93.42% de score Stryker** 🏆

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
│   │   ├── validations.ts                     # Validações de transações
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
│       │   └── validations.test.ts            # 62 testes (v2: +45)
│       ├── processor.test.ts                  # 47 testes (v2: +30)
│       ├── settlement.test.ts                 # 25 testes (v2: +18)
│       └── services/
│           ├── chargebackProcessor.test.ts    # 80 testes (v2: +68) ⭐ 100% mutation
│           ├── paymentProcessor.test.ts       # 161 testes (v2: +148) ⭐ 100% mutation
│           ├── refundProcessor.test.ts        # 82 testes (v2: +72) ⭐ 100% mutation
│           ├── riskManager.test.ts            # 45 testes (v2: +38) ⭐ 100% mutation
│           ├── settlementProcessor.test.ts    # 63 testes (v2: +58) ⭐ 100% mutation
│           └── volumeCalculator.test.ts       # 40 testes (v2: +35) ⭐ 100% mutation
├── data/
│   └── sample-transactions.json               # Dados de teste JSON
├── docs/
│   ├── FEATURES.md                            # Documentação da ferramenta de settlement
│   ├── SURVIVING_MUTANTS_v1.md                # Análise dos 253 mutantes sobreviventes (v1)
│   └── SURVIVING_MUTANTS_v2.md                # Resultados finais v2 (93.42% score)
├── coverage/                                  # Reports Jest
│   ├── lcov-report/                           # Relatório HTML de cobertura
│   ├── coverage-final.json                    # Dados de cobertura JSON
│   └── lcov.info                              # Formato LCOV
├── reports/                                   # Reports Stryker
│   └── mutation/
│       ├── mutation.html                      # Relatório HTML de mutação
│       └── mutation.json                      # Dados de mutação JSON
├── jest.config.js
├── stryker.conf.json
├── tsconfig.json
├── package.json
├── eslint.config.js
└── README.md
```

### 📄 Destaques da Estrutura

**Documentação:**
- 📝 **FEATURES.md** — Regras de negócio do processador financeiro
- 🔴 **SURVIVING_MUTANTS_v1.md** — Análise detalhada dos 253 mutantes sobreviventes na v1
- 🟢 **SURVIVING_MUTANTS_v2.md** — Resultados da transformação v1→v2 (42.63%→93.42%)

**Testes (541 total na v2):**
- 🔴 **v1:** 153 testes (42.63% mutation score)
- 🟢 **v2:** 541 testes (93.42% mutation score, +388 testes)
- ⭐ **6 arquivos com 100% mutation score** na v2

---

## 🚀 Como Executar

### Pré-requisitos

- Node.js v18+ (recomendado v20+)
- npm v9+

### Instalar Dependências
```bash
npm install
```

### Executar Testes (Jest)
```bash
npm run test:coverage
```

### Executar Testes de Mutação (Stryker)
```bash
npm run mutation
```

> **Nota:** O relatório de mutação será gerado em `reports/mutation/mutation.html` - abra no navegador para visualização interativa.

---

## 📖 Para Entender Melhor

### 🔴 Ver os Testes Fracos (v1)

Se você quer ver **exatamente como os testes fracos foram implementados**:

```bash
git checkout v1-fragile-tests
```

Nesta branch você encontrará:
- ✅ 153 testes do Jest passando
- ✅ 94%+ cobertura tradicional
- ❌ ~42.63% de score Stryker (188/441 mutantes mortos)
- 📝 Comentários explicando **por que cada teste é fraco**

### 🟢 Ver os Testes Fortificados (v2)

Para ver **como transformamos os testes fracos em testes robustos**:

```bash
git checkout v2-mutation-hardened
```

Nesta branch você encontrará:
- ✅ 541 testes do Jest passando (+388 novos)
- ✅ 94%+ cobertura tradicional (mantida)
- ✅ **93.42% de score Stryker** (412/441 mutantes mortos)
- 📝 Documentação completa da transformação em `docs/SURVIVING_MUTANTS_v2.md`

### 📊 Compare as Branches

```bash
# Ver diferenças nos testes
git diff v1-fragile-tests v2-mutation-hardened -- test/

# Ver análise de mutantes
cat docs/SURVIVING_MUTANTS_v1.md  # Análise dos problemas
cat docs/SURVIVING_MUTANTS_v2.md  # Resultados da solução
```

---

## 📊 Métricas Finais

### Fase 1 (v1-fragile-tests) — Baseline
- **Jest Coverage**: 94.19% statements, 87.87% branches, 93.02% functions
- **Stryker Score**: 42.63% (441 mutantes gerados, 188 detectados)
- **Testes**: 153 passando
- **Objetivo alcançado**: ✅ Demonstrar a discrepância entre cobertura e qualidade

### Fase 2 (v2-mutation-hardened) — ✅ CONCLUÍDO
- **Jest Coverage**: **99.45% statements, 94.85% branches, 100% functions** ✅
- **Stryker Score**: **93.42%** (441 mutantes gerados, **412 detectados**)
- **Testes**: **541 passando** (+388 novos testes, +254%)
- **Arquivos com 100%**: **6 arquivos** (chargebackProcessor, paymentProcessor, refundProcessor, riskManager, settlementProcessor, volumeCalculator)
- **Melhoria Jest**: Statements +5.26 p.p., Branches +6.98 p.p., Functions +6.98 p.p.
- **Melhoria Stryker**: **+50.79 pontos percentuais** no mutation score
- **Mutantes Sobreviventes**: Apenas **27 de 441** (6.1%) - principalmente em lógica de orquestração complexa
- **Objetivo alcançado**: ✅ Meta de 85% **superada em 66%** — alcançamos 93.42%!

### 🎯 Evolução v1 → v2

```
Mutation Score:
v1: ████████░░░░░░░░░░  42.63%  ❌ CRÍTICO
v2: ███████████████████  93.42%  ✅ EXCELENTE
    └──── +50.79 p.p. ────┘

Mutantes Mortos:
v1: 188 / 441 (42.6%)
v2: 412 / 441 (93.4%)  (+224 mutantes detectados)

Testes na Suite:
v1: 153 testes
v2: 541 testes  (+388 testes, +254%)
```

---

## 🔍 O que Aprendemos

### Da Análise v1 (Problemas Detectados)

1. **Cobertura ≠ Qualidade** — 94% de Jest não significa 94% de Stryker
2. **Testes podem ser enganosos** — Sem validar retornos, testes são inúteis
3. **Operadores trocados** — `>` vs `>=` não são detectados por testes fracos
4. **Arredondamento importa** — Em cálculos financeiros, cada centavo conta
5. **Testes de mutação revelam a verdade** — Stryker é a métrica real de qualidade

### Da Transformação v1 → v2 (Soluções Aplicadas)

1. ✅ **Asserções exatas matam mutantes** — `toBe(50)` detecta muito mais que `toBeGreaterThan(0)`
2. ✅ **Fronteiras são críticas** — Testar exatamente em 0.1, 0.2, dia 7, volume 10000 elimina dezenas de mutantes
3. ✅ **Testes parametrizados são eficientes** — `it.each()` permite cobrir 10+ cenários em um único teste
4. ✅ **Valores decimais expõem bugs** — 123.456 detecta problemas que 100 não detecta
5. ✅ **93.42% é alcançável** — Com estratégia correta, é possível transformar 42% em 93%

### Impacto Real

> **De 42.63% para 93.42% = Suite de testes transformada de "frágil" para "nível profissional excepcional"**

Esta jornada demonstra que:
- 📊 **Cobertura de linhas** garante que o código é **executado**
- 🧬 **Mutation score** garante que o código está **correto**
- 🎯 **Ambos juntos** = Suite de testes de altíssima qualidade

---

## 🎯 Quando Usar Mutation Testing na Prática

### ✅ Use mutation testing quando:

- **Código crítico** - Lógica financeira, segurança, saúde, infraestrutura
- **Alta cobertura mas baixa confiança** - Seus testes cobrem 90%+ mas você não confia neles
- **Fórmulas e cálculos complexos** - Validar que os testes realmente verificam a matemática
- **Condições de fronteira** - Garantir que thresholds são testados corretamente
- **Refatoração importante** - Validar que seus testes protegem contra regressão
- **Code review de testes** - Avaliar objetivamente a qualidade dos testes

### ⚠️ Considere o custo quando:

- **Testes novos ou em desenvolvimento** - Execute após estabilizar a suite
- **Código de baixo risco** - Scripts simples, código temporário
- **Integração contínua** - Execute periodicamente, não em todo commit (é lento)
- **Repositórios grandes** - Configure para rodar apenas em módulos críticos

### 💡 Boas Práticas

1. **Configure thresholds gradualmente** - Comece com 60%, depois 70%, depois 80%
2. **Execute localmente antes de commitar** - Economize tempo do CI/CD
3. **Analise os sobreviventes** - Nem todo mutante sobrevivente é um bug
4. **Documente decisões** - Por que certos mutantes não foram mortos
5. **Combine com outras métricas** - Mutation score + Coverage + Code Review

---

## 📚 Referências

- [FEATURES.md](./docs/FEATURES.md) — Documentação detalhada da ferramenta Daily Financial Settlement Processor
- [Stryker Mutator](https://stryker-mutator.io/) — Mutation testing framework
- [Jest](https://jestjs.io/) — Unit testing framework
- [TypeScript](https://www.typescriptlang.org/) — Language