import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { shop_ids, title, message, type = 'info' } = await request.json()

  if (!title || !message) {
    return NextResponse.json({ error: 'Title and message required' }, { status: 400 })
  }

  const db = getServiceClient()
  let targetIds: string[] = shop_ids || []

  // If 'all', get all shop IDs
  if (targetIds.length === 1 && targetIds[0] === 'all') {
    const { data: shops } = await db.from('shops').select('id')
    targetIds = (shops || []).map(s => s.id)
  }

  if (targetIds.length === 0) {
    return NextResponse.json({ error: 'No shops specified' }, { status: 400 })
  }

  const notifications = targetIds.map(shop_id => ({
    shop_id,
    type,
    title,
    message,
    source: 'platform',
    user_id: null,
  }))

  const { error } = await db.from('notifications').insert(notifications)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, count: targetIds.length })
}
