import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ shops: [], orders: [], users: [] })
  }

  const db = getServiceClient()
  const pattern = `%${q}%`

  const [shopsRes, ordersRes, usersRes] = await Promise.all([
    db.from('shops')
      .select('id, name, slug, plan')
      .or(`name.ilike.${pattern},slug.ilike.${pattern}`)
      .limit(5),
    db.from('orders')
      .select('id, seq_id, customer_name, shop_id, status, grand_total')
      .or(`customer_name.ilike.${pattern},seq_id::text.ilike.${pattern}`)
      .limit(5),
    db.from('platform_admins')
      .select('user_id, role')
      .limit(50),
  ])

  // For users, search by email via auth
  const users: Array<{ id: string; email: string; role: string }> = []
  if (usersRes.data) {
    for (const pa of usersRes.data) {
      try {
        const { data: { user } } = await db.auth.admin.getUserById(pa.user_id)
        if (user?.email && user.email.toLowerCase().includes(q.toLowerCase())) {
          users.push({ id: pa.user_id, email: user.email, role: pa.role })
          if (users.length >= 5) break
        }
      } catch {}
    }
  }

  return NextResponse.json({
    shops: shopsRes.data || [],
    orders: ordersRes.data || [],
    users,
  })
}
