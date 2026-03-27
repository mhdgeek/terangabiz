'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { ALL_SECTORS, fmtCFA, fmt, avatarColor, initials, daysUntil } from '@/lib/constants'
import Link from 'next/link'

interface Stats {
  revenue: number
  profit: number
  cost: number
  salesCount: number
  clientsCount: number
  subsCount: number
  expiringCount: number
  expiredCount: number
}

interface TopClient { name: string; total_spent: number; count: number }
interface RecentSale { id: string; client_name: string; product: string; profit: number; sale_price: number; created_at: string }

export default function DashboardPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<Stats>({ revenue: 0, profit: 0, cost: 0, salesCount: 0, clientsCount: 0, subsCount: 0, expiringCount: 0, expiredCount: 0 })
  const [topClients, setTopClients] = useState<TopClient[]>([])
  const [recentSales, setRecentSales] = useState<RecentSale[]>([])
  const [barData, setBarData] = useState<{ label: string; val: number }[]>([])
  const [loading, setLoading] = useState(true)

  const userSectors = profile?.sectors?.map(id => ALL_SECTORS.find(s => s.id === id)).filter(Boolean) || []

  useEffect(() => {
    if (!profile) return
    fetchAll()
  }, [profile])

  const fetchAll = async () => {
    if (!profile) return
    setLoading(true)

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [salesRes, clientsRes, subsRes] = await Promise.all([
      supabase.from('sales').select('*').eq('user_id', profile.id),
      supabase.from('clients').select('*').eq('user_id', profile.id),
      supabase.from('subscriptions').select('*').eq('user_id', profile.id),
    ])

    const allSales = salesRes.data || []
    const allClients = clientsRes.data || []
    const allSubs = subsRes.data || []

    const monthSales = allSales.filter(s => new Date(s.created_at) >= new Date(monthStart))
    const revenue = monthSales.reduce((a, s) => a + (s.sale_price || 0), 0)
    const cost = monthSales.reduce((a, s) => a + (s.buy_price || 0) + (s.delivery_fee || 0), 0)
    const profit = monthSales.reduce((a, s) => a + (s.profit || 0), 0)

    const today = new Date().toISOString().split('T')[0]
    const in7 = new Date(); in7.setDate(in7.getDate() + 7)
    const in7str = in7.toISOString().split('T')[0]
    const expiringCount = allSubs.filter(s => s.expiry_date >= today && s.expiry_date <= in7str).length
    const expiredCount = allSubs.filter(s => s.expiry_date < today).length

    setStats({ revenue, profit, cost, salesCount: monthSales.length, clientsCount: allClients.length, subsCount: allSubs.length, expiringCount, expiredCount })

    // Top clients
    const clientMap: Record<string, { name: string; total: number; count: number }> = {}
    allSales.forEach(s => {
      if (!clientMap[s.client_name]) clientMap[s.client_name] = { name: s.client_name, total: 0, count: 0 }
      clientMap[s.client_name].total += s.sale_price || 0
      clientMap[s.client_name].count += 1
    })
    setTopClients(Object.values(clientMap).sort((a, b) => b.total - a.total).slice(0, 5).map(c => ({ name: c.name, total_spent: c.total, count: c.count })))

    // Recent sales
    setRecentSales(allSales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6))

    // Bar chart last 7 days
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i))
      const dayStr = d.toISOString().split('T')[0]
      const label = d.toLocaleDateString('fr-SN', { weekday: 'short' })
      const val = allSales.filter(s => s.created_at?.startsWith(dayStr)).reduce((a, s) => a + (s.profit || 0), 0)
      return { label, val }
    })
    setBarData(days)

    setLoading(false)
  }

  const maxBar = Math.max(...barData.map(d => d.val), 1)

  const statCards = [
    { label: 'Chiffre d\'affaires', val: fmtCFA(stats.revenue), icon: '📈', color: '#10b981', glow: '#10b981', note: 'Ce mois' },
    { label: 'Bénéfice net', val: fmtCFA(stats.profit), icon: '💵', color: '#6366f1', glow: '#6366f1', note: 'Ce mois' },
    { label: 'Coûts totaux', val: fmtCFA(stats.cost), icon: '📦', color: '#f59e0b', glow: '#f59e0b', note: 'Achats + livraison' },
    { label: 'Ventes', val: fmt(stats.salesCount), icon: '🛒', color: '#ec4899', glow: '#ec4899', note: 'Ce mois' },
    { label: 'Clients', val: fmt(stats.clientsCount), icon: '👥', color: '#8b5cf6', glow: '#8b5cf6', note: 'Total enregistrés' },
    { label: 'Abonnements', val: fmt(stats.subsCount), icon: '📡', color: '#06b6d4', glow: '#06b6d4', note: `${stats.expiringCount + stats.expiredCount} alertes` },
  ]

  return (
    <AppShell title={<>Dashboard <span>Personnel</span></>}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      ) : (
        <>
          {/* ALERTS */}
          {stats.expiredCount > 0 && (
            <div className="alert alert-err">
              🚨 <strong>{stats.expiredCount}</strong> abonnement(s) expiré(s) !
              <Link href="/subscriptions" style={{ marginLeft: 'auto', color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}>Voir →</Link>
            </div>
          )}
          {stats.expiringCount > 0 && (
            <div className="alert alert-warn">
              ⏰ <strong>{stats.expiringCount}</strong> abonnement(s) expire(nt) dans moins de 7 jours
              <Link href="/subscriptions" style={{ marginLeft: 'auto', color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}>Voir →</Link>
            </div>
          )}

          {/* STATS */}
          <div className="stats-grid">
            {statCards.map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-glow" style={{ background: s.glow }} />
                <div className="stat-icon-wrap" style={{ background: `${s.color}20` }}>
                  <span>{s.icon}</span>
                </div>
                <div className={`stat-val ${s.val.length > 12 ? 'stat-val-sm' : ''}`}>{s.val}</div>
                <div className="stat-label">{s.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>{s.note}</div>
              </div>
            ))}
          </div>

          {/* CHART + TOP CLIENTS */}
          <div className="g2" style={{ marginBottom: 16 }}>
            <div className="card">
              <div className="card-title">📊 Bénéfices — 7 derniers jours</div>
              {barData.every(d => d.val === 0) ? (
                <div className="empty-state" style={{ padding: '28px 0' }}>
                  <div className="ei">📊</div>
                  <div className="et" style={{ fontSize: 13 }}>Pas encore de données</div>
                  <div className="es">Ajoutez des ventes pour voir le graphique</div>
                </div>
              ) : (
                <div className="bar-wrap">
                  {barData.map((d, i) => (
                    <div key={i} className="bar-col">
                      <div className="bar-fill" style={{
                        height: `${Math.max((d.val / maxBar) * 100, 3)}%`,
                        background: d.val > 0 ? 'linear-gradient(180deg,var(--accent),var(--accent2))' : 'var(--border)',
                      }} title={fmtCFA(d.val)} />
                      <span className="bar-lbl">{d.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">🏆 Meilleurs clients</div>
                <Link href="/clients" className="btn btn-ghost btn-sm">Voir tout</Link>
              </div>
              {topClients.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <div className="ei">👥</div>
                  <div className="et" style={{ fontSize: 13 }}>Aucun client</div>
                </div>
              ) : topClients.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="avatar" style={{ background: avatarColor(c.name), width: 34, height: 34, fontSize: 13 }}>{initials(c.name)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.count} achat{c.count > 1 ? 's' : ''}</div>
                  </div>
                  <div className="money money-green" style={{ fontSize: 12 }}>{fmtCFA(c.total_spent)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RECENT SALES */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <div className="card-title">💰 Ventes récentes</div>
              <Link href="/sales" className="btn btn-ghost btn-sm">Voir tout</Link>
            </div>
            {recentSales.length === 0 ? (
              <div className="empty-state" style={{ padding: '28px 0' }}>
                <div className="ei">💰</div>
                <div className="et">Aucune vente</div>
                <div className="es">Commencez à enregistrer vos ventes</div>
                <Link href="/sales" className="btn btn-primary btn-sm" style={{ marginTop: 14 }}>+ Nouvelle vente</Link>
              </div>
            ) : (
              <div className="tbl-wrap">
                <table>
                  <thead><tr><th>Client</th><th>Produit</th><th>Prix vente</th><th>Bénéfice</th><th>Date</th></tr></thead>
                  <tbody>
                    {recentSales.map(s => (
                      <tr key={s.id}>
                        <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar" style={{ background: avatarColor(s.client_name), width: 28, height: 28, fontSize: 11 }}>{initials(s.client_name)}</div>
                          {s.client_name}
                        </div></td>
                        <td style={{ fontWeight: 500 }}>{s.product}</td>
                        <td className="money money-green">{fmtCFA(s.sale_price)}</td>
                        <td className={`money ${s.profit >= 0 ? 'money-accent' : 'money-red'}`}>{fmtCFA(s.profit)}</td>
                        <td style={{ color: 'var(--text3)', fontSize: 12, fontFamily: 'var(--mono)' }}>
                          {new Date(s.created_at).toLocaleDateString('fr-SN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTORS */}
          {userSectors.length > 0 && (
            <div className="card">
              <div className="card-title">🗂️ Mes secteurs d'activité</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {userSectors.map(s => s && (
                  <div key={s.id} className="pill" style={{ background: `${s.color}18`, border: `1px solid ${s.color}30`, color: s.color }}>
                    {s.icon} {s.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </AppShell>
  )
}
