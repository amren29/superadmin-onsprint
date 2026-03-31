import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || '30d'
  const metric = searchParams.get('metric') || 'revenue'

  const days = period === '90d' ? 90 : period === 'all' ? 3650 : 30
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const db = getServiceClient()
  const { data: orders } = await db.from('orders').select('shop_id, grand_total, created_at').gte('created_at', from)
  const { data: shops } = await db.from('shops').select('id, name, slug, plan')

  const shopMap: Record<string, { name: string; slug: string; plan: string }> = {}
  for (const s of (shops || [])) shopMap[s.id] = { name: s.name, slug: s.slug, plan: s.plan }

  const agg: Record<string, { revenue: number; orders: number }> = {}
  for (const o of (orders || [])) {
    if (!agg[o.shop_id]) agg[o.shop_id] = { revenue: 0, orders: 0 }
    agg[o.shop_id].revenue += o.grand_total || 0
    agg[o.shop_id].orders++
  }

  const leaderboard = Object.entries(agg)
    .map(([shop_id, stats]) => ({
      shop_id,
      ...shopMap[shop_id],
      ...stats,
    }))
    .sort((a, b) => metric === 'orders' ? b.orders - a.orders : b.revenue - a.revenue)
    .slice(0, 20)

  return NextResponse.json({ leaderboard, period, metric })
}
