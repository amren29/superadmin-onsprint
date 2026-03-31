import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const db = getServiceClient()
  const { data } = await db.from('platform_coupons').select('*').order('created_at', { ascending: false })

  return NextResponse.json({ coupons: data || [] })
}

export async function POST(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await request.json()
  const { code, discount_type, discount_value, plan, max_uses, expires_at } = body

  if (!code || !discount_type || !discount_value) {
    return NextResponse.json({ error: 'Code, discount type, and value required' }, { status: 400 })
  }

  const db = getServiceClient()
  const { data, error } = await db.from('platform_coupons').insert({
    code: code.toUpperCase(),
    discount_type,
    discount_value,
    plan: plan || null,
    max_uses: max_uses || null,
    expires_at: expires_at || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    adminUserId: admin.user.id,
    action: 'coupon_created',
    entityType: 'coupon',
    entityId: data.id,
    details: { code, discount_type, discount_value },
  })

  return NextResponse.json({ success: true, coupon: data })
}

export async function DELETE(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await request.json()
  const db = getServiceClient()
  await db.from('platform_coupons').update({ active: false }).eq('id', id)

  await logAudit({
    adminUserId: admin.user.id,
    action: 'coupon_deactivated',
    entityType: 'coupon',
    entityId: id,
  })

  return NextResponse.json({ success: true })
}
