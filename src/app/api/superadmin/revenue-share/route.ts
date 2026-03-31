import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const db = getServiceClient()
  const { data: shops } = await db.from('shops')
    .select('id, name, slug, plan, revenue_share_percent')
    .is('deleted_at', null)
    .order('name')

  // Get revenue per shop
  const { data: orders } = await db.from('orders').select('shop_id, grand_total')
  const revenueMap: Record<string, number> = {}
  for (const o of (orders || [])) {
    revenueMap[o.shop_id] = (revenueMap[o.shop_id] || 0) + (o.grand_total || 0)
  }

  const result = (shops || []).map(s => ({
    ...s,
    totalRevenue: revenueMap[s.id] || 0,
    platformEarnings: (revenueMap[s.id] || 0) * ((s.revenue_share_percent || 0) / 100),
  }))

  const totalPlatformEarnings = result.reduce((s, r) => s + r.platformEarnings, 0)

  return NextResponse.json({ shops: result, totalPlatformEarnings })
}

export async function PATCH(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { shop_id, revenue_share_percent } = await request.json()
  if (!shop_id) return NextResponse.json({ error: 'shop_id required' }, { status: 400 })

  const db = getServiceClient()
  await db.from('shops').update({ revenue_share_percent }).eq('id', shop_id)
  return NextResponse.json({ success: true })
}
