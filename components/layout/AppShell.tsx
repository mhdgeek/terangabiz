'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Sidebar from './Sidebar'
import Toast from '@/components/ui/Toast'

interface AppShellProps {
  children: React.ReactNode
  title: React.ReactNode
  actions?: React.ReactNode
}

export default function AppShell({ children, title, actions }: AppShellProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
  }, [user, loading, router])

  if (loading || !user) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
    </div>
  )

  return (
    <>
      <div className="bg-fx" />
      <div className="app-layout">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-content">
          <div className="page-wrap">
            <div className="topbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button className="btn btn-ghost btn-icon" style={{ display: 'none' }}
                  id="menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
                <div className="page-title">{title}</div>
              </div>
              {actions && <div className="topbar-actions">{actions}</div>}
            </div>
            {children}
          </div>
          <footer>
            <strong>TERANGABIZ-SN</strong> · garde un œil sur tes revenus · Made in Sénégal 🇸🇳
          </footer>
        </div>
      </div>
      <Toast />
    </>
  )
}
