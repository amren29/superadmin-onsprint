import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'shops'

  const db = getServiceClient()
  let csv = ''

  if (type === 'shops') {
    const { data } = await db.from('shops').select('id, name, slug, plan, plan_expires_at, created_at').is('deleted_at', null).order('created_at')
    csv = 'ID,Name,Slug,Plan,Plan Expires,Created\n'
    for (const s of (data || [])) {
      csv += `${s.id},"${s.name}",${s.slug},${s.plan || 'free'},${s.plan_expires_at || ''},${s.created_at}\n`
    }
  } else if (type === 'orders') {
    const { data } = await db.from('orders').select('id, seq_id, shop_id, customer_name, grand_total, status, created_at').order('created_at', { ascending: false }).limit(1000)
    csv = 'ID,Order #,Shop ID,Customer,Total,Status,Created\n'
    for (const o of (data || [])) {
      csv += `${o.id},${o.seq_id || ''},${o.shop_id},"${o.customer_name || ''}",${o.grand_total || 0},${o.status},${o.created_at}\n`
    }
  } else if (type === 'revenue') {
    const { data } = await db.from('orders').select('shop_id, grand_total, created_at, shops(name)').order('created_at', { ascending: false })
    csv = 'Shop,Amount,Date\n'
    for (const o of (data || [])) {
      csv += `"${(o.shops as any)?.name || o.shop_id}",${o.grand_total || 0},${o.created_at}\n`
    }
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${type}-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
