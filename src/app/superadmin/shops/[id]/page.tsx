'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import CustomSelect from '@/components/CustomSelect'

const fmtRM = (n: number) => `RM ${(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`

interface ShopDetail {
  shop: any
  members: Array<{ user_id: string; email: string; name: string; role: string; created_at: string }>
  orderCount: number
  productCount: number
  customerCount: number
  storeUserCount: number
  totalRevenue: number
  storeSettings: { store_name?: string; logo_url?: string; domain?: string } | null
  recentOrders: Array<{ id: string; seq_id: string; customer_name: string; grand_total: number; status: string; created_at: string }>
}

export default function SuperAdminShopDetail() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<ShopDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [showNotifyForm, setShowNotifyForm] = useState(false)
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifType, setNotifType] = useState('info')
  const [notifStatus, setNotifStatus] = useState('')
  const [showTransfer, setShowTransfer] = useState(false)
  const [transferEmail, setTransferEmail] = useState('')
  const [deleteSlug, setDeleteSlug] = useState('')
  const [showDelete, setShowDelete] = useState(false)

  const id = params.id as string

  function loadShop() {
    setLoading(true)
    fetch(`/api/superadmin/shops/${id}`)
      .then(r => r.json())
      .then(d => {
        setData(d)
        setSelectedPlan(d.shop?.plan || 'free')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadShop() }, [id])

  async function toggleSuspend() {
    if (!data?.shop) return
    setSaving(true)
    await fetch('/api/superadmin/shops', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, suspended: !data.shop.suspended }),
    })
    loadShop()
    setSaving(false)
  }

  async function changePlan() {
    if (!data?.shop || selectedPlan === (data.shop.plan || 'free')) return
    setSaving(true)
    await fetch('/api/superadmin/shops', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, plan: selectedPlan }),
    })
    loadShop()
    setSaving(false)
  }

  async function sendNotification() {
    if (!notifTitle || !notifMessage) return
    setNotifStatus('Sending...')
    const res = await fetch('/api/superadmin/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shop_ids: [id], title: notifTitle, message: notifMessage, type: notifType }),
    })
    if (res.ok) {
      setNotifStatus('Sent!')
      setNotifTitle('')
      setNotifMessage('')
      setTimeout(() => { setShowNotifyForm(false); setNotifStatus('') }, 1500)
    } else {
      setNotifStatus('Failed to send')
    }
  }

  async function transferOwnership() {
    if (!transferEmail) return
    setSaving(true)
    const res = await fetch(`/api/superadmin/shops/${id}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_owner_email: transferEmail }),
    })
    if (res.ok) {
      setShowTransfer(false); setTransferEmail(''); loadShop()
    } else {
      const d = await res.json(); alert(d.error)
    }
    setSaving(false)
  }

  async function deleteShop() {
    if (!deleteSlug || deleteSlug !== data?.shop?.slug) { alert('Slug does not match'); return }
    setSaving(true)
    const res = await fetch(`/api/superadmin/shops/${id}/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm_slug: deleteSlug }),
    })
    if (res.ok) {
      router.push('/superadmin/shops')
    } else {
      const d = await res.json(); alert(d.error)
    }
    setSaving(false)
  }

  async function impersonate() {
    if (!confirm(`Login as "${data?.shop?.name}" owner? You'll be redirected to their dashboard.`)) return
    const res = await fetch('/api/superadmin/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shop_id: id }),
    })
    if (res.ok) {
      window.location.href = '/dashboard'
    }
  }

  if (loading) {
    return (
      <div className="page-scroll">
        <div style={{ color: 'var(--text-muted)', padding: '40px 0', textAlign: 'center' }}>Loading...</div>
      </div>
    )
  }

  if (!data?.shop) {
    return (
      <div className="page-scroll">
        <div style={{ color: 'var(--text-muted)', padding: '40px 0', textAlign: 'center' }}>Shop not found</div>
      </div>
    )
  }

  const shop = data.shop

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn-ghost" onClick={() => router.push('/superadmin/shops')} style={{ fontSize: 12 }}>
            &larr; Back
          </button>
          <div>
            <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {shop.name}
              {shop.suspended && <span className="badge badge-warning">SUSPENDED</span>}
            </div>
            <div className="page-subtitle">{shop.slug} · {data.members.length} members · {data.orderCount} orders</div>
          </div>
        </div>
        <div className="page-actions">
          <button className="topbar-btn" onClick={() => setShowNotifyForm(!showNotifyForm)}>
            Notify
          </button>
          <button className="topbar-btn" onClick={impersonate}>
            Impersonate
          </button>
          <button
            className={shop.suspended ? 'btn-primary' : 'topbar-btn'}
            onClick={toggleSuspend}
            disabled={saving}
            style={!shop.suspended ? { color: 'var(--negative)', borderColor: 'var(--negative)' } : {}}
          >
            {saving ? 'Saving...' : shop.suspended ? 'Unsuspend' : 'Suspend'}
          </button>
        </div>
      </div>

      <div className="finance-stats">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-label">Plan</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CustomSelect
              value={selectedPlan}
              onChange={v => setSelectedPlan(v)}
              options={[
                { value: 'free', label: 'Free' },
                { value: 'trial', label: 'Trial' },
                { value: 'starter', label: 'Starter' },
                { value: 'pro', label: 'Pro' },
                { value: 'business', label: 'Business' },
              ]}
            />
            {selectedPlan !== (shop.plan || 'free') && (
              <button className="btn-primary" onClick={changePlan} disabled={saving} style={{ fontSize: 12, padding: '5px 12px' }}>
                {saving ? '...' : 'Save'}
              </button>
            )}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-label">Revenue</div>
            <span className="stat-card-period">All time</span>
          </div>
          <div className="stat-value">{fmtRM(data.totalRevenue)}</div>
          <div className="stat-vs">{data.orderCount} orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-label">Products</div>
          </div>
          <div className="stat-value">{data.productCount}</div>
          <div className="stat-vs">in catalog</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-label">Customers</div>
          </div>
          <div className="stat-value">{data.customerCount}</div>
          <div className="stat-vs">{data.storeUserCount} store users</div>
        </div>
      </div>

      <div className="page-scroll">
        {/* Notify Form */}
        {showNotifyForm && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Send Notification to {shop.name}</h3>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <label className="form-group" style={{ flex: 1 }}>
                  <span className="form-label">Title</span>
                  <input
                    type="text"
                    placeholder="Title"
                    value={notifTitle}
                    onChange={e => setNotifTitle(e.target.value)}
                    className="form-input"
                  />
                </label>
                <div className="form-group">
                  <span className="form-label">Type</span>
                  <CustomSelect
                    value={notifType}
                    onChange={v => setNotifType(v)}
                    options={[
                      { value: 'info', label: 'Info' },
                      { value: 'success', label: 'Success' },
                      { value: 'warning', label: 'Warning' },
                      { value: 'danger', label: 'Danger' },
                    ]}
                    style={{ width: 100 }}
                  />
                </div>
              </div>
              <div className="form-group">
                <span className="form-label">Message</span>
                <textarea
                  placeholder="Message..."
                  value={notifMessage}
                  onChange={e => setNotifMessage(e.target.value)}
                  className="form-input"
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="btn-primary" onClick={sendNotification} disabled={!notifTitle || !notifMessage}>
                  Send
                </button>
                <button className="btn-secondary" onClick={() => setShowNotifyForm(false)}>Cancel</button>
                {notifStatus && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{notifStatus}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Shop Details + Store Info side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Shop Details</h3>
            </div>
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px 16px', fontSize: 13 }}>
              <span className="form-label">ID</span>
              <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{shop.id}</span>
              <span className="form-label">Slug</span>
              <span>{shop.slug}</span>
              <span className="form-label">Created</span>
              <span>{new Date(shop.created_at).toLocaleString()}</span>
              {shop.plan_expires_at && (
                <>
                  <span className="form-label">Plan Expires</span>
                  <span>{new Date(shop.plan_expires_at).toLocaleString()}</span>
                </>
              )}
              <span className="form-label">Store URL</span>
              <span style={{ color: 'var(--accent)' }}>/s/{shop.slug}</span>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Store Settings</h3>
            </div>
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px 16px', fontSize: 13 }}>
              <span className="form-label">Store Name</span>
              <span>{data.storeSettings?.store_name || '—'}</span>
              <span className="form-label">Domain</span>
              <span>{data.storeSettings?.domain || '—'}</span>
              <span className="form-label">Logo</span>
              <span>{data.storeSettings?.logo_url ? 'Uploaded' : 'None'}</span>
              <span className="form-label">Members</span>
              <span>{data.members.length} team members</span>
              <span className="form-label">Store Users</span>
              <span>{data.storeUserCount} registered</span>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        {data.recentOrders.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Orders ({data.orderCount} total)</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map(o => (
                  <tr key={o.id}>
                    <td><div className="cell-name">{o.seq_id || o.id.slice(0, 8)}</div></td>
                    <td><div className="cell-sub">{o.customer_name || '—'}</div></td>
                    <td><div className="cell-name">{fmtRM(o.grand_total)}</div></td>
                    <td><span className={`badge badge-${o.status === 'Completed' ? 'success' : o.status === 'Pending' ? 'warning' : 'info'}`}>{o.status}</span></td>
                    <td><div className="cell-sub">{new Date(o.created_at).toLocaleDateString()}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Members */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Members</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.members.map(m => (
                <tr key={m.user_id}>
                  <td><div className="cell-name">{m.email}</div></td>
                  <td><div className="cell-sub">{m.name || '—'}</div></td>
                  <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{m.role}</span></td>
                  <td><div className="cell-sub">{new Date(m.created_at).toLocaleDateString()}</div></td>
                </tr>
              ))}
              {data.members.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No members</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Transfer Ownership */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Transfer Ownership</h3>
            {!showTransfer && (
              <button className="topbar-btn" style={{ fontSize: 12 }} onClick={() => setShowTransfer(true)}>Transfer</button>
            )}
          </div>
          {showTransfer && (
            <div style={{ padding: 16, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <label className="form-group" style={{ flex: 1 }}>
                <span className="form-label">New Owner Email</span>
                <input value={transferEmail} onChange={e => setTransferEmail(e.target.value)} className="form-input" placeholder="newowner@email.com" />
              </label>
              <button className="btn-primary" onClick={transferOwnership} disabled={saving || !transferEmail}>
                {saving ? '...' : 'Transfer'}
              </button>
              <button className="btn-secondary" onClick={() => setShowTransfer(false)}>Cancel</button>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="card" style={{ borderColor: 'var(--negative)' }}>
          <div className="card-header">
            <h3 className="card-title" style={{ color: 'var(--negative)' }}>Danger Zone</h3>
            {!showDelete && (
              <button className="btn-ghost" style={{ fontSize: 12, color: 'var(--negative)' }} onClick={() => setShowDelete(true)}>Delete Shop</button>
            )}
          </div>
          {showDelete && (
            <div style={{ padding: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                Type <strong>{shop.slug}</strong> to confirm deletion. This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={deleteSlug} onChange={e => setDeleteSlug(e.target.value)} className="form-input" style={{ width: 200 }} placeholder={shop.slug} />
                <button
                  className="btn-primary"
                  style={{ background: 'var(--negative)' }}
                  onClick={deleteShop}
                  disabled={saving || deleteSlug !== shop.slug}
                >
                  {saving ? '...' : 'Delete Forever'}
                </button>
                <button className="btn-secondary" onClick={() => { setShowDelete(false); setDeleteSlug('') }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
