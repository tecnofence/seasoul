# IVA Angola — Análise Completa para o ENGERIS ONE
**Fontes:** CIVA (Lei 7/19 + Lei 17/19 + Lei 32/21 + Lei 42/20) · Decreto Presidencial 71/25 (20 Mar 2025)
**Data de análise:** 2026-03-28

---

## 1. TAXAS DE IVA — O QUE A LEI DIZ

### Taxa Normal
- **14%** — aplicada a todos os bens e serviços não abrangidos por taxa reduzida

### Taxa Reduzida — CRÍTICA PARA HOTÉIS
- **7%** — aplica-se a **serviços de hotelaria e restauração** (Art. 14.º/2 Lei 32/21)
- **Condicional:** só se aplica se o operador cumprir **simultaneamente** as 4 condições:
  1. Todos os imóveis (próprios ou usados) registados na AGT
  2. Todos os veículos motorizados registados na AGT
  3. Faturação **exclusivamente** via sistemas de faturação eletrónica certificados pela AGT
  4. Todas as declarações fiscais dos anos anteriores entregues

> **ATENÇÃO:** Se qualquer das 4 condições não for cumprida, aplica-se a taxa de 14%.
> Isto significa que ter o sistema de faturação certificado pela AGT é **obrigatório para que o hotel
> pague 7% em vez de 14%** — diferença enorme na fatura fiscal do cliente.

### Taxas Reduzidas em Produtos Específicos (Anexo I Lei 32/21)
| Produtos | Taxa |
|---|---|
| Animais vivos (bovinos, suínos, aves), sementes, fertilizantes, ferramentas agrícolas | 5% |
| Carnes (porco, ovino, caprino, aves), peixe (tilápia, sardinha, cavala), leite/lacticínios, ovos, arroz, farinhas (trigo/milho/mandioca), óleos alimentares, açúcar, pão, massa, sal, água mineral, margarina, sabão | 7% |

### Taxa POS Terminal
- **2.5%** retida automaticamente pelo terminal de pagamentos (Art. 14.º/20 Lei 32/21)
- Dedutível na declaração periódica

### Regimes e Limiares
| Regime | Limiar Anual | Taxa | Declaração |
|---|---|---|---|
| **Regime Geral** | Sem limite superior / obrigatório para Grandes Contribuintes | 14% (ou 7% hotéis) | Mensal |
| **Regime Simplificado** | ≤ Kz 350.000.000 | 7% sobre faturação recebida | Mensal |
| **Regime de Exclusão** | ≤ Kz 10.000.000 | Fora do IVA | N/A |

---

## 2. REQUISITOS DAS FATURAS (Decreto Presidencial 71/25)

### Campos Obrigatórios em Cada Fatura (Art. 10.º DP 71/25)

| Campo | Detalhe |
|---|---|
| a) Identidade do emitente | Nome, NIF, morada |
| b) Numeração sequencial | Sequencial e cronológica por tipo de documento e série, dentro do ano fiscal |
| c) Descrição de bens/serviços | Com quantidades e unidades |
| d) Preço unitário e total em AOA | Escrito por extenso |
| e) Taxa e montante de imposto aplicáveis | |
| f) Motivo de não liquidação | Quando IVA não é cobrado, indicar base legal |
| g) Data, hora e local | Da entrega do bem ou prestação do serviço |
| h) Língua | Obrigatoriamente em **português** |
| i) Data de emissão | |
| j) Identificação do software | Nome do software validado pela AGT, **código hash**, número de certificação/validação |

### Prazo de Emissão
- **5 dias úteis** após o facto gerador (entrega de bem, prestação de serviço, recebimento de adiantamento)
- Para serviços contínuos: fatura global mensal, no máximo, emitida nos 5 dias úteis após o fim do período
- Emissão fora do prazo: **penalidade de 0,2% do valor** da fatura

### Tipos de Documentos (Art. 3.º DP 71/25)
| Código | Tipo | Uso Hotel |
|---|---|---|
| FT | Fatura | Fatura principal ao cliente |
| FR | Fatura-Recibo | Fatura + recibo combinados |
| NC | Nota de Crédito | Anulação ou correção de fatura |
| ND | Nota de Débito | Débito adicional sem IVA |
| RC | Recibo | Recibo de pagamento parcial/total |
| PF | Proforma | Orçamento / proposta |
| AM | Adiantamento | Fatura de adiantamento/depósito |
| GT | Guia de Transporte | Transporte de mercadorias |

