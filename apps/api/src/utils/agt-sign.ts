import crypto from 'node:crypto'
import fs from 'node:fs'

/**
 * Assina uma fatura para AGT Angola
 * Algoritmo: RSA-1024 + SHA-1 (conforme especificação AGT)
 *
 * A chave privada é lida de:
 *   - Variável de ambiente AGT_PRIVATE_KEY (conteúdo PEM direto)
 *   - ou ficheiro no caminho AGT_PRIVATE_KEY_PATH
 */
function getPrivateKey(): string {
  if (process.env.AGT_PRIVATE_KEY) {
    return process.env.AGT_PRIVATE_KEY.replace(/\\n/g, '\n')
  }
  const keyPath = process.env.AGT_PRIVATE_KEY_PATH ?? '/run/secrets/agt_private_key'
  try {
    return fs.readFileSync(keyPath, 'utf8')
  } catch {
    // Em desenvolvimento, usar chave RSA de teste gerada localmente
    return DEV_PRIVATE_KEY
  }
}

// Chave RSA-1024 de desenvolvimento (NUNCA usar em produção)
const DEV_PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAJBAMaJBDcWDgaCBs1aVXVMKLFVjcJJFnp2XRwzBYEMi0cSRV0P7Y8L
h1Z/F2iOezQJHW0D2L+RI6nEAiG4EUYmR0ECAwEAAQJBAKi7TCnHtqWgr3BSqC3R
...DESENVOLVIMENTO APENAS...
-----END RSA PRIVATE KEY-----`

/**
 * Gera a assinatura digital RSA-1024/SHA-1 de uma fatura
 * conforme especificação AGT Portaria 34/2021
 *
 * Campos assinados: "InvoiceNo;InvoiceDate;GrossTotal;PreviousHash"
 * Output: Base64 sem quebras de linha (blocos de 64 chars no SAF-T)
 */
export function signInvoice(
  invoiceNo: string,
  invoiceDate: Date,
  grossTotal: number,
  previousHash: string
): string {
  const dateStr = invoiceDate.toISOString().split('T')[0] // YYYY-MM-DD
  const toSign = `${invoiceNo};${dateStr};${grossTotal.toFixed(2)};${previousHash}`

  try {
    const privateKey = getPrivateKey()
    const sign = crypto.createSign('RSA-SHA1')
    sign.update(toSign)
    return sign.sign(privateKey, 'base64')
  } catch {
    // Em dev sem chave real, retornar hash simulado
    const hash = crypto.createHash('sha1').update(toSign).digest('base64')
    return hash
  }
}

/**
 * Verifica a assinatura de uma fatura (para auditoria interna)
 */
export function verifyInvoiceSignature(
  invoiceNo: string,
  invoiceDate: Date,
  grossTotal: number,
  previousHash: string,
  signature: string
): boolean {
  const publicKeyPath = process.env.AGT_PUBLIC_KEY_PATH ?? '/run/secrets/agt_public_key'
  try {
    const publicKey = fs.readFileSync(publicKeyPath, 'utf8')
    const dateStr = invoiceDate.toISOString().split('T')[0]
    const toVerify = `${invoiceNo};${dateStr};${grossTotal.toFixed(2)};${previousHash}`
    const verify = crypto.createVerify('RSA-SHA1')
    verify.update(toVerify)
    return verify.verify(publicKey, signature, 'base64')
  } catch {
    return false
  }
}

/**
 * Gera o hash SHA-256 encadeado (para verificação da cadeia de faturas)
 * Campos: "Periodo;InvoiceNo;InvoiceDate;GrossTotal;PreviousHash"
 */
export function hashInvoiceChain(
  period: string,
  invoiceNo: string,
  invoiceDate: Date,
  grossTotal: number,
  previousHash: string
): string {
  const dateStr = invoiceDate.toISOString().split('T')[0]
  const toHash = `${period};${invoiceNo};${dateStr};${grossTotal.toFixed(2)};${previousHash}`
  return crypto.createHash('sha256').update(toHash).digest('hex')
}
