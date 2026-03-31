import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 30
  const offset = (page - 1) * limit

  const db = getServiceClient()
  let query = db.from('platform_audit_log').select('*', { count: 'exact' })

  if (action) query = query.eq('action', action)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get admin emails
  const adminIds = [...new Set((data || []).map(d => d.admin_user_id).filter(Boolean))]
  const adminEmails: Record<string, string> = {}
  for (const uid of adminIds) {
    const { data: { user } } = await db.auth.admin.getUserById(uid)
    adminEmails[uid] = user?.email || 'Unknown'
  }

  const logs = (data || []).map(d => ({
    ...d,
    admin_email: adminEmails[d.admin_user_id] || 'Unknown',
  }))

  return NextResponse.json({ logs, total: count || 0, page, limit })
}
