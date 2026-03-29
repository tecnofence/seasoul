import { Decimal } from '@prisma/client/runtime/library'

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number | Decimal
  taxRate: number
  discount?: number
}

interface InvoiceData {
  invoiceNumber: string
  invoiceType: string
  issueDate: Date
  dueDate?: Date
  // Emitente
  companyName: string
  companyNif: string
  companyAddress: string
  // Cliente
  clientName: string
  clientNif?: string
  clientAddress?: string
  // Itens
  items: InvoiceItem[]
  // Totais
  subtotal: number
  totalTax: number
  totalDiscount: number
  grandTotal: number
  currency: string
  // Compliance
  qrCode?: string
  agtHash?: string
  digitalSignature?: string
  hashChain?: string
  // Pagamento
  paymentMethod?: string
  // Nota de crédito
  relatedInvoice?: string
  notes?: string
}

export function generateInvoiceHtml(data: InvoiceData): string {
  const formatMoney = (v: number) =>
    new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)

  const docTypeLabels: Record<string, string> = {
    FT: 'FATURA',
    FR: 'FATURA-RECIBO',
    NC: 'NOTA DE CRÉDITO',
    ND: 'NOTA DE DÉBITO',
    ORC: 'ORÇAMENTO',
    PF: 'PRÓ-FORMA',
    RC: 'RECIBO',
    GT: 'GUIA DE TRANSPORTE',
    AM: 'AUTO DE MEDIÇÃO',
    CS: 'CONSULTA DE PREÇOS',
    TREINO: 'DOCUMENTO DE TREINO',
  }

  const docLabel = docTypeLabels[data.invoiceType] ?? data.invoiceType
  const isTraining = data.invoiceType === 'TREINO'

  const itemsHtml = data.items.map((item, i) => {
    const unitPrice = Number(item.unitPrice)
    const qty = item.quantity
    const discount = item.discount ?? 0
    const lineTotal = qty * unitPrice * (1 - discount / 100)
    const lineTax = lineTotal * (item.taxRate / 100)

    return `
      <tr>
        <td>${i + 1}</td>
        <td>${item.description}</td>
        <td class="right">${qty}</td>
        <td class="right">${formatMoney(unitPrice)}</td>
        <td class="right">${discount > 0 ? discount + '%' : '-'}</td>
        <td class="right">${item.taxRate}%</td>
        <td class="right">${formatMoney(lineTotal + lineTax)}</td>
      </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${docLabel} ${data.invoiceNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; }
  .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 15mm 15mm 20mm; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 3px solid #1A3E6E; padding-bottom: 15px; }
  .logo { font-size: 22px; font-weight: 900; color: #1A3E6E; letter-spacing: -1px; }
  .logo span { color: #0A5C8A; }
  .doc-type { text-align: right; }
  .doc-type h1 { font-size: 20px; font-weight: 900; color: #1A3E6E; }
  .doc-type .number { font-size: 14px; color: #555; margin-top: 4px; }
  .doc-type .date { font-size: 11px; color: #888; margin-top: 2px; }
  ${isTraining ? '.training-badge { background: #FEF3C7; border: 2px solid #F59E0B; color: #92400E; padding: 6px 12px; text-align: center; font-weight: 700; font-size: 12px; border-radius: 4px; margin-bottom: 12px; }' : ''}
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 16px 0; }
  .party h3 { font-size: 10px; text-transform: uppercase; color: #888; letter-spacing: 0.5px; margin-bottom: 6px; }
  .party p { line-height: 1.5; }
  .party .name { font-weight: 700; font-size: 12px; }
  .party .nif { color: #555; font-size: 10px; }
  .related { background: #FFF3CD; border-left: 3px solid #F59E0B; padding: 6px 10px; margin: 8px 0; font-size: 10px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  thead tr { background: #1A3E6E; color: white; }
  thead th { padding: 7px 6px; text-align: left; font-size: 10px; font-weight: 600; }
  thead th.right { text-align: right; }
  tbody tr:nth-child(even) { background: #F8FAFC; }
  tbody td { padding: 6px; border-bottom: 1px solid #E5E7EB; font-size: 10px; vertical-align: top; }
  td.right { text-align: right; }
  .totals { display: flex; justify-content: flex-end; margin: 8px 0; }
  .totals table { width: 280px; }
  .totals td { padding: 4px 6px; font-size: 11px; }
  .totals .label { color: #555; }
  .totals .grand { font-weight: 700; font-size: 14px; border-top: 2px solid #1A3E6E; color: #1A3E6E; }
  .footer { margin-top: 20px; border-top: 1px solid #E5E7EB; padding-top: 12px; display: grid; grid-template-columns: 1fr auto; gap: 16px; }
  .compliance { font-size: 9px; color: #888; line-height: 1.6; }
  .compliance strong { color: #555; }
  .notes { background: #F8FAFC; padding: 8px; border-radius: 4px; font-size: 10px; margin: 8px 0; }
  @media print {
    .page { margin: 0; padding: 10mm; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="logo">Sea<span>&amp;</span>Soul</div>
      <p style="font-size:10px;color:#555;margin-top:4px;">${data.companyName}</p>
      <p style="font-size:10px;color:#888;">NIF: ${data.companyNif}</p>
      <p style="font-size:10px;color:#888;">${data.companyAddress}</p>
    </div>
    <div class="doc-type">
      <h1>${docLabel}</h1>
      <div class="number">${data.invoiceNumber}</div>
      <div class="date">${formatDate(data.issueDate)}</div>
      ${data.dueDate ? `<div class="date">Vencimento: ${formatDate(data.dueDate)}</div>` : ''}
    </div>
  </div>

  ${isTraining ? '<div class="training-badge">DOCUMENTO DE FORMACAO - NAO TEM VALOR FISCAL</div>' : ''}

  ${data.relatedInvoice ? `<div class="related">Documento relacionado: <strong>${data.relatedInvoice}</strong></div>` : ''}

  <div class="parties">
    <div class="party">
      <h3>Emitente</h3>
      <p class="name">${data.companyName}</p>
      <p class="nif">NIF: ${data.companyNif}</p>
      <p>${data.companyAddress}</p>
    </div>
    <div class="party">
      <h3>Cliente</h3>
      <p class="name">${data.clientName}</p>
      ${data.clientNif ? `<p class="nif">NIF: ${data.clientNif}</p>` : ''}
      ${data.clientAddress ? `<p>${data.clientAddress}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Descricao</th>
        <th class="right">Qtd</th>
        <th class="right">Preco Unit.</th>
        <th class="right">Desc.</th>
        <th class="right">IVA</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <div class="totals">
    <table>
      <tr><td class="label">Subtotal:</td><td class="right">${data.currency} ${formatMoney(data.subtotal)}</td></tr>
      ${data.totalDiscount > 0 ? `<tr><td class="label">Desconto:</td><td class="right">- ${data.currency} ${formatMoney(data.totalDiscount)}</td></tr>` : ''}
      <tr><td class="label">IVA:</td><td class="right">${data.currency} ${formatMoney(data.totalTax)}</td></tr>
      <tr class="grand"><td>TOTAL:</td><td class="right">${data.currency} ${formatMoney(data.grandTotal)}</td></tr>
    </table>
  </div>

  ${data.notes ? `<div class="notes"><strong>Notas:</strong> ${data.notes}</div>` : ''}

  <div class="footer">
    <div class="compliance">
      ${data.qrCode ? `<p><strong>QR AGT:</strong> ${data.qrCode}</p>` : ''}
      ${data.hashChain ? `<p><strong>Hash:</strong> ${data.hashChain.substring(0, 32)}...</p>` : ''}
      ${data.digitalSignature ? `<p><strong>Assinatura:</strong> ${data.digitalSignature.substring(0, 40)}...</p>` : ''}
      <p>Processado por computador - ENGERIS ONE v1.0</p>
      <p>Angola - NIF ${data.companyNif} - ${new Date().getFullYear()}</p>
    </div>
    ${data.paymentMethod ? `<div style="text-align:right;font-size:10px;color:#555;"><strong>Forma de pagamento:</strong><br>${data.paymentMethod}</div>` : ''}
  </div>
</div>
</body>
</html>`
}
