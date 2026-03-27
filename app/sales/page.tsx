'use client'
import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { ALL_SECTORS, SECTOR_CATEGORIES, fmtCFA, fmt, avatarColor, initials } from '@/lib/constants'
import { toast } from '@/components/ui/Toast'

interface Sale {
  id: string; client_name: string; sector: string; category: string; product: string
  sale_price: number; buy_price: number; delivery_fee: number; profit: number
  notes: string; sale_date: string; created_at: string
}

type Period = 'day' | 'month' | 'year' | 'all'

const EMPTY_FORM = { client_name: '', sector: '', category: '', product: '', sale_price: '', buy_price: '', delivery_fee: '', notes: '', sale_date: new Date().toISOString().split('T')[0] }

export default function SalesPage() {
  const { profile } = useAuth()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [period, setPeriod] = useState<Period>('month')
  const [search, setSearch] = useState('')
  const [clientSuggestions, setClientSuggestions] = useState<string[]>([])

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const fetchSales = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    const { data } = await supabase.from('sales').select('*').eq('user_id', profile.id).order('created_at', { ascending: false })
    setSales(data || [])
    setLoading(false)
  }, [profile])

  const fetchClients = useCallback(async () => {
    if (!profile) return
    const { data } = await supabase.from('clients').select('name').eq('user_id', profile.id)
    setClientSuggestions((data || []).map((c: any) => c.name))
  }, [profile])

  useEffect(() => { fetchSales(); fetchClients() }, [fetchSales, fetchClients])

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

  const filtered = filterByPeriod(sales).filter(s =>
    !search || s.client_name.toLowerCase().includes(search.toLowerCase()) ||
    s.product.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.toLowerCase().includes(search.toLowerCase())
  )

  const totalRevenue = filtered.reduce((a, s) => a + (s.sale_price || 0), 0)
  const totalCost = filtered.reduce((a, s) => a + (s.buy_price || 0) + (s.delivery_fee || 0), 0)
  const totalProfit = filtered.reduce((a, s) => a + (s.profit || 0), 0)

  const profit = form.sale_price && form.buy_price
    ? parseFloat(form.sale_price) - parseFloat(form.buy_price) - parseFloat(form.delivery_fee || '0')
    : null

  const userSectors = profile?.sectors?.map(id => ALL_SECTORS.find(s => s.id === id)).filter(Boolean) || []
  const cats = form.sector ? (SECTOR_CATEGORIES[form.sector] || []) : profile?.sectors?.flatMap(id => SECTOR_CATEGORIES[id] || []) || []

  const handleSubmit = async () => {
    if (!form.client_name.trim() || !form.product.trim() || !form.sale_price || !form.buy_price) {
      toast.err('Remplissez les champs obligatoires (*)'); return
    }
    if (!profile) return
    setSaving(true)

    // Upsert client
    const { data: existClient } = await supabase.from('clients').select('id,total_spent').eq('user_id', profile.id).ilike('name', form.client_name).single()
    const salePrice = parseFloat(form.sale_price)
    if (existClient) {
      await supabase.from('clients').update({ total_spent: (existClient.total_spent || 0) + salePrice, updated_at: new Date().toISOString() }).eq('id', existClient.id)
    } else {
      await supabase.from('clients').insert({ user_id: profile.id, name: form.client_name.trim(), total_spent: salePrice })
    }

    const { error } = await supabase.from('sales').insert({
      user_id: profile.id,
      client_name: form.client_name.trim(),
      sector: form.sector,
      category: form.category,
      product: form.product.trim(),
      sale_price: salePrice,
      buy_price: parseFloat(form.buy_price),
      delivery_fee: parseFloat(form.delivery_fee || '0'),
      notes: form.notes,
      sale_date: form.sale_date,
    })

    setSaving(false)
    if (error) { toast.err('Erreur lors de l\'enregistrement'); return }
    toast.ok(`Vente enregistrée ! Bénéfice : ${fmtCFA(profit || 0)} 💰`)
    setShowModal(false)
    setForm(EMPTY_FORM)
    fetchSales(); fetchClients()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette vente ?')) return
    await supabase.from('sales').delete().eq('id', id)
    toast.ok('Vente supprimée')
    fetchSales()
  }

  return (
    <AppShell
      title={<>Mes <span>Ventes</span></>}
      actions={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nouvelle vente</button>}
    >
      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="df-wrap">
          {(['day','month','year','all'] as Period[]).map(p => (
            <button key={p} className={`df-btn ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
              {{ day: 'Jour', month: 'Mois', year: 'Année', all: 'Tout' }[p]}
            </button>
          ))}
        </div>
        <div className="search-wrap" style={{ flex: 1, maxWidth: 300 }}>
          <span style={{ color: 'var(--text3)' }}>🔍</span>
          <input placeholder="Rechercher client, produit..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* STATS */}
      <div className="g3" style={{ marginBottom: 18 }}>
        <div className="stat-card">
          <div className="stat-glow" style={{ background: '#10b981' }} />
          <div className="stat-val stat-val-sm">{fmtCFA(totalRevenue)}</div>
          <div className="stat-label">Revenus</div>
        </div>
        <div className="stat-card">
          <div className="stat-glow" style={{ background: '#ef4444' }} />
          <div className="stat-val stat-val-sm">{fmtCFA(totalCost)}</div>
          <div className="stat-label">Achats + Livraison</div>
        </div>
        <div className="stat-card">
          <div className="stat-glow" style={{ background: '#6366f1' }} />
          <div className="stat-val stat-val-sm" style={{ color: totalProfit >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtCFA(totalProfit)}</div>
          <div className="stat-label">Bénéfice net</div>
        </div>
      </div>

      {/* TABLE */}
      <div className="card">
        <div className="card-title">💰 Historique ({fmt(filtered.length)} vente{filtered.length > 1 ? 's' : ''})</div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="ei">💰</div>
            <div className="et">Aucune vente</div>
            <div className="es">{search ? 'Aucun résultat pour votre recherche' : 'Cliquez sur "+ Nouvelle vente" pour commencer'}</div>
          </div>
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Client</th><th>Produit</th><th>Catégorie</th>
                  <th>Prix vente</th><th>Prix achat</th><th>Livraison</th>
                  <th>Bénéfice</th><th>Date</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar" style={{ background: avatarColor(s.client_name), width: 28, height: 28, fontSize: 11 }}>{initials(s.client_name)}</div>
                        <span style={{ fontWeight: 500 }}>{s.client_name}</span>
                      </div>
                    </td>
                    <td>{s.product}</td>
                    <td>{s.category ? <span className="badge badge-blue">{s.category}</span> : <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                    <td className="money money-green">{fmtCFA(s.sale_price)}</td>
                    <td className="money money-red" style={{ fontSize: 12 }}>{fmtCFA(s.buy_price)}</td>
                    <td style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 12 }}>{s.delivery_fee ? fmtCFA(s.delivery_fee) : '—'}</td>
                    <td className={`money ${s.profit >= 0 ? 'money-accent' : 'money-red'}`} style={{ fontWeight: 700 }}>{fmtCFA(s.profit)}</td>
                    <td style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {new Date(s.created_at).toLocaleDateString('fr-SN')}
                    </td>
                    <td>
                      <button className="btn btn-danger btn-xs btn-icon" onClick={() => handleDelete(s.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-hd">
              <h2>💰 Nouvelle Vente</h2>
              <div className="modal-close" onClick={() => setShowModal(false)}>✕</div>
            </div>
            <div className="modal-body">
              <div className="field">
                <label>Nom du client *</label>
                <input placeholder="Ex: Moussa Diallo" value={form.client_name}
                  onChange={e => setF('client_name', e.target.value)}
                  list="client-list" autoComplete="off" />
                <datalist id="client-list">
                  {clientSuggestions.map(n => <option key={n} value={n} />)}
                </datalist>
              </div>

              <div className="g2">
                <div className="field">
                  <label>Secteur</label>
                  <select value={form.sector} onChange={e => { setF('sector', e.target.value); setF('category', '') }}>
                    <option value="">— Sélectionner —</option>
                    {userSectors.map(s => s && <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Catégorie *</label>
                  <select value={form.category} onChange={e => setF('category', e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {cats.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="field">
                <label>Produit / Service *</label>
                <input placeholder="Ex: Laptop HP 15s, Réparation écran..." value={form.product} onChange={e => setF('product', e.target.value)} />
              </div>

              <div className="g3">
                <div className="field">
                  <label>Prix de vente (FCFA) *</label>
                  <input type="number" placeholder="0" min="0" value={form.sale_price} onChange={e => setF('sale_price', e.target.value)} />
                </div>
                <div className="field">
                  <label>Prix d'achat (FCFA) *</label>
                  <input type="number" placeholder="0" min="0" value={form.buy_price} onChange={e => setF('buy_price', e.target.value)} />
                </div>
                <div className="field">
                  <label>Livraison (FCFA)</label>
                  <input type="number" placeholder="0" min="0" value={form.delivery_fee} onChange={e => setF('delivery_fee', e.target.value)} />
                </div>
              </div>

              <div className="g2">
                <div className="field">
                  <label>Date de vente</label>
                  <input type="date" value={form.sale_date} onChange={e => setF('sale_date', e.target.value)} />
                </div>
                <div className="field">
                  <label>Notes</label>
                  <input placeholder="Remarques..." value={form.notes} onChange={e => setF('notes', e.target.value)} />
                </div>
              </div>

              {profit !== null && (
                <div className={`profit-box ${profit >= 0 ? 'positive' : 'negative'}`}>
                  <div className="pb-label">Bénéfice estimé</div>
                  <div className="pb-val" style={{ color: profit >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtCFA(profit)}</div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Annuler</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSubmit} disabled={saving}>
                  {saving ? <span className="spinner" /> : ''}
                  {saving ? 'Enregistrement...' : '✓ Enregistrer la vente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
