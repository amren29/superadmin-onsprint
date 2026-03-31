'use client'

import { useEffect, useState } from 'react'
import RowMenu from '@/components/RowMenu'
import ConfirmModal from '@/components/ConfirmModal'

export default function SuperAdminMaintenance() {
  const [windows, setWindows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [creating, setCreating] = useState(false)
  const [delTarget, setDelTarget] = useState<any>(null)

  function load() {
    fetch('/api/superadmin/maintenance')
      .then(r => r.json()).then(d => { setWindows(d.windows || []); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  async function create() {
    setCreating(true)
    const res = await fetch('/api/superadmin/maintenance', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message, starts_at: startsAt, ends_at: endsAt }),
    })
    if (res.ok) { setTitle(''); setMessage(''); setStartsAt(''); setEndsAt(''); setShowCreate(false) }
    setCreating(false); load()
  }

  async function toggle(id: string, active: boolean) {
    await fetch('/api/superadmin/maintenance', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !active }),
    })
    load()
  }

  async function handleDelete() {
    if (!delTarget) return
    await fetch('/api/superadmin/maintenance', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: delTarget.id }),
    })
    setDelTarget(null)
    load()
  }

  const now = new Date()

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Maintenance</div>
          <div className="page-subtitle">Schedule maintenance windows and show banners</div>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>+ Schedule</button>
        </div>
      </div>

      <div className="page-scroll">
        {showCreate && (
          <div className="card">
            <div className="card-header"><h3 className="card-title">Schedule Maintenance</h3></div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label className="form-group">
                  <span className="form-label">Title</span>
                  <input value={title} onChange={e => setTitle(e.target.value)} className="form-input" placeholder="Scheduled maintenance" />
                </label>
                <label className="form-group">
                  <span className="form-label">Message</span>
                  <input value={message} onChange={e => setMessage(e.target.value)} className="form-input" placeholder="We'll be back shortly" />
                </label>
                <label className="form-group">
                  <span className="form-label">Starts At</span>
                  <input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} className="form-input" />
                </label>
                <label className="form-group">
                  <span className="form-label">Ends At</span>
                  <input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} className="form-input" />
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-primary" onClick={create} disabled={creating || !title || !startsAt || !endsAt}>{creating ? '...' : 'Schedule'}</button>
                <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header"><h3 className="card-title">Maintenance Windows</h3></div>
          <table className="data-table">
            <thead><tr><th>Title</th><th>Message</th><th>Start</th><th>End</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Loading...</td></tr>
              ) : windows.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No maintenance scheduled</td></tr>
              ) : windows.map(w => {
                const isLive = w.active && new Date(w.starts_at) <= now && new Date(w.ends_at) >= now
                const isPast = new Date(w.ends_at) < now
                return (
                  <tr key={w.id}>
                    <td><div className="cell-name">{w.title}</div></td>
                    <td><div className="cell-sub">{w.message || '—'}</div></td>
                    <td><div className="cell-sub">{new Date(w.starts_at).toLocaleString()}</div></td>
                    <td><div className="cell-sub">{new Date(w.ends_at).toLocaleString()}</div></td>
                    <td>
                      {isLive ? <span className="badge badge-warning">Live</span>
                        : isPast ? <span className="badge badge-pending">Past</span>
                        : w.active ? <span className="badge badge-info">Scheduled</span>
                        : <span className="badge badge-pending">Disabled</span>}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <RowMenu items={[
                        { label: w.active ? 'Disable' : 'Enable', action: () => toggle(w.id, w.active) },
                        { label: 'Delete', action: () => setDelTarget(w), danger: true },
                      ]} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {delTarget && (
        <ConfirmModal
          title={`Delete "${delTarget.title}"?`}
          message="This maintenance window will be permanently deleted."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </>
  )
}
