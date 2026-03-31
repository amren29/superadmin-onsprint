import { NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await verifySuperAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const db = getServiceClient()
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [shopsRes, recentShopsRes, ordersRes, recentOrdersRes] = await Promise.all([
    db.from('shops').select('id, plan, plan_expires_at, created_at', { count: 'exact' }),
    db.from('shops').select('id', { count: 'exact' }).gte('created_at', thirtyDaysAgo),
    db.from('orders').select('id, total, created_at', { count: 'exact' }),
    db.from('orders').select('id, total, created_at').gte('created_at', thirtyDaysAgo),
  ])

  const shops = shopsRes.data || []
  const totalShops = shopsRes.count || 0
  const newThisMonth = recentShopsRes.count || 0
  const totalOrders = ordersRes.count || 0

  // Calculate active subscriptions (shops with non-expired plans)
  const activeSubs = shops.filter(s => {
    if (!s.plan || s.plan === 'free') return false
    if (!s.plan_expires_at) return true
    return new Date(s.plan_expires_at) > now
  }).length

  // Calculate MRR from recent orders (simplified)
  const recentRevenue = (recentOrdersRes.data || []).reduce((sum, o) => sum + (o.total || 0), 0)

  // Monthly revenue by day for chart
  const dailyRevenue: Record<string, number> = {}
  for (const order of (recentOrdersRes.data || [])) {
    const day = order.created_at?.slice(0, 10)
    if (day) {
      dailyRevenue[day] = (dailyRevenue[day] || 0) + (order.total || 0)
    }
  }

  // Recent shops for activity
  const { data: recentShops } = await db
    .from('shops')
    .select('id, name, slug, plan, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    totalShops,
    activeSubs,
    mrr: recentRevenue,
    newThisMonth,
    totalOrders,
    dailyRevenue,
    recentShops: recentShops || [],
  })
}
