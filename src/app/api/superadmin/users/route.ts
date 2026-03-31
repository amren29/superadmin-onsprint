import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const type = searchParams.get('type') || 'shop_admins'
  const page = parseInt(searchParams.get('page') || '1')
  const perPage = 20

  const db = getServiceClient()
  const { data: { users }, error } = await db.auth.admin.listUsers({ page, perPage })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const userIds = users.map(u => u.id)

  // Get memberships based on type
  const [{ data: shopMembers }, { data: storeUsers }, { data: platformAdmins }] = await Promise.all([
    db.from('shop_members').select('user_id, shop_id, role, shops(name)').in('user_id', userIds),
    db.from('store_users').select('user_id, shop_id, shops(name)').in('user_id', userIds),
    db.from('platform_admins').select('user_id, role').in('user_id', userIds),
  ])

  const shopMemberMap: Record<string, any[]> = {}
  for (const m of (shopMembers || [])) {
    if (!shopMemberMap[m.user_id]) shopMemberMap[m.user_id] = []
    shopMemberMap[m.user_id].push(m)
  }

  const storeUserMap: Record<string, any[]> = {}
  for (const m of (storeUsers || [])) {
    if (!storeUserMap[m.user_id]) storeUserMap[m.user_id] = []
    storeUserMap[m.user_id].push(m)
  }

  const platformAdminSet = new Set((platformAdmins || []).map(a => a.user_id))

  let filtered = users.map(u => ({
    id: u.id,
    email: u.email || '',
    name: u.user_metadata?.full_name || u.user_metadata?.name || '',
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
    shops: type === 'store_customers'
      ? (storeUserMap[u.id] || [])
      : (shopMemberMap[u.id] || []),
    isShopAdmin: (shopMemberMap[u.id] || []).length > 0,
    isStoreCustomer: (storeUserMap[u.id] || []).length > 0,
    isPlatformAdmin: platformAdminSet.has(u.id),
  }))

  // Filter by type
  if (type === 'shop_admins') {
    filtered = filtered.filter(u => u.isShopAdmin)
  } else if (type === 'store_customers') {
    filtered = filtered.filter(u => u.isStoreCustomer)
  } else if (type === 'platform_admins') {
    filtered = filtered.filter(u => u.isPlatformAdmin)
  }

  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(u =>
      u.email.toLowerCase().includes(s) || u.name.toLowerCase().includes(s)
    )
  }

  return NextResponse.json({ users: filtered, page, perPage })
}
