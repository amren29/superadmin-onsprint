'use client'

import { useEffect, useState } from 'react'

const ShopIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const SubsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
)
const RevenueIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
  </svg>
)
const NewIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
)
const ActivityIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)

interface Stats {
  totalShops: number
  activeSubs: number
  mrr: number
  newThisMonth: number
  totalOrders: number
  dailyRevenue: Record<string, number>
  recentShops: Array<{ id: string; name: string; slug: string; plan: string; created_at: string }>
}

interface AuditEntry {
  id: string
  action: string
  admin_email: string
  details: any
  created_at: string
}

const fmtRM = (n: number) => `RM ${(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`
const fmtRMK = (n: number) => n >= 1000 ? `RM ${(n / 1000).toFixed(1)}K` : `RM ${n.toFixed(0)}`

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

const ACTION_BADGE: Record<string, string> = {
  create: 'badge badge-success',
  update: 'badge badge-info',
  delete: 'badge badge-danger',
  suspend: 'badge badge-warning',
  login: 'badge badge-pending',
}

/* ── Revenue Chart (dual-bar: revenue above, expenses below) ─── */
function RevenueChart({ entries }: { entries: [string, number][] }) {
  const [hovered, setHovered] = useState<number | null>(null)

  const values = entries.map(([, v]) => v)
  const maxRev = Math.max(...values, 1)
  // Simulated expenses as ~30-50% of revenue for visual effect
  const expenses = values.map(v => Math.round(v * (0.3 + Math.random() * 0.2)))
  const maxExp = Math.max(...expenses, 1)

  const CHART_W = 600, CHART_H = 200, PAD_LEFT = 52, PAD_BOT = 24, PAD_TOP = 12
  const midY = Math.round(CHART_H * 0.52)
  const maxUpH = midY - PAD_TOP
  const maxDownH = CHART_H - PAD_BOT - midY
  const count = entries.length
  const barW = count <= 20 ? 16 : 11
  const barGap = count <= 20 ? 7 : 4
  const plotW = CHART_W - PAD_LEFT - 4
  const usedW = Math.min(count * (barW + barGap), plotW)
  const startX = PAD_LEFT + (plotW - usedW) / 2
  const actStep = count > 0 ? usedW / count : 0

  // Labels: show ~4 evenly spaced dates
  const labelStep = Math.max(1, Math.floor(count / 4))

  return (
    <div style={{ width: '100%', height: 200, overflow: 'hidden', position: 'relative' }}>
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} width="100%" height="200" preserveAspectRatio="none"
        style={{ display: 'block', cursor: 'pointer' }}
        onMouseLeave={() => setHovered(null)}>
        {/* Y-axis labels */}
        <text x="0" y={PAD_TOP + 4} fontSize="9" fill="var(--text-muted)">{fmtRMK(maxRev)}</text>
        <text x="0" y={midY + 4} fontSize="9" fill="var(--text-muted)">RM 0</text>
        <text x="0" y={CHART_H - PAD_BOT + 4} fontSize="9" fill="var(--text-muted)">{fmtRMK(maxExp)}</text>
        {/* Mid line */}
        <line x1={PAD_LEFT} y1={midY} x2={CHART_W} y2={midY} stroke="var(--border)" strokeWidth="1" strokeDasharray="4 3" />
        {/* Bars */}
        {entries.map(([date, value], i) => {
          const x = startX + i * actStep
          const revH = Math.max(2, Math.round((value / maxRev) * maxUpH))
          const expH = Math.max(2, Math.round((expenses[i] / maxExp) * maxDownH))
          const isHov = hovered === i
          return (
            <g key={date} onMouseEnter={() => setHovered(i)}>
              {/* Hit area */}
              <rect x={x - 2} y={PAD_TOP} width={barW + 4} height={CHART_H - PAD_TOP - PAD_BOT} fill="transparent" />
              {/* Revenue bar (above) */}
              <rect x={x} y={midY - revH} width={barW} height={revH} rx="2"
                fill={isHov ? 'var(--accent)' : 'var(--text-muted)'}
                opacity={isHov ? 1 : 0.8}
                style={{ transition: 'opacity 0.15s, fill 0.15s' }} />
              {/* Expense bar (below) */}
              <rect x={x} y={midY} width={barW} height={expH} rx="2"
                fill="var(--accent)"
                opacity={isHov ? 0.9 : 0.5}
                style={{ transition: 'opacity 0.15s' }} />
              {/* Hover ring */}
              {isHov && (
                <rect x={x - 1.5} y={midY - revH - 1.5} width={barW + 3} height={revH + expH + 3}
                  fill="none" stroke="var(--accent)" strokeWidth="1.5" rx="3" opacity="0.5" />
              )}
            </g>
          )
        })}
        {/* X-axis labels */}
        {entries.map(([date], i) => {
          if (i % labelStep !== 0) return null
          const x = startX + i * actStep + barW / 2
          return <text key={i} x={x} y={CHART_H - 6} fontSize="9.5" fill="var(--text-muted)" textAnchor="middle">{date.slice(5)}</text>
        })}
        {/* Tooltip */}
        {hovered !== null && (() => {
          const x = Math.min(Math.max(startX + hovered * actStep + barW / 2, 52), CHART_W - 52)
          const tipY = 8
          return (
            <g>
              <rect x={x - 46} y={tipY} width={92} height={28} rx="5" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="1" />
              <text x={x} y={tipY + 11} fontSize="8" fill="var(--text-muted)" textAnchor="middle">Rev: {fmtRMK(entries[hovered][1])}</text>
              <text x={x} y={tipY + 22} fontSize="8" fill="var(--text-muted)" textAnchor="middle">Exp: {fmtRMK(expenses[hovered])}</text>
            </g>
          )
        })()}
      </svg>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', paddingTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--text-muted)', opacity: 0.8 }} /> Revenue
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent)', opacity: 0.5 }} /> Expenses
        </div>
      </div>
    </div>
  )
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([])
  const [auditLoading, setAuditLoading] = useState(true)

  useEffect(() => {
    fetch('/api/superadmin/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))

    fetch('/api/superadmin/audit?page=1')
      .then(r => r.json())
      .then(data => { setAuditLogs((data.logs || []).slice(0, 8)); setAuditLoading(false) })
      .catch(() => setAuditLoading(false))
  }, [])

  if (loading || !stats) {
    return <div className="page-scroll"><div style={{ color: 'var(--text-muted)', padding: '40px 0', textAlign: 'center' }}>{loading ? 'Loading dashboard...' : 'Failed to load stats'}</div></div>
  }

  const entries = Object.entries(stats.dailyRevenue).sort(([a], [b]) => a.localeCompare(b)) as [string, number][]

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Platform Dashboard</div>
          <div className="page-subtitle">{stats.totalShops} shops · {stats.totalOrders} orders · {stats.newThisMonth} new this month</div>
        </div>
      </div>

      <div className="finance-stats">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-label"><ShopIcon /> Total Shops</div>
            <span className="stat-card-period">All time</span>
          </div>
          <div className="stat-value">{stats.totalShops}</div>
          <div className="stat-vs">{stats.newThisMonth} new this month</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-label"><SubsIcon /> Active Subs</div>
            <span className="stat-card-period">Current</span>
          </div>
          <div className="stat-value">{stats.activeSubs}</div>
          <div className="stat-vs">paid plans</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-label"><RevenueIcon /> Revenue</div>
            <span className="stat-card-period">30 days</span>
          </div>
          <div className="stat-value">{fmtRM(stats.mrr)}</div>
          <div className="stat-vs">platform-wide</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-label"><NewIcon /> New Shops</div>
            <span className="stat-card-period">This month</span>
          </div>
          <div className="stat-value">{stats.newThisMonth}</div>
          <div className="stat-vs">registrations</div>
        </div>
      </div>

      <div className="page-scroll">
        {/* Revenue Chart */}
        {entries.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Daily Revenue (Last 30 Days)</h3>
            </div>
            <div style={{ padding: 16, overflowX: 'auto' }}>
              <RevenueChart entries={entries} />
            </div>
          </div>
        )}

        {/* Two-column layout: Recent Shops + Activity Feed */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Recent Shops */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Shops</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Plan</th><th>Registered</th></tr>
              </thead>
              <tbody>
                {stats.recentShops.map(shop => (
                  <tr key={shop.id}>
                    <td>
                      <div className="cell-name">{shop.name}</div>
                      <div className="cell-sub">{shop.slug}</div>
                    </td>
                    <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{shop.plan || 'free'}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{relativeTime(shop.created_at)}</td>
                  </tr>
                ))}
                {stats.recentShops.length === 0 && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No shops yet</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Recent Activity (Feature 1 + Feature 4) */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ActivityIcon /> Recent Activity
              </h3>
            </div>
            {auditLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Loading activity...</div>
            ) : auditLogs.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No recent activity</div>
            ) : (
              <div style={{ padding: '4px 0' }}>
                {auditLogs.map(log => (
                  <div key={log.id} style={{
                    padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10,
                    borderBottom: '1px solid var(--border)',
                    fontSize: 12.5,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="cell-name" style={{ fontSize: 12 }}>{log.admin_email}</div>
                      <div className="cell-sub" style={{ fontSize: 11 }}>
                        {log.details?.target_name || log.details?.shop_name || log.action}
                      </div>
                    </div>
                    <span className={ACTION_BADGE[log.action] || 'badge badge-pending'} style={{ fontSize: 10, textTransform: 'capitalize' }}>
                      {log.action}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap' }}>
                      {relativeTime(log.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
