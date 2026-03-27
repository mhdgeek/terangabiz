'use client'
import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { fmtCFA, fmt, ALL_SECTORS } from '@/lib/constants'

type Period = 'day' | 'month' | 'year' | 'all'

interface Sale {
  id: string; category: string; sector: string; sale_price: number
  buy_price: number; delivery_fee: number; profit: number; created_at: string; sale_date: string
}

export default function ReportsPage() {
  const { profile } = useAuth()
  const [sales, setSales] = useState<Sale[]>([])
  const [subs, setSubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('month')

  const fetchAll = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    const [s, sb] = await Promise.all([
      supabase.from('sales').select('*').eq('user_id', profile.id),
      supabase.from('subscriptions').select('*').eq('user_id', profile.id),
    ])
    setSales(s.data || [])
    setSubs(sb.data || [])
    setLoading(false)
  }, [profile])

  useEffect(() => { fetchAll() }, [fetchAll])

  const filterByPeriod = (items: Sale[]) => {
    const now = new Date()
    return items.filter(s => {
      const d = new Date(s.created_at)
      if (period === 'day') return d.toDateString() === now.toDateString()
      if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      if (period === 'year') return d.getFullYear() === now.getFullYear()
      return true
    })
  }

  const filtered = filterByPeriod(sales)
  const revenue = filtered.reduce((a, s) => a + (s.sale_price || 0), 0)
  const cost = filtered.reduce((a, s) => a + (s.buy_price || 0) + (s.delivery_fee || 0), 0)
  const profit = filtered.reduce((a, s) => a + (s.profit || 0), 0)
  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0'

  // By category
  const byCategory: Record<string, { count: number; profit: number; revenue: number }> = {}
  filtered.forEach(s => {
    const k = s.category || 'Non catégorisé'
    if (!byCategory[k]) byCategory[k] = { count: 0, profit: 0, revenue: 0 }
    byCategory[k].count++
    byCategory[k].profit += s.profit || 0
    byCategory[k].revenue += s.sale_price || 0
  })
  const catList = Object.entries(byCategory).sort((a, b) => b[1].profit - a[1].profit)

  // By sector
  const bySector: Record<string, number> = {}
  filtered.forEach(s => {
    if (!s.sector) return
    bySector[s.sector] = (bySector[s.sector] || 0) + (s.profit || 0)
  })
  const sectorList = Object.entries(bySector).sort((a, b) => b[1] - a[1])

  // Monthly trend (last 12 months)
  const monthly: Record<string, { revenue: number; profit: number }> = {}
  sales.forEach(s => {
    const d = new Date(s.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!monthly[key]) monthly[key] = { revenue: 0, profit: 0 }
    monthly[key].revenue += s.sale_price || 0
    monthly[key].profit += s.profit || 0
  })
  const monthlyList = Object.entries(monthly).sort((a, b) => a[0].localeCompare(b[0])).slice(-12)
  const maxMonthly = Math.max(...monthlyList.map(m => m[1].revenue), 1)

  // Subscriptions stats
  const today = new Date().toISOString().split('T')[0]
  const in7 = new Date(); in7.setDate(in7.getDate() + 7)
  const in7str = in7.toISOString().split('T')[0]

  const subStats = {
    total: subs.length,
    active: subs.filter(s => s.expiry_date > in7str).length,
    expiring: subs.filter(s => s.expiry_date >= today && s.expiry_date <= in7str).length,
    expired: subs.filter(s => s.expiry_date < today).length,
    wifi: subs.filter(s => s.sub_type === 'wifi').length,
    iptv: subs.filter(s => s.sub_type === 'iptv').length,
  }

  const periodLabel = { day: 'Aujourd\'hui', month: 'Ce mois', year: 'Cette année', all: 'Tout' }[period]

  return (
    <AppShell title={<>Mes <span>Rapports</span></>}>
      {/* PERIOD SELECTOR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
        <div className="df-wrap">
          {(['day','month','year','all'] as Period[]).map(p => (
            <button key={p} className={`df-btn ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
              {{ day: "Aujourd'hui", month: 'Ce mois', year: 'Cette année', all: 'Tout' }[p]}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>Affichage : <strong style={{ color: 'var(--text2)' }}>{periodLabel}</strong></span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : (
        <>
          {/* KPI */}
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            {[
              { label: 'Chiffre d\'affaires', val: fmtCFA(revenue), color: '#10b981' },
              { label: 'Bénéfice net', val: fmtCFA(profit), color: '#6366f1' },
              { label: 'Coûts totaux', val: fmtCFA(cost), color: '#ef4444' },
              { label: 'Nombre de ventes', val: fmt(filtered.length), color: '#f59e0b' },
              { label: 'Marge bénéficiaire', val: `${margin}%`, color: '#06b6d4' },
              { label: 'Panier moyen', val: filtered.length > 0 ? fmtCFA(Math.round(revenue / filtered.length)) : '—', color: '#ec4899' },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-glow" style={{ background: s.color }} />
                <div className={`stat-val ${s.val.length > 12 ? 'stat-val-sm' : ''}`} style={{ color: i === 1 ? (profit >= 0 ? 'var(--green)' : 'var(--red)') : undefined }}>{s.val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* MONTHLY CHART */}
          {monthlyList.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">📊 Évolution mensuelle du CA (12 derniers mois)</div>
              <div className="bar-wrap" style={{ height: 140 }}>
                {monthlyList.map(([key, data]) => {
                  const [year, month] = key.split('-')
                  const label = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('fr-SN', { month: 'short' })
                  return (
                    <div key={key} className="bar-col">
                      <div title={`CA: ${fmtCFA(data.revenue)}\nBénéfice: ${fmtCFA(data.profit)}`}>
                        <div className="bar-fill" style={{
                          height: `${Math.max((data.revenue / maxMonthly) * 100, 2)}%`,
                          background: 'linear-gradient(180deg,var(--green),var(--accent))',
                        }} />
                      </div>
                      <span className="bar-lbl">{label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="g2" style={{ marginBottom: 16 }}>
            {/* BY CATEGORY */}
            <div className="card">
              <div className="card-title">🗂️ Par catégorie</div>
              {catList.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <div className="ei">📊</div><div className="et" style={{ fontSize: 13 }}>Pas de données</div>
                </div>
              ) : catList.map(([cat, data]) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <span className="badge badge-blue" style={{ marginBottom: 2 }}>{cat}</span>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{data.count} vente{data.count > 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="money money-green" style={{ fontSize: 13 }}>{fmtCFA(data.profit)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)' }}>CA: {fmtCFA(data.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* BY SECTOR */}
            <div className="card">
              <div className="card-title">🏭 Par secteur d'activité</div>
              {sectorList.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <div className="ei">🏭</div><div className="et" style={{ fontSize: 13 }}>Pas de données</div>
                </div>
              ) : sectorList.map(([sectorId, sProfit]) => {
                const s = ALL_SECTORS.find(x => x.id === sectorId)
                return (
                  <div key={sectorId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{s?.icon || '📦'}</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{s?.label || sectorId}</span>
                    </div>
                    <div className="money money-accent" style={{ fontSize: 13 }}>{fmtCFA(sProfit)}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* SUBSCRIPTIONS REPORT */}
          <div className="card">
            <div className="card-title">📡 Rapport Abonnements</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {[
                { label: 'Total', val: subStats.total, color: 'var(--accent)' },
                { label: 'Actifs', val: subStats.active, color: 'var(--green)' },
                { label: 'Expirent bientôt', val: subStats.expiring, color: 'var(--orange)' },
                { label: 'Expirés', val: subStats.expired, color: 'var(--red)' },
                { label: 'WiFi Zone', val: subStats.wifi, color: 'var(--accent3)' },
                { label: 'IPTV', val: subStats.iptv, color: 'var(--accent2)' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '14px 16px', background: 'var(--bg3)', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 26, color: item.color }}>{item.val}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </AppShell>
  )
}
