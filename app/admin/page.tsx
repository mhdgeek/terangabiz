'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { ALL_SECTORS, avatarColor, initials, fmt } from '@/lib/constants'
import { toast } from '@/components/ui/Toast'

interface Profile {
  id: string
  email: string
  full_name: string
  business_name: string
  sectors: string[]
  created_at: string
}

export default function AdminPage() {
  const { profile } = useAuth()
  const router = useRouter()

  const [users, setUsers] = useState<Profile[]>([])
  const [activityMap, setActivityMap] = useState<Record<string, { total: number; last: string }>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)

  useEffect(() => {
    if (profile && profile.role !== 'admin') router.replace('/dashboard')
  }, [profile, router])

  const fetchAll = useCallback(async () => {
    if (!profile || profile.role !== 'admin') return
    setLoading(true)

    const [usersRes, salesRes, subsRes, intervRes] = await Promise.all([
      supabase.from('profiles').select('id, email, full_name, business_name, sectors, created_at').neq('role', 'admin').order('created_at', { ascending: false }),
      supabase.from('sales').select('user_id, created_at'),
      supabase.from('subscriptions').select('user_id, created_at'),
      supabase.from('interventions').select('user_id, created_at'),
    ])

    const allUsers = usersRes.data || []
    setUsers(allUsers)

    // Compute activity per user (number of actions + last active date)
    const map: Record<string, { total: number; last: string }> = {}
    allUsers.forEach(u => { map[u.id] = { total: 0, last: u.created_at } })

    const rows = [...(salesRes.data || []), ...(subsRes.data || []), ...(intervRes.data || [])]
    rows.forEach(r => {
      if (!map[r.user_id]) return
      map[r.user_id].total++
      if (r.created_at > map[r.user_id].last) map[r.user_id].last = r.created_at
    })
    setActivityMap(map)
    setLoading(false)
  }, [profile])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── TIME HELPERS ──
  const now = new Date()
  const todayStr = now.toDateString()
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const day30Ago = new Date(now); day30Ago.setDate(now.getDate() - 30)

  const daysSince = (d: string) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
    if (diff === 0) return "Aujourd'hui"
    if (diff === 1) return 'Hier'
    if (diff < 7) return `${diff}j`
    if (diff < 30) return `${Math.floor(diff / 7)}sem`
    return `${Math.floor(diff / 30)}mois`
  }

  // ── KPIs ──
  const total = users.length
  const todayNew = users.filter(u => new Date(u.created_at).toDateString() === todayStr).length
  const weekNew = users.filter(u => new Date(u.created_at) >= weekAgo).length
  const monthNew = users.filter(u => new Date(u.created_at) >= monthStart).length
  const activeUsers = Object.values(activityMap).filter(a => a.total > 0).length
  const recentlyActive = Object.values(activityMap).filter(a => a.total > 0 && new Date(a.last) >= day30Ago).length
  const activationRate = total > 0 ? Math.round((activeUsers / total) * 100) : 0

  // ── DAILY CHART (14 days) ──
  const dailyData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i))
    return {
      label: d.toLocaleDateString('fr-SN', { day: 'numeric', month: 'short' }),
      count: users.filter(u => new Date(u.created_at).toDateString() === d.toDateString()).length,
      isToday: d.toDateString() === todayStr,
    }
  })
  const maxDaily = Math.max(...dailyData.map(d => d.count), 1)

  // ── MONTHLY CHART (12 months) ──
  const monthlyMap: Record<string, number> = {}
  users.forEach(u => {
    const d = new Date(u.created_at)
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyMap[k] = (monthlyMap[k] || 0) + 1
  })
  const monthlyData = Object.entries(monthlyMap).sort((a, b) => a[0].localeCompare(b[0])).slice(-12)
  const maxMonthly = Math.max(...monthlyData.map(m => m[1]), 1)

  // ── SECTOR POPULARITY ──
  const sectorMap: Record<string, number> = {}
  users.forEach(u => (u.sectors || []).forEach(s => { sectorMap[s] = (sectorMap[s] || 0) + 1 }))
  const topSectors = Object.entries(sectorMap).sort((a, b) => b[1] - a[1])

  // ── FILTERED USERS ──
  const filtered = users.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.business_name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSendReset = async () => {
    if (!resetEmail) return
    setResetLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setResetLoading(false)
    if (error) { toast.err('Erreur : ' + error.message); return }
    toast.ok(`Lien de réinitialisation envoyé à ${resetEmail} ✅`)
    setSelectedUser(null); setResetEmail('')
  }

  return (
    <AppShell title={<>Dashboard <span>Admin</span></>}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : (
        <>
          {/* ══ KPIs ══ */}
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            {[
              { icon: '👥', label: 'Utilisateurs total',      val: fmt(total),            sub: `+${todayNew} aujourd'hui`,      color: '#6366f1' },
              { icon: '📅', label: 'Inscrits ce mois',        val: fmt(monthNew),          sub: `+${weekNew} cette semaine`,     color: '#8b5cf6' },
              { icon: '✅', label: 'Utilisateurs actifs',     val: fmt(activeUsers),       sub: 'Ont créé au moins 1 saisie',    color: '#10b981' },
              { icon: '🔥', label: 'Actifs (30 derniers j)',  val: fmt(recentlyActive),    sub: 'Activité récente',              color: '#06b6d4' },
              { icon: '😴', label: 'Inactifs',                val: fmt(total - activeUsers), sub: 'Aucune saisie encore',        color: '#f59e0b' },
              { icon: '📊', label: "Taux d'activation",       val: `${activationRate}%`,   sub: 'Users actifs / total inscrits', color: '#ec4899' },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-glow" style={{ background: s.color }} />
                <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                <div className="stat-val" style={{ fontSize: 22 }}>{s.val}</div>
                <div className="stat-label">{s.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* ══ CHARTS ROW ══ */}
          <div className="g2" style={{ marginBottom: 16 }}>

            {/* Daily registrations */}
            <div className="card">
              <div className="card-title">📅 Inscriptions — 14 derniers jours</div>
              <div className="bar-wrap" style={{ height: 110 }}>
                {dailyData.map((d, i) => (
                  <div key={i} className="bar-col">
                    <div className="bar-fill" style={{
                      height: `${Math.max((d.count / maxDaily) * 100, d.count > 0 ? 6 : 2)}%`,
                      background: d.isToday ? 'var(--accent)' : 'linear-gradient(180deg,var(--accent2),var(--accent))',
                      opacity: d.count === 0 ? 0.15 : 1,
                    }} title={`${d.label} : ${d.count} inscription(s)`} />
                    <span className="bar-lbl" style={{ fontSize: 8 }}>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly registrations */}
            <div className="card">
              <div className="card-title">📈 Croissance — 12 derniers mois</div>
              <div className="bar-wrap" style={{ height: 110 }}>
                {monthlyData.map(([key, count]) => {
                  const [y, m] = key.split('-')
                  const label = new Date(+y, +m - 1).toLocaleDateString('fr-SN', { month: 'short' })
                  return (
                    <div key={key} className="bar-col">
                      <div className="bar-fill" style={{
                        height: `${Math.max((count / maxMonthly) * 100, 4)}%`,
                        background: 'linear-gradient(180deg,var(--green),var(--accent3))',
                      }} title={`${label} : ${count}`} />
                      <span className="bar-lbl" style={{ fontSize: 8 }}>{label}</span>
                    </div>
                  )
                })}
                {monthlyData.length === 0 && (
                  <div className="empty-state" style={{ padding: '20px 0', width: '100%' }}>
                    <div className="ei">📊</div><div className="et" style={{ fontSize: 13 }}>Pas de données</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ══ UTILISATION + SECTEURS ══ */}
          <div className="g2" style={{ marginBottom: 16 }}>

            {/* Fréquence d'utilisation */}
            <div className="card">
              <div className="card-title">⚡ Fréquence d'utilisation</div>
              {[
                { label: "Nouveaux aujourd'hui",      val: todayNew,                        color: 'var(--green)' },
                { label: 'Nouveaux cette semaine',    val: weekNew,                         color: 'var(--accent)' },
                { label: 'Nouveaux ce mois',          val: monthNew,                        color: 'var(--accent2)' },
                { label: 'Actifs (30 derniers jours)', val: recentlyActive,                 color: 'var(--accent3)' },
                { label: 'Actifs total',              val: activeUsers,                     color: '#10b981' },
                { label: 'Jamais utilisé',            val: total - activeUsers,             color: 'var(--text3)' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>{row.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 70, height: 4, background: 'var(--border)', borderRadius: 99 }}>
                      <div style={{ height: '100%', borderRadius: 99, background: row.color, width: total > 0 ? `${(row.val / total) * 100}%` : '0%' }} />
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 18, color: row.color, minWidth: 32, textAlign: 'right' }}>{row.val}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Secteurs populaires */}
            <div className="card">
              <div className="card-title">🏭 Secteurs les plus utilisés</div>
              {topSectors.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px 0' }}>
                  <div className="ei">🏭</div><div className="et" style={{ fontSize: 13 }}>Pas de données</div>
                </div>
              ) : topSectors.map(([sectorId, count]) => {
                const s = ALL_SECTORS.find(x => x.id === sectorId)
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={sectorId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{s?.icon || '📦'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s?.label || sectorId}
                      </div>
                      <div style={{ height: 3, background: 'var(--border)', borderRadius: 99 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: s?.color || 'var(--accent)', borderRadius: 99 }} />
                      </div>
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>{count} ({pct}%)</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ══ LISTE UTILISATEURS ══ */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">👥 Liste des utilisateurs ({fmt(total)})</div>
              <div className="search-wrap">
                <span style={{ color: 'var(--text3)' }}>🔍</span>
                <input placeholder="Nom ou business..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Business</th>
                    <th>Secteurs</th>
                    <th>Inscrit le</th>
                    <th>Dernière activité</th>
                    <th>Statut</th>
                    <th>Reset MDP</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7}>
                      <div className="empty-state" style={{ padding: '32px 0' }}>
                        <div className="ei">👥</div>
                        <div className="et">{search ? 'Aucun résultat' : 'Aucun utilisateur inscrit'}</div>
                      </div>
                    </td></tr>
                  ) : filtered.map(u => {
                    const act = activityMap[u.id] || { total: 0, last: u.created_at }
                    const isActive = act.total > 0
                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="avatar" style={{ background: avatarColor(u.full_name), width: 34, height: 34, borderRadius: 10, fontSize: 13 }}>
                              {initials(u.full_name)}
                            </div>
                            <span style={{ fontWeight: 600, fontSize: 13 }}>{u.full_name}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 12, fontWeight: 500, color: 'var(--accent)' }}>
                          {u.business_name || <span style={{ color: 'var(--text3)' }}>—</span>}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            {(u.sectors || []).slice(0, 5).map((id: string) => {
                              const s = ALL_SECTORS.find(x => x.id === id)
                              return s ? <span key={id} title={s.label} style={{ fontSize: 16 }}>{s.icon}</span> : null
                            })}
                            {(u.sectors || []).length > 5 && (
                              <span style={{ fontSize: 10, color: 'var(--text3)', alignSelf: 'center' }}>+{u.sectors.length - 5}</span>
                            )}
                          </div>
                        </td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                          {new Date(u.created_at).toLocaleDateString('fr-SN')}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                          {isActive ? daysSince(act.last) : <span style={{ color: 'var(--text3)' }}>—</span>}
                        </td>
                        <td>
                          <span className={`badge ${isActive ? 'badge-green' : 'badge-gray'}`}>
                            {isActive ? '● Actif' : '○ Inactif'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-ghost btn-xs"
                            title="Envoyer un lien de réinitialisation"
                            onClick={() => { setSelectedUser(u); setResetEmail(u.email) }}>
                            🔑 Reset
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══ MODAL RESET MDP ══ */}
      {selectedUser && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedUser(null)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-hd">
              <h2>🔑 Réinitialisation mot de passe</h2>
              <div className="modal-close" onClick={() => { setSelectedUser(null); setResetEmail('') }}>✕</div>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg3)', borderRadius: 10, marginBottom: 18 }}>
                <div className="avatar" style={{ background: avatarColor(selectedUser.full_name), width: 40, height: 40, borderRadius: 11, fontSize: 15 }}>
                  {initials(selectedUser.full_name)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedUser.full_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{selectedUser.business_name || 'Aucun business renseigné'}</div>
                </div>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 18, lineHeight: 1.7 }}>
                Un lien sécurisé sera envoyé par email à cet utilisateur.
                Il pourra créer un nouveau mot de passe. Le lien expire après <strong style={{ color: 'var(--text)' }}>1 heure</strong>.
              </p>

              <div style={{ padding: '10px 14px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, marginBottom: 18, fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent)' }}>
                📧 {selectedUser.email}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setSelectedUser(null); setResetEmail('') }}>
                  Annuler
                </button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSendReset} disabled={resetLoading}>
                  {resetLoading && <span className="spinner" />}
                  {resetLoading ? 'Envoi...' : '📧 Envoyer le lien'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
