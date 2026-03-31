import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const { confirm_slug } = await request.json()

  const db = getServiceClient()
  const { data: shop } = await db.from('shops').select('id, name, slug').eq('id', id).maybeSingle()
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  // Require slug confirmation
  if (confirm_slug !== shop.slug) {
    return NextResponse.json({ error: 'Type the shop slug to confirm deletion' }, { status: 400 })
  }

  // Soft delete
  const { error } = await db.from('shops').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    adminUserId: admin.user.id,
    action: 'shop_deleted',
    entityType: 'shop',
    entityId: id,
    details: { name: shop.name, slug: shop.slug },
  })

  return NextResponse.json({ success: true })
}
