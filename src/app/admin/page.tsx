'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, ShoppingBag, Clock, Package } from 'lucide-react'

const C = { forest:'#1B2E1F', cream:'#F5F0E6', gold:'#D4A853', white:'#FFFFFF', ink:'#0F1A11', muted:'#6B7B6E', border:'#DDD8CF', bg:'#FAFAF8' }

interface Stats { totalOrders:number; pendingVerification:number; confirmedRevenue:number; totalProducts:number; recentOrders:any[] }

const STATUS_COLORS: Record<string,{ bg:string; color:string }> = {
  pending_verification: { bg:'rgba(212,168,83,0.12)', color:'#B8860B' },
  confirmed: { bg:'rgba(27,46,31,0.08)', color:'#1B2E1F' },
  processing: { bg:'rgba(59,130,246,0.1)', color:'#1d4ed8' },
  shipped: { bg:'rgba(139,92,246,0.1)', color:'#6d28d9' },
  delivered: { bg:'rgba(16,185,129,0.1)', color:'#065f46' },
  cancelled: { bg:'rgba(239,68,68,0.1)', color:'#991b1b' },
  pending: { bg:'rgba(212,168,83,0.08)', color:'#92400e' },
}

const PAY_COLORS: Record<string,{ bg:string; color:string }> = {
  cod: { bg:'rgba(27,46,31,0.08)', color:'#1B2E1F' },
  jazzcash: { bg:'rgba(237,28,36,0.1)', color:'#991b1b' },
  easypaisa: { bg:'rgba(76,175,80,0.1)', color:'#166534' },
  nayapay: { bg:'rgba(123,45,139,0.1)', color:'#581c87' },
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const STAT_CARDS = [
    { label:'Total Orders', value:stats?.totalOrders??'—', icon:ShoppingBag, color:C.forest },
    { label:'Pending Verification', value:stats?.pendingVerification??'—', icon:Clock, color:'#B8860B' },
    { label:'Revenue (PKR)', value:stats?.confirmedRevenue?`${(stats.confirmedRevenue/1000).toFixed(0)}K`:'—', icon:TrendingUp, color:'#166534' },
    { label:'Total Products', value:stats?.totalProducts??'—', icon:Package, color:'#6d28d9' },
  ]

  return (
    <div style={{ padding:'clamp(1.5rem,3vw,2.5rem)' }}>
      {/* Header */}
      <div style={{ marginBottom:'2rem', paddingBottom:'1.5rem', borderBottom:`1px solid ${C.border}` }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:300, color:C.ink, margin:'0 0 4px' }}>Dashboard</h1>
        <p style={{ fontFamily:'var(--font-sans)', fontSize:'13px', color:C.muted, margin:0 }}>
          {new Date().toLocaleDateString('en-PK', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'1rem', marginBottom:'2rem' }} className="md:grid-cols-4">
        {STAT_CARDS.map((card,i) => (
          <div key={i} style={{ background:C.white, border:`1px solid ${C.border}`, padding:'1.5rem', borderTop:`3px solid ${card.color}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase', color:C.muted, margin:0 }}>{card.label}</p>
              <card.icon size={18} strokeWidth={1.5} color={card.color} />
            </div>
            <p style={{ fontFamily:'var(--font-display)', fontSize:'2.2rem', fontWeight:300, color:C.ink, margin:0, lineHeight:1 }}>
              {loading?'—':card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div style={{ background:C.white, border:`1px solid ${C.border}` }}>
        <div style={{ padding:'1.25rem 1.5rem', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.25rem', fontWeight:300, color:C.ink, margin:0 }}>Recent Orders</h2>
          <a href="/admin/orders" style={{ fontFamily:'var(--font-sans)', fontSize:'12px', color:C.gold, textDecoration:'none', letterSpacing:'0.1em' }}>View All →</a>
        </div>

        {loading ? (
          <div style={{ padding:'3rem', textAlign:'center', color:C.muted, fontFamily:'var(--font-sans)', fontSize:'13px' }}>Loading...</div>
        ) : !stats?.recentOrders?.length ? (
          <div style={{ padding:'3rem', textAlign:'center', color:C.muted, fontFamily:'var(--font-sans)', fontSize:'13px' }}>No orders yet. Share your store link to start selling!</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:C.forest }}>
                  {['Order #','Customer','Total','Payment','Status','Date'].map(h => (
                    <th key={h} style={{ padding:'12px 16px', fontFamily:'var(--font-sans)', fontSize:'10px', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(245,240,230,0.7)', textAlign:'left', fontWeight:400, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order:any, i:number) => {
                  const sc = STATUS_COLORS[order.orderStatus] || { bg:'#f3f4f6', color:'#374151' }
                  const pc = PAY_COLORS[order.paymentMethod] || { bg:'#f3f4f6', color:'#374151' }
                  return (
                    <tr key={i} style={{ borderBottom:`1px solid ${C.border}` }}
                      onMouseEnter={e=>{ (e.currentTarget as HTMLTableRowElement).style.background='rgba(27,46,31,0.02)' }}
                      onMouseLeave={e=>{ (e.currentTarget as HTMLTableRowElement).style.background='transparent' }}>
                      <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:'12px', color:C.ink, whiteSpace:'nowrap' }}>#{order.orderNumber}</td>
                      <td style={{ padding:'14px 16px' }}>
                        <p style={{ fontFamily:'var(--font-sans)', fontSize:'13px', color:C.ink, margin:'0 0 2px' }}>{order.customer?.name}</p>
                        <p style={{ fontFamily:'var(--font-sans)', fontSize:'11px', color:C.muted, margin:0 }}>{order.customer?.email}</p>
                      </td>
                      <td style={{ padding:'14px 16px', fontFamily:'var(--font-sans)', fontSize:'13px', color:C.ink, whiteSpace:'nowrap' }}>PKR {order.total?.toLocaleString()}</td>
                      <td style={{ padding:'14px 16px' }}>
                        <span style={{ padding:'4px 10px', borderRadius:'4px', background:pc.bg, color:pc.color, fontFamily:'var(--font-sans)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{order.paymentMethod}</span>
                      </td>
                      <td style={{ padding:'14px 16px' }}>
                        <span style={{ padding:'4px 10px', borderRadius:'4px', background:sc.bg, color:sc.color, fontFamily:'var(--font-sans)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{order.orderStatus?.replace('_',' ')}</span>
                      </td>
                      <td style={{ padding:'14px 16px', fontFamily:'var(--font-sans)', fontSize:'12px', color:C.muted, whiteSpace:'nowrap' }}>{new Date(order.createdAt).toLocaleDateString('en-PK')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
