import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function POST(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { name, owner_email, plan = 'free' } = await request.json()
  if (!name) return NextResponse.json({ error: 'Shop name required' }, { status: 400 })

  const db = getServiceClient()
  let slug = slugify(name)

  // Ensure unique slug
  const { data: existing } = await db.from('shops').select('id').eq('slug', slug).maybeSingle()
  if (existing) slug = `${slug}-${Date.now().toString(36).slice(-4)}`

  // Create shop
  const { data: shop, error: shopError } = await db.from('shops').insert({ name, slug, plan }).select().single()
  if (shopError) return NextResponse.json({ error: shopError.message }, { status: 500 })

  // If owner email provided, link them
  if (owner_email) {
    const { data: { users } } = await db.auth.admin.listUsers({ perPage: 1000 })
    let user = users.find(u => u.email?.toLowerCase() === owner_email.toLowerCase())

    if (!user) {
      // Create user
      const { data: created, error: createError } = await db.auth.admin.createUser({
        email: owner_email,
        email_confirm: true,
      })
      if (createError) return NextResponse.json({ error: `User creation failed: ${createError.message}` }, { status: 500 })
      user = created.user
    }

    if (user) {
      await db.from('shop_members').insert({ shop_id: shop.id, user_id: user.id, role: 'owner' })
    }
  }

  await logAudit({
    adminUserId: admin.user.id,
    action: 'shop_created',
    entityType: 'shop',
    entityId: shop.id,
    details: { name, slug, plan, owner_email },
  })

  return NextResponse.json({ success: true, shop })
}
