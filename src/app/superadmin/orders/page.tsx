'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import CustomSelect from '@/components/CustomSelect'
import RowMenu from '@/components/RowMenu'
import ViewModal, { ViewRow, SectionLabel } from '@/components/ViewModal'

interface OrderRow {
  id: string
  seq_id: string
  shop_id: string
  status: string
  grand_total: number
  customer_name: string
  created_at: string
  shops: { name: string } | null
}

const fmtRM = (n: number) => `RM ${(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`

const STATUS_BADGE: Record<string, string> = {
  Pending: 'badge badge-warning',
  Confirmed: 'badge badge-info',
  Completed: 'badge badge-success',
  Cancelled: 'badge badge-pending',
}

export default function SuperAdminOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewTarget, setViewTarget] = useState<OrderRow | null>(null)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    params.set('page', String(page))

    fetch(`/api/superadmin/orders?${params}`)
      .then(r => r.json())
      .then(data => {
        setOrders(data.orders || [])
        setTotal(data.total || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [search, statusFilter, page])

  const totalPages = Math.ceil(total / 20)

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Orders</div>
          <div className="page-subtitle">{total} orders across all shops</div>
        </div>
      </div>

      <div className="page-scroll">
        <div className="filter-row">
          <div />
          <div className="filter-right">
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '6px 12px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search order # or customer..."
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12.5, color: 'var(--text-primary)', width: 200 }} />
            </div>
            <CustomSelect
              value={statusFilter}
              onChange={v => { setStatusFilter(v); setPage(1) }}
              options={[
                { value: '', label: 'All Status' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Confirmed', label: 'Confirmed' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Cancelled', label: 'Cancelled' },
              ]}
              style={{ width: 140 }}
            />
          </div>
        </div>
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Shop</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Loading...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No orders found</td></tr>
              ) : orders.map(order => (
                <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => setViewTarget(order)}>
                  <td><div className="cell-name">{order.seq_id || order.id.slice(0, 8)}</div></td>
                  <td>
                    <Link href={`/superadmin/shops/${order.shop_id}`} style={{ color: 'var(--accent)' }}>
                      {(order.shops as any)?.name || order.shop_id.slice(0, 8)}
                    </Link>
                  </td>
                  <td><div className="cell-sub">{order.customer_name || '—'}</div></td>
                  <td>
                    <span className={STATUS_BADGE[order.status] || 'badge badge-pending'}>
                      {order.status}
                    </span>
                  </td>
                  <td><div className="cell-name">{fmtRM(order.grand_total)}</div></td>
                  <td><div className="cell-sub">{new Date(order.created_at).toLocaleDateString()}</div></td>
                  <td onClick={e => e.stopPropagation()}>
                    <RowMenu items={[
                      { label: 'View', action: () => setViewTarget(order) },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '12px 0' }}>
            <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span style={{ alignSelf: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Page {page} of {totalPages}</span>
            <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </div>

      {viewTarget && (
        <ViewModal
          title={`Order ${viewTarget.seq_id || viewTarget.id.slice(0, 8)}`}
          status={viewTarget.status}
          onClose={() => setViewTarget(null)}
        >
          <SectionLabel>Order Details</SectionLabel>
          <ViewRow label="Order #" value={viewTarget.seq_id || viewTarget.id.slice(0, 8)} />
          <ViewRow label="Shop" value={(viewTarget.shops as any)?.name || viewTarget.shop_id.slice(0, 8)} />
          <ViewRow label="Customer" value={viewTarget.customer_name || '—'} />
          <ViewRow label="Status" value={viewTarget.status} />
          <ViewRow label="Total" value={fmtRM(viewTarget.grand_total)} accent />
          <ViewRow label="Date" value={new Date(viewTarget.created_at).toLocaleString()} />
        </ViewModal>
      )}
    </>
  )
}
