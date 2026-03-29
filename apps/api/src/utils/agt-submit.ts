import axios from 'axios'

// ──────────────────────────────────────────────────────────────────────────────
// API E-FACTURA AGT — Decreto Executivo n.º 683/25 + DP n.º 71/25
// Base URL Produção:    https://sifp.minfin.gov.ao/sigt/fe/v1
// Base URL Homologação: https://sifphml.minfin.gov.ao/sigt/fe/v1
// Autenticação: HTTP Basic (Base64 de username:password)
// Processamento: ASSÍNCRONO — submissão devolve requestId; polling via /consultarEstado
// ──────────────────────────────────────────────────────────────────────────────

const AGT_PROD_URL  = 'https://sifp.minfin.gov.ao/sigt/fe/v1'
const AGT_HML_URL   = 'https://sifphml.minfin.gov.ao/sigt/fe/v1'
const AGT_ENV       = process.env.AGT_ENVIRONMENT ?? 'sandbox' // 'sandbox' | 'homologacao' | 'producao'
const AGT_USERNAME  = process.env.AGT_USERNAME ?? ''
const AGT_PASSWORD  = process.env.AGT_PASSWORD ?? ''

function getBaseUrl(): string {
  if (AGT_ENV === 'producao') return AGT_PROD_URL
  if (AGT_ENV === 'homologacao') return AGT_HML_URL
  return '' // sandbox — não faz chamadas reais
}

function basicAuth(): string {
  return Buffer.from(`${AGT_USERNAME}:${AGT_PASSWORD}`).toString('base64')
}

function agtClient() {
  return axios.create({
    baseURL: getBaseUrl(),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${basicAuth()}`,
    },
    timeout: 20_000,
  })
}

// ── Tipos de dados conforme DE 683/25 ────────────────────────────────────────

export interface AgtDocumentLine {
  lineNumber: number
  operationType: string   // SE, SS, SG, TB, etc.
  productCode: string
  productDescription: string
  quantity: number
  unitOfMeasure: string
  unitPriceBase: number
  unitPrice: number
  creditAmount?: number
  debitAmount?: number
  taxes: {
    taxType: string         // IVA
    taxCountryRegion: string // AO
    taxCode: string          // NOR, RED, ISE
    taxPercentage: number
    taxContribution: number
  }[]
}

export interface AgtInvoicePayload {
  documentNo: string                // Formato: "FT A/00001"
  documentStatus: 'N' | 'C'        // N=Normal, C=Correção
  jwsDocumentSignature: string      // JWS RS256 com chave do contribuinte
  jwsSoftwareSignature: string      // JWS RS256 com chave do produtor
  documentDate: string              // AAAA-MM-DD
  documentType: string              // FT, FR, NC, ND, etc.
  systemEntryDate: string           // ISO 8601
  customerTaxID: string             // NIF; "999999999" para consumidor final
  customerCountry: string           // ISO 3166-1 alpha-2
  companyName: string               // Máx. 200 caracteres
  documentTotals: {
    taxPayable: number
    netTotal: number
    grossTotal: number
  }
  lines?: AgtDocumentLine[]
  referenceInfo?: {                 // Obrigatório em NC/ND
    reference: string
    reason: string
  }
}

export interface AgtSubmitResult {
  success: boolean
  requestId?: string    // ID assíncrono para polling via /consultarEstado
  codigoAgt?: string    // Código digital único (após validação)
  qrCode?: string
  mensagem?: string
  erro?: string
}

export interface AgtStatusResult {
  success: boolean
  status?: 'PENDENTE' | 'ACEITE' | 'REJEITADO' | 'PROCESSANDO'
  codigoAgt?: string
  qrCode?: string
  erro?: string
}

export interface AgtSerieResult {
  success: boolean
  serieId?: string
  serieCode?: string
  erro?: string
}

// ── /registarFactura — Submeter documento fiscal ──────────────────────────────
// Suporta batch: até 30 faturas por chamada (array)

export async function submitInvoiceToAgt(payload: AgtInvoicePayload): Promise<AgtSubmitResult> {
  if (AGT_ENV === 'sandbox') {
    const mockCode = `AGT${Date.now().toString(36).toUpperCase()}`
    return {
      success: true,
      requestId: `REQ-${crypto.randomUUID?.() ?? Date.now()}`,
      codigoAgt: mockCode,
      qrCode: `https://efatura.agt.minfin.gov.ao/verificar/${mockCode}`,
      mensagem: '[SANDBOX] Fatura registada com sucesso',
    }
  }

  try {
    const response = await agtClient().post('/registarFactura', [payload])
    const data = response.data

    // A API devolve requestId para processamento assíncrono
    const requestId: string = data?.requestId ?? data?.idRequisicao ?? data?.[0]?.requestId
    const codigoAgt: string | undefined = data?.codigoAgt ?? data?.[0]?.codigoAgt

    return {
      success: true,
      requestId,
      codigoAgt,
      mensagem: data?.mensagem ?? 'Submetido com sucesso',
    }
  } catch (err: any) {
    const msg = err.response?.data?.mensagem ?? err.response?.data?.erro ?? err.message ?? 'Erro de comunicação com AGT'
    return { success: false, erro: msg }
  }
}

/**
 * Submete até 30 faturas num único pedido (batch)
 */
