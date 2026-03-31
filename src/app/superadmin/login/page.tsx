'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

/* ── Icons ───────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

/* ── Animated CSS ──────────────────────────────────────── */
const ANIM_CSS = `
  @keyframes bubbleFloat1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33%  { transform: translate(25px, -30px) scale(1.05); }
    66%  { transform: translate(-15px, -15px) scale(0.97); }
  }
  @keyframes bubbleFloat2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33%  { transform: translate(-20px, 25px) scale(0.95); }
    66%  { transform: translate(18px, 10px) scale(1.03); }
  }
  @keyframes bubbleFloat3 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50%  { transform: translate(15px, 20px) scale(1.06); }
  }
  @media (max-width: 768px) {
    .sa-login-grid { grid-template-columns: 1fr !important; }
    .sa-login-right { display: none !important; }
  }
`

export default function SuperAdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Handle Google OAuth callback (redirected back with ?code=)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (!code) return

    async function handleOAuthReturn() {
      setLoading(true)
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        // Try exchanging code — may fail if middleware already exchanged it
        await supabase.auth.exchangeCodeForSession(code!).catch(() => {})

        // Check if we have a session (either from exchange or middleware)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('Google sign-in failed. Please try again.')
          setLoading(false)
          return
        }

        // Verify super admin
        const res = await fetch('/api/superadmin/me')
        if (!res.ok) {
          await fetch('/api/auth/signout', { method: 'POST' })
          setError('Access denied. This account is not a platform admin.')
          setLoading(false)
          return
        }

        router.push('/superadmin')
        router.refresh()
      } catch {
        setError('Something went wrong.')
        setLoading(false)
      }
    }
    handleOAuthReturn()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setError('')
    setLoading(true)

    try {
      const { signIn } = await import('@/lib/auth-actions')
      const result = await signIn({ email, password })
      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      const res = await fetch('/api/superadmin/me')
      if (!res.ok) {
        await fetch('/api/auth/signout', { method: 'POST' })
        setError('Access denied. This account is not a platform admin.')
        setLoading(false)
        return
      }

      router.push('/superadmin')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f0f0f3',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <style>{ANIM_CSS}</style>

      <div className="sa-login-grid" style={{
        width: '100%',
        maxWidth: 960,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(15,23,42,0.12), 0 4px 16px rgba(15,23,42,0.06)',
        minHeight: 580,
      }}>

        {/* ── LEFT — Form ── */}
        <div style={{
          background: '#ffffff',
          padding: '48px 52px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 52 }}>
            <div style={{
              width: 34, height: 34,
              background: '#006AFF',
              borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
            }}>
              SA
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>Onsprint</span>
            <span style={{
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#fff',
              background: '#006AFF',
              padding: '2px 6px',
              borderRadius: 4,
              lineHeight: 1,
            }}>
              SUPER ADMIN
            </span>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
              Platform Login
            </h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Authorized administrators only.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@onsprint.com"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '10px 14px',
                  fontSize: 14, color: '#0f172a',
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 8, outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = '#006AFF'; e.target.style.background = '#fff' }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '10px 40px 10px 14px',
                    fontSize: 14, color: '#0f172a',
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 8, outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#006AFF'; e.target.style.background = '#fff' }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#94a3b8', padding: 2, display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ fontSize: 13, color: '#338bff', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px' }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '11px',
                background: loading ? '#005ce6' : '#006AFF',
                color: '#fff', border: 'none',
                borderRadius: 8, fontSize: 14, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: 'background 0.15s, transform 0.1s',
                letterSpacing: '0.1px',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#005ce6' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#006AFF' }}
            >
              {loading ? 'Signing in...' : 'Log In'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>Or Login With</span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>

            {/* Google button */}
            <button
              type="button"
              onClick={async () => {
                try {
                  const { createClient } = await import('@/lib/supabase/client')
                  const supabase = createClient()
                  await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: `${window.location.origin}/superadmin/login`,
                      skipBrowserRedirect: false,
                    },
                  })
                } catch (err) {
                  console.error('OAuth error:', err)
                }
              }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '9px 16px',
                background: '#fff',
                border: '1.5px solid #e2e8f0',
                borderRadius: 8, fontSize: 13, fontWeight: 500,
                color: '#374151', cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff' }}
            >
              <GoogleIcon />
              Google
            </button>
          </form>

          {/* Footer */}
          <div style={{ marginTop: 28, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
            This is a restricted area. Unauthorized access is prohibited.
          </div>
        </div>

        {/* ── RIGHT — Branding panel ── */}
        <div className="sa-login-right" style={{
          background: 'linear-gradient(140deg, #0055d4 0%, #006AFF 45%, #338bff 100%)',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 24,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Animated bubbles */}
          <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none', animation: 'bubbleFloat1 8s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: -60, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none', animation: 'bubbleFloat2 10s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', top: '40%', left: '50%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none', animation: 'bubbleFloat3 12s ease-in-out infinite' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{
              fontSize: 28, fontWeight: 800, color: '#ffffff',
              margin: '0 0 12px', lineHeight: 1.25, letterSpacing: '-0.5px',
            }}>
              Platform Administration
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', margin: 0, lineHeight: 1.6 }}>
              Manage all shops, users, subscriptions, and revenue across the Onsprint platform from a single dashboard.
            </p>
          </div>

          {/* Admin mockup */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 16, border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[
                  { label: 'Total Shops', value: '24', color: '#fbbf24' },
                  { label: 'Active Subs', value: '18', color: '#4ade80' },
                  { label: 'MRR', value: 'RM 2,340', color: '#60a5fa' },
                ].map(stat => (
                  <div key={stat.label} style={{
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    padding: '8px 10px',
                  }}>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{stat.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Shops</div>
              {[
                { name: 'PrintHub KL', plan: 'Pro', status: 'Active' },
                { name: 'QuickPrint JB', plan: 'Starter', status: 'Active' },
                { name: 'DesignWorks PJ', plan: 'Trial', status: 'Trial' },
              ].map((shop, i) => (
                <div key={shop.name} style={{
                  padding: '5px 10px',
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 0.8fr 0.7fr',
                  gap: 6,
                  borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{shop.name}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>{shop.plan}</div>
                  <span style={{
                    fontSize: 7, fontWeight: 600,
                    color: shop.status === 'Active' ? '#4ade80' : '#fbbf24',
                    background: shop.status === 'Active' ? 'rgba(74,222,128,0.15)' : 'rgba(251,191,36,0.15)',
                    borderRadius: 4, padding: '1px 4px', display: 'inline-block',
                  }}>{shop.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '14px 32px',
        fontSize: 12, color: '#94a3b8',
        pointerEvents: 'none',
      }}>
        <span>Copyright &copy; 2026 Onsprint</span>
      </div>
    </div>
  )
}
