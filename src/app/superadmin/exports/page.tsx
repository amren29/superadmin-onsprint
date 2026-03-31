'use client'

import { useState } from 'react'

const EXPORTS = [
  { type: 'shops', label: 'Shops', desc: 'All shops with plan, slug, dates' },
  { type: 'orders', label: 'Orders', desc: 'Last 1000 orders with customer, total, status' },
  { type: 'revenue', label: 'Revenue', desc: 'All order revenue by shop and date' },
]

export default function SuperAdminExports() {
  const [downloading, setDownloading] = useState<string | null>(null)

  async function download(type: string) {
    setDownloading(type)
    const res = await fetch(`/api/superadmin/export?type=${type}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setDownloading(null)
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Export & Reports</div>
          <div className="page-subtitle">Download platform data as CSV</div>
        </div>
      </div>

      <div className="page-scroll">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {EXPORTS.map(e => (
            <div className="card" key={e.type} style={{ padding: 20 }}>
              <div className="cell-name" style={{ marginBottom: 6 }}>{e.label}</div>
              <div className="cell-sub" style={{ marginBottom: 14 }}>{e.desc}</div>
              <button className="btn-primary" onClick={() => download(e.type)} disabled={downloading === e.type}>
                {downloading === e.type ? 'Downloading...' : 'Download CSV'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
