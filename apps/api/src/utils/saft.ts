import { Invoice, InvoiceItem } from '@prisma/client'

export interface SAFTData {
  tenant: {
    name: string
    nif: string
    address?: string
    city?: string
  }
  fiscalYear: number
  startDate: string  // YYYY-MM-DD
  endDate: string    // YYYY-MM-DD
  softwareVersion: string
  invoices: (Invoice & { items: InvoiceItem[] })[]
  currency: string
}

export function generateSAFT(data: SAFTData): string {
  const esc = (s: string) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

  const fmt = (n: number | string) => Number(n).toFixed(2)

  // Collect unique customers
  const customersMap = new Map<string, { name: string; nif: string; address?: string }>()
  for (const inv of data.invoices) {
    const key = inv.clientNif ?? `UNKNOWN_${inv.clientName}`
    if (!customersMap.has(key)) {
      customersMap.set(key, {
        name: inv.clientName,
        nif: inv.clientNif ?? '999999999',
        address: inv.clientAddress ?? undefined,
      })
    }
  }

  // Tax table
  const taxTable = `
    <TaxTable>
      <TaxTableEntry>
        <TaxType>IVA</TaxType>
        <TaxCountryRegion>AO</TaxCountryRegion>
        <TaxCode>NOR</TaxCode>
        <Description>Taxa Normal</Description>
        <TaxPercentage>14.00</TaxPercentage>
      </TaxTableEntry>
      <TaxTableEntry>
        <TaxType>IVA</TaxType>
        <TaxCountryRegion>AO</TaxCountryRegion>
        <TaxCode>HOT</TaxCode>
        <Description>Hotelaria e Restauração</Description>
        <TaxPercentage>7.00</TaxPercentage>
      </TaxTableEntry>
      <TaxTableEntry>
        <TaxType>IVA</TaxType>
        <TaxCountryRegion>AO</TaxCountryRegion>
        <TaxCode>RED</TaxCode>
        <Description>Taxa Reduzida Alimentos</Description>
        <TaxPercentage>7.00</TaxPercentage>
      </TaxTableEntry>
      <TaxTableEntry>
        <TaxType>IVA</TaxType>
        <TaxCountryRegion>AO</TaxCountryRegion>
        <TaxCode>ISE</TaxCode>
        <Description>Isento</Description>
        <TaxPercentage>0.00</TaxPercentage>
      </TaxTableEntry>
    </TaxTable>`

  // Customer entries
  const customersXml = Array.from(customersMap.values()).map(c => `
    <Customer>
      <CustomerID>${esc(c.nif)}</CustomerID>
      <AccountID>21</AccountID>
      <CustomerTaxID>${esc(c.nif)}</CustomerTaxID>
      <CompanyName>${esc(c.name)}</CompanyName>
      <BillingAddress>
        <AddressDetail>${esc(c.address ?? 'Angola')}</AddressDetail>
        <City>${esc('Angola')}</City>
        <Country>AO</Country>
      </BillingAddress>
      <SelfBillingIndicator>0</SelfBillingIndicator>
    </Customer>`).join('')

  // Invoice entries — only FT, FR, NC (fiscal documents)
  const fiscalDocs = data.invoices.filter(inv =>
    ['FT', 'FR', 'NC'].includes(inv.documentType) && !inv.cancelledAt
  )

  const totalCredit = fiscalDocs
    .filter(inv => inv.documentType !== 'NC')
    .reduce((s, inv) => s + Number(inv.totalAmount), 0)
  const totalDebit = fiscalDocs
    .filter(inv => inv.documentType === 'NC')
    .reduce((s, inv) => s + Number(inv.totalAmount), 0)

  const invoicesXml = fiscalDocs.map(inv => {
    const invoiceDate = inv.createdAt.toISOString().split('T')[0]
    const systemEntryDate = inv.createdAt.toISOString().replace('T', ' ').substring(0, 19)
    const isNC = inv.documentType === 'NC'

    const linesXml = inv.items.map((item, idx) => {
      const lineBase = Number(item.quantity) * Number(item.unitPrice) * (1 - Number(item.discount) / 100)
      const lineTax = lineBase * (Number(item.taxRate) / 100)
      const lineGross = lineBase + lineTax

      // Map tax rate to tax code
      const taxRate = Number(item.taxRate)
      const taxCode = taxRate === 0 ? 'ISE' : taxRate === 7 ? 'HOT' : 'NOR'

      return `
      <Line>
        <LineNumber>${idx + 1}</LineNumber>
        <ProductCode>SERV${String(idx + 1).padStart(3,'0')}</ProductCode>
        <ProductDescription>${esc(item.description)}</ProductDescription>
        <Quantity>${Number(item.quantity).toFixed(3)}</Quantity>
        <UnitOfMeasure>${(item as any).unit ?? 'UN'}</UnitOfMeasure>
        <UnitPrice>${fmt(item.unitPrice)}</UnitPrice>
        <TaxBase>${fmt(lineBase)}</TaxBase>
        <TaxPointDate>${invoiceDate}</TaxPointDate>
        <Description>${esc(item.description)}</Description>
        <${isNC ? 'DebitAmount' : 'CreditAmount'}>${fmt(lineGross)}</${isNC ? 'DebitAmount' : 'CreditAmount'}>
        <Tax>
          <TaxType>IVA</TaxType>
          <TaxCountryRegion>AO</TaxCountryRegion>
          <TaxCode>${taxCode}</TaxCode>
          <TaxPercentage>${taxRate.toFixed(2)}</TaxPercentage>
          <TaxAmount>${fmt(lineTax)}</TaxAmount>
        </Tax>
        <SettlementAmount>0.00</SettlementAmount>
      </Line>`
    }).join('')

    return `
    <Invoice>
      <InvoiceNo>${esc(inv.fullNumber)}</InvoiceNo>
      <ATCUD>${inv.agtHash?.substring(0, 8) ?? '00000000'}</ATCUD>
      <DocumentStatus>
        <InvoiceStatus>N</InvoiceStatus>
        <InvoiceStatusDate>${systemEntryDate}</InvoiceStatusDate>
        <SourceID>${inv.createdBy ?? 'SYSTEM'}</SourceID>
        <SourceBilling>P</SourceBilling>
      </DocumentStatus>
      <Hash>${inv.agtHash ?? ''}</Hash>
      <HashControl>${inv.agtPreviousHash?.substring(0, 4) ?? '0000'}</HashControl>
      <Period>${String(inv.createdAt.getMonth() + 1).padStart(2, '0')}</Period>
      <InvoiceDate>${invoiceDate}</InvoiceDate>
      <InvoiceType>${inv.documentType}</InvoiceType>
      <SpecialRegimes>
        <SelfBillingIndicator>0</SelfBillingIndicator>
        <CashVATSchemeIndicator>0</CashVATSchemeIndicator>
        <ThirdPartiesBillingIndicator>0</ThirdPartiesBillingIndicator>
      </SpecialRegimes>
      <SourceID>ENGERISONE</SourceID>
      <SystemEntryDate>${systemEntryDate}</SystemEntryDate>
      <CustomerID>${esc(inv.clientNif ?? '999999999')}</CustomerID>
      ${inv.documentType === 'NC' && inv.relatedInvoiceId ? `<References><Reference>REF:${esc(inv.relatedInvoiceId)}</Reference><Reason>${esc(inv.notes ?? 'Crédito')}</Reason></References>` : ''}
      <Lines>${linesXml}
      </Lines>
      <DocumentTotals>
        <TaxPayable>${fmt(inv.taxAmount)}</TaxPayable>
        <NetTotal>${fmt(inv.subtotal)}</NetTotal>
        <GrossTotal>${fmt(inv.totalAmount)}</GrossTotal>
        ${Number(inv.cativoAmount ?? 0) > 0 ? `<WithholdingTax><WithholdingTaxType>IVA</WithholdingTaxType><WithholdingTaxAmount>${fmt(inv.cativoAmount ?? 0)}</WithholdingTaxAmount></WithholdingTax>` : ''}
      </DocumentTotals>
    </Invoice>`
  }).join('')

  const now = new Date()
  const creationDate = now.toISOString().split('T')[0]

  return `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="urn:OECD:Standard Audit File - Tax:AO_1.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Header>
    <AuditFileVersion>1.0.0</AuditFileVersion>
    <CompanyID>${esc(data.tenant.nif)}</CompanyID>
    <TaxRegistrationNumber>${esc(data.tenant.nif)}</TaxRegistrationNumber>
    <TaxAccountingBasis>F</TaxAccountingBasis>
    <CompanyName>${esc(data.tenant.name)}</CompanyName>
    <BusinessName>${esc(data.tenant.name)}</BusinessName>
    <CompanyAddress>
      <AddressDetail>${esc(data.tenant.address ?? 'Luanda, Angola')}</AddressDetail>
      <City>${esc(data.tenant.city ?? 'Luanda')}</City>
      <Country>AO</Country>
    </CompanyAddress>
    <FiscalYear>${data.fiscalYear}</FiscalYear>
    <StartDate>${data.startDate}</StartDate>
    <EndDate>${data.endDate}</EndDate>
    <CurrencyCode>${data.currency}</CurrencyCode>
    <DateCreated>${creationDate}</DateCreated>
    <TaxEntity>Global</TaxEntity>
    <ProductCompanyTaxID>${esc(data.tenant.nif)}</ProductCompanyTaxID>
    <SoftwareCertificateNumber>ENGERISONE-001</SoftwareCertificateNumber>
    <ProductID>ENGERIS ONE</ProductID>
    <ProductVersion>${data.softwareVersion}</ProductVersion>
    <HeaderComment>SAF-T AO gerado por ENGERIS ONE</HeaderComment>
    <Telephone></Telephone>
    <Fax></Fax>
    <Email></Email>
    <Website></Website>
  </Header>
  <MasterFiles>
    ${customersXml}
    ${taxTable}
  </MasterFiles>
  <SourceDocuments>
    <SalesInvoices>
      <NumberOfEntries>${fiscalDocs.length}</NumberOfEntries>
      <TotalDebit>${fmt(totalDebit)}</TotalDebit>
      <TotalCredit>${fmt(totalCredit)}</TotalCredit>
      ${invoicesXml}
    </SalesInvoices>
  </SourceDocuments>
</AuditFile>`
}
