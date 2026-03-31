import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const db = getServiceClient()
  const { data } = await db.from('platform_feature_flags').select('*').order('created_at', { ascending: true })
  return NextResponse.json({ flags: data || [] })
}

export async function POST(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { key, name, description, enabled_default } = await request.json()
  if (!key || !name) return NextResponse.json({ error: 'Key and name required' }, { status: 400 })

  const db = getServiceClient()
  const { data, error } = await db.from('platform_feature_flags').insert({
    key, name, description, enabled_default: enabled_default || false,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({ adminUserId: admin.user.id, action: 'feature_flag_created', entityType: 'feature_flag', entityId: data.id, details: { key, name } })
  return NextResponse.json({ success: true, flag: data })
}

export async function PATCH(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id, ...updates } = await request.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const db = getServiceClient()
  const { error } = await db.from('platform_feature_flags').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({ adminUserId: admin.user.id, action: 'feature_flag_updated', entityType: 'feature_flag', entityId: id, details: updates })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await request.json()
  const db = getServiceClient()
  await db.from('platform_feature_flags').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
