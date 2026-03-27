'use client'

import React from 'react'

type Currency = 'AOA' | 'USD' | 'EUR' | 'ZAR'

interface CurrencyDisplayProps {
  amount: number | string
  currency?: Currency
  className?: string
}

const currencySymbols: Record<Currency, string> = {
  AOA: 'Kz',
  USD: '$',
  EUR: '€',
  ZAR: 'R',
}

export function CurrencyDisplay({
  amount,
  currency = 'AOA',
  className = '',
}: CurrencyDisplayProps) {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount

  const formattedValue = new Intl.NumberFormat('pt-AO', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

  // Para AOA, colocamos o símbolo depois do valor (padrão em Angola)
  if (currency === 'AOA') {
    return (
      <span className={className}>
        {formattedValue} <span className="text-[0.8em] font-light">{currencySymbols.AOA}</span>
      </span>
    )
  }

  // Para USD e EUR, o símbolo costuma vir antes
  return (
    <span className={className}>
      <span className="mr-0.5 text-[0.9em] font-light">{currencySymbols[currency]}</span>
      {formattedValue}
    </span>
  )
}
