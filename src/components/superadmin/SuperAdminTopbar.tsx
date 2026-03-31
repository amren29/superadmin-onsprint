'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import SuperAdminSearch from './SuperAdminSearch'

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
)

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const HamburgerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)

const BellIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
)

interface SupportTicket {
  id: string
  subject: string
  status: string
  updated_at: string
  shops?: { name: string }
  user_email?: string
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function NotificationBell() {
  const router = useRouter()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  function fetchTickets() {
    fetch('/api/superadmin/support?status=open')
      .then(r => r.json())
      .then(data => setTickets(data.tickets || []))
      .catch(() => {})
  }

  useEffect(() => {
    fetchTickets()
    const interval = setInterval(fetchTickets, 30000)
    return () => clearInterval(interval)
  }, [])

  // Click outside to close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        className="topbar-btn"
        onClick={() => setOpen(!open)}
        title="Support tickets"
        style={{ position: 'relative' }}
      >
        <BellIcon />
        {tickets.length > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            minWidth: 14, height: 14, borderRadius: 7,
            background: 'var(--danger, #ef4444)', color: '#fff',
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', lineHeight: 1,
          }}>
            {tickets.length > 99 ? '99+' : tickets.length}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 8,
          width: 340, maxHeight: 400,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg, 12px)', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 1000,
        }}>
          <div style={{
            padding: '10px 14px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>
              Open Tickets ({tickets.length})
            </span>
            <button
              className="btn-ghost"
              style={{ fontSize: 11, padding: '2px 8px' }}
              onClick={() => { setOpen(false); router.push('/superadmin/support') }}
            >
              View All
            </button>
          </div>

          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {tickets.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                No open tickets
              </div>
            ) : tickets.slice(0, 10).map(ticket => (
              <div
                key={ticket.id}
                onClick={() => { setOpen(false); router.push('/superadmin/support') }}
                style={{
                  padding: '10px 14px', cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 12.5,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span className="cell-name" style={{ flex: 1, fontSize: 12 }}>
                    {ticket.subject || 'No subject'}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10, whiteSpace: 'nowrap' }}>
                    {relativeTime(ticket.updated_at)}
                  </span>
                </div>
                <div className="cell-sub" style={{ fontSize: 11 }}>
                  {ticket.shops?.name || 'Unknown shop'} {ticket.user_email ? `· ${ticket.user_email}` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SuperAdminTopbar({ onHamburgerClick }: { onHamburgerClick: () => void }) {
  const router = useRouter()
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.getAttribute('data-theme') === 'dark')
  }, [])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : '')
    localStorage.setItem('sp-theme', next ? 'dark' : 'light')
  }

  async function handleLogout() {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <header className="topbar">
      <button className="topbar-hamburger" onClick={onHamburgerClick} aria-label="Toggle menu">
        <HamburgerIcon />
      </button>
      <div className="topbar-spacer" />
      <SuperAdminSearch />
      <NotificationBell />
      <button className="topbar-btn" onClick={toggleTheme} title="Toggle theme">
        {dark ? <SunIcon /> : <MoonIcon />}
      </button>
      <button className="topbar-btn" onClick={handleLogout} title="Log out">
        <LogoutIcon />
      </button>
    </header>
  )
}
