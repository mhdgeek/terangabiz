'use client'
import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { fmtCFA, fmt, avatarColor, initials, SECTOR_CATEGORIES } from '@/lib/constants'
import { toast } from '@/components/ui/Toast'

interface Intervention {
  id: string; client_name: string; client_phone: string; category: string
  description: string; location: string; status: 'pending' | 'in_progress' | 'done' | 'cancelled'
  fee: number; parts_cost: number; profit: number; intervention_date: string
  notes: string; created_at: string
}

const STATUS_META = {
  pending:     { label: 'En attente',   cls: 'badge-orange', icon: '⏳' },
  in_progress: { label: 'En cours',     cls: 'badge-blue',   icon: '🔧' },
  done:        { label: 'Terminé',      cls: 'badge-green',  icon: '✅' },
  cancelled:   { label: 'Annulé',       cls: 'badge-red',    icon: '❌' },
}

const EMPTY = {
  client_name: '', client_phone: '', category: '', description: '', location: '',
  status: 'pending' as const, fee: '', parts_cost: '', notes: '',
  intervention_date: new Date().toISOString().split('T')[0],
}

export default function InterventionsPage() {
  const { profile } = useAuth()
  const [items, setItems] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Intervention | null>(null)

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const fetchItems = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    const { data } = await supabase
      .from('interventions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }, [profile])

  useEffect(() => { fetchItems() }, [fetchItems])

  const profit = form.fee && form.parts_cost !== undefined
    ? parseFloat(form.fee || '0') - parseFloat(form.parts_cost || '0')
    : null

  const handleSubmit = async () => {
    if (!form.client_name.trim() || !form.category || !form.description.trim()) {
      toast.err('Remplissez les champs obligatoires (*)'); return
    }
    if (!profile) return
    setSaving(true)
    const fee = parseFloat(form.fee || '0')
    const parts_cost = parseFloat(form.parts_cost || '0')
    const { error } = await supabase.from('interventions').insert({
      user_id: profile.id,
      client_name: form.client_name.trim(),
      client_phone: form.client_phone,
      category: form.category,
      description: form.description.trim(),
      location: form.location,
      status: form.status,
      fee,
      parts_cost,
      profit: fee - parts_cost,
      notes: form.notes,
      intervention_date: form.intervention_date,
    })
    setSaving(false)
    if (error) { toast.err("Erreur lors de l'enregistrement"); return }
    toast.ok('Intervention enregistrée ✅')
    setShowModal(false); setForm(EMPTY); fetchItems()
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('interventions').update({ status }).eq('id', id)
    toast.ok('Statut mis à jour')
    fetchItems()
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: status as any } : null)
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Supprimer cette intervention ?')) return
    await supabase.from('interventions').delete().eq('id', id)
    toast.ok('Supprimée'); fetchItems()
    if (selected?.id === id) setSelected(null)
  }

  const filtered = items.filter(i => {
    const matchStatus = filterStatus === 'all' || i.status === filterStatus
    const matchSearch = !search || i.client_name.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const stats = {
    total: items.length,
    pending: items.filter(i => i.status === 'pending').length,
    inProgress: items.filter(i => i.status === 'in_progress').length,
    done: items.filter(i => i.status === 'done').length,
    revenue: items.filter(i => i.status === 'done').reduce((a, i) => a + (i.fee || 0), 0),
    profit: items.filter(i => i.status === 'done').reduce((a, i) => a + (i.profit || 0), 0),
  }

  const cats = SECTOR_CATEGORIES['support_it'] || []

  return (
    <AppShell
      title={<>Support IT <span>& Réseaux</span></>}
      actions={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nouvelle intervention</button>}
    >
      {/* STATS */}
      <div className="stats-grid" style={{ marginBottom: 18 }}>
        {[
          { label: 'Total interventions', val: fmt(stats.total), color: '#6366f1' },
          { label: 'En attente', val: fmt(stats.pending), color: '#f59e0b' },
          { label: 'En cours', val: fmt(stats.inProgress), color: '#06b6d4' },
          { label: 'Terminées', val: fmt(stats.done), color: '#10b981' },
          { label: 'Revenus (terminées)', val: fmtCFA(stats.revenue), color: '#10b981' },
          { label: 'Bénéfice net', val: fmtCFA(stats.profit), color: '#6366f1' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-glow" style={{ background: s.color }} />
            <div className={`stat-val ${s.val.length > 12 ? 'stat-val-sm' : ''}`}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="df-wrap">
          {[
            { id: 'all', l: 'Toutes' },
            { id: 'pending', l: '⏳ En attente' },
            { id: 'in_progress', l: '🔧 En cours' },
            { id: 'done', l: '✅ Terminées' },
            { id: 'cancelled', l: '❌ Annulées' },
          ].map(f => (
            <button key={f.id} className={`df-btn ${filterStatus === f.id ? 'active' : ''}`} onClick={() => setFilterStatus(f.id)}>{f.l}</button>
          ))}
        </div>
        <div className="search-wrap" style={{ flex: 1, maxWidth: 280 }}>
          <span style={{ color: 'var(--text3)' }}>🔍</span>
          <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* LIST */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="card"><div className="empty-state">
          <div className="ei">🖧</div>
          <div className="et">Aucune intervention</div>
          <div className="es">Enregistrez vos câblages, installations caméras, dépannages...</div>
        </div></div>
      ) : (
        <div className="card">
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr><th>Client</th><th>Type</th><th>Description</th><th>Date</th><th>Statut</th><th>Frais</th><th>Pièces</th><th>Bénéfice</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const st = STATUS_META[item.status]
                  return (
                    <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(item)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar" style={{ background: avatarColor(item.client_name), width: 28, height: 28, borderRadius: 8, fontSize: 11 }}>{initials(item.client_name)}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{item.client_name}</div>
                            {item.client_phone && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{item.client_phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-blue">{item.category}</span></td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{item.description}</td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                        {new Date(item.intervention_date || item.created_at).toLocaleDateString('fr-SN')}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <select
                          value={item.status}
                          className="badge"
                          style={{ border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 11, borderRadius: 99, padding: '3px 8px', background: item.status === 'done' ? 'var(--green-dim)' : item.status === 'pending' ? 'var(--orange-dim)' : item.status === 'in_progress' ? 'rgba(6,182,212,0.15)' : 'var(--red-dim)', color: item.status === 'done' ? 'var(--green)' : item.status === 'pending' ? 'var(--orange)' : item.status === 'in_progress' ? 'var(--accent3)' : 'var(--red)' }}
                          onChange={e => updateStatus(item.id, e.target.value)}>
                          <option value="pending">⏳ En attente</option>
                          <option value="in_progress">🔧 En cours</option>
                          <option value="done">✅ Terminé</option>
                          <option value="cancelled">❌ Annulé</option>
                        </select>
                      </td>
                      <td className="money money-green" style={{ fontSize: 12 }}>{fmtCFA(item.fee || 0)}</td>
                      <td className="money money-red" style={{ fontSize: 12 }}>{fmtCFA(item.parts_cost || 0)}</td>
                      <td className={`money ${(item.profit || 0) >= 0 ? 'money-accent' : 'money-red'}`} style={{ fontWeight: 700, fontSize: 12 }}>{fmtCFA(item.profit || 0)}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <button className="btn btn-danger btn-xs btn-icon" onClick={() => deleteItem(item.id)}>🗑️</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-hd">
              <h2>🖧 Nouvelle Intervention</h2>
              <div className="modal-close" onClick={() => setShowModal(false)}>✕</div>
            </div>
            <div className="modal-body">
              <div className="g2">
                <div className="field">
                  <label>Nom du client *</label>
                  <input placeholder="Ex: Entreprise CTIC" value={form.client_name} onChange={e => setF('client_name', e.target.value)} />
                </div>
                <div className="field">
                  <label>Téléphone client</label>
                  <input placeholder="+221 77 000 0000" value={form.client_phone} onChange={e => setF('client_phone', e.target.value)} />
                </div>
              </div>
              <div className="g2">
                <div className="field">
                  <label>Type d'intervention *</label>
                  <select value={form.category} onChange={e => setF('category', e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {cats.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Statut</label>
                  <select value={form.status} onChange={e => setF('status', e.target.value)}>
                    <option value="pending">⏳ En attente</option>
                    <option value="in_progress">🔧 En cours</option>
                    <option value="done">✅ Terminé</option>
                    <option value="cancelled">❌ Annulé</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Description de l'intervention *</label>
                <textarea placeholder="Décrivez le travail à effectuer ou effectué..." value={form.description} onChange={e => setF('description', e.target.value)} style={{ minHeight: 80 }} />
              </div>
              <div className="g2">
                <div className="field">
                  <label>Lieu / Adresse</label>
                  <input placeholder="Ex: Plateau, Dakar" value={form.location} onChange={e => setF('location', e.target.value)} />
                </div>
                <div className="field">
                  <label>Date d'intervention</label>
                  <input type="date" value={form.intervention_date} onChange={e => setF('intervention_date', e.target.value)} />
                </div>
              </div>
              <div className="g2">
                <div className="field">
                  <label>Frais de service (FCFA)</label>
                  <input type="number" placeholder="0" min="0" value={form.fee} onChange={e => setF('fee', e.target.value)} />
                </div>
                <div className="field">
                  <label>Coût des pièces / matériel</label>
                  <input type="number" placeholder="0" min="0" value={form.parts_cost} onChange={e => setF('parts_cost', e.target.value)} />
                </div>
              </div>
              {profit !== null && (
                <div className={`profit-box ${profit >= 0 ? 'positive' : 'negative'}`}>
                  <div className="pb-label">Bénéfice estimé</div>
                  <div className="pb-val" style={{ color: profit >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtCFA(profit)}</div>
                </div>
              )}
              <div className="field" style={{ marginTop: 14 }}>
                <label>Notes internes</label>
                <input placeholder="Remarques, matériel utilisé..." value={form.notes} onChange={e => setF('notes', e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Annuler</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSubmit} disabled={saving}>
                  {saving && <span className="spinner" />}
                  {saving ? 'Enregistrement...' : '✓ Enregistrer l\'intervention'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal modal-lg">
            <div className="modal-hd">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="avatar" style={{ background: avatarColor(selected.client_name), width: 44, height: 44, borderRadius: 12, fontSize: 17 }}>{initials(selected.client_name)}</div>
                <div>
                  <h2>{selected.client_name}</h2>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{selected.client_phone} {selected.location && `· ${selected.location}`}</div>
                </div>
              </div>
              <div className="modal-close" onClick={() => setSelected(null)}>✕</div>
            </div>
            <div className="modal-body">
              <div className="g3" style={{ marginBottom: 18 }}>
                <div style={{ padding: 14, background: 'var(--bg3)', borderRadius: 12, textAlign: 'center' }}>
                  <div className="money money-green" style={{ fontSize: 18 }}>{fmtCFA(selected.fee || 0)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Frais de service</div>
                </div>
                <div style={{ padding: 14, background: 'var(--bg3)', borderRadius: 12, textAlign: 'center' }}>
                  <div className="money money-red" style={{ fontSize: 18 }}>{fmtCFA(selected.parts_cost || 0)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Coût matériel</div>
                </div>
                <div style={{ padding: 14, background: 'var(--bg3)', borderRadius: 12, textAlign: 'center' }}>
                  <div className={`money ${(selected.profit || 0) >= 0 ? 'money-accent' : 'money-red'}`} style={{ fontSize: 18 }}>{fmtCFA(selected.profit || 0)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Bénéfice</div>
                </div>
              </div>
              <div style={{ padding: '14px 16px', background: 'var(--bg3)', borderRadius: 12, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="badge badge-blue">{selected.category}</span>
                  <span className={`badge ${STATUS_META[selected.status].cls}`}>{STATUS_META[selected.status].icon} {STATUS_META[selected.status].label}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.6 }}>{selected.description}</div>
                {selected.notes && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 10, fontStyle: 'italic' }}>📝 {selected.notes}</div>}
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>
                  📅 {new Date(selected.intervention_date || selected.created_at).toLocaleDateString('fr-SN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(['pending','in_progress','done','cancelled'] as const).map(s => (
                  <button key={s} className={`btn btn-sm ${selected.status === s ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => updateStatus(selected.id, s)}>
                    {STATUS_META[s].icon} {STATUS_META[s].label}
                  </button>
                ))}
                <button className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }} onClick={() => deleteItem(selected.id)}>🗑️ Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
