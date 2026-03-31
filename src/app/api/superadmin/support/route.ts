import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20
  const offset = (page - 1) * limit

  const db = getServiceClient()
  let query = db.from('support_tickets').select('*, shops(name)', { count: 'exact' })

  if (status) query = query.eq('status', status)

  const { data, count, error } = await query
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get user emails
  const tickets = []
  for (const t of (data || [])) {
    let email = ''
    if (t.user_id) {
      const { data: { user } } = await db.auth.admin.getUserById(t.user_id)
      email = user?.email || ''
    }
    tickets.push({ ...t, user_email: email })
  }

  return NextResponse.json({ tickets, total: count || 0, page, limit })
}

export async function PATCH(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id, status } = await request.json()
  if (!id || !status) return NextResponse.json({ error: 'ID and status required' }, { status: 400 })

  const db = getServiceClient()
  await db.from('support_tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  return NextResponse.json({ success: true })
}
