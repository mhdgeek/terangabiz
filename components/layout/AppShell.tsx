'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Sidebar from './Sidebar'

interface Props {
  children: React.ReactNode
  title: React.ReactNode
  actions?: React.ReactNode
}

export default function AppShell({ children, title, actions }: Props) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
  }, [user, loading, router])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 16,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'linear-gradient(135deg,var(--accent),var(--accent2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          boxShadow: '0 0 24px rgba(99,102,241,0.4)',
        }}>💼</div>
        <div className="spinner" style={{ width: 22, height: 22 }} />
      </div>
    )
  }

  if (!user) return null

  return (
    <>
      <div className="bg-fx" />
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <div className="page-wrap">
            <div className="topbar">
              <div className="page-title">{title}</div>
              {actions && <div className="topbar-actions">{actions}</div>}
            </div>
            {children}
          </div>
          <footer>
            <strong>TERANGABIZ-SN</strong> · garde un œil sur tes revenus · Made in Sénégal 🇸🇳
          </footer>
        </div>
      </div>
    </>
  )
}
