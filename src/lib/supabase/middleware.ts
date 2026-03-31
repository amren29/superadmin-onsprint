import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/superadmin/login',
  '/api/',
]

function isPublicRoute(path: string): boolean {
  if (path === '/') return true
  return PUBLIC_ROUTES.some((route) => path === route || path.startsWith(route))
}

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPublic = isPublicRoute(path)

  // Protected routes: redirect to /superadmin/login if no session
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/superadmin/login'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  // If logged in and on login page, check if platform admin and redirect
  if (user && path === '/superadmin/login') {
    try {
      const adminClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: platformAdmin } = await adminClient
        .from('platform_admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (platformAdmin) {
        const url = request.nextUrl.clone()
        url.pathname = '/superadmin'
        url.search = ''
        return NextResponse.redirect(url)
      }
    } catch {}
  }

  // For superadmin routes (non-login), verify platform_admins membership
  if (user && path.startsWith('/superadmin') && path !== '/superadmin/login') {
    try {
      const adminClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: platformAdmin } = await adminClient
        .from('platform_admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!platformAdmin) {
        // Not a platform admin — redirect to login
        const url = request.nextUrl.clone()
        url.pathname = '/superadmin/login'
        return NextResponse.redirect(url)
      }
    } catch {
      // On error, allow through (API routes will double-check)
    }
  }

  return supabaseResponse
}
