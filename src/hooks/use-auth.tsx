import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { UserRole } from '@/lib/types'

interface AuthContextType {
  user: User | null
  session: Session | null
  role: UserRole | null
  avatarUrl: string | null
  setAvatarUrl: (url: string | null) => void
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const mounted = useRef(false)

  const fetchProfile = useCallback(
    async (
      userId: string,
    ): Promise<{ role: UserRole | null; avatarUrl: string | null }> => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('role, avatar_url')
          .eq('id', userId)
          .single()

        if (error) {
          console.error('[useAuth] Error querying user_profiles:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          })

          if (error.code === 'PGRST116') {
            console.warn(
              '[useAuth] User profile not found (0 rows). This might be a new user pending profile creation.',
            )
          } else if (
            error.code === '42501' ||
            error.message?.includes('policy')
          ) {
            console.error(
              '[useAuth] RLS Policy Violation (403/42501). User may not have permission to view their profile.',
            )
          }

          return { role: null, avatarUrl: null }
        }
        return {
          role: data?.role as UserRole,
          avatarUrl: data?.avatar_url || null,
        }
      } catch (e: any) {
        console.error('[useAuth] Exception fetching user role:', e)
        return { role: null, avatarUrl: null }
      }
    },
    [],
  )

  useEffect(() => {
    mounted.current = true

    const initializeAuth = async () => {
      try {
        console.log('[useAuth] Initializing auth...')
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        if (mounted.current) {
          setSession(initialSession)
          const currentUser = initialSession?.user ?? null
          setUser(currentUser)

          if (currentUser) {
            const { role: r, avatarUrl: a } = await fetchProfile(currentUser.id)
            if (mounted.current) {
              setRole(r)
              setAvatarUrl(a)
            }
          }
        }
      } catch (error) {
        console.error('[useAuth] Auth initialization error:', error)
      } finally {
        if (mounted.current) {
          console.log(
            '[useAuth] Auth initialization complete. Setting loading to false.',
          )
          setLoading(false)
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted.current) return

      console.log('[useAuth] Auth State Change:', event)

      setSession(currentSession)
      const currentUser = currentSession?.user ?? null
      setUser(currentUser)

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (currentUser) {
          setLoading(true)
          fetchProfile(currentUser.id).then(({ role: r, avatarUrl: a }) => {
            if (mounted.current) {
              setRole(r)
              setAvatarUrl(a)
              setLoading(false)
            }
          })
        } else {
          setLoading(false)
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted.current) {
          setRole(null)
          setAvatarUrl(null)
          setUser(null)
          setSession(null)
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    })

    return () => {
      mounted.current = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (mounted.current) {
      setRole(null)
      setAvatarUrl(null)
      setUser(null)
      setSession(null)
    }
    return { error }
  }

  const value = {
    user,
    session,
    role,
    avatarUrl,
    setAvatarUrl,
    signUp,
    signIn,
    signOut,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
