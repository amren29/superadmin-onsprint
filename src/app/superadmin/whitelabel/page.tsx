'use client'

import { useEffect, useState } from 'react'

export default function SuperAdminWhitelabel() {
  const [shops, setShops] = useState<any[]>([])
  const [allShops, setAllShops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editShopId, setEditShopId] = useState('')
  const [domain, setDomain] = useState('')
  const [brandName, setBrandName] = useState('')
  const [saving, setSaving] = useState(false)

  function load() {
    fetch('/api/superadmin/whitelabel')
      .then(r => r.json()).then(d => { setShops(d.shops || []); setLoading(false) })
    fetch('/api/superadmin/shops?page=1')
      .then(r => r.json()).then(d => setAllShops(d.shops || []))
  }
  useEffect(() => { load() }, [])

  async function save() {
    if (!editShopId) return
    setSaving(true)
    await fetch('/api/superadmin/whitelabel', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shop_id: editShopId, whitelabel_domain: domain || null, whitelabel_brand_name: brandName || null }),
    })
    setEditShopId(''); setDomain(''); setBrandName(''); setSaving(false); load()
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Whitelabel</div>
          <div className="page-subtitle">Custom domains and branding per shop</div>
        </div>
      </div>

      <div className="page-scroll">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Configure Shop</h3></div>
          <div style={{ padding: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <label className="form-group" style={{ width: 200 }}>
              <span className="form-label">Shop</span>
              <select value={editShopId} onChange={e => setEditShopId(e.target.value)} className="form-input">
                <option value="">Select shop...</option>
                {allShops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="form-group" style={{ width: 200 }}>
              <span className="form-label">Custom Domain</span>
              <input value={domain} onChange={e => setDomain(e.target.value)} className="form-input" placeholder="shop.example.com" />
            </label>
            <label className="form-group" style={{ width: 160 }}>
              <span className="form-label">Brand Name</span>
              <input value={brandName} onChange={e => setBrandName(e.target.value)} className="form-input" placeholder="Custom Brand" />
            </label>
            <button className="btn-primary" onClick={save} disabled={saving || !editShopId}>{saving ? '...' : 'Save'}</button>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Whitelabel Shops ({shops.length})</h3></div>
          <table className="data-table">
            <thead><tr><th>Shop</th><th>Domain</th><th>Brand</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Loading...</td></tr>
              ) : shops.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No whitelabel shops configured</td></tr>
              ) : shops.map(s => (
                <tr key={s.id}>
                  <td><div className="cell-name">{s.name}</div><div className="cell-sub">{s.slug}</div></td>
                  <td><div className="cell-name">{s.whitelabel_domain || '—'}</div></td>
                  <td><div className="cell-sub">{s.whitelabel_brand_name || '—'}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
