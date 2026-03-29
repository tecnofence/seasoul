# Certificação de software de faturação pela AGT: guia técnico e legal completo

**Angola está a implementar um novo regime de faturação eletrónica obrigatória que redefine por completo os requisitos para software de faturação.** O Decreto Presidencial n.º 71/25 (março 2025), que revogou o regime anterior (DP 292/18), combinado com o Decreto Executivo n.º 683/25 (agosto 2025), estabelece um sistema de comunicação em tempo real via API REST com a AGT. Para a ENGERIS, isto significa que o SaaS deve ser desenvolvido já nativamente para o novo regime de e-factura — não apenas para o SAF-T legado. A Fase 1 (grandes contribuintes e B2G) arrancou a **1 de janeiro de 2026**, e a Fase 2 (todos os contribuintes dos regimes Geral e Simplificado) está prevista para **2027**.

---

## O novo regime jurídico das faturas transforma o mercado angolano

O enquadramento legal da faturação em Angola assenta agora em dois diplomas fundamentais: o **Decreto Presidencial n.º 71/25**, de 20 de março de 2025 (Novo Regime Jurídico das Faturas), que entrou em vigor a 20 de setembro de 2025, e o **Decreto Executivo n.º 683/25**, de 22 de agosto de 2025, que define a estrutura de dados e o modelo técnico da faturação eletrónica. Estes dois diplomas substituem e atualizam o anterior DP 292/18.

A legislação complementar essencial inclui o **Decreto Presidencial n.º 312/18** (regime de submissão eletrónica SAF-T, parcialmente derrogado), o **Decreto Executivo n.º 74/19** (regras técnicas de validação de software — documento com especificações criptográficas detalhadas), o **Decreto Presidencial n.º 231/19** (obrigatoriedade de assinatura digital desde 01.01.2020), a **Lei n.º 7/19** (Código do IVA), a **Lei n.º 14/23** (alteração ao CIVA com novos limiares) e a **Lei n.º 21/14** (Código Geral Tributário). A obrigatoriedade de software certificado aplica-se a **todos os contribuintes dos Regimes Geral e Simplificado do IVA**, independentemente do volume de faturação. Contribuintes do Regime de Exclusão (faturação anual inferior a **Kz 25.000.000**) podem usar blocos de faturas impressos ou o Portal do Contribuinte, limitado a 300 documentos por ano.

O cronograma de implementação faseada é determinante para o planeamento da ENGERIS:

- **Outubro–dezembro 2025**: período transitório sem penalidades, certificação de softwares pela AGT
- **1 de janeiro de 2026**: obrigatória para grandes contribuintes (faturação ≥ Kz 350M), fornecedores do Estado (B2G) e transações individuais ≥ Kz 25M
- **2027**: obrigatória para todos os contribuintes dos Regimes Geral e Simplificado

---

## Dois sistemas coexistem: SAF-T legado e e-factura em tempo real

Angola opera atualmente com dois sistemas de comunicação fiscal que coexistem. O **SAF-T(AO)** é o sistema legado de reporte periódico — um ficheiro XML normalizado baseado no schema **SAFTAO1.01_01.xsd** (disponível em github.com/assoft-portugal/SAF-T-AO), fortemente inspirado no modelo português. O SAF-T(AO) contém quatro secções principais: Header, MasterFiles (clientes, fornecedores, produtos, tabela de impostos, contas do razão), GeneralLedgerEntries e SourceDocuments (com subsecções 4.1 SalesInvoices, 4.2 MovementOfGoods, 4.3 WorkingDocuments e 4.4 Payments). A submissão é **mensal**, até ao último dia do mês seguinte, via upload no Portal do Contribuinte ou por webservice SOAP. Além disso, existem o ficheiro de inventários (anual, até 15 de fevereiro) e o ficheiro de contabilidade (anual, até 10 de abril).

