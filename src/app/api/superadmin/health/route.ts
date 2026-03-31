import { NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const db = getServiceClient()
  const checks: Record<string, { status: string; detail: string }> = {}

  // Database check
  try {
    const { count } = await db.from('shops').select('id', { count: 'exact', head: true })
    checks.database = { status: 'ok', detail: `${count} shops` }
  } catch {
    checks.database = { status: 'error', detail: 'Connection failed' }
  }

  // Auth check
  try {
    const { data: { users } } = await db.auth.admin.listUsers({ perPage: 1 })
    checks.auth = { status: 'ok', detail: 'Auth service responsive' }
  } catch {
    checks.auth = { status: 'error', detail: 'Auth service unreachable' }
  }

  // Recent activity
  try {
    const { data: lastOrder } = await db.from('orders')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastOrder) {
      const ago = Date.now() - new Date(lastOrder.created_at).getTime()
      const hours = Math.floor(ago / 3600000)
      checks.activity = {
        status: hours < 24 ? 'ok' : hours < 72 ? 'warning' : 'error',
        detail: hours < 1 ? 'Last order < 1h ago' : `Last order ${hours}h ago`,
      }
    } else {
      checks.activity = { status: 'warning', detail: 'No orders yet' }
    }
  } catch {
    checks.activity = { status: 'error', detail: 'Could not check activity' }
  }

  // Counts
  const [shopsRes, ordersRes, usersRes] = await Promise.all([
    db.from('shops').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    db.from('orders').select('id', { count: 'exact', head: true }),
    db.auth.admin.listUsers({ perPage: 1 }),
  ])

  const metrics = {
    shops: shopsRes.count || 0,
    orders: ordersRes.count || 0,
    platform: 'Cloudflare Workers',
    runtime: 'Edge',
  }

  const overall = Object.values(checks).some(c => c.status === 'error') ? 'error'
    : Object.values(checks).some(c => c.status === 'warning') ? 'warning'
    : 'ok'

  return NextResponse.json({ checks, metrics, overall })
}
