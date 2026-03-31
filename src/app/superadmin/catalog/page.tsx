'use client'

import { useEffect, useState } from 'react'

export default function SuperAdminCatalog() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newCat, setNewCat] = useState('')
  const [adding, setAdding] = useState(false)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameTo, setRenameTo] = useState('')

  function load() {
    fetch('/api/superadmin/catalog/categories')
      .then(r => r.json())
      .then(d => { setCategories(d.categories || []); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  async function addCategory() {
    if (!newCat) return
    setAdding(true)
    const res = await fetch('/api/superadmin/catalog/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCat }),
    })
    if (res.ok) { setNewCat(''); load() }
    setAdding(false)
  }

  async function renameCategory(oldName: string) {
    if (!renameTo || renameTo === oldName) { setRenaming(null); return }
    await fetch('/api/superadmin/catalog/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ old_name: oldName, new_name: renameTo }),
    })
    setRenaming(null)
    load()
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Catalog</div>
          <div className="page-subtitle">Manage product categories across all shops</div>
        </div>
      </div>

      <div className="page-scroll">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Categories ({categories.length})</h3>
          </div>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Shops Using</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Loading...</td></tr>
              ) : categories.map(c => (
                <tr key={c.name}>
                  <td>
                    {renaming === c.name ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input value={renameTo} onChange={e => setRenameTo(e.target.value)} className="form-input" style={{ width: 160 }}
                          onKeyDown={e => e.key === 'Enter' && renameCategory(c.name)} autoFocus />
                        <button className="btn-primary" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => renameCategory(c.name)}>Save</button>
                        <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => setRenaming(null)}>Cancel</button>
                      </div>
                    ) : (
                      <div className="cell-name">{c.name}</div>
                    )}
                  </td>
                  <td>{c.shopCount}</td>
                  <td>
                    <button className="btn-ghost" style={{ fontSize: 11, color: 'var(--accent)' }}
                      onClick={() => { setRenaming(c.name); setRenameTo(c.name) }}>
                      Rename
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && categories.length === 0 && (
                <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No categories</td></tr>
              )}
            </tbody>
          </table>
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input placeholder="New category name" value={newCat} onChange={e => setNewCat(e.target.value)} className="form-input" style={{ width: 200 }}
              onKeyDown={e => e.key === 'Enter' && addCategory()} />
            <button className="btn-primary" onClick={addCategory} disabled={adding || !newCat}>
              {adding ? '...' : 'Add to All Shops'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
