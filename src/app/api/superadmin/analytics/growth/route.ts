import { NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const db = getServiceClient()
  const { data: shops } = await db.from('shops').select('id, created_at').is('deleted_at', null).order('created_at', { ascending: true })

  // Group by month
  const monthly: Record<string, number> = {}
  for (const s of (shops || [])) {
    const month = s.created_at?.slice(0, 7)
    if (month) monthly[month] = (monthly[month] || 0) + 1
  }

  let cumulative = 0
  const series = Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => {
    cumulative += count
    return { month, count, cumulative }
  })

  return NextResponse.json({ series, totalShops: shops?.length || 0 })
}
