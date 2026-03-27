'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ALL_SECTORS, checkPassword, passwordStrength } from '@/lib/constants'

export default function AuthPage() {
  const router = useRouter()
  const { signIn, signUp, resetPassword } = useAuth()

  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    email: '', password: '', confirmPwd: '', name: '', businessName: ''
  })
  const [sectors, setSectors] = useState<string[]>([])
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)

  const setF = (k: string, v: string) => { setForm(p => ({ ...p, [k]: v })); setError('') }

  const pwdCheck = checkPassword(form.password)
  const pwdStrength = passwordStrength(form.password)

  const toggleSector = (id: string) =>
    setSectors(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleLogin = async () => {
    if (!form.email || !form.password) { setError('Remplissez tous les champs'); return }
    setLoading(true)
    const { error } = await signIn(form.email, form.password)
    setLoading(false)
    if (error) { setError(error); return }
    router.replace('/dashboard')
  }

  const handleStep1 = () => {
    if (!form.name.trim()) { setError('Entrez votre nom complet'); return }
    if (!form.businessName.trim()) { setError('Entrez le nom de votre business'); return }
    if (!form.email.trim() || !form.email.includes('@')) { setError('Email invalide'); return }
    if (!pwdCheck.valid) { setError('Le mot de passe ne respecte pas les règles'); return }
    if (form.password !== form.confirmPwd) { setError('Les mots de passe ne correspondent pas'); return }
    setError(''); setStep(2)
  }

  const handleRegister = async () => {
    if (sectors.length === 0) { setError("Sélectionnez au moins un secteur d'activité"); return }
    setLoading(true)
    const { error } = await signUp(form.email, form.password, form.name, form.businessName, sectors)
    setLoading(false)
    if (error) { setError(error); return }
    router.replace('/dashboard')
  }

  const handleForgot = async () => {
    if (!form.email.trim() || !form.email.includes('@')) { setError('Entrez votre email valide'); return }
    setLoading(true)
    const { error } = await resetPassword(form.email)
    setLoading(false)
    if (error) { setError(error); return }
    setSuccess('Email envoyé ! Vérifiez votre boîte mail pour le lien de réinitialisation.')
  }

  return (
    <>
      <div className="bg-fx" />
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="alm">💼</div>
            <h1>Teranga<span>Biz</span></h1>
            <p>Gérez votre business comme un pro 🇸🇳</p>
          </div>

          {tab !== 'forgot' && (
            <div className="tab-row">
              <button className={`tab-btn ${tab === 'login' ? 'active' : ''}`}
                onClick={() => { setTab('login'); setError(''); setStep(1) }}>Connexion</button>
              <button className={`tab-btn ${tab === 'register' ? 'active' : ''}`}
                onClick={() => { setTab('register'); setError(''); setStep(1) }}>Créer un compte</button>
            </div>
          )}

          {error && <div className="alert alert-err" style={{ marginBottom: 16 }}>⚠️ {error}</div>}
          {success && <div className="alert alert-ok" style={{ marginBottom: 16 }}>✅ {success}</div>}

          {/* ── LOGIN ── */}
          {tab === 'login' && (
            <>
              <div className="field">
                <label>Email</label>
                <input type="email" placeholder="votre@email.com" value={form.email}
                  onChange={e => setF('email', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()} />
              </div>
              <div className="field">
                <label>Mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="••••••••" value={form.password}
                    onChange={e => setF('password', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowPwd(p => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text3)' }}>
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <button className="btn btn-primary btn-full" onClick={handleLogin} disabled={loading}>
                {loading && <span className="spinner" />}
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, cursor: 'pointer', marginTop: 12, width: '100%', textAlign: 'center' }}
                onClick={() => { setTab('forgot'); setError(''); setSuccess('') }}>
                Mot de passe oublié ?
              </button>
            </>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {tab === 'forgot' && (
            <>
              <div style={{ marginBottom: 20 }}>
                <button style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={() => { setTab('login'); setError(''); setSuccess('') }}>
                  ← Retour à la connexion
                </button>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>🔑 Réinitialiser le mot de passe</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>Entrez votre email. Vous recevrez un lien pour créer un nouveau mot de passe.</div>
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" placeholder="votre@email.com" value={form.email}
                  onChange={e => setF('email', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleForgot()} />
              </div>
              <button className="btn btn-primary btn-full" onClick={handleForgot} disabled={loading || !!success}>
                {loading && <span className="spinner" />}
                {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
              </button>
            </>
          )}

          {/* ── REGISTER ── */}
          {tab === 'register' && (
            <>
              <div className="step-bar">
                <div className={`step-seg ${step >= 1 ? 'done' : 'todo'}`} />
                <div className={`step-seg ${step >= 2 ? 'done' : 'todo'}`} />
              </div>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 18 }}>
                {step === 1 ? "Étape 1/2 — Informations du compte" : "Étape 2/2 — Vos secteurs d'activité"}
              </p>

              {step === 1 ? (
                <>
                  <div className="field">
                    <label>Nom complet *</label>
                    <input placeholder="Ex: Moussa Diallo" value={form.name} onChange={e => setF('name', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Nom du business *</label>
                    <input placeholder="Ex: Dakar Tech Solutions" value={form.businessName} onChange={e => setF('businessName', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Email *</label>
                    <input type="email" placeholder="votre@email.com" value={form.email} onChange={e => setF('email', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Mot de passe *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPwd ? 'text' : 'password'}
                        placeholder="Min. 8 caractères"
                        value={form.password}
                        onChange={e => setF('password', e.target.value)}
                        style={{ paddingRight: 44 }}
                      />
                      <button type="button" onClick={() => setShowPwd(p => !p)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text3)' }}>
                        {showPwd ? '🙈' : '👁️'}
                      </button>
                    </div>

                    {/* Password strength bar */}
                    {form.password.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
                          {[1,2,3,4,5,6].map(i => (
                            <div key={i} style={{
                              flex: 1, height: 3, borderRadius: 99,
                              background: i <= pwdStrength.score ? pwdStrength.color : 'var(--border)',
                              transition: 'background 0.3s'
                            }} />
                          ))}
                        </div>
                        <div style={{ fontSize: 11, color: pwdStrength.color, fontWeight: 600, marginBottom: 6 }}>
                          {pwdStrength.label}
                        </div>
                        {/* Rules checklist */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 8px' }}>
                          {[
                            { rule: /^.{8,}$/, label: '8 caractères min' },
                            { rule: /[A-Z]/, label: 'Majuscule' },
                            { rule: /[a-z]/, label: 'Minuscule' },
                            { rule: /[0-9]/, label: 'Chiffre' },
                            { rule: /[^A-Za-z0-9]/, label: 'Caractère spécial' },
                          ].map(({ rule, label }) => {
                            const ok = rule.test(form.password)
                            return (
                              <div key={label} style={{ fontSize: 10, color: ok ? 'var(--green)' : 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span>{ok ? '✓' : '○'}</span> {label}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="field">
                    <label>Confirmer le mot de passe *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPwd ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={form.confirmPwd}
                        onChange={e => setF('confirmPwd', e.target.value)}
                        style={{ paddingRight: 44, borderColor: form.confirmPwd && form.confirmPwd !== form.password ? 'var(--red)' : undefined }}
                      />
                      <button type="button" onClick={() => setShowConfirmPwd(p => !p)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text3)' }}>
                        {showConfirmPwd ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {form.confirmPwd && form.confirmPwd !== form.password && (
                      <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>Les mots de passe ne correspondent pas</div>
                    )}
                  </div>

                  <button className="btn btn-primary btn-full" onClick={handleStep1}>Suivant →</button>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>
                    Choisissez vos domaines d'activité — votre dashboard sera personnalisé 🎯
                  </p>
                  {/* Highlight service sectors */}
                  <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ background: 'rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: 99 }}>🖧 Service (pas de ventes)</span>
                    <span style={{ background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 99, color: 'var(--green)' }}>🛍️ Commerce (ventes)</span>
                  </div>
                  <div className="sector-grid">
                    {ALL_SECTORS.map(s => (
                      <div key={s.id} className={`sc ${sectors.includes(s.id) ? 'sel' : ''}`}
                        onClick={() => toggleSector(s.id)}
                        style={{ borderColor: sectors.includes(s.id) ? s.color : undefined, background: sectors.includes(s.id) ? `${s.color}15` : undefined }}>
                        <span className="sico">{s.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div className="slbl">{s.label}</div>
                          <div style={{ fontSize: 9, color: s.type === 'service' ? 'var(--accent)' : 'var(--green)', marginTop: 1 }}>
                            {s.type === 'service' ? '⚙️ Service' : '🛍️ Commerce'}
                          </div>
                        </div>
                        {sectors.includes(s.id) && <span className="sck">✓</span>}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-ghost" style={{ width: '38%' }} onClick={() => setStep(1)}>← Retour</button>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleRegister} disabled={loading}>
                      {loading && <span className="spinner" />}
                      {loading ? 'Création...' : `Créer mon compte (${sectors.length} secteur${sectors.length !== 1 ? 's' : ''})`}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
      <footer><strong>TERANGABIZ-SN</strong> · garde un œil sur tes revenus · Made in Sénégal 🇸🇳</footer>
    </>
  )
}
