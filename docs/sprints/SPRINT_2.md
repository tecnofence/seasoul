# 🏃 Sprint 2 — Mês 2: POS + AGT + Stock + RH + Assiduidade

> **Período:** Semanas 5–8
> **Objetivo:** Módulos operacionais completos — vendas, fiscal, stock, recursos humanos e controlo de assiduidade

---

## 🎯 Objetivo do Sprint

Implementar todos os módulos de gestão interna: POS com faturação eletrónica certificada AGT, gestão de stock integrada, RH completo e controlo de assiduidade por GPS com geofencing.

---

## ✅ Critérios de Aceitação do Sprint

- [ ] POS funcional em tablet e browser
- [ ] Faturação eletrónica emitida e assinada RSA
- [ ] Fatura enviada à AGT em tempo real (ambiente sandbox)
- [ ] SAF-T gerado corretamente
- [ ] Stock descontado automaticamente ao efetuar venda POS
- [ ] Alertas de stock mínimo funcionais
- [ ] Módulo RH — CRUD colaboradores, contratos, turnos
- [ ] Processamento salarial automático
- [ ] App de assiduidade GPS com geofencing funcional
- [ ] Registo offline de ponto sincronizado ao voltar online
- [ ] Integração assiduidade → salários validada

---

## 📋 Tarefas por Semana

### Semana 5 — POS (Backend + Frontend)

| ID | Tarefa | Responsável | Estimativa |
|---|---|---|---|
| S2-01 | Prisma schema — vendas, itens, faturas, séries AGT | Backend | 4h |
| S2-02 | API — CRUD produtos e categorias POS | Backend | 4h |
| S2-03 | API — criar venda + linha de itens | Backend | 6h |
| S2-04 | API — fatura consolidada por hóspede | Backend | 6h |
| S2-05 | Interface POS — écran de venda (tablet/browser) | Frontend | 12h |
| S2-06 | Interface POS — comandas e mesas | Frontend | 6h |
| S2-07 | Interface POS — fechamento de conta | Frontend | 4h |
| S2-08 | Interface POS — modo offline (cache local) | Frontend | 6h |

### Semana 6 — Faturação AGT

| ID | Tarefa | Responsável | Estimativa |
|---|---|---|---|
| S2-09 | Implementar assinatura digital RSA (x.509, SHA-1, 1024 bits) | Backend | 8h |
| S2-10 | Gerador de número de série sequencial por estabelecimento | Backend | 4h |
| S2-11 | Integração AGT API — envio de fatura em tempo real | Backend | 10h |
| S2-12 | Gerador SAF-T (ficheiro XML normalizado) | Backend | 10h |
| S2-13 | Bull Queue — fila de envio AGT offline | Backend | 4h |
| S2-14 | Gerador PDF fatura (com QR code AGT) | Backend | 6h |
| S2-15 | Upload fatura PDF para MinIO | Backend | 2h |
| S2-16 | Envio fatura PDF ao cliente (email + app) | Backend | 2h |
| S2-17 | Testes AGT — sandbox completo | Tech Lead | 4h |

### Semana 7 — Stock + RH

| ID | Tarefa | Responsável | Estimativa |
|---|---|---|---|
| S2-18 | Prisma schema — stock, movimentos, fornecedores | Backend | 4h |
| S2-19 | API — entradas e saídas de stock | Backend | 6h |
| S2-20 | API — integração POS → desconto automático stock | Backend | 4h |
| S2-21 | API — alertas stock mínimo (Bull Queue) | Backend | 4h |
| S2-22 | Dashboard stock — inventário e movimentos | Frontend | 8h |
| S2-23 | Prisma schema — colaboradores, contratos, turnos, salários | Backend | 4h |
| S2-24 | API — CRUD colaboradores e contratos | Backend | 6h |
| S2-25 | API — gestão de turnos e escalas | Backend | 6h |
| S2-26 | API — processamento salarial automático | Backend | 8h |
| S2-27 | Dashboard RH — colaboradores, turnos, escalas | Frontend | 8h |

### Semana 8 — Assiduidade GPS + Integração

| ID | Tarefa | Responsável | Estimativa |
|---|---|---|---|
| S2-28 | Prisma schema — registos de ponto, geofences | Backend | 2h |
| S2-29 | API — validação de GPS + geofencing por resort | Backend | 6h |
| S2-30 | API — registo de ponto (entrada, saída, pausas, extras) | Backend | 6h |
| S2-31 | API — cálculo automático horas trabalhadas e extras | Backend | 6h |
| S2-32 | API — integração assiduidade → folha salarial | Backend | 4h |
| S2-33 | App React Native — écran de registo de ponto | Mobile | 8h |
| S2-34 | App React Native — GPS + geofencing (Expo Location) | Mobile | 8h |
| S2-35 | App React Native — modo offline (WatermelonDB) | Mobile | 8h |
| S2-36 | App React Native — sync automático ao voltar online | Mobile | 6h |
| S2-37 | Dashboard assiduidade — mapa de presenças + relatórios | Frontend | 6h |
| S2-38 | Alertas supervisor — falta detetada em tempo real | Backend | 4h |
| S2-39 | Testes integração POS + Stock + AGT + RH + Assiduidade | Tech Lead | 6h |

---

## 📦 Entregáveis do Sprint 2

1. **POS** funcional em tablet e browser (online + offline)
2. **Faturação AGT** — emissão, assinatura RSA, envio em tempo real
3. **SAF-T** — gerado automaticamente
4. **Gestão de Stock** — integrada com POS
5. **RH Completo** — colaboradores, turnos, salários
6. **App de Assiduidade** — GPS, geofencing, offline, sync
7. **Integração Salarial** — assiduidade → salários automático

---

## 🔗 Dependências Externas

| Dependência | Responsável | Prazo |
|---|---|---|
| Credenciais sandbox AGT | ENGERIS | Semana 5 |
| NIF da empresa Sea and Soul | Sea and Soul | Semana 5 |
| Chaves RSA AGT (geradas e registadas) | ENGERIS | Semana 6 |
| Lista de colaboradores dos 2 resorts | Sea and Soul RH | Semana 7 |
| Tabela salarial e categorias | Sea and Soul RH | Semana 7 |
| Coordenadas GPS exatas dos resorts | ENGERIS / Sea and Soul | Semana 8 |

---

## ⚠️ Riscos

| Risco | Probabilidade | Mitigação |
|---|---|---|
| API AGT sandbox com bugs | Alta | Manter fila offline como fallback |
| GPS impreciso dentro do resort | Média | Raio de geofencing configurável |
| Processamento salarial complexo (Lei angolana) | Alta | Reunião com RH Sea and Soul na semana 7 |
| App React Native — geolocalização iOS | Baixa | Testar permissões cedo |

---

*ENGERIS — engeris.co.ao | Sprint 2 | Abril 2026*
