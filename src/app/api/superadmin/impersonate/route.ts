import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { shop_id } = await request.json()
  if (!shop_id) return NextResponse.json({ error: 'shop_id required' }, { status: 400 })

  const db = getServiceClient()

  // Verify shop exists
  const { data: shop } = await db.from('shops').select('id, name').eq('id', shop_id).maybeSingle()
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  // Get the shop owner
  const { data: owner } = await db.from('shop_members').select('user_id, role').eq('shop_id', shop_id).eq('role', 'owner').maybeSingle()

  const response = NextResponse.json({ success: true, shopName: shop.name })

  // Set impersonation cookies (1 hour TTL)
  response.cookies.set('x-shop-id', shop_id, { path: '/', maxAge: 3600, httpOnly: false, sameSite: 'lax' })
  response.cookies.set('x-shop-role', 'owner', { path: '/', maxAge: 3600, httpOnly: false, sameSite: 'lax' })
  response.cookies.set('sa-impersonate', JSON.stringify({
    shop_id,
    shop_name: shop.name,
    admin_id: admin.user.id,
    owner_id: owner?.user_id || null,
  }), { path: '/', maxAge: 3600, httpOnly: false, sameSite: 'lax' })

  return response
}

export async function DELETE() {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const response = NextResponse.json({ success: true })

  // Clear impersonation cookie
  response.cookies.set('sa-impersonate', '', { path: '/', maxAge: 0 })
  // Clear shop cookies
  response.cookies.set('x-shop-id', '', { path: '/', maxAge: 0 })
  response.cookies.set('x-shop-role', '', { path: '/', maxAge: 0 })

  return response
}
