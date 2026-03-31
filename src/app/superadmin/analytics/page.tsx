'use client'

import { useEffect, useState } from 'react'
import CustomSelect from '@/components/CustomSelect'

const fmtRM = (n: number) => `RM ${(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`

type Tab = 'revenue' | 'growth' | 'leaderboard' | 'churn'

export default function SuperAdminAnalytics() {
  const [tab, setTab] = useState<Tab>('revenue')
  const [period, setPeriod] = useState('30d')
  const [revenueData, setRevenueData] = useState<any>(null)
  const [growthData, setGrowthData] = useState<any>(null)
  const [leaderboardData, setLeaderboardData] = useState<any>(null)
  const [churnData, setChurnData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    if (tab === 'revenue') {
      fetch(`/api/superadmin/analytics/revenue?period=${period}`)
        .then(r => r.json()).then(d => { setRevenueData(d); setLoading(false) })
    } else if (tab === 'growth') {
      fetch('/api/superadmin/analytics/growth')
        .then(r => r.json()).then(d => { setGrowthData(d); setLoading(false) })
    } else if (tab === 'leaderboard') {
      fetch(`/api/superadmin/analytics/leaderboard?period=${period}`)
        .then(r => r.json()).then(d => { setLeaderboardData(d); setLoading(false) })
    } else {
      fetch('/api/superadmin/analytics/churn')
        .then(r => r.json()).then(d => { setChurnData(d); setLoading(false) })
    }
  }, [tab, period])

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Analytics</div>
          <div className="page-subtitle">Platform-wide insights and trends</div>
        </div>
        <div className="page-actions">
          {(tab === 'revenue' || tab === 'leaderboard') && (
            <CustomSelect
              value={period}
              onChange={v => setPeriod(v)}
              options={[
                { value: '7d', label: '7 days' },
                { value: '30d', label: '30 days' },
                { value: '90d', label: '90 days' },
                { value: '1y', label: '1 year' },
              ]}
              style={{ width: 100 }}
            />
          )}
        </div>
      </div>

      <div className="page-scroll">
        <div className="filter-row">
          <div className="filter-bar">
            <button className={`filter-tab${tab === 'revenue' ? ' active' : ''}`} onClick={() => setTab('revenue')}>Revenue</button>
            <button className={`filter-tab${tab === 'growth' ? ' active' : ''}`} onClick={() => setTab('growth')}>Growth</button>
            <button className={`filter-tab${tab === 'leaderboard' ? ' active' : ''}`} onClick={() => setTab('leaderboard')}>Leaderboard</button>
            <button className={`filter-tab${tab === 'churn' ? ' active' : ''}`} onClick={() => setTab('churn')}>Churn</button>
          </div>
        </div>
        {loading ? (
          <div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>Loading...</div>
        ) : tab === 'revenue' && revenueData ? (
          <>
            <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="stat-card">
                <div className="stat-card-header"><div className="stat-card-label">Total Revenue</div><span className="stat-card-period">{period}</span></div>
                <div className="stat-value">{fmtRM(revenueData.total)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-header"><div className="stat-card-label">Previous Period</div><span className="stat-card-period">Comparison</span></div>
                <div className="stat-value">{fmtRM(revenueData.prevTotal)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-header"><div className="stat-card-label">Change</div></div>
                <div className="stat-value" style={{ color: revenueData.total >= revenueData.prevTotal ? 'var(--success-text)' : 'var(--negative)' }}>
                  {revenueData.prevTotal > 0 ? `${Math.round(((revenueData.total - revenueData.prevTotal) / revenueData.prevTotal) * 100)}%` : '—'}
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3 className="card-title">Daily Revenue</h3></div>
              <div style={{ padding: 16, overflowX: 'auto' }}>
                {revenueData.series.length > 0 ? (
                  <svg width="100%" height="180" viewBox={`0 0 ${Math.max(revenueData.series.length * 20, 300)} 180`}>
                    {(() => {
                      const max = Math.max(...revenueData.series.map((s: any) => s.revenue), 1)
                      return revenueData.series.map((s: any, i: number) => (
                        <g key={s.date}>
                          <rect x={i * 20 + 2} y={165 - (s.revenue / max) * 150} width="14" height={(s.revenue / max) * 150} rx="2" fill="var(--accent)" opacity="0.8">
                            <title>{s.date}: {fmtRM(s.revenue)}</title>
                          </rect>
                        </g>
                      ))
                    })()}
                  </svg>
                ) : <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No data for this period</div>}
              </div>
            </div>
          </>
        ) : tab === 'growth' && growthData ? (
          <div className="card">
            <div className="card-header"><h3 className="card-title">Shop Growth Over Time ({growthData.totalShops} total)</h3></div>
            <table className="data-table">
              <thead><tr><th>Month</th><th>New Shops</th><th>Cumulative</th></tr></thead>
              <tbody>
                {growthData.series.map((s: any) => (
                  <tr key={s.month}>
                    <td><div className="cell-name">{s.month}</div></td>
                    <td>{s.count}</td>
                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{s.cumulative}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : tab === 'leaderboard' && leaderboardData ? (
          <div className="card">
            <div className="card-header"><h3 className="card-title">Top Shops by Revenue ({period})</h3></div>
            <table className="data-table">
              <thead><tr><th>#</th><th>Shop</th><th>Plan</th><th>Orders</th><th>Revenue</th></tr></thead>
              <tbody>
                {leaderboardData.leaderboard.map((s: any, i: number) => (
                  <tr key={s.shop_id}>
                    <td style={{ fontWeight: 700, color: i < 3 ? 'var(--accent)' : 'var(--text-muted)' }}>{i + 1}</td>
                    <td><div className="cell-name">{s.name || s.shop_id?.slice(0, 8)}</div></td>
                    <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{s.plan || 'free'}</span></td>
                    <td>{s.orders}</td>
                    <td><div className="cell-name">{fmtRM(s.revenue)}</div></td>
                  </tr>
                ))}
                {leaderboardData.leaderboard.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : tab === 'churn' && churnData ? (
          <>
            <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="stat-card">
                <div className="stat-card-header"><div className="stat-card-label">Churn Rate</div></div>
                <div className="stat-value" style={{ color: 'var(--negative)' }}>{churnData.churnRate}%</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-header"><div className="stat-card-label">At Risk</div><span className="stat-card-period">30-60d inactive</span></div>
                <div className="stat-value" style={{ color: 'var(--warning)' }}>{churnData.atRisk.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-header"><div className="stat-card-label">Churned</div><span className="stat-card-period">60d+ inactive</span></div>
                <div className="stat-value" style={{ color: 'var(--negative)' }}>{churnData.churned.length}</div>
              </div>
            </div>
            {churnData.atRisk.length > 0 && (
              <div className="card">
                <div className="card-header"><h3 className="card-title">At Risk Shops</h3></div>
                <table className="data-table">
                  <thead><tr><th>Shop</th><th>Plan</th><th>Orders</th><th>Last Order</th></tr></thead>
                  <tbody>
                    {churnData.atRisk.map((s: any) => (
                      <tr key={s.id}>
                        <td><div className="cell-name">{s.name}</div></td>
                        <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{s.plan || 'free'}</span></td>
                        <td>{s.orderCount}</td>
                        <td style={{ color: 'var(--warning)' }}>{new Date(s.lastOrder).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {churnData.churned.length > 0 && (
              <div className="card">
                <div className="card-header"><h3 className="card-title">Churned Shops</h3></div>
                <table className="data-table">
                  <thead><tr><th>Shop</th><th>Plan</th><th>Orders</th><th>Last Order</th></tr></thead>
                  <tbody>
                    {churnData.churned.map((s: any) => (
                      <tr key={s.id}>
                        <td><div className="cell-name">{s.name}</div></td>
                        <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{s.plan || 'free'}</span></td>
                        <td>{s.orderCount}</td>
                        <td style={{ color: 'var(--negative)' }}>{new Date(s.lastOrder).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}
      </div>
    </>
  )
}
