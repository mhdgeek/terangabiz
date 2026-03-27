'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ALL_SECTORS, avatarColor, initials } from '@/lib/constants'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface SidebarProps { open: boolean; onClose: () => void }

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, signOut } = useAuth()
  const [expiringCount, setExpiringCount] = useState(0)

  useEffect(() => {
    if (!profile || profile.role === 'admin') return
    const fetchExpiring = async () => {
      const in7 = new Date(); in7.setDate(in7.getDate() + 7)
      const { count } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .lte('expiry_date', in7.toISOString().split('T')[0])
      setExpiringCount(count || 0)
    }
    fetchExpiring()
  }, [profile])

  const handleLogout = async () => { await signOut(); router.replace('/auth') }
  const isAdmin = profile?.role === 'admin'
  const userSectors = profile?.sectors?.map(id => ALL_SECTORS.find(s => s.id === id)).filter(Boolean) || []
  const hasSupportIT = profile?.sectors?.includes('support_it')

  const is = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const NavItem = ({ href, icon, label, badge }: { href: string; icon: string; label: string; badge?: number }) => (
    <Link href={href} className={`nav-item ${is(href) ? 'active' : ''}`} onClick={onClose}>
      <span className="ni">{icon}</span>
      {label}
      {badge ? <span className="nb">{badge}</span> : null}
    </Link>
  )

  return (
    <>
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} onClick={onClose} />
      )}
      <nav className={`sidebar ${open ? 'open' : ''}`}>
        {/* LOGO */}
        <div className="sidebar-logo">
          <div className="logo-mark">💼</div>
          <div className="logo-text">
            <h1>Teranga<span>Biz</span></h1>
            {!isAdmin && profile?.business_name
              ? <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginTop: 1 }}>{profile.business_name}</p>
              : <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>Garde un œil sur tes revenus</p>
            }
          </div>
        </div>

        <div className="sidebar-nav">

          {/* ── ADMIN NAV ── */}
          {isAdmin && (
            <>
              <div className="nav-section">Administration</div>
              <NavItem href="/admin" icon="📊" label="Dashboard Admin" />
            </>
          )}

          {/* ── USER NAV ── */}
          {!isAdmin && (
            <>
              <div className="nav-section">Principal</div>
              <NavItem href="/dashboard" icon="📊" label="Dashboard" />

              {/* Support IT — uniquement si secteur sélectionné */}
              {hasSupportIT && (
                <>
                  <div className="nav-section">Support IT</div>
                  <NavItem href="/interventions" icon="🖧" label="Interventions" />
                </>
              )}

              <div className="nav-section">Business</div>
              <NavItem href="/sales" icon="💰" label="Ventes" />
              <NavItem href="/clients" icon="👥" label="Clients" />
              <NavItem href="/subscriptions" icon="📡" label="Abonnements" badge={expiringCount || undefined} />
              <NavItem href="/reports" icon="📈" label="Rapports" />

              {/* Secteurs actifs (indicatif) */}
              {userSectors.filter(s => s && s.id !== 'support_it').length > 0 && (
                <>
                  <div className="nav-section">Mes Secteurs</div>
                  {userSectors.filter(s => s && s.id !== 'support_it').map(s => s && (
                    <div key={s.id} className="nav-sub-item">
                      <div className="nav-sub-dot" style={{ background: s.color }} />
                      {s.label.split(' & ')[0]}
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* USER PILL */}
        <div className="sidebar-user">
          <div className="user-pill">
            <div className="u-avatar" style={{
              background: isAdmin ? 'linear-gradient(135deg,var(--accent),var(--accent2))' : avatarColor(profile?.full_name || ''),
              width: 34, height: 34, fontSize: isAdmin ? 16 : 13
            }}>
              {isAdmin ? '🛡️' : initials(profile?.full_name || '')}
            </div>
            <div className="u-info">
              <div className="u-name">{profile?.full_name}</div>
              <div className="u-role">{isAdmin ? 'Administrateur' : (profile?.business_name || `${profile?.sectors?.length || 0} secteur(s)`)}</div>
            </div>
            <button className="u-logout" onClick={handleLogout} title="Se déconnecter">⏻</button>
          </div>
        </div>
      </nav>
    </>
  )
}
