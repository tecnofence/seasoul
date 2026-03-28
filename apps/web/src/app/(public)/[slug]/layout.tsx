import { getResortInfo } from '@/lib/public-api'
import { notFound } from 'next/navigation'
import PublicNavbar from './_components/navbar'
import PublicFooter from './_components/footer'

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  const resort = await getResortInfo(params.slug)
  if (!resort) notFound()

  return (
    <div
      className="min-h-screen bg-white"
      style={{ '--primary': resort.primaryColor ?? '#1A3E6E' } as React.CSSProperties}
    >
      <PublicNavbar resort={resort} slug={params.slug} />
      <main>{children}</main>
      <PublicFooter resort={resort} slug={params.slug} />
    </div>
  )
}
