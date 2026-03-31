import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const { new_owner_email } = await request.json()
  if (!new_owner_email) return NextResponse.json({ error: 'New owner email required' }, { status: 400 })

  const db = getServiceClient()

  // Find new owner
  const { data: { users } } = await db.auth.admin.listUsers({ perPage: 1000 })
  let newOwner = users.find(u => u.email?.toLowerCase() === new_owner_email.toLowerCase())

  if (!newOwner) {
    const { data: created, error } = await db.auth.admin.createUser({
      email: new_owner_email,
      email_confirm: true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    newOwner = created.user
  }

  // Demote current owner
  await db.from('shop_members').update({ role: 'admin' }).eq('shop_id', id).eq('role', 'owner')

  // Check if new owner already a member
  const { data: existingMember } = await db.from('shop_members')
    .select('id').eq('shop_id', id).eq('user_id', newOwner!.id).maybeSingle()

  if (existingMember) {
    await db.from('shop_members').update({ role: 'owner' }).eq('shop_id', id).eq('user_id', newOwner!.id)
  } else {
    await db.from('shop_members').insert({ shop_id: id, user_id: newOwner!.id, role: 'owner' })
  }

  await logAudit({
    adminUserId: admin.user.id,
    action: 'shop_ownership_transferred',
    entityType: 'shop',
    entityId: id,
    details: { new_owner_email, new_owner_id: newOwner!.id },
  })

  return NextResponse.json({ success: true })
}
