import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const shopId = searchParams.get('shop_id') || ''
  const status = searchParams.get('status') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20
  const offset = (page - 1) * limit

  const db = getServiceClient()
  let query = db.from('orders').select('id, seq_id, shop_id, status, grand_total, customer_name, created_at, shops(name)', { count: 'exact' })

  if (search) {
    query = query.or(`seq_id.ilike.%${search}%,customer_name.ilike.%${search}%`)
  }
  if (shopId) query = query.eq('shop_id', shopId)
  if (status) query = query.eq('status', status)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ orders: data || [], total: count || 0, page, limit })
}
