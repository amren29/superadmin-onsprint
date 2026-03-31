import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const db = getServiceClient()
  const { data: categories } = await db.from('categories').select('id, name, shop_id')

  // Aggregate: count shops per category name
  const nameMap: Record<string, { count: number; ids: string[] }> = {}
  for (const c of (categories || [])) {
    if (!nameMap[c.name]) nameMap[c.name] = { count: 0, ids: [] }
    nameMap[c.name].count++
    nameMap[c.name].ids.push(c.id)
  }

  const result = Object.entries(nameMap)
    .map(([name, { count, ids }]) => ({ name, shopCount: count, ids }))
    .sort((a, b) => b.shopCount - a.shopCount)

  return NextResponse.json({ categories: result })
}

export async function POST(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { name } = await request.json()
  if (!name) return NextResponse.json({ error: 'Category name required' }, { status: 400 })

  const db = getServiceClient()

  // Get all shops
  const { data: shops } = await db.from('shops').select('id').is('deleted_at', null)
  if (!shops?.length) return NextResponse.json({ error: 'No shops found' }, { status: 400 })

  // Insert category for each shop that doesn't have it
  const inserts = []
  for (const shop of shops) {
    const { data: existing } = await db.from('categories')
      .select('id').eq('shop_id', shop.id).eq('name', name).maybeSingle()
    if (!existing) {
      inserts.push({ shop_id: shop.id, name })
    }
  }

  if (inserts.length > 0) {
    await db.from('categories').insert(inserts)
  }

  return NextResponse.json({ success: true, addedTo: inserts.length })
}

export async function PATCH(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { old_name, new_name } = await request.json()
  if (!old_name || !new_name) return NextResponse.json({ error: 'Old and new name required' }, { status: 400 })

  const db = getServiceClient()
  const { error, count } = await db.from('categories').update({ name: new_name }).eq('name', old_name)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, updated: count })
}
