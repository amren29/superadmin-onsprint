'use client'

import { useEffect, useState } from 'react'
import CustomSelect from '@/components/CustomSelect'

export default function SuperAdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('info')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState('')

  function load() {
    fetch('/api/superadmin/announcements')
      .then(r => r.json())
      .then(d => { setAnnouncements(d.announcements || []); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  async function send() {
    if (!title || !message) return
    setSending(true)
    setStatus('')
    const res = await fetch('/api/superadmin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message, type, target: 'all' }),
    })
    const data = await res.json()
    if (res.ok) {
      setStatus(`Sent to ${data.sentTo} shops`)
      setTitle(''); setMessage('')
      load()
    } else {
      setStatus(`Error: ${data.error}`)
    }
    setSending(false)
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Announcements</div>
          <div className="page-subtitle">Broadcast messages to all shops</div>
        </div>
      </div>

      <div className="page-scroll">
        <div className="card">
          <div className="card-header"><h3 className="card-title">New Announcement</h3></div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <label className="form-group" style={{ flex: 1 }}>
                <span className="form-label">Title</span>
                <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="form-input" />
              </label>
              <div className="form-group">
                <span className="form-label">Type</span>
                <CustomSelect
                  value={type}
                  onChange={v => setType(v)}
                  options={[
                    { value: 'info', label: 'Info' },
                    { value: 'success', label: 'Success' },
                    { value: 'warning', label: 'Warning' },
                    { value: 'danger', label: 'Urgent' },
                  ]}
                  style={{ width: 110 }}
                />
              </div>
            </div>
            <div className="form-group">
              <span className="form-label">Message</span>
              <textarea placeholder="Message to all shops..." value={message} onChange={e => setMessage(e.target.value)} className="form-input" rows={3} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn-primary" onClick={send} disabled={sending || !title || !message}>
                {sending ? 'Sending...' : 'Broadcast to All Shops'}
              </button>
              {status && <span style={{ fontSize: 12, color: status.startsWith('Error') ? 'var(--negative)' : 'var(--success-text)' }}>{status}</span>}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">History</h3></div>
          <table className="data-table">
            <thead><tr><th>Title</th><th>Type</th><th>Target</th><th>Sent</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Loading...</td></tr>
              ) : announcements.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No announcements yet</td></tr>
              ) : announcements.map(a => (
                <tr key={a.id}>
                  <td>
                    <div className="cell-name">{a.title}</div>
                    <div className="cell-sub">{a.message?.slice(0, 80)}{a.message?.length > 80 ? '...' : ''}</div>
                  </td>
                  <td><span className={`badge badge-${a.type === 'danger' ? 'warning' : a.type === 'success' ? 'success' : 'info'}`}>{a.type}</span></td>
                  <td style={{ textTransform: 'capitalize' }}>{a.target}</td>
                  <td><div className="cell-sub">{new Date(a.created_at).toLocaleString()}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
