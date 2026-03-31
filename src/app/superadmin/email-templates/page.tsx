'use client'

import { useEffect, useState } from 'react'
import RowMenu from '@/components/RowMenu'
import ConfirmModal from '@/components/ConfirmModal'

export default function SuperAdminEmailTemplates() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any>(null)
  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [delTarget, setDelTarget] = useState<any>(null)

  function load() {
    fetch('/api/superadmin/email-templates')
      .then(r => r.json()).then(d => { setTemplates(d.templates || []); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  function startEdit(t: any) {
    setEditing(t)
    setSlug(t.slug); setName(t.name); setSubject(t.subject); setBody(t.body)
  }
  function startNew() {
    setEditing({ id: null })
    setSlug(''); setName(''); setSubject(''); setBody('')
  }

  async function save() {
    setSaving(true)
    if (editing?.id) {
      await fetch('/api/superadmin/email-templates', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, name, subject, body }),
      })
    } else {
      await fetch('/api/superadmin/email-templates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, name, subject, body }),
      })
    }
    setEditing(null); setSaving(false); load()
  }

  async function handleDelete() {
    if (!delTarget) return
    await fetch('/api/superadmin/email-templates', {
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
          <div className="page-title">Email Templates</div>
          <div className="page-subtitle">Customize platform email content</div>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={startNew}>+ New Template</button>
        </div>
      </div>

      <div className="page-scroll">
        {editing && (
          <div className="card">
            <div className="card-header"><h3 className="card-title">{editing.id ? 'Edit Template' : 'New Template'}</h3></div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label className="form-group">
                  <span className="form-label">Slug</span>
                  <input value={slug} onChange={e => setSlug(e.target.value)} className="form-input" placeholder="welcome-email" disabled={!!editing.id} />
                </label>
                <label className="form-group">
                  <span className="form-label">Name</span>
                  <input value={name} onChange={e => setName(e.target.value)} className="form-input" placeholder="Welcome Email" />
                </label>
              </div>
              <label className="form-group">
                <span className="form-label">Subject</span>
                <input value={subject} onChange={e => setSubject(e.target.value)} className="form-input" placeholder="Welcome to {{shop_name}}" />
              </label>
              <div className="form-group">
                <span className="form-label">Body (HTML)</span>
                <textarea value={body} onChange={e => setBody(e.target.value)} className="form-input" rows={8} style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
                  placeholder="<h1>Welcome!</h1><p>Hi {{name}}, ..." />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-primary" onClick={save} disabled={saving || !slug || !name || !subject || !body}>
                  {saving ? '...' : 'Save'}
                </button>
                <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header"><h3 className="card-title">Templates ({templates.length})</h3></div>
          <table className="data-table">
            <thead><tr><th>Slug</th><th>Name</th><th>Subject</th><th>Updated</th><th></th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Loading...</td></tr>
              ) : templates.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No templates yet</td></tr>
              ) : templates.map(t => (
                <tr key={t.id}>
                  <td><div className="cell-name" style={{ fontFamily: 'monospace' }}>{t.slug}</div></td>
                  <td><div className="cell-sub">{t.name}</div></td>
                  <td><div className="cell-sub">{t.subject}</div></td>
                  <td><div className="cell-sub">{new Date(t.updated_at).toLocaleDateString()}</div></td>
                  <td onClick={e => e.stopPropagation()}>
                    <RowMenu items={[
                      { label: 'Edit', action: () => startEdit(t) },
                      { label: 'Delete', action: () => setDelTarget(t), danger: true },
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
          message="This template will be permanently deleted."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </>
  )
}
