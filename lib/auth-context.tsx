'use client'
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
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
  signOut: () => void
  refreshProfile: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (data) setProfile(data)
    return data as Profile | null
  }, [])

  useEffect(() => {
    // Initial session check — reads from localStorage, instant
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        fetchProfile(u.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Auth state listener — handles login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (event === 'SIGNED_OUT') {
        setProfile(null)
        setLoading(false)
      }
      if (event === 'SIGNED_IN' && u) {
        fetchProfile(u.id).finally(() => setLoading(false))
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

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
      options: { data: { full_name: fullName, business_name: businessName } },
    })

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        return { error: 'Cet email est déjà utilisé' }
      }
      return { error: error.message }
    }

    if (!data.user) return { error: 'Erreur lors de la création du compte' }

    // Wait a moment for the DB trigger to run, then upsert to ensure profile exists
    await new Promise(r => setTimeout(r, 800))

    await supabase.from('profiles').upsert(
      {
        id: data.user.id,
        email,
        full_name: fullName,
        business_name: businessName,
        role: 'user',
        sectors,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

    setProfile({
      id: data.user.id,
      email,
      full_name: fullName,
      business_name: businessName,
      role: 'user',
      sectors,
      created_at: new Date().toISOString(),
    })

    return { error: null }
  }

  // Instant sign out — clear local state immediately, then call Supabase async
  const signOut = () => {
    setUser(null)
    setProfile(null)
    setLoading(false)
    supabase.auth.signOut() // fire and forget
  }

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  const resetPassword = async (email: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    })
    if (error) return { error: error.message }
    return { error: null }
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
