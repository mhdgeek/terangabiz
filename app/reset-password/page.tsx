'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { checkPassword, passwordStrength } from '@/lib/constants'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready,    setReady]    = useState(false)
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [showCfm,  setShowCfm]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const pwdCheck    = checkPassword(password)
  const pwdStrength = passwordStrength(password)

  const handleReset = async () => {
    if (!pwdCheck.valid) {
      setError('Le mot de passe ne respecte pas les règles de sécurité')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess(true)
    setTimeout(() => router.replace('/auth'), 3000)
  }

  return (
    <>
      <div className="bg-fx" />
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="alm">🔑</div>
            <h1>Teranga<span>Biz</span></h1>
            <p>Nouveau mot de passe</p>
          </div>

          {success ? (
            <div className="alert alert-ok">
              ✅ Mot de passe mis à jour ! Redirection en cours...
            </div>
          ) : !ready ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13, color: 'var(--text2)' }}>
                Vérification du lien de réinitialisation...
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="alert alert-err" style={{ marginBottom: 16 }}>⚠️ {error}</div>
              )}

              <div className="field">
                <label>Nouveau mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Minimum 8 caractères"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowPwd(p => !p)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text3)',
                  }}>
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>

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
                        { re: /^.{8,}$/,     label: '8 caractères min'  },
                        { re: /[A-Z]/,        label: 'Majuscule'         },
                        { re: /[a-z]/,        label: 'Minuscule'         },
                        { re: /[0-9]/,        label: 'Chiffre'           },
                        { re: /[^A-Za-z0-9]/, label: 'Caractère spécial' },
                      ].map(({ re, label }) => {
                        const ok = re.test(password)
                        return (
                          <div key={label} style={{ fontSize: 10, color: ok ? 'var(--green)' : 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {ok ? '✓' : '○'} {label}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="field">
                <label>Confirmer le mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCfm ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); setError('') }}
                    style={{
                      paddingRight: 44,
                      borderColor: confirm && confirm !== password ? 'var(--red)' : undefined,
                    }}
                  />
                  <button type="button" onClick={() => setShowCfm(p => !p)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text3)',
                  }}>
                    {showCfm ? '🙈' : '👁️'}
                  </button>
                </div>
                {confirm && confirm !== password && (
                  <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>
                    Les mots de passe ne correspondent pas
                  </div>
                )}
              </div>

              <button
                className="btn btn-primary btn-full"
                onClick={handleReset}
                disabled={loading}
              >
                {loading
                  ? <><span className="spinner" /> Mise à jour...</>
                  : '✓ Enregistrer le nouveau mot de passe'}
              </button>
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
