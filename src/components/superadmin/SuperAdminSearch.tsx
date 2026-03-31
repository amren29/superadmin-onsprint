'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const ShopIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const OrderIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/>
  </svg>
)

const UserIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

interface SearchResults {
  shops: Array<{ id: string; name: string; slug: string; plan: string }>
  orders: Array<{ id: string; seq_id: number; customer_name: string; shop_id: string; status: string }>
  users: Array<{ id: string; email: string; role: string }>
}

export default function SuperAdminSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  // Cmd+K to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
        setResults(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
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

  const doSearch = useCallback((q: string) => {
    if (q.length < 2) { setResults(null); return }
    setLoading(true)
    fetch(`/api/superadmin/search?q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(data => { setResults(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function handleChange(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 300)
  }

  function navigate(path: string) {
    setOpen(false)
    setQuery('')
    setResults(null)
    router.push(path)
  }

  const hasResults = results && (results.shops.length > 0 || results.orders.length > 0 || results.users.length > 0)

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        className="topbar-btn"
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
        title="Search (Cmd+K)"
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <SearchIcon />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          Search
          <kbd style={{
            fontSize: 9, padding: '1px 4px', borderRadius: 3,
            background: 'var(--bg-hover)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', fontFamily: 'inherit',
          }}>&#8984;K</kbd>
        </span>
      </button>

      {open && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', paddingTop: 80,
        }}>
          <div style={{
            width: 480, maxHeight: 420,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg, 12px)', overflow: 'hidden',
            boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', borderBottom: '1px solid var(--border)',
            }}>
              <SearchIcon />
              <input
                ref={inputRef}
                value={query}
                onChange={e => handleChange(e.target.value)}
                placeholder="Search shops, orders, users..."
                style={{
                  flex: 1, border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 14, color: 'var(--text-primary)',
                }}
              />
              <kbd style={{
                fontSize: 10, padding: '2px 6px', borderRadius: 4,
                background: 'var(--bg-hover)', border: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}>ESC</kbd>
            </div>

            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {loading && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                  Searching...
                </div>
              )}

              {!loading && query.length >= 2 && !hasResults && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                  No results found
                </div>
              )}

              {!loading && hasResults && (
                <>
                  {results!.shops.length > 0 && (
                    <div>
                      <div style={{ padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Shops
                      </div>
                      {results!.shops.map(s => (
                        <div
                          key={s.id}
                          onClick={() => navigate(`/superadmin/shops/${s.id}`)}
                          style={{
                            padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10,
                            cursor: 'pointer', fontSize: 13,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <ShopIcon />
                          <span className="cell-name" style={{ flex: 1 }}>{s.name}</span>
                          <span className="cell-sub">{s.slug}</span>
                          <span className="badge badge-info" style={{ textTransform: 'capitalize', fontSize: 10 }}>{s.plan || 'free'}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {results!.orders.length > 0 && (
                    <div>
                      <div style={{ padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Orders
                      </div>
                      {results!.orders.map(o => (
                        <div
                          key={o.id}
                          onClick={() => navigate(`/superadmin/shops/${o.shop_id}`)}
                          style={{
                            padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10,
                            cursor: 'pointer', fontSize: 13,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <OrderIcon />
                          <span className="cell-name" style={{ flex: 1 }}>#{o.seq_id} {o.customer_name}</span>
                          <span className="badge badge-info" style={{ fontSize: 10, textTransform: 'capitalize' }}>{o.status || 'new'}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {results!.users.length > 0 && (
                    <div>
                      <div style={{ padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Users
                      </div>
                      {results!.users.map(u => (
                        <div
                          key={u.id}
                          style={{
                            padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10,
                            cursor: 'pointer', fontSize: 13,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <UserIcon />
                          <span className="cell-name" style={{ flex: 1 }}>{u.email}</span>
                          <span className="badge badge-info" style={{ fontSize: 10, textTransform: 'capitalize' }}>{u.role}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {!loading && query.length < 2 && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                  Type at least 2 characters to search
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