O **novo sistema de e-factura** opera em tempo real via **API REST** com formato **JSON**. Após adesão à faturação eletrónica, a comunicação por SAF-T mensal de faturação deixa de ser obrigatória (exceto se a AGT o solicitar), mas o SAF-T de contabilidade e inventários mantém-se. O modelo é de **post-clearance**: o contribuinte emite a fatura, transmite os dados em JSON à AGT, que valida e atribui um código digital único. Faturas sem este código de validação **não são dedutíveis para efeitos de IVA**. A API REST da AGT disponibiliza sete endpoints em produção (base URL: `https://sifp.minfin.gov.ao/sigt/fe/v1/`):

| Serviço | Método | Endpoint |
|---------|--------|----------|
| Registar Factura | POST | `/registarFactura` |
| Solicitar Série | POST | `/solicitarSerie` |
| Listar Séries | POST | `/listarSeries` |
| Consultar Estado | POST | `/consultarEstado` |
| Consultar Factura | POST | `/consultarFactura` |
| Listar Facturas | POST | `/listarFacturas` |
| Validar Documento | POST | `/validarDocumento` |

O ambiente de homologação usa `https://sifphml.minfin.gov.ao/`. A autenticação é **HTTP Basic** (Base64 de username:password), com credenciais emitidas pela AGT. O processamento é **assíncrono** — a submissão retorna um requestID — e suporta até **30 faturas por chamada**. O software deve ainda suportar **modo de contingência** (offline) com upload posterior num prazo de **45 dias**.

---

## Assinatura digital encadeada com dois regimes criptográficos distintos

O sistema de integridade documental da AGT baseia-se em assinaturas digitais encadeadas, com especificações técnicas distintas para o sistema legado e o novo sistema de e-factura.

**No sistema legado (SAF-T)**, as especificações do Decreto Executivo 74/19 definem: algoritmo **RSA com SHA-1**, chave privada de **1024 bits**, certificado x.509, charset UTF-8, encoding Base64, padding PKCS1 v1.5. Os campos a assinar são concatenados com ";" sem aspas: `InvoiceDate;SystemEntryDate;InvoiceNo;GrossTotal;Hash_do_documento_anterior`. O primeiro documento de cada série tem o campo Hash vazio. A assinatura resultante tem **172 bytes** em Base64. A chave privada é de conhecimento exclusivo do fabricante, e a chave pública é submetida à AGT via Declaração Modelo 8 em formato PEM. Na impressão, exibem-se **4 caracteres da assinatura** (posições 1.ª, 11.ª, 21.ª e 31.ª) separados por "-", seguidos de "Processado por programa validado n.º XXXX/AGT".

**No novo sistema de e-factura**, a assinatura evolui para **RS256 (RSA + SHA-256)** via **JWS (JSON Web Signature)**, com chaves RSA de mínimo **2048 bits** (recomendado 4096), encoding Base64URL. O sistema define três tipos de assinatura: **jwsSoftwareSignature** (assinada com chave do produtor, identifica o software), **jwsDocumentSignature** (assinada com chave do contribuinte gerada pela AGT, assina dados do documento fiscal incluindo documentNo, taxRegistrationNumber, documentType, documentDate, customerTaxID, customerCountry, companyName e documentTotals) e **jwsSignature** (assina dados da requisição). As chaves dos contribuintes são geradas e geridas pela AGT através do Portal do Contribuinte; as chaves dos produtores são geradas localmente e a chave pública é submetida via Portal do Parceiro (`portaldoparceiro.minfin.gov.ao`).

Para a stack da ENGERIS (Node.js/Fastify), ambos os regimes criptográficos podem ser implementados com a biblioteca `crypto` nativa do Node.js ou com bibliotecas como `jose` para JWS.

---

## Tipos de documentos fiscais e campos obrigatórios por documento

O novo regime reconhece um leque alargado de tipos de documentos fiscais. Os quatro principais para o MVP da ENGERIS são:

A **Fatura (FT)** formaliza a transmissão onerosa de bens ou prestação de serviços e deve ser emitida até **5 dias** após o facto tributário (ou até 1 mês para fornecimentos contínuos). A **Fatura-Recibo (FR)** combina fatura e comprovativo de pagamento simultâneo ("pronto pagamento"). A **Nota de Crédito (NC)** retifica ou anula uma fatura anterior — deve conter a expressão "anulação ou retificação", identificar o documento original no campo `referenceInfo`, e requer prova de conhecimento pelo adquirente. A **Nota de Débito (ND)** serve para aumentar o valor de uma transação ou repassar despesas. Outros tipos suportados pela API incluem FA (Fatura de Adiantamento), FG (Fatura Global), GF (Fatura Genérica), AC/AR (Aviso de Cobrança), TV (Talão de Venda), RC/RG (Recibo), RE (Estorno), AF (Auto-Faturação) e tipos sectoriais para seguros.

