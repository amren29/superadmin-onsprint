import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const db = getServiceClient()
  const { data } = await db.from('shops')
    .select('id, name, slug, whitelabel_domain, whitelabel_logo_url, whitelabel_brand_name')
    .not('whitelabel_domain', 'is', null)
    .order('name')

  return NextResponse.json({ shops: data || [] })
}

export async function PATCH(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { shop_id, whitelabel_domain, whitelabel_logo_url, whitelabel_brand_name } = await request.json()
  if (!shop_id) return NextResponse.json({ error: 'shop_id required' }, { status: 400 })

  const db = getServiceClient()
  const { error } = await db.from('shops').update({
    whitelabel_domain, whitelabel_logo_url, whitelabel_brand_name,
  }).eq('id', shop_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
