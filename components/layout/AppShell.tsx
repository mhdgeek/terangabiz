'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Sidebar from './Sidebar'

interface AppShellProps {
  children: React.ReactNode
  title: React.ReactNode
  actions?: React.ReactNode
}

export default function AppShell({ children, title, actions }: AppShellProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
  }, [user, loading, router])

  // Pendant le chargement → écran minimal
  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 13, margin: '0 auto 16px',
          background: 'linear-gradient(135deg,var(--accent),var(--accent2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
        }}>💼</div>
        <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto' }} />
      </div>
    </div>
  )

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