**Campos obrigatórios para todos os documentos na API de e-factura:**

| Campo | Descrição | Notas |
|-------|-----------|-------|
| `documentNo` | Identificação única | Formato: TIPO SÉRIE/NÚMERO |
| `documentStatus` | Estado | N=Normal, C=Correção |
| `jwsDocumentSignature` | Assinatura JWS RS256 | Obrigatória |
| `documentDate` | Data de emissão | AAAA-MM-DD |
| `documentType` | Tipo | FT, FR, NC, ND, etc. |
| `systemEntryDate` | Timestamp de gravação | ISO 8601 |
| `customerTaxID` | NIF do cliente | 999999999 se consumidor final |
| `customerCountry` | País do cliente | ISO 3166-1-alpha-2 |
| `companyName` | Nome do contribuinte | Máx. 200 caracteres |
| `documentTotals` | Totais | taxPayable, netTotal, grossTotal |

Para FT, FR, NC e ND, o array `lines` é obrigatório com: lineNumber, operationType (SE, SS, SG, TB, etc.), productCode, productDescription, quantity, unitOfMeasure, unitPriceBase, unitPrice, debitAmount ou creditAmount, e bloco `taxes` (taxType, taxCountryRegion, taxCode, taxPercentage, taxContribution). Na fatura impressa, são ainda obrigatórios: preço por extenso em moeda nacional, data/hora/local da operação, identificação do software validado com código hash, e **QR Code de validação** (para e-faturas).

---

## IVA em Angola: três regimes com taxas diferenciadas

O Imposto sobre o Valor Acrescentado entrou em vigor a 1 de outubro de 2019 (Lei n.º 7/19), com alterações substanciais pela Lei n.º 14/23. A **taxa normal é de 14%**. Existem taxas reduzidas: **7%** para hotelaria e restauração (com requisitos cumulativos) e para o regime simplificado; **5%** para bens alimentares de amplo consumo (pão, carne, peixe, leite, ovos, feijão, farinha, óleo alimentar — cerca de 20 categorias) e insumos agrícolas; **1%** para a província de Cabinda (regime especial); e **0%** para exportações. Estão isentos serviços financeiros de intermediação, seguros de saúde e vida, ensino, serviços médicos e transações via plataformas de pagamento móvel autorizadas pelo BNA.

Os três regimes de IVA determinam obrigações distintas. O **Regime Geral** (faturação ≥ **Kz 350.000.000** ou indústria transformadora ≥ Kz 25M) exige liquidação de IVA a 14%, dedução do IVA suportado, e declaração periódica **mensal**. O **Regime Simplificado** (Kz 25M a Kz 350M) paga **7% sobre recebimentos** efetivos, deduz apenas 10% do IVA suportado, e declara **trimestralmente**. O **Regime de Exclusão** (inferior a Kz 25M) não tem obrigações de IVA. O software deve identificar corretamente o regime do contribuinte e calcular taxas de IVA conforme os códigos: NOR (normal 14%), INT (intermédia), RED (reduzida), ISE (isento). Existe ainda o mecanismo de **cativação de IVA**, onde certas entidades (Estado, empresas petrolíferas a 100%; bancos, seguradoras, telecomunicações a 50%) retêm IVA dos fornecedores.

---

## Numeração sequencial, séries e regras de imutabilidade

O formato de numeração segue o padrão `[TipoDocumento] [Série]/[NúmeroSequencial]` — por exemplo, `FT 001/9` ou `NC A/1`. No sistema de e-factura, as séries devem ser **solicitadas previamente à AGT** via endpoint `solicitarSerie`. Cada série deve ser específica por **estabelecimento e programa**, nunca repetida para o mesmo tipo de documento no mesmo contribuinte. A numeração é **progressiva, contínua e cronológica**, sem saltos, com período mínimo de um ano fiscal. Séries plurianuais são permitidas, onde o primeiro documento do novo exercício pode encadear com o hash do último do exercício anterior.

