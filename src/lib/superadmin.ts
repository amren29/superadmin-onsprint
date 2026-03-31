import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Service role client for platform-level queries
export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Verify the current user is a platform admin via session cookie
export async function verifySuperAdmin(): Promise<{ user: { id: string; email: string }; role: string } | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('sa-session')?.value

    if (!sessionCookie) return null

    const [b64] = sessionCookie.split('.')
    if (!b64) return null

    const tokenData = JSON.parse(atob(b64))

    // Check expiry
    if (tokenData.exp && tokenData.exp < Date.now()) return null

    return {
      user: {
        id: tokenData.user_id || tokenData.admin_id,
        email: tokenData.username || '',
      },
      role: tokenData.role || 'admin',
    }
  } catch {
    return null
  }
}
