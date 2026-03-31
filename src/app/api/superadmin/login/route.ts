import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Simple hash using Web Crypto API (Cloudflare + Vercel compatible)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + (process.env.ADMIN_SALT || 'onsprint-sa-2026'))
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
  }

  const db = getServiceClient()

  // Find admin by username
  const { data: admin } = await db
    .from('platform_admins')
    .select('id, user_id, role, username, password_hash')
    .eq('username', username)
    .maybeSingle()

  if (!admin || !admin.password_hash) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  // Verify password
  const hash = await hashPassword(password)
  if (hash !== admin.password_hash) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  // Create a session token (simple JWT-like approach using crypto)
  const tokenData = JSON.stringify({
    admin_id: admin.id,
    user_id: admin.user_id,
    role: admin.role,
    username: admin.username,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  })
  const encoder = new TextEncoder()
  const data = encoder.encode(tokenData)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(tokenData + (process.env.ADMIN_SALT || 'onsprint-sa-2026')))
  const sig = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
  const token = btoa(tokenData) + '.' + sig

  const response = NextResponse.json({ success: true, role: admin.role })

  // Set session cookie
  response.cookies.set('sa-session', token, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
  })

  return response
}