A imutabilidade dos documentos é um requisito fundamental. **Nenhum documento pode ser alterado após emissão e assinatura.** Documentos em preparação não podem ser impressos antes da finalização. A anulação (estado "A") é permitida apenas para faturas não enviadas ao adquirente ou para retificações de dados identificativos — e nunca para documentos que já tenham notas de crédito/débito associadas. Correções de valor fazem-se exclusivamente via NC ou ND. O software deve registar **controlo de acessos** por utilizador com autenticação obrigatória, alteração periódica de passwords (que não podem ser vazias), e SourceID (código de utilizador) em cada documento. Cópias de segurança com periodicidade obrigatória e registo do número de reposições são igualmente exigidos. O período legal de conservação é de **5 anos** (ampliável a 10 em caso de infração fiscal).

---

## Como obter certificação junto da AGT e o que está em jogo

O processo de certificação exige que o produtor do software (ou representante legal) **resida ou tenha representação em Angola**. O pedido de validação é submetido à AGT, que verifica os pressupostos técnicos num prazo de **45 dias**, emitindo um certificado de validação com formato "XXX/AGT/YYYY" e validade de **24 meses**. Para o sistema de e-factura, a AGT concede acesso ao **Portal do Parceiro** (`portaldoparceiro.minfin.gov.ao`) com fase de testes no ambiente de homologação. Em dezembro de 2025, a AGT publicou uma lista de **43 softwares certificados para faturação eletrónica**, após ter identificado em agosto de 2025 **261 softwares com irregularidades**, dando 15 dias para correção sob pena de revogação.

As penalizações por não conformidade são severas e percentuais sobre o valor das transações:

| Infração | Coima |
|----------|-------|
| Não emissão de fatura | **7%** do valor (15% se reiterada, >5 faturas) |
| Software não certificado | **5%** do valor da fatura |
| Dados críticos em falta (NIF, preço) | **5%** do valor |
| Dados secundários em falta | 1% do valor |
| Faturas omitidas no SAF-T | 7%–15% do valor |
| Emissão tardia | 0,2% do valor |
| Erros imputáveis ao produtor de software | **Kz 600.000 por período** |
| Não submissão de SAF-T (>3 meses) | Equiparada a não emissão |

A AGT pode **suspender softwares** com irregularidades (precedentes reais: SAC5, FASTFACTURA, QUIANNI foram suspensos em 2025), obrigando utilizadores a migrar para software certificado em 30 dias.

---

## Conclusão: implicações práticas para o desenvolvimento do SaaS da ENGERIS

O desenvolvimento do MVP deve priorizar nativamente o novo regime de e-factura (API REST/JSON com JWS RS256), mantendo capacidade de exportação SAF-T(AO) em XML como funcionalidade complementar. **Três decisões arquitecturais são críticas**: implementar o mecanismo de assinatura dual (SHA-1/RSA-1024 para SAF-T legado e SHA-256/RSA-2048 para e-factura via JWS), construir o modelo de dados para suportar todos os tipos documentais exigidos pela API com os campos obrigatórios identificados, e desenhar o sistema de séries e numeração sequencial com encadeamento de hashes e zero tolerância a gaps.

O facto de a AGT ter identificado 261 softwares não conformes e suspendido vários representa simultaneamente um risco e uma oportunidade — o mercado angolano precisa urgentemente de soluções robustas e bem implementadas. A stack Next.js 14 + Fastify + PostgreSQL é tecnicamente adequada: o PostgreSQL suporta bem imutabilidade via triggers e audit trails, o Fastify pode gerir a comunicação REST assíncrona com a AGT, e o Node.js tem bibliotecas maduras para criptografia RSA/JWS. A representação local em Angola é **requisito legal incontornável** para obter certificação. O contacto direto com a Central de Apoio ao Contribuinte da AGT (+244 923 16 70 10, apoio.agt@minfin.gov.ao) e o acesso ao Portal do Parceiro devem ser as primeiras ações concretas da ENGERIS.