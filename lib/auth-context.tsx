'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface Profile {
  id: string
  email: string
  full_name: string
  business_name: string
  role: 'user' | 'admin'
  sectors: string[]
  created_at: string
}

interface AuthCtx {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string, businessName: string, sectors: string[]) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateSectors: (sectors: string[]) => Promise<void>
  refreshProfile: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx)
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string, retries = 4): Promise<Profile | null> => {
    for (let i = 0; i < retries; i++) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (data) { setProfile(data); return data }
      if (i < retries - 1) await sleep(700)
    }
    return null
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) await fetchProfile(session.user.id)
      else setProfile(null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: 'Email ou mot de passe incorrect' }
    return { error: null }
  }

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    businessName: string,
    sectors: string[]
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, business_name: businessName, role: 'user' } }
    })
    if (error) {
      if (error.message.toLowerCase().includes('already registered')) return { error: 'Cet email est déjà utilisé' }
      return { error: error.message }
    }
    if (!data.user) return { error: 'Erreur lors de la création du compte' }

    await sleep(800)

    // Upsert profile (more reliable than trigger alone)
    const { error: upsertErr } = await supabase.from('profiles').upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      business_name: businessName,
      role: 'user',
      sectors,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

    if (upsertErr) {
      await supabase.from('profiles').insert({
        id: data.user.id, email, full_name: fullName, business_name: businessName, role: 'user', sectors,
      })
    }

    setProfile({
      id: data.user.id, email, full_name: fullName, business_name: businessName,
      role: 'user', sectors, created_at: new Date().toISOString(),
    })
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const updateSectors = async (sectors: string[]) => {
    if (!user) return
    await supabase.from('profiles').update({ sectors, updated_at: new Date().toISOString() }).eq('id', user.id)
    setProfile(prev => prev ? { ...prev, sectors } : prev)
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) return { error: error.message }
    return { error: null }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, updateSectors, refreshProfile, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
