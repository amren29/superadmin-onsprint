import { NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const db = getServiceClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()

  const { data: shops } = await db.from('shops').select('id, name, slug, plan, created_at').is('deleted_at', null)
  const { data: orders } = await db.from('orders').select('shop_id, created_at')

  // Build last order date per shop
  const lastOrder: Record<string, string> = {}
  const orderCount: Record<string, number> = {}
  for (const o of (orders || [])) {
    if (!lastOrder[o.shop_id] || o.created_at > lastOrder[o.shop_id]) {
      lastOrder[o.shop_id] = o.created_at
    }
    orderCount[o.shop_id] = (orderCount[o.shop_id] || 0) + 1
  }

  const atRisk = []
  const churned = []

  for (const shop of (shops || [])) {
    const last = lastOrder[shop.id]
    const count = orderCount[shop.id] || 0
    if (count === 0) continue // Never had orders, not churn

    if (last < sixtyDaysAgo) {
      churned.push({ ...shop, lastOrder: last, orderCount: count })
    } else if (last < thirtyDaysAgo) {
      atRisk.push({ ...shop, lastOrder: last, orderCount: count })
    }
  }

  const totalWithOrders = Object.keys(orderCount).length
  const churnRate = totalWithOrders > 0 ? Math.round((churned.length / totalWithOrders) * 100) : 0

  return NextResponse.json({ atRisk, churned, churnRate, totalWithOrders })
}
