import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const db = getServiceClient()
  const { data: admins } = await db.from('platform_admins').select('*').order('created_at', { ascending: true })

  const result = []
  for (const a of (admins || [])) {
    const { data: { user } } = await db.auth.admin.getUserById(a.user_id)
    result.push({
      ...a,
      email: user?.email || 'Unknown',
      name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
    })
  }

  return NextResponse.json({ admins: result, currentUserId: admin.user.id })
}

export async function POST(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const db = getServiceClient()

  // Find user by email
  const { data: { users } } = await db.auth.admin.listUsers({ perPage: 1000 })
  const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) return NextResponse.json({ error: 'User not found. They must register first.' }, { status: 404 })

  // Check if already admin
  const { data: existing } = await db.from('platform_admins').select('id').eq('user_id', user.id).maybeSingle()
  if (existing) return NextResponse.json({ error: 'User is already a super admin' }, { status: 400 })

  const { error } = await db.from('platform_admins').insert({ user_id: user.id, role: 'admin' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { user_id } = await request.json()
  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

  // Prevent self-deletion
  if (user_id === admin.user.id) {
    return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })
  }

  const db = getServiceClient()
  const { error } = await db.from('platform_admins').delete().eq('user_id', user_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
