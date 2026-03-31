import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, getServiceClient } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const db = getServiceClient()

  const [ticketRes, messagesRes] = await Promise.all([
    db.from('support_tickets').select('*, shops(name)').eq('id', id).maybeSingle(),
    db.from('support_messages').select('*').eq('ticket_id', id).order('created_at', { ascending: true }),
  ])

  if (!ticketRes.data) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  // Get emails for messages
  const messages = []
  for (const m of (messagesRes.data || [])) {
    let email = ''
    if (m.sender_id) {
      const { data: { user } } = await db.auth.admin.getUserById(m.sender_id)
      email = user?.email || ''
    }
    messages.push({ ...m, sender_email: email })
  }

  return NextResponse.json({ ticket: ticketRes.data, messages })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const { message } = await request.json()
  if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  const db = getServiceClient()
  await db.from('support_messages').insert({
    ticket_id: id,
    sender_type: 'admin',
    sender_id: admin.user.id,
    message,
  })
  await db.from('support_tickets').update({ updated_at: new Date().toISOString() }).eq('id', id)

  return NextResponse.json({ success: true })
}
