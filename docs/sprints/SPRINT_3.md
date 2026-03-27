# 🏃 Sprint 3 — Mês 3: App Hóspede + Fechaduras + Painel Central + Go Live

> **Período:** Semanas 9–12
> **Objetivo:** App do hóspede, integração fechaduras TTLock/Seam, painel central da sede, testes finais e Go Live

---

## 🎯 Objetivo do Sprint

Completar a experiência do hóspede (app + fechaduras PIN automático), o painel central da sede Sea and Soul, e executar os testes finais com formação das equipas antes do Go Live.

---

## ✅ Critérios de Aceitação do Sprint

- [ ] App do hóspede publicada na App Store e Google Play
- [ ] Check-in digital via app funcional
- [ ] PIN gerado automaticamente após check-in
- [ ] Fechadura TTLock abre com PIN gerado
- [ ] PIN desativado automaticamente no check-out
- [ ] Room service via app funcional
- [ ] Painel central da sede com vista dos 2 resorts
- [ ] KPIs em tempo real (ocupação, receita, stock)
- [ ] Relatórios comparativos entre resorts
- [ ] Servidores locais configurados em ambos os resorts
- [ ] Modo offline validado em Sangano
- [ ] Formação das equipas dos 2 resorts concluída
- [ ] Go Live com os 2 resorts em produção

---

## 📋 Tarefas por Semana

### Semana 9 — App Hóspede + Seam API

| ID | Tarefa | Responsável | Estimativa |
|---|---|---|---|
| S3-01 | Setup conta Seam API + workspace produção | DevOps | 2h |
| S3-02 | Configurar fechaduras TTLock no Seam dashboard | DevOps | 4h |
| S3-03 | API — integração Seam API (gerar PIN por quarto) | Backend | 8h |
| S3-04 | API — webhook Seam (eventos de acesso em tempo real) | Backend | 6h |
| S3-05 | API — revogação de PIN no check-out | Backend | 4h |
| S3-06 | API — alerta bateria fraca fechadura | Backend | 2h |
| S3-07 | App Hóspede — onboarding e login por reserva | Mobile | 6h |
| S3-08 | App Hóspede — écran check-in digital | Mobile | 6h |
| S3-09 | App Hóspede — exibição do PIN da fechadura | Mobile | 4h |
| S3-10 | App Hóspede — abertura por Bluetooth (Seam SDK) | Mobile | 6h |
| S3-11 | App Hóspede — multilíngue PT/EN/FR/ES | Mobile | 4h |

### Semana 10 — Serviços do Resort + Painel Central

| ID | Tarefa | Responsável | Estimativa |
|---|---|---|---|
| S3-12 | App Hóspede — room service (pedidos de quarto) | Mobile | 6h |
| S3-13 | App Hóspede — reservas internas (spa, restaurante, atividades) | Mobile | 6h |
| S3-14 | App Hóspede — chat com receção (WebSocket) | Mobile | 6h |
| S3-15 | App Hóspede — avaliação da estadia | Mobile | 4h |
| S3-16 | API — gestão de pedidos room service | Backend | 4h |
| S3-17 | API — gestão de manutenção e limpeza | Backend | 4h |
| S3-18 | Dashboard limpeza — estado dos quartos em tempo real | Frontend | 6h |
| S3-19 | Dashboard manutenção — tickets e avarias | Frontend | 6h |
| S3-20 | Painel Central — vista consolidada 2 resorts | Frontend | 8h |
| S3-21 | Painel Central — KPIs em tempo real | Frontend | 6h |
| S3-22 | Painel Central — relatórios comparativos | Frontend | 6h |
| S3-23 | Painel Central — gestão de permissões por perfil | Frontend | 4h |

### Semana 11 — Servidores Locais + Testes Finais

