import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const db = getServiceClient()
  const { data } = await db.from('platform_maintenance').select('*').order('starts_at', { ascending: false })
  return NextResponse.json({ windows: data || [] })
}

export async function POST(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { title, message, starts_at, ends_at } = await request.json()
  if (!title || !starts_at || !ends_at) {
    return NextResponse.json({ error: 'Title, start and end time required' }, { status: 400 })
  }

  const db = getServiceClient()
  const { data, error } = await db.from('platform_maintenance').insert({
    title, message, starts_at, ends_at,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({ adminUserId: admin.user.id, action: 'maintenance_scheduled', entityType: 'maintenance', entityId: data.id, details: { title, starts_at, ends_at } })
  return NextResponse.json({ success: true, maintenance: data })
}

export async function PATCH(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id, active } = await request.json()
  const db = getServiceClient()
  await db.from('platform_maintenance').update({ active }).eq('id', id)
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await request.json()
  const db = getServiceClient()
  await db.from('platform_maintenance').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