> **Proforma, guias de entrega, orçamentos e pedidos NÃO são faturas** (Art. 4.º/9 DP 71/25)

### Correção de Faturas
- **Não há "estorno"** — a única forma de corrigir/anular é:
  1. Emitir **Nota de Crédito** (NC) com referência à fatura original
  2. Emitir nova fatura correta
- A NC deve conter: "anulação" ou "rectificação", identificação do documento cancelado, prova de notificação ao cliente

---

## 3. FATURAÇÃO ELETRÓNICA (DP 71/25)

### Quem é obrigado
- **Obrigatório:** todos os contribuintes do Regime Geral e Simplificado
- **Opcional:** Regime de Exclusão pode aderir voluntariamente

### Requisitos do Software
- Must use AGT-**validated** software or software made available by AGT
- Transmissão em **tempo real** para a AGT
- Se falha de comunicação >60 dias: o sistema deve **bloquear** emissão de novas faturas

### Modo de Contingência
- Se sem rede: emitir em offline com nota "emitido em contingência, pendente de autorização"
- Se sem energia/hardware: usar livros pré-impressos por máximo 45 dias
- Todas as faturas de contingência devem ser submetidas à AGT para validação

### Hash Code
- Cada fatura deve conter um **código hash de 4 dígitos** único
- O hash deve ser encadeado (cada fatura referencia o hash da anterior)
- Serve para detetar adulteração da sequência de faturas

### SAF-T (Standard Audit File — Tax)
- Formato XML
- Regime Geral e Simplificado: comunicar todas as faturas e recibos em formato SAF-T
- **SAF-T Contabilístico:** entregar até **10 de abril** de cada ano (ano anterior)
- Se SAF-T não entregue por 3 períodos consecutivos: penalidade a partir do 4.º período

### Informação a Comunicar à AGT até 15 de fevereiro de cada ano
- Identificação e localização de todos os estabelecimentos que emitem faturas
- Todos os sistemas de software utilizados em cada estabelecimento
- Todas as séries de faturas (usadas e não usadas)
- Inventário em 31 de dezembro do ano anterior

---

## 4. REGRAS ESPECIAIS PARA HOTÉIS

### Imposto Cativo — Quem Retém IVA das Faturas do Hotel
| Tipo de Cliente | Retém IVA? | % Retida |
|---|---|---|
| Clientes privados / particulares | **NÃO** — hotel remete diretamente à AGT | 0% |
| Empresas privadas | **NÃO** — hotel remete diretamente | 0% |
| **Entidades Estatais e Autarquias** | **SIM** — retêm na íntegra (Art. 21.º/6) | **100%** |
| **Bancos, Seguradoras, Telecoms** | **SIM** — retêm 50% (Art. 21.º/6) | **50%** |
| Empresas Petrolíferas | SIM — regras especiais | 100% |

> **Nota crítica:** Art. 21.º/5/d isentaria os hotéis do cativo, mas Art. 21.º/6 revoga essa isenção
> para entidades estatais, bancos, seguradoras e telecoms.
> O ERP deve suportar estes dois cenários de faturação.

### Territorialidade
- Serviços de hotelaria e restauração prestados em Angola são **sempre tributados em Angola**,
  independentemente de onde o contrato foi celebrado (Art. 10.º/2/b CIVA)

### Não Dedutibilidade para Compradores
- Empresas que pagam alojamento para os seus colaboradores **não podem deduzir o IVA** (Art. 24.º CIVA)
- Exceto se essa for a atividade principal do comprador
- Resultado: o hotel não precisa emitir fatura com NIF empresarial para poder deduzir

### Adiantamentos / Depósitos de Reserva
- IVA **devido no período de recebimento** do adiantamento, mesmo antes do check-in
- Deve emitir **Fatura de Adiantamento (AM)**
- Na data do serviço real: regularizar com NC referenciando a AM, emitir FT final

### Vouchers / Gift Cards
- **Voucher de finalidade única** (serviço específico): IVA devido na data de emissão do voucher
- **Gift card / voucher multipurpose**: IVA apenas na data de utilização; emissão do voucher não é facto gerador

