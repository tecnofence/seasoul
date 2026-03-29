import axios from 'axios'

const AGT_BASE_URL = process.env.AGT_API_URL ?? 'https://api.agt.minfin.gov.ao'
const AGT_NIF = process.env.AGT_NIF ?? ''
const AGT_ENV = process.env.AGT_ENVIRONMENT ?? 'sandbox'

interface AgtInvoicePayload {
  nif: string
  serie: string
  numero: number
  tipo: string // FT, FR, NC, etc.
  dataEmissao: string // YYYY-MM-DD
  nifCliente?: string
  nomeCliente: string
  totalSemIva: number
  totalIva: number
  totalGeral: number
  hash: string
  assinatura: string
  linhas: Array<{
    descricao: string
    quantidade: number
    precoUnitario: number
    taxaIva: number
    totalLinha: number
  }>
}

interface AgtResponse {
  success: boolean
  codigoAgt?: string
  qrCode?: string
  mensagem?: string
  erro?: string
}

/**
 * Submete uma fatura à API da AGT Angola
 * Em sandbox: simula a resposta sem submeter realmente
 */
export async function submitInvoiceToAgt(payload: AgtInvoicePayload): Promise<AgtResponse> {
  // Em sandbox, simular resposta da AGT
  if (AGT_ENV === 'sandbox') {
    const mockCode = `AGT${Date.now().toString(36).toUpperCase()}`
    return {
      success: true,
      codigoAgt: mockCode,
      qrCode: `https://efatura.agt.minfin.gov.ao/verificar/${mockCode}`,
      mensagem: '[SANDBOX] Fatura registada com sucesso',
    }
  }

  // Em produção, submeter à API AGT real
  try {
    const response = await axios.post(
      `${AGT_BASE_URL}/v1/faturas`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-NIF': AGT_NIF,
          'X-Environment': AGT_ENV,
        },
        timeout: 15_000,
      }
    )

    return {
      success: true,
      codigoAgt: response.data.codigo,
      qrCode: response.data.qrCode,
      mensagem: response.data.mensagem,
    }
  } catch (err: any) {
    const msg = err.response?.data?.mensagem ?? err.message ?? 'Erro de comunicação com AGT'
    return {
      success: false,
      erro: msg,
    }
  }
}

/**
 * Verifica o estado de uma fatura previamente submetida à AGT
 */
export async function checkInvoiceStatus(codigoAgt: string): Promise<{ valid: boolean; status?: string }> {
  if (AGT_ENV === 'sandbox') {
    return { valid: true, status: 'ACEITE' }
  }

  try {
    const res = await axios.get(`${AGT_BASE_URL}/v1/faturas/${codigoAgt}`, {
      headers: { 'X-NIF': AGT_NIF },
      timeout: 10_000,
    })
    return { valid: true, status: res.data.estado }
  } catch {
    return { valid: false }
  }
}
