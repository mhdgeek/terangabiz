'use client'
import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { daysUntil, fmt } from '@/lib/constants'
import { toast } from '@/components/ui/Toast'

interface Sub {
  id: string
  client_name: string
  sub_type: 'wifi' | 'iptv' | 'other'
  service_name: string
  login: string | null
  password: string | null
  expiry_date: string
  monthly_fee: number
  notes: string | null
  created_at: string
}

type FilterType = 'all' | 'wifi' | 'iptv' | 'other' | 'expiring' | 'expired'

const emptyForm = () => ({
  client_name: '',
  sub_type: 'wifi' as const,
  service_name: '',
  login: '',
  password: '',
  expiry_date: '',
  monthly_fee: '',
  notes: '',
})

const TYPE_META = {
  wifi:  { icon: '📶', label: 'WiFi Zone', cls: 'badge-cyan'   },
  iptv:  { icon: '📺', label: 'IPTV',      cls: 'badge-purple' },
  other: { icon: '🔌', label: 'Autre',     cls: 'badge-gray'   },
}

export default function SubscriptionsPage() {
  const { profile } = useAuth()
  const [subs, setSubs]         = useState<Sub[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]         = useState(emptyForm())
  const [filter, setFilter]     = useState<FilterType>('all')
  const [search, setSearch]     = useState('')
  const [showPwd, setShowPwd]   = useState<Record<string, boolean>>({})

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const fetchSubs = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', profile.id)
      .order('expiry_date', { ascending: true })
    if (!error) setSubs(data || [])
    setLoading(false)
  }, [profile])

  useEffect(() => { fetchSubs() }, [fetchSubs])

  const today  = new Date().toISOString().split('T')[0]
  const in7    = new Date(); in7.setDate(in7.getDate() + 7)
  const in7str = in7.toISOString().split('T')[0]

  const expiredList  = subs.filter(s => s.expiry_date < today)
  const expiringList = subs.filter(s => s.expiry_date >= today && s.expiry_date <= in7str)

  const filtered = subs
    .filter(s => {
      if (filter === 'expired')  return s.expiry_date < today
      if (filter === 'expiring') return s.expiry_date >= today && s.expiry_date <= in7str
      if (filter === 'all')      return true
      return s.sub_type === filter
    })
    .filter(s =>
      !search ||
      s.client_name.toLowerCase().includes(search.toLowerCase()) ||
      s.service_name.toLowerCase().includes(search.toLowerCase())
    )

  const previewDays = form.expiry_date ? daysUntil(form.expiry_date) : null

  const handleSubmit = async () => {
    if (!form.client_name.trim() || !form.service_name.trim() || !form.expiry_date) {
      toast.err('Remplissez les champs obligatoires (*)')
      return
    }
    if (!profile) return
    setSaving(true)

    const { error } = await supabase.from('subscriptions').insert({
      user_id:      profile.id,
      client_name:  form.client_name.trim(),
      sub_type:     form.sub_type,
      service_name: form.service_name.trim(),
      login:        form.login       || null,
      password:     form.password    || null,
      expiry_date:  form.expiry_date,
      monthly_fee:  parseFloat(form.monthly_fee || '0'),
      notes:        form.notes       || null,
    })

    setSaving(false)
    if (error) { toast.err("Erreur lors de l'enregistrement"); return }
    toast.ok('Abonnement enregistré ✅')
    setShowModal(false)
    setForm(emptyForm())
    fetchSubs()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cet abonnement ?')) return
    const { error } = await supabase.from('subscriptions').delete().eq('id', id)
    if (error) { toast.err('Erreur lors de la suppression'); return }
    toast.ok('Abonnement supprimé')
    fetchSubs()
  }

  const getCardClass = (s: Sub) => {
    if (s.expiry_date < today)                           return 'sub-card expired'
    if (s.expiry_date >= today && s.expiry_date <= in7str) return 'sub-card expiring'
    return 'sub-card ok'
  }

  const getDaysColor = (s: Sub) => {
    const d = daysUntil(s.expiry_date)
    if (d < 0)  return 'var(--red)'
    if (d <= 7) return 'var(--orange)'
    return 'var(--green)'
  }

  return (
    <AppShell
      title={<>Mes <span>Abonnements</span></>}
      actions={
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Nouvel abonnement
        </button>
      }
    >
      {/* ALERTS */}
      {expiredList.length > 0 && (
        <div className="alert alert-err">
          🚨 <strong>{expiredList.length}</strong> abonnement(s) expiré(s) — Renouvelez maintenant !
        </div>
      )}
      {expiringList.length > 0 && (
        <div className="alert alert-warn">
          ⏰ <strong>{expiringList.length}</strong> abonnement(s) expire(nt) dans ≤ 7 jours
        </div>
      )}

      {/* STATS */}
      <div className="stats-grid" style={{ marginBottom: 18 }}>
        {[
          { label: 'Total',             val: fmt(subs.length),                color: '#6366f1' },
          { label: 'Actifs',            val: fmt(subs.filter(s => s.expiry_date > in7str).length), color: '#10b981' },
          { label: 'Expirent bientôt', val: fmt(expiringList.length),         color: '#f59e0b' },
          { label: 'Expirés',          val: fmt(expiredList.length),           color: '#ef4444' },
          { label: 'WiFi Zone',         val: fmt(subs.filter(s => s.sub_type === 'wifi').length), color: '#06b6d4' },
          { label: 'IPTV',              val: fmt(subs.filter(s => s.sub_type === 'iptv').length), color: '#8b5cf6' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-glow" style={{ background: s.color }} />
            <div className="stat-val">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="df-wrap">
          {([
            { id: 'all',      l: 'Tous'         },
            { id: 'wifi',     l: '📶 WiFi'      },
            { id: 'iptv',     l: '📺 IPTV'      },
            { id: 'other',    l: '🔌 Autre'     },
            { id: 'expiring', l: '⏰ Bientôt'   },
            { id: 'expired',  l: '🚨 Expirés'   },
          ] as { id: FilterType; l: string }[]).map(f => (
            <button
              key={f.id}
              className={`df-btn ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.l}
            </button>
          ))}
        </div>
        <div className="search-wrap" style={{ flex: 1, maxWidth: 280 }}>
          <span style={{ color: 'var(--text3)' }}>🔍</span>
          <input
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* CARDS */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="ei">📡</div>
            <div className="et">Aucun abonnement</div>
            <div className="es">Gérez les abonnements WiFi, IPTV et autres de vos clients</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filtered.map(s => {
            const days = daysUntil(s.expiry_date)
            const meta = TYPE_META[s.sub_type]
            const pwdVisible = showPwd[s.id]

            return (
              <div key={s.id} className={getCardClass(s)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span className={`badge ${meta.cls}`} style={{ marginBottom: 8, display: 'inline-flex' }}>
                      {meta.icon} {meta.label}
                    </span>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{s.client_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.service_name}</div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 56 }}>
                    <div style={{
                      fontFamily: 'var(--mono)', fontWeight: 900,
                      fontSize: days < 0 ? 16 : 26,
                      color: getDaysColor(s), lineHeight: 1,
                    }}>
                      {days < 0 ? 'EXP' : days}
                    </div>
                    {days >= 0 && (
                      <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>jours</div>
                    )}
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 9, padding: '10px 12px', fontSize: 12 }}>
                  {s.login && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: 'var(--text3)' }}>Login</span>
                      <span style={{ fontFamily: 'var(--mono)', fontWeight: 500 }}>{s.login}</span>
                    </div>
                  )}
                  {s.password && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ color: 'var(--text3)' }}>Mot de passe</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'var(--mono)', fontWeight: 500 }}>
                          {pwdVisible ? s.password : '••••••••'}
                        </span>
                        <button
                          className="btn btn-ghost btn-xs btn-icon"
                          style={{ padding: '2px 5px', fontSize: 11 }}
                          onClick={() => setShowPwd(p => ({ ...p, [s.id]: !p[s.id] }))}
                        >
                          {pwdVisible ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text3)' }}>Expiration</span>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: getDaysColor(s) }}>
                      {new Date(s.expiry_date).toLocaleDateString('fr-SN')}
                    </span>
                  </div>
                  {s.monthly_fee > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ color: 'var(--text3)' }}>Mensualité</span>
                      <span className="money money-green" style={{ fontSize: 12 }}>
                        {s.monthly_fee.toLocaleString('fr-SN')} FCFA
                      </span>
                    </div>
                  )}
                </div>

                {s.notes && (
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10, fontStyle: 'italic' }}>
                    {s.notes}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button className="btn btn-danger btn-xs" onClick={() => handleDelete(s.id)}>
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ADD MODAL */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={e => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="modal">
            <div className="modal-hd">
              <h2>📡 Nouvel Abonnement</h2>
              <div className="modal-close" onClick={() => { setShowModal(false); setForm(emptyForm()) }}>✕</div>
            </div>
            <div className="modal-body">
              <div className="g2">
                <div className="field">
                  <label>Nom du client *</label>
                  <input placeholder="Ex: Fatou Ndiaye" value={form.client_name}
                    onChange={e => setF('client_name', e.target.value)} />
                </div>
                <div className="field">
                  <label>Type</label>
                  <select value={form.sub_type} onChange={e => setF('sub_type', e.target.value)}>
                    <option value="wifi">📶 WiFi Zone</option>
                    <option value="iptv">📺 IPTV</option>
                    <option value="other">🔌 Autre</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label>Service / Opérateur *</label>
                <input placeholder="Ex: Orange WiFi Box, My IPTV Pro..."
                  value={form.service_name} onChange={e => setF('service_name', e.target.value)} />
              </div>

              <div className="g2">
                <div className="field">
                  <label>Login / Identifiant</label>
                  <input placeholder="username" value={form.login}
                    onChange={e => setF('login', e.target.value)} />
                </div>
                <div className="field">
                  <label>Mot de passe</label>
                  <input placeholder="••••••••" value={form.password}
                    onChange={e => setF('password', e.target.value)} />
                </div>
              </div>

              <div className="g2">
                <div className="field">
                  <label>Date d'expiration *</label>
                  <input type="date" value={form.expiry_date}
                    onChange={e => setF('expiry_date', e.target.value)} />
                </div>
                <div className="field">
                  <label>Mensualité (FCFA)</label>
                  <input type="number" placeholder="0" min="0" value={form.monthly_fee}
                    onChange={e => setF('monthly_fee', e.target.value)} />
                </div>
              </div>

              <div className="field">
                <label>Notes</label>
                <input placeholder="Remarques..." value={form.notes}
                  onChange={e => setF('notes', e.target.value)} />
              </div>

              {/* Days preview */}
              {previewDays !== null && (
                <div className={`profit-box ${previewDays >= 0 ? 'positive' : 'negative'}`}>
                  <div className="pb-label">Jours restants</div>
                  <div className="pb-val" style={{
                    color: previewDays < 0 ? 'var(--red)' : previewDays <= 7 ? 'var(--orange)' : 'var(--green)',
                  }}>
                    {previewDays < 0 ? 'Déjà expiré !' : `${previewDays} jours`}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }}
                  onClick={() => { setShowModal(false); setForm(emptyForm()) }}>
                  Annuler
                </button>
                <button className="btn btn-primary" style={{ flex: 2 }}
                  onClick={handleSubmit} disabled={saving}>
                  {saving ? <><span className="spinner" /> Enregistrement...</> : '✓ Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