### Serviços Contínuos / Long Stay
- Para estadias longas com pagamento periódico: IVA devido no fim de cada período
- Pode emitir **Fatura Global** mensal cobrindo todas as transações do período

### Créditos Incobráveis
- Hotel pode recuperar IVA sobre dívidas em mora há >18 meses
- Deve pedir autorização à AGT dentro de 6 meses de a dívida se tornar duvidosa
- AGT tem 6 meses para responder; silêncio = aprovação tácita

---

## 5. PRAZOS E OBRIGAÇÕES DECLARATIVAS

| Obrigação | Prazo |
|---|---|
| Declaração periódica (mensal) | Último dia útil do mês seguinte |
| Pagamento IVA | Último dia útil do mês seguinte |
| SAF-T Contabilístico anual | **10 de abril** do ano seguinte |
| Comunicar séries/estabelecimentos/inventário | **15 de fevereiro** de cada ano |
| Declaração de início de atividade | 15 dias antes de iniciar |
| Declaração de cessação | 30 dias após cessação |
| Declaração de alteração | 15 dias após alteração |

---

## 6. PENALIDADES RELEVANTES

| Infração | Penalidade |
|---|---|
| Prestar serviço sem emitir fatura | **7%** do valor não faturado |
| Reincidência (>5 ocorrências) | **15%** |
| Fatura com campos críticos em falta (NIF, preço, morada, hash, software AGT) | **5%** por fatura |
| Fatura com outros campos em falta | **1%** por fatura |
| Fatura emitida fora do prazo (>5 dias úteis) | **0,2%** por fatura |
| Usar software não validado | Tratado como não emissão: 7%/15% |
| Série não comunicada à AGT | Tratado como não emissão |
| SAF-T não entregue por >3 períodos | Penalidade a partir do 4.º |
| Declaração periódica fora de prazo | 5.862 UCF por infração |

---

## 7. MAPEAMENTO: IMPLEMENTADO vs. NECESSÁRIO

### ✅ Já Implementado no ENGERIS ONE

| Funcionalidade | Localização | Estado |
|---|---|---|
| Taxa IVA 14% padrão | `packages/ui/src/index.ts:479` | ✅ OK |
| Taxa por item flexível | `schema.prisma InvoiceItem.taxRate` | ✅ OK |
| Modelo Invoice completo | `schema.prisma linhas 850-903` | ✅ OK |
| Gestão de séries com numeração atómica | `invoicing/index.ts POST /` | ✅ OK |
| Modo formação (série TREINO) | `invoicing/index.ts + Tenant.trainingMode` | ✅ OK |
| Tipos de documento: FT, FR, NC, ND, ORC, PF, RC, GT, AM, CS | `schema.prisma InvoiceDocType` | ✅ OK |
| Anulação com motivo e data | `Invoice.cancelledAt + cancelReason` | ✅ OK |
| Campos AGT: hash, hash anterior, status, QR code | `schema.prisma Invoice` | ✅ OK |
| Suporte multi-moeda com taxa de câmbio | `CurrencyService + Invoice.exchangeRate` | ✅ OK |
| Audit log de emissão de faturas | `invoicing/index.ts linhas 221-236` | ✅ OK |
| Multi-propriedade (resortId nas séries) | `InvoiceSeries.resortId` | ✅ OK |
| Desconto por item | `InvoiceItem.discount` | ✅ OK |
| relatedInvoiceId (NC → FT) | `Invoice.relatedInvoiceId` | ✅ Campo existe |

### ❌ Não Implementado — CRÍTICO

