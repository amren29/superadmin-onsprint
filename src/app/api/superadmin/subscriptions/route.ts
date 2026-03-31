import { NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await verifySuperAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const db = getServiceClient()
  const { data: shops, error } = await db
    .from('shops')
    .select('id, name, slug, plan, plan_expires_at, stripe_subscription_id, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const now = new Date()
  let activeSubs = 0
  let trialSubs = 0
  let expiredSubs = 0
  let mrr = 0

  const PLAN_PRICES: Record<string, number> = {
    starter: 29,
    pro: 79,
    business: 149,
  }

  for (const shop of (shops || [])) {
    const isExpired = shop.plan_expires_at && new Date(shop.plan_expires_at) < now
    const isFree = !shop.plan || shop.plan === 'free'
    const isTrial = shop.plan === 'trial'

    if (isTrial) {
      trialSubs++
    } else if (isExpired || isFree) {
      expiredSubs++
    } else {
      activeSubs++
      mrr += PLAN_PRICES[shop.plan] || 0
    }
  }

  return NextResponse.json({
    shops: shops || [],
    stats: { activeSubs, trialSubs, expiredSubs, mrr },
  })
}
