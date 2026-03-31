'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

const ANIM_CSS = `
  @media (max-width: 768px) {
    .sa-login-grid { grid-template-columns: 1fr !important; }
    .sa-login-right { display: none !important; }
  }
`

export default function SuperAdminLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) { setError('Please fill in all fields.'); return }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/superadmin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Invalid credentials')
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
        minHeight: 520,
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
              flexShrink: 0, color: '#fff', fontSize: 11, fontWeight: 700,
            }}>
              SA
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>Onsprint</span>
            <span style={{
              fontSize: 8, fontWeight: 700, letterSpacing: '0.08em',
              color: '#fff', background: '#006AFF',
              padding: '2px 6px', borderRadius: 4, lineHeight: 1,
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

            {/* Username */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
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
                  placeholder="Enter password"
                  autoComplete="current-password"
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
              <div style={{ fontSize: 13, color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px' }}>
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
                transition: 'background 0.15s',
              }}
            >
              {loading ? 'Signing in...' : 'Log In'}
            </button>
          </form>

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
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#ffffff', margin: '0 0 12px', lineHeight: 1.25, letterSpacing: '-0.5px' }}>
              Platform Administration
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', margin: 0, lineHeight: 1.6 }}>
              Manage all shops, users, subscriptions, and revenue across the Onsprint platform.
            </p>
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 16, border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Total Shops', value: '24', color: '#fbbf24' },
                  { label: 'Active Subs', value: '18', color: '#4ade80' },
                  { label: 'MRR', value: 'RM 2,340', color: '#60a5fa' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{stat.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
