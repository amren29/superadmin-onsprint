import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Service role client for platform-level queries
export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Verify the current user is a platform admin
export async function verifySuperAdmin(): Promise<{ user: any; role: string } | null> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const admin = getServiceClient()
    const { data: platformAdmin } = await admin
      .from('platform_admins')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!platformAdmin) return null

    return { user, role: platformAdmin.role }
  } catch {
    return null
  }
}
