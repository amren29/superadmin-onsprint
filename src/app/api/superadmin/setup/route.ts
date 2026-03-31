import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// One-time setup route to create the first admin with username/password
// Disable or delete this after first use

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + (process.env.ADMIN_SALT || 'onsprint-sa-2026'))
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(request: NextRequest) {
  const { username, password, setup_key } = await request.json()

  // Simple protection — require a setup key
  if (setup_key !== 'onsprint-setup-2026') {
    return NextResponse.json({ error: 'Invalid setup key' }, { status: 403 })
  }

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
  }

  const db = getServiceClient()
  const hash = await hashPassword(password)

  // Check if username already exists
  const { data: existing } = await db.from('platform_admins').select('id').eq('username', username).maybeSingle()

  if (existing) {
    // Update password
    await db.from('platform_admins').update({ password_hash: hash }).eq('username', username)
    return NextResponse.json({ success: true, message: 'Password updated' })
  }

  // Create new admin
  const { error } = await db.from('platform_admins').insert({
    username,
    password_hash: hash,
    role: 'owner',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, message: 'Admin created' })
}
