import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const db = getServiceClient()
  const { data } = await db.from('platform_email_templates').select('*').order('created_at', { ascending: true })
  return NextResponse.json({ templates: data || [] })
}

export async function POST(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await request.json()
  const { slug, name, subject, body: templateBody, variables } = body
  if (!slug || !name || !subject || !templateBody) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }

  const db = getServiceClient()
  const { data, error } = await db.from('platform_email_templates').insert({
    slug, name, subject, body: templateBody, variables: variables || [],
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, template: data })
}

export async function PATCH(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id, ...updates } = await request.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const db = getServiceClient()
  updates.updated_at = new Date().toISOString()
  const { error } = await db.from('platform_email_templates').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await request.json()
  const db = getServiceClient()
  await db.from('platform_email_templates').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