| Gap | Impacto | Prioridade |
|---|---|---|
| **Taxa de 7% para hotelaria** — apenas 14% definida como constante | Hotel paga o dobro do IVA necessário; não competitivo | 🔴 P1 |
| **Assinatura RSA e submissão à AGT** — `// TODO` na linha 100 de `invoices/index.ts` | Sem certificação AGT → não pode usar taxa de 7%; multa 7% por fatura | 🔴 P1 |
| **SAF-T XML export** — não existe nenhum gerador | Obrigação legal; multa por incumprimento | 🔴 P1 |
| **Fatura de Adiantamento (AM)** — sem lógica especial | IVA apurado incorretamente em depósitos de reserva | 🔴 P1 |
| **Prazo de 5 dias úteis** — sem controlo/alertas | Multa de 0,2% por fatura emitida fora de prazo | 🟡 P2 |
| **Imposto Cativo** — sem gestão de retenção por tipo de cliente | Faturas para Estado/bancos incorretas; reconciliação impossível | 🟡 P2 |
| **Hash chain** — campo `agtPreviousHash` existe mas não é calculado | Hash necessário para certificação AGT | 🔴 P1 |
| **Geração de PDF das faturas** — `// TODO` | Sem PDF não se pode entregar fatura ao cliente digitalmente | 🟡 P2 |
| **Nota de Crédito via API** — `relatedInvoiceId` existe mas sem endpoint/lógica de criação de NC | Correção de faturas sem suporte completo | 🟡 P2 |
| **Comunicação de séries à AGT (15 fev)** — sem scheduler | Penalidade por não comunicar | 🟠 P3 |
| **SAF-T comercial em tempo real** — sem transmissão | Obrigação futura (DP 71/25) | 🟠 P3 |
| **Retail hardcoded 14%** — `retail/index.ts linha 266` | Loja do resort deveria usar taxa correta por produto | 🟡 P2 |
| **Spa sem breakdown de IVA** — `totalPrice` mas sem taxAmount | Fatura de spa não tem IVA discriminado | 🟡 P2 |

---

## 8. PLANO DE IMPLEMENTAÇÃO (por prioridade)

### P1 — Bloqueadores para Legalidade e Competitividade

#### P1.1 — Taxa 7% para Hotelaria
**O que fazer:**
- Adicionar constante `ANGOLA_HOTEL_TAX_RATE = 7` em `packages/ui/src/index.ts`
- Adicionar campo `taxCategory` nos produtos: `'STANDARD' | 'HOTEL_SERVICE' | 'FOOD_REDUCED' | 'EXEMPT'`
- Cada produto/serviço configurável com a sua categoria fiscal
- O POS, Spa, Reservas aplicam a taxa correta automaticamente
- Na fatura: listar linhas com taxas diferentes se misturadas

**Regra de negócio:**
```
Alojamento (quarto)         → 7%  (condicionado às 4 exigências)
Restaurante / Bar / POS F&B → 7%
Spa / Massagens             → 7%  (atividade conexa à hotelaria)
Loja do Resort              → 14% (atividade de retalho separada)
Faturação AGT / Serviços    → 14%
Produtos farmacêuticos      → 0%  (isentos)
```

#### P1.2 — Hash Chain de Faturas
**O que fazer:**
- Ao emitir cada fatura, calcular hash SHA-256 de: `{number}{date}{totalAmount}{previousHash}`
- Guardar em `Invoice.agtHash`
- Buscar o hash da fatura anterior da mesma série e guardar em `Invoice.agtPreviousHash`
- Incluir os primeiros 4 dígitos do hash no documento impresso/PDF

#### P1.3 — SAF-T Export (Angola Format)
**O que fazer:**
- Criar endpoint `GET /v1/invoicing/saft?year=2026&month=3` (ou range)
- Gerar XML no formato SAFT-AO (formato específico Angola, semelhante ao SAFT-PT)
- Campos obrigatórios: Header, MasterFiles (Customers, Suppliers, Products, TaxTable), SourceDocuments (SalesInvoices, MovementOfGoods)
- Exportar também SAF-T Contabilístico (para entrega em abril)

#### P1.4 — Fatura de Adiantamento
**O que fazer:**
- Ao criar reserva com depósito: emitir automaticamente Fatura AM com taxa 7%
- Ao fazer check-in/check-out: regularizar AM com NC e emitir FT final
- O valor do AM deve ser deduzido da FT final
- Lógica: `FT final = total estadia - adiantamentos já faturados`

### P2 — Importantes para Compliance

#### P2.1 — Imposto Cativo
- Adicionar campo `clientType` na fatura: `'PRIVATE' | 'COMPANY' | 'STATE' | 'BANK' | 'TELECOM' | 'OIL_COMPANY'`
- Calcular automaticamente: `catvioPercentage` e `catvivoAmount` por fatura
- No PDF: indicar "IVA retido pelo cliente" com o montante

#### P2.2 — Prazo de 5 Dias Úteis
- Ao criar uma venda/reserva/SPA booking, registar `operationDate`
- Alert/warning se a fatura não for emitida dentro de 5 dias úteis
- Dashboard de faturas pendentes por data de operação

