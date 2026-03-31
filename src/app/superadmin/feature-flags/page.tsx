'use client'

import { useEffect, useState } from 'react'
import RowMenu from '@/components/RowMenu'
import ConfirmModal from '@/components/ConfirmModal'

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
      background: on ? 'var(--accent)' : 'var(--border)', position: 'relative', flexShrink: 0, transition: 'background 0.25s ease',
    }}>
      <span style={{
        position: 'absolute', top: 3, left: on ? 22 : 3, width: 18, height: 18, borderRadius: '50%',
        background: 'var(--bg-card)', transition: 'left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

export default function SuperAdminFeatureFlags() {
  const [flags, setFlags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [key, setKey] = useState('')
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [delTarget, setDelTarget] = useState<any>(null)

  function load() {
    fetch('/api/superadmin/feature-flags')
      .then(r => r.json()).then(d => { setFlags(d.flags || []); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  async function create() {
    setCreating(true)
    await fetch('/api/superadmin/feature-flags', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, name, description: desc }),
    })
    setKey(''); setName(''); setDesc(''); setShowCreate(false); setCreating(false); load()
  }

  async function toggle(flag: any) {
    await fetch('/api/superadmin/feature-flags', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: flag.id, enabled_default: !flag.enabled_default }),
    })
    load()
  }

  async function handleDelete() {
    if (!delTarget) return
    await fetch('/api/superadmin/feature-flags', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: delTarget.id }),
    })
    setDelTarget(null)
    load()
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Feature Flags</div>
          <div className="page-subtitle">Enable/disable features per shop or globally</div>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>+ New Flag</button>
        </div>
      </div>

      <div className="page-scroll">
        {showCreate && (
          <div className="card">
            <div className="card-header"><h3 className="card-title">Create Feature Flag</h3></div>
            <div style={{ padding: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <label className="form-group" style={{ width: 160 }}>
                <span className="form-label">Key</span>
                <input value={key} onChange={e => setKey(e.target.value)} className="form-input" placeholder="beta_kanban" />
              </label>
              <label className="form-group" style={{ width: 180 }}>
                <span className="form-label">Name</span>
                <input value={name} onChange={e => setName(e.target.value)} className="form-input" placeholder="Beta Kanban Board" />
              </label>
              <label className="form-group" style={{ flex: 1, minWidth: 150 }}>
                <span className="form-label">Description</span>
                <input value={desc} onChange={e => setDesc(e.target.value)} className="form-input" placeholder="New kanban board UI" />
              </label>
              <button className="btn-primary" onClick={create} disabled={creating || !key || !name}>{creating ? '...' : 'Create'}</button>
              <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="card">
          <table className="data-table">
            <thead><tr><th>Key</th><th>Name</th><th>Description</th><th>Enabled</th><th></th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Loading...</td></tr>
              ) : flags.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No feature flags</td></tr>
              ) : flags.map(f => (
                <tr key={f.id}>
                  <td><div className="cell-name" style={{ fontFamily: 'monospace' }}>{f.key}</div></td>
                  <td><div className="cell-sub">{f.name}</div></td>
                  <td><div className="cell-sub">{f.description || '—'}</div></td>
                  <td><Toggle on={f.enabled_default} onChange={() => toggle(f)} /></td>
                  <td onClick={e => e.stopPropagation()}>
                    <RowMenu items={[
                      { label: 'Delete', action: () => setDelTarget(f), danger: true },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {delTarget && (
        <ConfirmModal
          title={`Delete "${delTarget.name}"?`}
          message="This feature flag will be permanently deleted."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </>
  )
}
