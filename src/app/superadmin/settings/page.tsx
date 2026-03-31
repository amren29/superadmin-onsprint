'use client'

import { useEffect, useState } from 'react'

interface AdminRow {
  id: string
  user_id: string
  role: string
  email: string
  name: string
  created_at: string
}

export default function SuperAdminSettings() {
  const [admins, setAdmins] = useState<AdminRow[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  function loadAdmins() {
    fetch('/api/superadmin/admins')
      .then(r => r.json())
      .then(data => {
        setAdmins(data.admins || [])
        setCurrentUserId(data.currentUserId || '')
      })
  }

  useEffect(() => { loadAdmins() }, [])

  async function addAdmin() {
    if (!newEmail) return
    setAdding(true)
    setAddError('')
    const res = await fetch('/api/superadmin/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail }),
    })
    const data = await res.json()
    if (res.ok) {
      setNewEmail('')
      loadAdmins()
    } else {
      setAddError(data.error)
    }
    setAdding(false)
  }

  async function removeAdmin(userId: string) {
    if (!confirm('Remove this admin?')) return
    setRemoving(userId)
    await fetch('/api/superadmin/admins', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    loadAdmins()
    setRemoving(null)
  }

  const planPricing = [
    { plan: 'Starter', price: 'RM 29/mo', features: 'Basic features, 1 user' },
    { plan: 'Pro', price: 'RM 79/mo', features: 'Advanced features, 5 users' },
    { plan: 'Business', price: 'RM 149/mo', features: 'All features, unlimited users' },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-subtitle">Platform configuration and admin management</div>
        </div>
      </div>

      <div className="page-scroll">
        {/* Super Admins */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Super Admins</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {admins.map(a => (
                <tr key={a.user_id}>
                  <td>
                    <div className="cell-name">
                      {a.email}
                      {a.user_id === currentUserId && (
                        <span className="badge badge-info" style={{ marginLeft: 6 }}>You</span>
                      )}
                    </div>
                  </td>
                  <td><div className="cell-sub">{a.name || '—'}</div></td>
                  <td><span className="badge badge-success" style={{ textTransform: 'capitalize' }}>{a.role}</span></td>
                  <td><div className="cell-sub">{new Date(a.created_at).toLocaleDateString()}</div></td>
                  <td>
                    {a.user_id !== currentUserId && (
                      <button
                        className="btn-ghost"
                        style={{ fontSize: 11, color: 'var(--negative)' }}
                        onClick={() => removeAdmin(a.user_id)}
                        disabled={removing === a.user_id}
                      >
                        {removing === a.user_id ? '...' : 'Remove'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <label className="form-group">
              <span className="form-label">Admin Email</span>
              <input
                type="email"
                placeholder="Email address"
                value={newEmail}
                onChange={e => { setNewEmail(e.target.value); setAddError('') }}
                className="form-input"
                style={{ width: 260 }}
                onKeyDown={e => e.key === 'Enter' && addAdmin()}
              />
            </label>
            <button className="btn-primary" onClick={addAdmin} disabled={adding || !newEmail} style={{ alignSelf: 'flex-end' }}>
              {adding ? '...' : 'Add Admin'}
            </button>
            {addError && <span style={{ fontSize: 12, color: 'var(--negative)', alignSelf: 'flex-end' }}>{addError}</span>}
          </div>
        </div>

        {/* Plan Pricing */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Plan Pricing</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Price</th>
                <th>Features</th>
              </tr>
            </thead>
            <tbody>
              {planPricing.map(p => (
                <tr key={p.plan}>
                  <td><div className="cell-name">{p.plan}</div></td>
                  <td>{p.price}</td>
                  <td><div className="cell-sub">{p.features}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Environment */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Environment</h3>
          </div>
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '160px 1fr', gap: '8px 16px', fontSize: 13 }}>
            <span className="form-label">Platform</span>
            <span>Cloudflare Workers</span>
            <span className="form-label">Framework</span>
            <span>Next.js (App Router)</span>
            <span className="form-label">Database</span>
            <span>Supabase (PostgreSQL)</span>
            <span className="form-label">Auth</span>
            <span>Supabase Auth</span>
            <span className="form-label">Currency</span>
            <span>MYR (Malaysian Ringgit)</span>
          </div>
        </div>
      </div>
    </>
  )
}
