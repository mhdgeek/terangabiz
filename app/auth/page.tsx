'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ALL_SECTORS, checkPassword, passwordStrength } from '@/lib/constants'

type Tab  = 'login' | 'register' | 'forgot'

export default function AuthPage() {
  const router = useRouter()
  const { signIn, signUp, resetPassword } = useAuth()

  const [tab,  setTab]  = useState<Tab>('login')
  const [step, setStep] = useState(1)

  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [confirmPwd,  setConfirmPwd]  = useState('')
  const [fullName,    setFullName]    = useState('')
  const [businessName,setBusinessName]= useState('')
  const [sectors,     setSectors]     = useState<string[]>([])
  const [showPwd,     setShowPwd]     = useState(false)
  const [showCfm,     setShowCfm]     = useState(false)

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  const clearError = () => setError('')
  const pwdStrength = passwordStrength(password)
  const pwdCheck    = checkPassword(password)

  const switchTab = (t: Tab) => {
    setTab(t); setStep(1); setError(''); setSuccess('')
  }

  const handleLogin = async () => {
    if (!email || !password) { setError('Remplissez tous les champs'); return }
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) { setError(error); return }
    router.replace('/dashboard')
  }

  const handleStep1 = () => {
    if (!fullName.trim())      { setError('Entrez votre nom complet'); return }
    if (!businessName.trim())  { setError('Entrez le nom de votre business'); return }
    if (!email.includes('@'))  { setError('Adresse email invalide'); return }
    if (!pwdCheck.valid)       { setError('Le mot de passe ne respecte pas toutes les règles'); return }
    if (password !== confirmPwd) { setError('Les mots de passe ne correspondent pas'); return }
    setError(''); setStep(2)
  }

  const handleRegister = async () => {
    if (sectors.length === 0) { setError("Choisissez au moins un secteur d'activité"); return }
    setLoading(true)
    const { error } = await signUp(email, password, fullName, businessName, sectors)
    setLoading(false)
    if (error) { setError(error); return }
    router.replace('/dashboard')
  }

  const handleForgot = async () => {
    if (!email.includes('@')) { setError('Adresse email invalide'); return }
    setLoading(true)
    const { error } = await resetPassword(email)
    setLoading(false)
    if (error) { setError(error); return }
    setSuccess('Lien envoyé ! Vérifiez votre boîte mail.')
  }

  const PwdInput = ({
    value, onChange, show, onToggle, placeholder,
  }: { value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; placeholder: string }) => (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={e => { onChange(e.target.value); clearError() }}
        style={{ paddingRight: 44 }}
      />
      <button
        type="button"
        onClick={onToggle}
        style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text3)',
        }}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  )

  return (
    <>
      <div className="bg-fx" />
      <div className="auth-wrap">
        <div className="auth-card">
          {/* LOGO */}
          <div className="auth-logo">
            <div className="alm">💼</div>
            <h1>Teranga<span>Biz</span></h1>
            <p>Gérez votre business comme un pro 🇸🇳</p>
          </div>

          {/* TABS (not shown on forgot) */}
          {tab !== 'forgot' && (
            <div className="tab-row">
              <button className={`tab-btn ${tab === 'login'    ? 'active' : ''}`} onClick={() => switchTab('login')}>
                Connexion
              </button>
              <button className={`tab-btn ${tab === 'register' ? 'active' : ''}`} onClick={() => switchTab('register')}>
                Créer un compte
              </button>
            </div>
          )}

          {/* ERROR / SUCCESS */}
          {error   && <div className="alert alert-err" style={{ marginBottom: 14 }}>⚠️ {error}</div>}
          {success && <div className="alert alert-ok"  style={{ marginBottom: 14 }}>✅ {success}</div>}

          {/* ── LOGIN ── */}
          {tab === 'login' && (
            <>
              <div className="field">
                <label>Email</label>
                <input type="email" placeholder="votre@email.com" value={email}
                  onChange={e => { setEmail(e.target.value); clearError() }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()} />
              </div>
              <div className="field">
                <label>Mot de passe</label>
                <PwdInput value={password} onChange={setPassword}
                  show={showPwd} onToggle={() => setShowPwd(p => !p)}
                  placeholder="••••••••" />
              </div>
              <button className="btn btn-primary btn-full" onClick={handleLogin} disabled={loading}>
                {loading ? <><span className="spinner" /> Connexion...</> : 'Se connecter'}
              </button>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12,
                  cursor: 'pointer', marginTop: 12, width: '100%', textAlign: 'center' }}
                onClick={() => switchTab('forgot')}
              >
                Mot de passe oublié ?
              </button>
            </>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {tab === 'forgot' && (
            <>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 13,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}
                onClick={() => switchTab('login')}
              >
                ← Retour à la connexion
              </button>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>🔑 Réinitialiser le mot de passe</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                  Entrez votre email. Vous recevrez un lien pour créer un nouveau mot de passe.
                </div>
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" placeholder="votre@email.com" value={email}
                  onChange={e => { setEmail(e.target.value); clearError() }}
                  onKeyDown={e => e.key === 'Enter' && handleForgot()} />
              </div>
              <button className="btn btn-primary btn-full" onClick={handleForgot}
                disabled={loading || !!success}>
                {loading ? <><span className="spinner" /> Envoi...</> : 'Envoyer le lien'}
              </button>
            </>
          )}

          {/* ── REGISTER ── */}
          {tab === 'register' && (
            <>
              {/* Progress bar */}
              <div className="step-bar" style={{ marginBottom: 6 }}>
                <div className={`step-seg ${step >= 1 ? 'done' : 'todo'}`} />
                <div className={`step-seg ${step >= 2 ? 'done' : 'todo'}`} />
              </div>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 18 }}>
                {step === 1 ? 'Étape 1/2 — Informations du compte' : "Étape 2/2 — Vos secteurs d'activité"}
              </p>

              {step === 1 && (
                <>
                  <div className="field">
                    <label>Nom complet *</label>
                    <input placeholder="Ex: Moussa Diallo" value={fullName}
                      onChange={e => { setFullName(e.target.value); clearError() }} />
                  </div>
                  <div className="field">
                    <label>Nom du business *</label>
                    <input placeholder="Ex: Dakar Tech Solutions" value={businessName}
                      onChange={e => { setBusinessName(e.target.value); clearError() }} />
                  </div>
                  <div className="field">
                    <label>Email *</label>
                    <input type="email" placeholder="votre@email.com" value={email}
                      onChange={e => { setEmail(e.target.value); clearError() }} />
                  </div>
                  <div className="field">
                    <label>Mot de passe *</label>
                    <PwdInput value={password} onChange={setPassword}
                      show={showPwd} onToggle={() => setShowPwd(p => !p)}
                      placeholder="Minimum 8 caractères" />

                    {/* Strength indicator */}
                    {password.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', gap: 3, marginBottom: 5 }}>
                          {[1,2,3,4,5,6].map(i => (
                            <div key={i} style={{
                              flex: 1, height: 3, borderRadius: 99,
                              background: i <= pwdStrength.score ? pwdStrength.color : 'var(--border)',
                              transition: 'background 0.3s',
                            }} />
                          ))}
                        </div>
                        <div style={{ fontSize: 11, color: pwdStrength.color, fontWeight: 600, marginBottom: 6 }}>
                          {pwdStrength.label}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px' }}>
                          {[
                            { re: /^.{8,}$/,       label: '8 caractères min' },
                            { re: /[A-Z]/,          label: 'Majuscule'        },
                            { re: /[a-z]/,          label: 'Minuscule'        },
                            { re: /[0-9]/,          label: 'Chiffre'          },
                            { re: /[^A-Za-z0-9]/,   label: 'Caractère spécial' },
                          ].map(({ re, label }) => {
                            const ok = re.test(password)
                            return (
                              <div key={label} style={{
                                fontSize: 10,
                                color: ok ? 'var(--green)' : 'var(--text3)',
                                display: 'flex', alignItems: 'center', gap: 4,
                              }}>
                                {ok ? '✓' : '○'} {label}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="field">
                    <label>Confirmer le mot de passe *</label>
                    <PwdInput value={confirmPwd} onChange={setConfirmPwd}
                      show={showCfm} onToggle={() => setShowCfm(p => !p)}
                      placeholder="••••••••" />
                    {confirmPwd && confirmPwd !== password && (
                      <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>
                        Les mots de passe ne correspondent pas
                      </div>
                    )}
                  </div>
                  <button className="btn btn-primary btn-full" onClick={handleStep1}>
                    Suivant →
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>
                    Choisissez vos domaines — votre dashboard sera personnalisé 🎯
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)', padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>
                      🖧 Service
                    </span>
                    <span style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--green)', padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>
                      🛍️ Commerce
                    </span>
                  </div>
                  <div className="sector-grid">
                    {ALL_SECTORS.map(s => (
                      <div
                        key={s.id}
                        className={`sc ${sectors.includes(s.id) ? 'sel' : ''}`}
                        style={{
                          borderColor: sectors.includes(s.id) ? s.color : undefined,
                          background:  sectors.includes(s.id) ? `${s.color}15` : undefined,
                        }}
                        onClick={() => setSectors(prev =>
                          prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id]
                        )}
                      >
                        <span className="sico">{s.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div className="slbl">{s.label}</div>
                          <div style={{ fontSize: 9, marginTop: 1,
                            color: s.type === 'service' ? 'var(--accent)' : 'var(--green)' }}>
                            {s.type === 'service' ? '⚙️ Service' : '🛍️ Commerce'}
                          </div>
                        </div>
                        {sectors.includes(s.id) && <span className="sck">✓</span>}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-ghost" style={{ flex: '0 0 38%' }} onClick={() => setStep(1)}>
                      ← Retour
                    </button>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleRegister} disabled={loading}>
                      {loading
                        ? <><span className="spinner" /> Création...</>
                        : `Créer mon compte (${sectors.length} secteur${sectors.length !== 1 ? 's' : ''})`}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
      <footer>
        <strong>TERANGABIZ-SN</strong> · garde un œil sur tes revenus · Made in Sénégal 🇸🇳
      </footer>
    </>
  )
}