#### P2.3 — Geração de PDF
- Integrar biblioteca de PDF (ex. `@react-pdf/renderer` ou `puppeteer`)
- Template da fatura conforme DP 71/25: campos obrigatórios, hash, logo, QR code
- Guardar PDF no MinIO e atualizar `Invoice.pdfUrl`

#### P2.4 — Nota de Crédito com Fluxo Completo
- Endpoint `POST /v1/invoicing/:id/credit-note` que cria NC automaticamente
- Preenche: `relatedInvoiceId`, `documentType: 'NC'`, copia cliente, valores negativos
- Verifica que a fatura original não está já anulada

### P3 — Futuro / Compliance Avançada

#### P3.1 — Integração AGT (Submissão em Tempo Real)
- Implementar cliente HTTP para API AGT (sandbox → produção)
- Assinar cada fatura com chave RSA privada (já previsto em `.env`: `AGT_PRIVATE_KEY_PATH`)
- Submeter em tempo real, tratar estados: `pending → submitted → accepted/rejected`
- Queue BullMQ para retry em caso de falha

#### P3.2 — Sorteio Fatura Premiada (DP 71/25 Art. 28-33)
- Campo opcional `consumerNif` na fatura (cliente pode pedir para incluir NIF)
- Incluir no QR code / footer da fatura

#### P3.3 — Comunicação de Séries e Inventário (15 fevereiro)
- Job anual (BullMQ cron) que gera o relatório de séries e inventário
- Export para formato AGT

---

## 9. CONFIGURAÇÃO IMEDIATA NO ERP

### Constantes a adicionar em `packages/ui/src/index.ts`
```typescript
export const ANGOLA_TAX_RATE         = 14   // IVA padrão (%)
export const ANGOLA_HOTEL_TAX_RATE   = 7    // IVA hotelaria & restauração (%)
export const ANGOLA_FOOD_TAX_RATE    = 7    // Alimentos da lista Anexo I Lei 32/21
export const ANGOLA_REDUCED_TAX_RATE = 5    // Taxa reduzida (animais, sementes, etc.)
export const ANGOLA_EXEMPT_RATE      = 0    // Isenções (medicamentos, livros, etc.)
export const AGT_CATIVO_STATE        = 100  // Retenção entidades estatais (%)
export const AGT_CATIVO_BANK         = 50   // Retenção bancos/seguradoras/telecoms (%)
export const AGT_INVOICE_DEADLINE_DAYS = 5  // Prazo emissão fatura (dias úteis)
```

### Categorias Fiscais de Produtos (a adicionar ao schema)
```
STANDARD_14     → 14% — retalho, serviços gerais
HOTEL_SERVICE_7 → 7%  — alojamento, restauração, spa, bar
FOOD_REDUCED_7  → 7%  — alimentos Anexo I
AGRI_REDUCED_5  → 5%  — animais, sementes, fertilizantes
EXEMPT          → 0%  — medicamentos, livros
```

---

## 10. SÍNTESE EXECUTIVA

**O que está bem:**
O ENGERIS ONE tem uma base sólida — modelo de dados correto, séries de faturas, modo formação, tipos de documento, campos AGT preparados. A arquitetura suporta o que a lei exige.

**O risco principal hoje:**
Está a cobrar **14% IVA em vez de 7%** em serviços de hotelaria. Isto significa que cada fatura de quarto está com o dobro do IVA correto. Um hotel de 40 quartos a 50.000 KZ/noite com 70% ocupação paga ~Kz 2.5M/mês de IVA a mais do que deveria. A taxa de 7% é **poupança real e vantagem competitiva**.

**A condição para a taxa de 7%:**
Usar sistema de faturação eletrónica certificado pela AGT. Ou seja, o ENGERIS ONE ao obter certificação AGT, **desbloqueia automaticamente a taxa de 7% para todos os clientes**. Este é o argumento de venda mais forte para a adoção do sistema em Angola.

**Mensagem comercial:**
> "Com o ENGERIS ONE certificado pela AGT, o seu hotel paga **7% de IVA** em vez de 14% nos serviços de hotelaria e restauração — poupança garantida que cobre o custo do software."

---

*Documento gerado com base na análise jurídica das fontes: CIVA (Lei 7/19 e alterações), DP 71/25*
*Para dúvidas legais, consultar advogado fiscal em Angola*
