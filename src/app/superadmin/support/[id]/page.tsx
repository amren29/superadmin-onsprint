'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import CustomSelect from '@/components/CustomSelect'

export default function SuperAdminTicketDetail() {
  const params = useParams()
  const router = useRouter()
  const [ticket, setTicket] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const id = params.id as string

  function load() {
    fetch(`/api/superadmin/support/${id}`)
      .then(r => r.json()).then(d => {
        setTicket(d.ticket); setMessages(d.messages || []); setLoading(false)
      })
  }
  useEffect(() => { load() }, [id])

  async function sendReply() {
    if (!reply) return
    setSending(true)
    await fetch(`/api/superadmin/support/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: reply }),
    })
    setReply(''); setSending(false); load()
  }

  async function updateStatus(status: string) {
    await fetch('/api/superadmin/support', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    load()
  }

  if (loading) return <div className="page-scroll"><div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>Loading...</div></div>
  if (!ticket) return <div className="page-scroll"><div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>Ticket not found</div></div>

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn-ghost" onClick={() => router.push('/superadmin/support')} style={{ fontSize: 12 }}>&larr; Back</button>
          <div>
            <div className="page-title">{ticket.subject}</div>
            <div className="page-subtitle">{(ticket.shops as any)?.name || 'Unknown shop'} · {ticket.status}</div>
          </div>
        </div>
        <div className="page-actions">
          <CustomSelect
            value={ticket.status}
            onChange={v => updateStatus(v)}
            options={[
              { value: 'open', label: 'Open' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'closed', label: 'Closed' },
            ]}
            style={{ width: 140 }}
          />
        </div>
      </div>

      <div className="page-scroll">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Conversation</h3></div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No messages yet</div>}
            {messages.map(m => (
              <div key={m.id} style={{
                padding: '10px 14px', borderRadius: 10, fontSize: 13,
                background: m.sender_type === 'admin' ? 'var(--info-bg)' : 'var(--bg-elevated)',
                alignSelf: m.sender_type === 'admin' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
              }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                  {m.sender_type === 'admin' ? 'You' : m.sender_email} · {new Date(m.created_at).toLocaleString()}
                </div>
                <div>{m.message}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input value={reply} onChange={e => setReply(e.target.value)} className="form-input" placeholder="Type a reply..."
              onKeyDown={e => e.key === 'Enter' && sendReply()} style={{ flex: 1 }} />
            <button className="btn-primary" onClick={sendReply} disabled={sending || !reply}>
              {sending ? '...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
