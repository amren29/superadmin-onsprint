'use client'

import { useEffect, useState } from 'react'

export default function SuperAdminHealth() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    fetch('/api/superadmin/health')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  const statusColor = (s: string) => s === 'ok' ? 'var(--success-text)' : s === 'warning' ? 'var(--warning)' : 'var(--negative)'
  const statusBg = (s: string) => s === 'ok' ? 'var(--success-bg)' : s === 'warning' ? 'var(--warning-bg)' : 'var(--danger-bg)'

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Platform Health</div>
          <div className="page-subtitle">Auto-refreshes every 30 seconds</div>
        </div>
        <div className="page-actions">
          {data && (
            <span style={{
              padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              background: statusBg(data.overall), color: statusColor(data.overall),
              textTransform: 'uppercase',
            }}>
              {data.overall}
            </span>
          )}
          <button className="topbar-btn" onClick={load} disabled={loading}>
            {loading ? '...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="page-scroll">
        {loading && !data ? (
          <div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>Checking health...</div>
        ) : data ? (
          <>
            <div className="finance-stats">
              {Object.entries(data.checks as Record<string, { status: string; detail: string }>).map(([name, check]) => (
                <div className="stat-card" key={name}>
                  <div className="stat-card-header">
                    <div className="stat-card-label" style={{ textTransform: 'capitalize' }}>{name}</div>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: statusColor(check.status), display: 'inline-block',
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: statusColor(check.status), fontWeight: 500, marginTop: 4 }}>
                    {check.status.toUpperCase()}
                  </div>
                  <div className="cell-sub" style={{ marginTop: 2 }}>
                    {check.detail}
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-header"><h3 className="card-title">Platform Metrics</h3></div>
              <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '160px 1fr', gap: '8px 16px', fontSize: 13 }}>
                <span className="form-label">Total Shops</span>
                <span style={{ fontWeight: 600 }}>{data.metrics.shops}</span>
                <span className="form-label">Total Orders</span>
                <span style={{ fontWeight: 600 }}>{data.metrics.orders}</span>
                <span className="form-label">Platform</span>
                <span>{data.metrics.platform}</span>
                <span className="form-label">Runtime</span>
                <span>{data.metrics.runtime}</span>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  )
}
