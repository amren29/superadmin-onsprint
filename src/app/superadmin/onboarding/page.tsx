'use client'

import { useEffect, useState } from 'react'

export default function SuperAdminOnboarding() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/superadmin/onboarding-analytics')
      .then(r => r.json()).then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !data) return <div className="page-scroll"><div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>{loading ? 'Loading...' : 'Failed to load'}</div></div>

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Onboarding Analytics</div>
          <div className="page-subtitle">Track where new shops drop off in setup</div>
        </div>
      </div>

      <div className="page-scroll">
        {/* Funnel */}
        <div className="card">
          <div className="card-header"><h3 className="card-title">Onboarding Funnel</h3></div>
          <div style={{ padding: 16 }}>
            {data.steps.map((step: any, i: number) => {
              const pct = data.totalShops > 0 ? Math.round((step.count / data.totalShops) * 100) : 0
              return (
                <div key={step.key} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{i + 1}. {step.label}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{step.count} / {data.totalShops} ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 4, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Drop-off shops */}
        {data.dropoffs.length > 0 && (
          <div className="card">
            <div className="card-header"><h3 className="card-title">Shops That Never Added a Product</h3></div>
            <table className="data-table">
              <thead><tr><th>Shop</th><th>Slug</th><th>Registered</th></tr></thead>
              <tbody>
                {data.dropoffs.map((s: any) => (
                  <tr key={s.id}>
                    <td><div className="cell-name">{s.name}</div></td>
                    <td><div className="cell-sub">{s.slug}</div></td>
                    <td><div className="cell-sub">{new Date(s.created_at).toLocaleDateString()}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