| ID | Tarefa | Responsável | Estimativa |
|---|---|---|---|
| S3-24 | Configurar servidor local Cabo Ledo (mini PC) | DevOps | 4h |
| S3-25 | Configurar servidor local Sangano (mini PC) | DevOps | 4h |
| S3-26 | Testar modo offline Sangano (desligar internet) | DevOps + QA | 4h |
| S3-27 | Testar sync automático ao restaurar internet | DevOps + QA | 4h |
| S3-28 | Testar fila AGT offline → flush ao voltar online | QA | 4h |
| S3-29 | Testes de carga — POS com 10 tablets simultâneos | QA | 4h |
| S3-30 | Testes de segurança — penetration test básico | Tech Lead | 6h |
| S3-31 | Testes fluxo completo: reserva → check-in → PIN → check-out | QA | 6h |
| S3-32 | Publicar app iOS (App Store Connect) | Mobile | 4h |
| S3-33 | Publicar app Android (Google Play Console) | Mobile | 4h |
| S3-34 | Configurar Grafana dashboards produção | DevOps | 4h |
| S3-35 | Configurar alertas Prometheus (CPU, RAM, disco) | DevOps | 2h |

### Semana 12 — Formação + Go Live

| ID | Tarefa | Responsável | Estimativa |
|---|---|---|---|
| S3-36 | Manual do utilizador — receção e POS | Tech Lead | 8h |
| S3-37 | Manual do utilizador — gestão de stock e RH | Tech Lead | 4h |
| S3-38 | Manual do utilizador — app hóspede | Tech Lead | 4h |
| S3-39 | Formação equipa Cabo Ledo (receção, POS, stock, RH) | ENGERIS | 8h |
| S3-40 | Formação equipa Sangano (receção, POS, stock, RH) | ENGERIS | 8h |
| S3-41 | Formação gestão sede (painel central, relatórios) | ENGERIS | 4h |
| S3-42 | Migração dados existentes (reservas ativas) | Backend | 4h |
| S3-43 | Go Live — Cabo Ledo | Tech Lead + DevOps | 4h |
| S3-44 | Go Live — Sangano | Tech Lead + DevOps | 4h |
| S3-45 | Monitorização intensiva pós go live (48h) | Tech Lead + DevOps | 8h |
| S3-46 | Documentação técnica final | Tech Lead | 4h |
| S3-47 | Entrega do projeto ao cliente | ENGERIS | 2h |

---

## 📦 Entregáveis do Sprint 3

1. **App do Hóspede** — publicada iOS + Android
2. **Fechaduras TTLock** — PIN automático integrado
3. **Serviços do Resort** — room service, manutenção, limpeza
4. **Painel Central** — sede Sea and Soul
5. **Servidores Locais** — configurados e testados
6. **Modo Offline** — validado em Sangano
7. **Manuais** — utilizador e técnico
8. **Formação** — equipas dos 2 resorts
9. **Go Live** — sistema em produção nos 2 resorts

---

## 🔗 Dependências Externas

| Dependência | Responsável | Prazo |
|---|---|---|
| Conta Seam API (produção) | ENGERIS | Semana 9 |
| Fechaduras TTLock instaladas nos quartos | Sea and Soul | Semana 9 |
| Gateways TTLock instalados por andar | Sea and Soul | Semana 9 |
| Apple Developer Account | ENGERIS | Semana 11 |
| Google Play Console Account | ENGERIS | Semana 11 |
| Mini PCs dos resorts adquiridos | Sea and Soul | Semana 11 |
| Disponibilidade equipas para formação | Sea and Soul | Semana 12 |

---

## ⚠️ Riscos

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Aprovação App Store demorada | Alta | Submeter app na semana 10 (reservar 2 semanas) |
| Fechaduras TTLock não chegam a tempo | Média | Testar integração com fechadura simulada |
| Formação — resistência à mudança | Média | Envolver chefias na formação |
| Problemas de conectividade no Go Live | Média | Ter técnico presencial em cada resort |

---

## 🏁 Definição de Done (Go Live)

O projeto está concluído quando:
- ✅ Todos os módulos em produção e funcionais
- ✅ App publicada nas 2 stores
- ✅ AGT a receber faturas em tempo real
- ✅ Fechaduras a gerar PIN automaticamente
- ✅ Modo offline testado e funcional em Sangano
- ✅ Equipas formadas e confortáveis com o sistema
- ✅ Monitorização Grafana ativa
- ✅ Backups automáticos a correr
- ✅ Documentação entregue

---

*ENGERIS — engeris.co.ao | Sprint 3 | Maio 2026*
