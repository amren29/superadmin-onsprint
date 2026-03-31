'use client'

import { useEffect, useState } from 'react'
import CustomSelect from '@/components/CustomSelect'

export default function SuperAdminAudit() {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (actionFilter) params.set('action', actionFilter)
    params.set('page', String(page))

    fetch(`/api/superadmin/audit?${params}`)
      .then(r => r.json())
      .then(d => { setLogs(d.logs || []); setTotal(d.total || 0); setLoading(false) })
      .catch(() => setLoading(false))
  }, [actionFilter, page])

  const totalPages = Math.ceil(total / 30)

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Audit Log</div>
          <div className="page-subtitle">{total} recorded actions</div>
        </div>
      </div>

      <div className="page-scroll">
        <div className="filter-row">
          <div />
          <div className="filter-right">
            <CustomSelect
              value={actionFilter}
              onChange={v => { setActionFilter(v); setPage(1) }}
              options={[
                { value: '', label: 'All Actions' },
                { value: 'shop_created', label: 'Shop Created' },
                { value: 'shop_deleted', label: 'Shop Deleted' },
                { value: 'shop_ownership_transferred', label: 'Ownership Transfer' },
                { value: 'coupon_created', label: 'Coupon Created' },
                { value: 'coupon_deactivated', label: 'Coupon Deactivated' },
                { value: 'announcement_sent', label: 'Announcement Sent' },
              ]}
              style={{ width: 200 }}
            />
          </div>
        </div>
        <div className="card">
          <table className="data-table">
            <thead><tr><th>Time</th><th>Admin</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No audit logs</td></tr>
              ) : logs.map(log => (
                <tr key={log.id}>
                  <td><div className="cell-sub" style={{ whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </div></td>
                  <td><div className="cell-name">{log.admin_email}</div></td>
                  <td><span className="badge badge-info">{log.action}</span></td>
                  <td style={{ fontSize: 11 }}>
                    {log.entity_type && <span>{log.entity_type}</span>}
                    {log.entity_id && <span className="cell-sub" style={{ marginLeft: 4 }}>{log.entity_id.slice(0, 8)}</span>}
                  </td>
                  <td><div className="cell-sub" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {JSON.stringify(log.details)}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '12px 0' }}>
            <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span style={{ alignSelf: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Page {page} of {totalPages}</span>
            <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </div>
    </>
  )
}
