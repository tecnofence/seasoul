/**
 * ENGERIS ONE — Web App
 * Copyright (c) 2025 ENGERIS — Engenharia e Sistemas, Lda. Todos os direitos reservados.
 * Software proprietário. Consultar ficheiro LICENSE na raiz do repositório.
 */
import type { Metadata } from 'next'
import { Providers } from '@/lib/providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'ENGERIS ONE — ERP',
  description: 'ENGERIS ONE — Plataforma ERP Modular',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
