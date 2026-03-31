import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifySuperAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const db = getServiceClient()

  const [shopRes, membersRes, ordersRes, productsRes, customersRes, storeUsersRes, storeSettingsRes, recentOrdersRes] = await Promise.all([
    db.from('shops').select('*').eq('id', id).maybeSingle(),
    db.from('shop_members').select('user_id, role, created_at').eq('shop_id', id),
    db.from('orders').select('id, grand_total', { count: 'exact' }).eq('shop_id', id),
    db.from('products').select('id', { count: 'exact' }).eq('shop_id', id),
    db.from('customers').select('id', { count: 'exact' }).eq('shop_id', id),
    db.from('store_users').select('id', { count: 'exact' }).eq('shop_id', id),
    db.from('store_settings').select('store_name, logo_url, domain').eq('shop_id', id).maybeSingle(),
    db.from('orders').select('id, seq_id, customer_name, grand_total, status, created_at')
      .eq('shop_id', id).order('created_at', { ascending: false }).limit(10),
  ])

  if (!shopRes.data) {
    return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
  }

  // Get user emails for members
  const members = []
  for (const m of (membersRes.data || [])) {
    const { data: { user } } = await db.auth.admin.getUserById(m.user_id)
    members.push({
      ...m,
      email: user?.email || 'Unknown',
      name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
    })
  }

  // Calculate total revenue
  const totalRevenue = (ordersRes.data || []).reduce((s, o) => s + (o.grand_total || 0), 0)

  return NextResponse.json({
    shop: shopRes.data,
    members,
    orderCount: ordersRes.count || 0,
    productCount: productsRes.count || 0,
    customerCount: customersRes.count || 0,
    storeUserCount: storeUsersRes.count || 0,
    totalRevenue,
    storeSettings: storeSettingsRes.data || null,
    recentOrders: recentOrdersRes.data || [],
  })
}
