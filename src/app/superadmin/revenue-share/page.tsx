'use client'

import { useEffect, useState } from 'react'

const fmtRM = (n: number) => `RM ${(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`

export default function SuperAdminRevenueShare() {
  const [shops, setShops] = useState<any[]>([])
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  function load() {
    fetch('/api/superadmin/revenue-share')
      .then(r => r.json()).then(d => {
        setShops(d.shops || []); setTotalEarnings(d.totalPlatformEarnings || 0); setLoading(false)
      })
  }
  useEffect(() => { load() }, [])

  async function saveShare(shopId: string) {
    await fetch('/api/superadmin/revenue-share', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shop_id: shopId, revenue_share_percent: parseFloat(editValue) || 0 }),
    })
    setEditingId(null); load()
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Revenue Share</div>
          <div className="page-subtitle">Track platform commissions from shop sales</div>
        </div>
      </div>

      <div className="finance-stats">
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-label">Platform Earnings</div><span className="stat-card-period">All time</span></div>
          <div className="stat-value">{fmtRM(totalEarnings)}</div>
          <div className="stat-vs">from commissions</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-label">Shops with Share</div></div>
          <div className="stat-value">{shops.filter(s => s.revenue_share_percent > 0).length}</div>
          <div className="stat-vs">of {shops.length} total</div>
        </div>
      </div>

      <div className="page-scroll">
        <div className="card">
          <div className="card-header"><h3 className="card-title">All Shops</h3></div>
          <table className="data-table">
            <thead><tr><th>Shop</th><th>Plan</th><th>Revenue</th><th>Share %</th><th>Platform Earnings</th><th></th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Loading...</td></tr>
              ) : shops.map(s => (
                <tr key={s.id}>
                  <td><div className="cell-name">{s.name}</div></td>
                  <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{s.plan || 'free'}</span></td>
                  <td><div className="cell-name">{fmtRM(s.totalRevenue)}</div></td>
                  <td>
                    {editingId === s.id ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <input value={editValue} onChange={e => setEditValue(e.target.value)} className="form-input" style={{ width: 60 }} type="number" autoFocus />
                        <button className="btn-primary" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => saveShare(s.id)}>Save</button>
                      </div>
                    ) : (
                      <span style={{ cursor: 'pointer', color: 'var(--accent)' }} onClick={() => { setEditingId(s.id); setEditValue(String(s.revenue_share_percent || 0)) }}>
                        {s.revenue_share_percent || 0}%
                      </span>
                    )}
                  </td>
                  <td><div className="cell-name" style={{ color: s.platformEarnings > 0 ? 'var(--success-text)' : 'var(--text-muted)' }}>{fmtRM(s.platformEarnings)}</div></td>
                  <td>
                    {editingId !== s.id && (
                      <button className="btn-ghost" style={{ fontSize: 11, color: 'var(--accent)' }}
                        onClick={() => { setEditingId(s.id); setEditValue(String(s.revenue_share_percent || 0)) }}>Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
