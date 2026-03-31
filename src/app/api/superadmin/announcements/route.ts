import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const db = getServiceClient()
  const { data } = await db.from('platform_announcements').select('*').order('created_at', { ascending: false }).limit(50)

  return NextResponse.json({ announcements: data || [] })
}

export async function POST(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { title, message, type = 'info', target = 'all', target_shop_ids } = await request.json()

  if (!title || !message) {
    return NextResponse.json({ error: 'Title and message required' }, { status: 400 })
  }

  const db = getServiceClient()

  // Save announcement
  await db.from('platform_announcements').insert({
    title, message, type, target,
    target_shop_ids: target_shop_ids || null,
    admin_user_id: admin.user.id,
  })

  // Get target shop IDs
  let shopIds: string[] = target_shop_ids || []
  if (target === 'all') {
    const { data: shops } = await db.from('shops').select('id').is('deleted_at', null)
    shopIds = (shops || []).map(s => s.id)
  }

  // Insert notifications for each shop
  if (shopIds.length > 0) {
    const notifications = shopIds.map(shop_id => ({
      shop_id,
      type,
      title,
      message,
      source: 'platform',
      user_id: null,
    }))
    await db.from('notifications').insert(notifications)
  }

  await logAudit({
    adminUserId: admin.user.id,
    action: 'announcement_sent',
    entityType: 'announcement',
    details: { title, type, target, shopCount: shopIds.length },
  })

  return NextResponse.json({ success: true, sentTo: shopIds.length })
}
