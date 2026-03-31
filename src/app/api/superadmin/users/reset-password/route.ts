import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { user_id } = await request.json()
  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

  const db = getServiceClient()

  // Get user email
  const { data: { user }, error: userError } = await db.auth.admin.getUserById(user_id)
  if (userError || !user?.email) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Send password reset email
  const { error } = await db.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.BASE_URL}/reset-password`,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, email: user.email })
}