export async function submitBatchToAgt(payloads: AgtInvoicePayload[]): Promise<AgtSubmitResult[]> {
  if (payloads.length === 0) return []
  if (payloads.length > 30) {
    throw new Error('Máximo de 30 faturas por batch AGT')
  }

  if (AGT_ENV === 'sandbox') {
    return payloads.map((p) => {
      const mockCode = `AGT${Date.now().toString(36).toUpperCase()}`
      return {
        success: true,
        requestId: `REQ-${p.documentNo}`,
        codigoAgt: mockCode,
        qrCode: `https://efatura.agt.minfin.gov.ao/verificar/${mockCode}`,
        mensagem: '[SANDBOX] Fatura registada',
      }
    })
  }

  try {
    const response = await agtClient().post('/registarFactura', payloads)
    const results: any[] = Array.isArray(response.data) ? response.data : [response.data]
    return results.map((r) => ({
      success: true,
      requestId: r.requestId ?? r.idRequisicao,
      codigoAgt: r.codigoAgt,
      qrCode: r.qrCode,
      mensagem: r.mensagem,
    }))
  } catch (err: any) {
    const msg = err.response?.data?.mensagem ?? err.message ?? 'Erro batch AGT'
    return payloads.map(() => ({ success: false, erro: msg }))
  }
}

// ── /consultarEstado — Polling do estado de uma requisição assíncrona ─────────

export async function consultarEstadoAgt(requestId: string): Promise<AgtStatusResult> {
  if (AGT_ENV === 'sandbox') {
    return {
      success: true,
      status: 'ACEITE',
      codigoAgt: `AGT${requestId.replace('REQ-', '')}`,
      qrCode: `https://efatura.agt.minfin.gov.ao/verificar/${requestId}`,
    }
  }

  try {
    const response = await agtClient().post('/consultarEstado', { requestId })
    const data = response.data
    return {
      success: true,
      status: data.estado ?? data.status,
      codigoAgt: data.codigoAgt,
      qrCode: data.qrCode,
    }
  } catch (err: any) {
    return { success: false, erro: err.response?.data?.mensagem ?? err.message }
  }
}

/**
 * Polling com retry até obter resultado final (ACEITE/REJEITADO)
 * maxAttempts: número máximo de tentativas (default: 10, intervalo: 3s)
 */
export async function pollAgtStatus(
  requestId: string,
  maxAttempts = 10,
  intervalMs = 3_000
): Promise<AgtStatusResult> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await consultarEstadoAgt(requestId)

    if (!result.success) return result
    if (result.status === 'ACEITE' || result.status === 'REJEITADO') return result

    // Ainda a processar — aguardar antes de nova tentativa
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }
  }

  return { success: false, erro: `Timeout após ${maxAttempts} tentativas de consulta AGT` }
}

// ── /solicitarSerie — Registar série na AGT antes de emitir faturas ───────────

export interface AgtSerieRequest {
  taxRegistrationNumber: string
  seriesCode: string            // e.g. "A"
  documentType: string          // FT, FR, NC, ND, etc.
  startDate: string             // AAAA-MM-DD
  endDate?: string              // Opcional; séries plurianuais permitidas
  establishmentCode?: string    // Código do estabelecimento
}

export async function solicitarSerieAgt(request: AgtSerieRequest): Promise<AgtSerieResult> {
  if (AGT_ENV === 'sandbox') {
    return {
      success: true,
      serieId: `SER-${request.documentType}-${request.seriesCode}-SANDBOX`,
      serieCode: request.seriesCode,
    }
  }

  try {
    const response = await agtClient().post('/solicitarSerie', request)
    const data = response.data
    return {
      success: true,
      serieId: data.serieId ?? data.idSerie,
      serieCode: data.serieCode ?? data.codigoSerie ?? request.seriesCode,
    }
  } catch (err: any) {
    return { success: false, erro: err.response?.data?.mensagem ?? err.message }
  }
}

// ── /listarSeries — Listar séries registadas na AGT ──────────────────────────

export async function listarSeriesAgt(taxRegistrationNumber: string): Promise<{ success: boolean; series?: any[]; erro?: string }> {
  if (AGT_ENV === 'sandbox') {
    return { success: true, series: [] }
  }

  try {
    const response = await agtClient().post('/listarSeries', { taxRegistrationNumber })
    return { success: true, series: response.data?.series ?? response.data ?? [] }
  } catch (err: any) {
    return { success: false, erro: err.response?.data?.mensagem ?? err.message }
  }
}

// ── /validarDocumento — Validar documento antes de submeter ──────────────────

export async function validarDocumentoAgt(payload: AgtInvoicePayload): Promise<{ valid: boolean; errors?: string[]; erro?: string }> {
  if (AGT_ENV === 'sandbox') {
    return { valid: true }
  }

  try {
    const response = await agtClient().post('/validarDocumento', payload)
    const data = response.data
    return { valid: data.valido ?? true, errors: data.erros }
  } catch (err: any) {
    return { valid: false, erro: err.response?.data?.mensagem ?? err.message }
  }
}

// ── Verificar estado de fatura previamente submetida ─────────────────────────

export async function checkInvoiceStatus(codigoAgt: string): Promise<{ valid: boolean; status?: string }> {
  if (AGT_ENV === 'sandbox') {
    return { valid: true, status: 'ACEITE' }
  }

  try {
    const res = await agtClient().post('/consultarFactura', { codigoAgt })
    return { valid: true, status: res.data.estado ?? res.data.status }
  } catch {
    return { valid: false }
  }
}

// Re-export da função importPKCS8 do crypto nativo para uso em helpers
import { randomUUID } from 'node:crypto'
const crypto = { randomUUID }
