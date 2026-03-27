'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ALL_SECTORS, avatarColor, initials } from '@/lib/constants'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, signOut } = useAuth()
  const [expiringCount, setExpiringCount] = useState(0)

  useEffect(() => {
    if (!profile || profile.role === 'admin') return
    supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .lte('expiry_date', new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0])
      .then(({ count }) => setExpiringCount(count || 0))
  }, [profile])

  const handleLogout = () => {
    signOut()           // instantané — met user à null localement
    router.replace('/auth')  // redirige immédiatement
  }

  const isAdmin = profile?.role === 'admin'
  const hasSupportIT = profile?.sectors?.includes('support_it')
  const otherSectors = profile?.sectors
    ?.filter(id => id !== 'support_it')
    .map(id => ALL_SECTORS.find(s => s.id === id))
    .filter(Boolean) || []

  const is = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const NavLink = ({ href, icon, label, badge }: { href: string; icon: string; label: string; badge?: number }) => (
    <Link href={href} className={`nav-item ${is(href) ? 'active' : ''}`}>
      <span className="ni">{icon}</span>
      {label}
      {badge ? <span className="nb">{badge}</span> : null}
    </Link>
  )

  return (
    <nav className="sidebar">
      {/* LOGO */}
      <div className="sidebar-logo">
        <div className="logo-mark">💼</div>
        <div className="logo-text">
          <h1>Teranga<span>Biz</span></h1>
          {!isAdmin && profile?.business_name
            ? <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>{profile.business_name}</p>
            : <p style={{ fontSize: 10, color: 'var(--text3)' }}>Garde un œil sur tes revenus</p>
          }
        </div>
      </div>

      <div className="sidebar-nav">

        {/* ── ADMIN : 1 seul lien ── */}
        {isAdmin && (
          <>
            <div className="nav-section">Administration</div>
            <NavLink href="/admin" icon="📊" label="Dashboard" />
          </>
        )}

        {/* ── USER ── */}
        {!isAdmin && (
          <>
            <div className="nav-section">Principal</div>
            <NavLink href="/dashboard" icon="📊" label="Dashboard" />

            {hasSupportIT && (
              <>
                <div className="nav-section">Support IT</div>
                <NavLink href="/interventions" icon="🖧" label="Interventions" />
              </>
            )}

            <div className="nav-section">Business</div>
            <NavLink href="/sales"         icon="💰" label="Ventes" />
            <NavLink href="/clients"       icon="👥" label="Clients" />
            <NavLink href="/subscriptions" icon="📡" label="Abonnements" badge={expiringCount || undefined} />
            <NavLink href="/reports"       icon="📈" label="Rapports" />

            {otherSectors.length > 0 && (
              <>
                <div className="nav-section">Mes Secteurs</div>
                {otherSectors.map(s => s && (
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
            background: isAdmin
              ? 'linear-gradient(135deg,var(--accent),var(--accent2))'
              : avatarColor(profile?.full_name || ''),
            width: 34, height: 34,
            fontSize: isAdmin ? 16 : 13,
          }}>
            {isAdmin ? '🛡️' : initials(profile?.full_name || '')}
          </div>
          <div className="u-info">
            <div className="u-name">{profile?.full_name || '—'}</div>
            <div className="u-role">
              {isAdmin ? 'Administrateur' : (profile?.business_name || `${profile?.sectors?.length || 0} secteur(s)`)}
            </div>
          </div>
          <button className="u-logout" onClick={handleLogout} title="Se déconnecter">⏻</button>
        </div>
      </div>
    </nav>
  )
}
