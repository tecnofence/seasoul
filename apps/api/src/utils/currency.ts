import { Decimal } from '@prisma/client/runtime/library'
import { Currency } from '@prisma/client'

/**
 * Utilitário para conversão de moedas no ENGERIS ONE
 */
export class CurrencyService {
  /**
   * Converte um valor de uma moeda para outra usando uma taxa de câmbio
   * @param amount Valor original
   * @param rate Taxa de conversão (ex: 1 USD = 900 AOA, rate = 900)
   * @returns Valor convertido
   */
  static convert(amount: Decimal | number, rate: Decimal | number): Decimal {
    const a = new Decimal(amount)
    const r = new Decimal(rate)
    return a.mul(r)
  }

  /**
   * Formata um valor para exibição (Backend side, ex: logs ou PDFs)
   * @param amount Valor
   * @param currency Moeda (AOA, USD, EUR)
   */
  static format(amount: Decimal | number, currency: Currency): string {
    const val = new Decimal(amount).toNumber()
    const symbols: Record<Currency, string> = {
      AOA: 'Kz',
      USD: '$',
      EUR: '€',
      ZAR: 'R',
    }

    const formatter = new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: currency === 'AOA' ? 'AOA' : currency, // Intl pode não conhecer AOA em todos os nodes
      currencyDisplay: 'symbol',
    })

    // Fallback se o Intl falhar para AOA
    if (currency === 'AOA') {
      return `${val.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} ${symbols.AOA}`
    }

    return formatter.format(val)
  }
}
