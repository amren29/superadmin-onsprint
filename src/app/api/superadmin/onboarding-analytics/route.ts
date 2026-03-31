import { NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const db = getServiceClient()

  const [shopsRes, ordersRes, productsRes, storeSettingsRes, stockRes] = await Promise.all([
    db.from('shops').select('id, name, slug, created_at').is('deleted_at', null),
    db.from('orders').select('shop_id'),
    db.from('products').select('shop_id'),
    db.from('store_settings').select('shop_id, store_name'),
    db.from('inventory_items').select('shop_id'),
  ])

  const shops = shopsRes.data || []
  const orderShops = new Set((ordersRes.data || []).map(o => o.shop_id))
  const productShops = new Set((productsRes.data || []).map(p => p.shop_id))
  const storeShops = new Set((storeSettingsRes.data || []).filter(s => s.store_name).map(s => s.shop_id))
  const stockShops = new Set((stockRes.data || []).map(s => s.shop_id))

  const steps = [
    { key: 'registered', label: 'Registered', count: shops.length },
    { key: 'added_product', label: 'Added Product', count: shops.filter(s => productShops.has(s.id)).length },
    { key: 'customized_store', label: 'Customized Store', count: shops.filter(s => storeShops.has(s.id)).length },
    { key: 'first_order', label: 'First Order', count: shops.filter(s => orderShops.has(s.id)).length },
    { key: 'added_stock', label: 'Added Inventory', count: shops.filter(s => stockShops.has(s.id)).length },
  ]

  // Shops that never completed each step
  const dropoffs = shops.filter(s => !productShops.has(s.id)).map(s => ({ ...s, stoppedAt: 'Before adding product' }))

  return NextResponse.json({ steps, totalShops: shops.length, dropoffs: dropoffs.slice(0, 20) })
}
