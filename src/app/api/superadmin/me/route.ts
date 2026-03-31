import { NextResponse } from 'next/server'
import { verifySuperAdmin } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await verifySuperAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  return NextResponse.json({
    isSuperAdmin: true,
    role: admin.role,
    email: admin.user.email,
  })
}
