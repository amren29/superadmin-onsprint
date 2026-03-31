'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomSelect from '@/components/CustomSelect'
import RowMenu from '@/components/RowMenu'
import ConfirmModal from '@/components/ConfirmModal'

interface Shop {
  id: string
  name: string
  slug: string
  plan: string
  created_at: string
  suspended: boolean
}

export default function SuperAdminShops() {
  const router = useRouter()
  const [shops, setShops] = useState<Shop[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPlan, setNewPlan] = useState('free')
  const [creating, setCreating] = useState(false)
  const [delTarget, setDelTarget] = useState<Shop | null>(null)

  // Bulk selection state
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showBulkSuspend, setShowBulkSuspend] = useState(false)
  const [showBulkNotify, setShowBulkNotify] = useState(false)
  const [notifyTitle, setNotifyTitle] = useState('')
  const [notifyMessage, setNotifyMessage] = useState('')
  const [bulkActing, setBulkActing] = useState(false)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (planFilter) params.set('plan', planFilter)
    params.set('page', String(page))

    fetch(`/api/superadmin/shops?${params}`)
      .then(r => r.json())
      .then(data => {
        setShops(data.shops || [])
        setTotal(data.total || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [search, planFilter, page])

  // Clear selection when shops change
  useEffect(() => {
    setSelected(new Set())
  }, [shops])

  const totalPages = Math.ceil(total / 20)

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === shops.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(shops.map(s => s.id)))
    }
  }

  async function handleBulkSuspend() {
    setBulkActing(true)
    const ids = Array.from(selected)
    for (const id of ids) {
      await fetch('/api/superadmin/shops', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, suspended: true }),
      })
    }
    setBulkActing(false)
    setShowBulkSuspend(false)
    setSelected(new Set())
    setPage(1)
    // Trigger refetch
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (planFilter) params.set('plan', planFilter)
    params.set('page', '1')
    fetch(`/api/superadmin/shops?${params}`)
      .then(r => r.json())
      .then(data => { setShops(data.shops || []); setTotal(data.total || 0); setLoading(false) })
      .catch(() => setLoading(false))
  }

  async function handleBulkNotify() {
    if (!notifyTitle || !notifyMessage) return
    setBulkActing(true)
    await fetch('/api/superadmin/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shop_ids: Array.from(selected), title: notifyTitle, message: notifyMessage }),
    })
    setBulkActing(false)
    setShowBulkNotify(false)
    setNotifyTitle('')
    setNotifyMessage('')
    setSelected(new Set())
  }

  async function handleDelete() {
    if (!delTarget) return
    await fetch(`/api/superadmin/shops/${delTarget.id}`, {
      method: 'DELETE',
    })
    setDelTarget(null)
    setPage(1)
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Shops</div>
          <div className="page-subtitle">{total} shops across the platform</div>
        </div>
        <div className="page-actions">
          <button className="topbar-btn" onClick={() => setShowCreate(!showCreate)}>+ Create Shop</button>
        </div>
      </div>

      {showCreate && (
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header"><h3 className="card-title">Create New Shop</h3></div>
          <div style={{ padding: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <label className="form-group" style={{ width: 180 }}>
              <span className="form-label">Shop Name *</span>
              <input value={newName} onChange={e => setNewName(e.target.value)} className="form-input" placeholder="My Print Shop" />
            </label>
            <label className="form-group" style={{ width: 200 }}>
              <span className="form-label">Owner Email</span>
              <input value={newEmail} onChange={e => setNewEmail(e.target.value)} className="form-input" placeholder="owner@email.com" />
            </label>
            <div className="form-group" style={{ width: 130 }}>
              <span className="form-label">Plan</span>
              <CustomSelect
                value={newPlan}
                onChange={v => setNewPlan(v)}
                options={[
                  { value: 'free', label: 'Free' },
                  { value: 'trial', label: 'Trial' },
                  { value: 'starter', label: 'Starter' },
                  { value: 'pro', label: 'Pro' },
                  { value: 'business', label: 'Business' },
                ]}
              />
            </div>
            <button className="btn-primary" disabled={creating || !newName} onClick={async () => {
              setCreating(true)
              const res = await fetch('/api/superadmin/shops/create', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, owner_email: newEmail || undefined, plan: newPlan }),
              })
              if (res.ok) { setNewName(''); setNewEmail(''); setShowCreate(false); setPage(1) }
              else { const d = await res.json(); alert(d.error) }
              setCreating(false)
            }}>{creating ? '...' : 'Create'}</button>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
          background: 'var(--bg-card)', border: '1px solid var(--accent)',
          borderRadius: 'var(--r-md)', marginBottom: 0,
        }}>
          <span style={{ fontSize: 12.5, color: 'var(--text-primary)', fontWeight: 500 }}>
            {selected.size} shop{selected.size > 1 ? 's' : ''} selected
          </span>
          <div style={{ flex: 1 }} />
          <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => setShowBulkNotify(true)}>
            Send Notification
          </button>
          <button className="btn-primary" style={{ fontSize: 12, background: 'var(--warning, #f59e0b)' }} onClick={() => setShowBulkSuspend(true)}>
            Suspend Selected
          </button>
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      )}

      {/* Bulk Notify Modal */}
      {showBulkNotify && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="card" style={{ width: 420, margin: 0 }}>
            <div className="card-header"><h3 className="card-title">Send Notification to {selected.size} Shop{selected.size > 1 ? 's' : ''}</h3></div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label className="form-group">
                <span className="form-label">Title *</span>
                <input value={notifyTitle} onChange={e => setNotifyTitle(e.target.value)} className="form-input" placeholder="Notification title" />
              </label>
              <label className="form-group">
                <span className="form-label">Message *</span>
                <textarea value={notifyMessage} onChange={e => setNotifyMessage(e.target.value)} className="form-input"
                  placeholder="Enter your message..." rows={3} style={{ resize: 'vertical' }} />
              </label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={() => { setShowBulkNotify(false); setNotifyTitle(''); setNotifyMessage('') }}>Cancel</button>
                <button className="btn-primary" disabled={bulkActing || !notifyTitle || !notifyMessage} onClick={handleBulkNotify}>
                  {bulkActing ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="page-scroll">
        <div className="filter-row">
          <div />
          <div className="filter-right">
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '6px 12px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search shops..."
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12.5, color: 'var(--text-primary)', width: 180 }} />
            </div>
            <CustomSelect
              value={planFilter}
              onChange={v => { setPlanFilter(v); setPage(1) }}
              options={[
                { value: '', label: 'All Plans' },
                { value: 'free', label: 'Free' },
                { value: 'trial', label: 'Trial' },
                { value: 'starter', label: 'Starter' },
                { value: 'pro', label: 'Pro' },
                { value: 'business', label: 'Business' },
              ]}
              style={{ width: 130 }}
            />
          </div>
        </div>
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    checked={shops.length > 0 && selected.size === shops.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
                  />
                </th>
                <th>Name</th>
                <th>Slug</th>
                <th>Plan</th>
                <th>Created</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Loading...</td></tr>
              ) : shops.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No shops found</td></tr>
              ) : shops.map(shop => (
                <tr
                  key={shop.id}
                  style={{ cursor: 'pointer', background: selected.has(shop.id) ? 'var(--bg-hover)' : undefined }}
                  onClick={() => router.push(`/superadmin/shops/${shop.id}`)}
                >
                  <td onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(shop.id)}
                      onChange={() => toggleSelect(shop.id)}
                      style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
                    />
                  </td>
                  <td><div className="cell-name">{shop.name}</div></td>
                  <td><div className="cell-sub">{shop.slug}</div></td>
                  <td>
                    <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                      {shop.plan || 'free'}
                    </span>
                  </td>
                  <td><div className="cell-sub">{new Date(shop.created_at).toLocaleDateString()}</div></td>
                  <td>
                    {shop.suspended ? (
                      <span className="badge badge-warning">Suspended</span>
                    ) : (
                      <span className="badge badge-success">Active</span>
                    )}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <RowMenu items={[
                      { label: 'View', action: () => router.push(`/superadmin/shops/${shop.id}`) },
                      { label: 'Delete', action: () => setDelTarget(shop), danger: true },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '12px 0' }}>
            <button
              className="btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <span style={{ alignSelf: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              Page {page} of {totalPages}
            </span>
            <button
              className="btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {delTarget && (
        <ConfirmModal
          title={`Delete "${delTarget.name}"?`}
          message="This will soft-delete the shop. This action cannot be easily undone."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}

      {showBulkSuspend && (
        <ConfirmModal
          title={`Suspend ${selected.size} shop${selected.size > 1 ? 's' : ''}?`}
          message="This will suspend all selected shops. Their users will not be able to access the admin panel."
          confirmLabel={bulkActing ? 'Suspending...' : 'Suspend All'}
          onConfirm={handleBulkSuspend}
          onCancel={() => setShowBulkSuspend(false)}
        />
      )}
    </>
  )
}
