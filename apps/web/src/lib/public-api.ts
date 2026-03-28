const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1'

export async function getResortInfo(slug: string) {
  const res = await fetch(`${API_BASE}/public/${slug}/info`, { next: { revalidate: 300 } })
  if (!res.ok) return null
  const json = await res.json()
  return json.data
}

export async function getResortRooms(slug: string) {
  const res = await fetch(`${API_BASE}/public/${slug}/rooms`, { next: { revalidate: 60 } })
  if (!res.ok) return []
  const json = await res.json()
  return json.data ?? []
}

export async function checkAvailability(
  slug: string,
  checkIn: string,
  checkOut: string,
  adults = 1,
) {
  const params = new URLSearchParams({ checkIn, checkOut, adults: String(adults) })
  const res = await fetch(`${API_BASE}/public/${slug}/availability?${params}`, {
    cache: 'no-store',
  })
  if (!res.ok) return []
  const json = await res.json()
  return json.data ?? []
}

export async function getSpaServices(slug: string) {
  const res = await fetch(`${API_BASE}/public/${slug}/spa`, { next: { revalidate: 300 } })
  if (!res.ok) return []
  const json = await res.json()
  return json.data ?? []
}

export async function getActivities(slug: string) {
  const res = await fetch(`${API_BASE}/public/${slug}/activities`, { next: { revalidate: 300 } })
  if (!res.ok) return []
  const json = await res.json()
  return json.data ?? []
}

export async function getResortReviews(slug: string) {
  const res = await fetch(`${API_BASE}/public/${slug}/reviews`, { next: { revalidate: 60 } })
  if (!res.ok) return []
  const json = await res.json()
  return json.data ?? []
}

export async function createBooking(
  slug: string,
  data: {
    guestName: string
    guestEmail: string
    guestPhone: string
    roomId: string
    checkIn: string
    checkOut: string
    adults: number
    children: number
    totalAmount: number
    notes?: string
  },
) {
  const res = await fetch(`${API_BASE}/public/${slug}/booking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Erro ao criar reserva')
  return json.data
}
