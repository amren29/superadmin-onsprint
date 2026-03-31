import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || '30d'
  const shopId = searchParams.get('shop_id') || ''

  const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30
  const now = new Date()
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
  const prevFrom = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000).toISOString()

  const db = getServiceClient()

  let query = db.from('orders').select('grand_total, created_at').gte('created_at', from)
  let prevQuery = db.from('orders').select('grand_total, created_at').gte('created_at', prevFrom).lt('created_at', from)

  if (shopId) {
    query = query.eq('shop_id', shopId)
    prevQuery = prevQuery.eq('shop_id', shopId)
  }

  const [{ data: current }, { data: previous }] = await Promise.all([query, prevQuery])

  const total = (current || []).reduce((s, o) => s + (o.grand_total || 0), 0)
  const prevTotal = (previous || []).reduce((s, o) => s + (o.grand_total || 0), 0)

  // Group by day
  const daily: Record<string, number> = {}
  for (const o of (current || [])) {
    const day = o.created_at?.slice(0, 10)
    if (day) daily[day] = (daily[day] || 0) + (o.grand_total || 0)
  }

  const series = Object.entries(daily).sort(([a], [b]) => a.localeCompare(b)).map(([date, revenue]) => ({ date, revenue }))

  return NextResponse.json({ series, total, prevTotal, period })
}
