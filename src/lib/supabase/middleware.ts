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
  const isPublic = isPublicRoute(path)

  // Check for sa-session cookie
  const session = request.cookies.get('sa-session')?.value

  // No session + protected route → redirect to login
  if (!session && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/superadmin/login'
    return NextResponse.redirect(url)
  }

  // Has session → validate it's not expired
  if (session) {
    try {
      const [b64] = session.split('.')
      if (b64) {
        const tokenData = JSON.parse(atob(b64))
        if (tokenData.exp && tokenData.exp < Date.now()) {
          // Expired → clear cookie and redirect to login
          const url = request.nextUrl.clone()
          url.pathname = '/superadmin/login'
          const response = NextResponse.redirect(url)
          response.cookies.set('sa-session', '', { path: '/', maxAge: 0 })
          return response
        }
      }

      // Valid session + on login page → redirect to dashboard
      if (path === '/superadmin/login') {
        const url = request.nextUrl.clone()
        url.pathname = '/superadmin'
        url.search = ''
        return NextResponse.redirect(url)
      }
    } catch {
      // Invalid cookie → clear and redirect
      if (!isPublic) {
        const url = request.nextUrl.clone()
        url.pathname = '/superadmin/login'
        const response = NextResponse.redirect(url)
        response.cookies.set('sa-session', '', { path: '/', maxAge: 0 })
        return response
      }
    }
  }

  return NextResponse.next({ request })
}
