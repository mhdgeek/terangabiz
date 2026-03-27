'use client'
import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { fmtCFA, fmt, avatarColor, initials } from '@/lib/constants'

interface Client {
  id: string; name: string; phone: string; email: string
  notes: string; total_spent: number; created_at: string
}
interface Sale {
  id: string; product: string; category: string; sale_price: number
  profit: number; created_at: string
}

export default function ClientsPage() {
  const { profile } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Client | null>(null)
  const [clientSales, setClientSales] = useState<Sale[]>([])
  const [loadingSales, setLoadingSales] = useState(false)

  const fetchClients = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    const { data } = await supabase.from('clients').select('*').eq('user_id', profile.id).order('total_spent', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }, [profile])

  useEffect(() => { fetchClients() }, [fetchClients])

  const openClient = async (c: Client) => {
    setSelected(c)
    setLoadingSales(true)
    const { data } = await supabase.from('sales').select('*').eq('user_id', profile!.id).ilike('client_name', c.name).order('created_at', { ascending: false })
    setClientSales(data || [])
    setLoadingSales(false)
  }

  const filtered = clients.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
  const totalRevenueAll = clients.reduce((a, c) => a + (c.total_spent || 0), 0)

  return (
    <AppShell title={<>Mes <span>Clients</span></>}>
      {/* STATS */}
      <div className="g3" style={{ marginBottom: 18 }}>
        <div className="stat-card">
          <div className="stat-glow" style={{ background: '#8b5cf6' }} />
          <div className="stat-val">{fmt(clients.length)}</div>
          <div className="stat-label">Clients total</div>
        </div>
        <div className="stat-card">
          <div className="stat-glow" style={{ background: '#10b981' }} />
          <div className="stat-val stat-val-sm">{fmtCFA(totalRevenueAll)}</div>
          <div className="stat-label">CA total clients</div>
        </div>
        <div className="stat-card">
          <div className="stat-glow" style={{ background: '#06b6d4' }} />
          <div className="stat-val stat-val-sm">{clients.length > 0 ? fmtCFA(Math.round(totalRevenueAll / clients.length)) : '0 FCFA'}</div>
          <div className="stat-label">Panier moyen</div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div className="search-wrap" style={{ maxWidth: 320 }}>
          <span style={{ color: 'var(--text3)' }}>🔍</span>
          <input placeholder="Rechercher un client..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="card"><div className="empty-state">
          <div className="ei">👥</div>
          <div className="et">Aucun client</div>
          <div className="es">Les clients sont créés automatiquement lors d'une vente</div>
        </div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filtered.map(c => {
            const salesCount = 0 // Will be shown after click
            return (
              <div key={c.id} className="client-card" onClick={() => openClient(c)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <div className="avatar" style={{ background: avatarColor(c.name), width: 48, height: 48, borderRadius: 13, fontSize: 18 }}>{initials(c.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                    {c.phone && <div style={{ fontSize: 12, color: 'var(--text3)' }}>📞 {c.phone}</div>}
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                      Client depuis {new Date(c.created_at).toLocaleDateString('fr-SN')}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ padding: '10px 12px', background: 'var(--bg3)', borderRadius: 10 }}>
                    <div className="money money-green" style={{ fontSize: 13 }}>{fmtCFA(c.total_spent || 0)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>Total dépensé</div>
                  </div>
                  <div style={{ padding: '10px 12px', background: 'var(--bg3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600 }}>Voir historique →</div>
                    </div>
                  </div>
                </div>

                {c.notes && (
                  <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text3)', fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                    {c.notes}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* CLIENT DETAIL MODAL */}
      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal modal-lg">
            <div className="modal-hd">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="avatar" style={{ background: avatarColor(selected.name), width: 44, height: 44, borderRadius: 12, fontSize: 17 }}>{initials(selected.name)}</div>
                <div>
                  <h2>{selected.name}</h2>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>Client depuis {new Date(selected.created_at).toLocaleDateString('fr-SN')}</div>
                </div>
              </div>
              <div className="modal-close" onClick={() => setSelected(null)}>✕</div>
            </div>
            <div className="modal-body">
              <div className="g3" style={{ marginBottom: 20 }}>
                <div style={{ textAlign: 'center', padding: 14, background: 'var(--bg3)', borderRadius: 12 }}>
                  <div className="money money-green" style={{ fontSize: 16 }}>{fmtCFA(selected.total_spent || 0)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Total dépensé</div>
                </div>
                <div style={{ textAlign: 'center', padding: 14, background: 'var(--bg3)', borderRadius: 12 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 22 }}>{clientSales.length}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Achats</div>
                </div>
                <div style={{ textAlign: 'center', padding: 14, background: 'var(--bg3)', borderRadius: 12 }}>
                  <div className="money money-accent" style={{ fontSize: 16 }}>{fmtCFA(clientSales.reduce((a, s) => a + (s.profit || 0), 0))}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Ton bénéfice</div>
                </div>
              </div>

              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📋 Historique des achats</div>
              {loadingSales ? (
                <div style={{ textAlign: 'center', padding: 24 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
              ) : clientSales.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <div className="ei">🛒</div><div className="et" style={{ fontSize: 13 }}>Aucun achat</div>
                </div>
              ) : clientSales.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg3)', borderRadius: 10, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.product}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {s.category && <span className="badge badge-blue" style={{ marginRight: 6 }}>{s.category}</span>}
                      {new Date(s.created_at).toLocaleDateString('fr-SN')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="money money-green" style={{ fontSize: 14 }}>{fmtCFA(s.sale_price)}</div>
                    <div className={`money ${s.profit >= 0 ? 'money-accent' : 'money-red'}`} style={{ fontSize: 11 }}>+{fmtCFA(s.profit)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
