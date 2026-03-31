'use client'

import { useEffect, useState } from 'react'

interface SubData {
  shops: Array<{
    id: string
    name: string
    slug: string
    plan: string
    plan_expires_at: string | null
    stripe_subscription_id: string | null
    created_at: string
  }>
  stats: { activeSubs: number; trialSubs: number; expiredSubs: number; mrr: number }
}

export default function SuperAdminSubscriptions() {
  const [data, setData] = useState<SubData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/superadmin/subscriptions')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="page-scroll">
        <div style={{ color: 'var(--text-muted)', padding: '40px 0', textAlign: 'center' }}>Loading...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="page-scroll">
        <div style={{ color: 'var(--text-muted)', padding: '40px 0', textAlign: 'center' }}>Failed to load data</div>
      </div>
    )
  }

  const now = new Date()

  function getStatus(shop: SubData['shops'][0]) {
    if (!shop.plan || shop.plan === 'free') return 'free'
    if (shop.plan === 'trial') return 'trial'
    if (shop.plan_expires_at && new Date(shop.plan_expires_at) < now) return 'expired'
    return 'active'
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Subscriptions</div>
          <div className="page-subtitle">Plan overview and billing status for all shops</div>
        </div>
      </div>

      <div className="finance-stats">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-label">MRR</div>
            <span className="stat-card-period">Monthly</span>
          </div>
          <div className="stat-value">RM {data.stats.mrr}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-label">Active</div>
            <span className="stat-card-period">Paid plans</span>
          </div>
          <div className="stat-value">{data.stats.activeSubs}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-label">Trial</div>
            <span className="stat-card-period">In progress</span>
          </div>
          <div className="stat-value">{data.stats.trialSubs}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-label">Expired / Free</div>
            <span className="stat-card-period">Inactive</span>
          </div>
          <div className="stat-value">{data.stats.expiredSubs}</div>
        </div>
      </div>

      <div className="page-scroll">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">All Shops</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Shop</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Billing</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              {data.shops.map(shop => {
                const status = getStatus(shop)
                const badgeClass = status === 'active' ? 'badge badge-success'
                  : status === 'trial' ? 'badge badge-warning'
                  : status === 'expired' ? 'badge badge-pending'
                  : 'badge badge-pending'
                return (
                  <tr key={shop.id}>
                    <td><div className="cell-name">{shop.name}</div></td>
                    <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{shop.plan || 'free'}</span></td>
                    <td><span className={badgeClass} style={{ textTransform: 'capitalize' }}>{status}</span></td>
                    <td><div className="cell-sub">{shop.stripe_subscription_id ? 'Stripe' : 'Manual'}</div></td>
                    <td><div className="cell-sub">
                      {shop.plan_expires_at
                        ? new Date(shop.plan_expires_at).toLocaleDateString()
                        : '—'}
                    </div></td>
                  </tr>
                )
              })}
              {data.shops.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No shops</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
