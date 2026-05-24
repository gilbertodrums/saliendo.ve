'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseAuthUser } from '@supabase/supabase-js'
import type { User as DbUser } from '@/types/database'

export interface AuthContextType {
  user: SupabaseAuthUser | null
  profile: DbUser | null
  loading: boolean
  error: string | null
  signInWithOtp: (email: string) => Promise<{ success: boolean; error?: any }>
  verifyOtp: (email: string, token: string) => Promise<{ success: boolean; session: any; error?: any } | { success: boolean; session?: null; error: any }>
  signOut: () => Promise<void>
  upsertProfile: (profileData: { full_name: string; phone?: string; id_number?: string }) => Promise<{ success: boolean; data?: DbUser; error?: any }>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Proveedor de Autenticación para el layout raíz de Next.js.
 * Garantiza un único listener activo de Supabase Auth y reactividad
 * del perfil de usuario en toda la aplicación.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseAuthUser | null>(null)
  const [profile, setProfile] = useState<DbUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Limpiar el estado de error
  const clearError = useCallback(() => setError(null), [])

  // Recupera el perfil del usuario desde public.users en Supabase
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (dbError) {
        // Si el usuario acaba de registrarse mediante OTP, es posible que el trigger
        // tarde unas milésimas en insertar el perfil en public.users.
        // Reintentamos una vez si no se encuentra el perfil.
        if (dbError.code === 'PGRST116') {
          console.warn('Profile not found on first fetch. Retrying in 1s...')
          await new Promise((resolve) => setTimeout(resolve, 1000))
          const { data: retryData, error: retryError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()
          
          if (retryError) throw retryError
          setProfile(retryData)
          return
        }
        throw dbError
      }
      setProfile(data)
    } catch (err: any) {
      console.error('Error fetching user profile from public.users:', err)
      // No bloqueamos el flujo de auth si falla la carga del perfil
      setProfile(null)
    }
  }, [supabase])

  // Inicializar sesión y suscribirse a cambios de estado de auth
  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        if (session?.user) {
          if (isMounted) setUser(session.user)
          await fetchProfile(session.user.id)
        }
      } catch (err: any) {
        console.error('Error initializing authentication:', err)
        if (isMounted) setError(err.message || 'Error al inicializar sesión')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      setLoading(true)
      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  // Enviar código OTP sin contraseña por correo electrónico
  const signInWithOtp = useCallback(async (email: string) => {
    setLoading(true)
    setError(null)
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true, // Si no existe en auth.users, lo crea automáticamente
        },
      })
      if (otpError) throw otpError
      return { success: true }
    } catch (err: any) {
      console.error('Error in signInWithOtp:', err)
      const friendlyMessage = err.message || 'Error al enviar el código OTP'
      setError(friendlyMessage)
      return { success: false, error: err }
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Verificar el código OTP ingresado por el usuario
  const verifyOtp = useCallback(async (email: string, token: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email', // type 'email' maneja de forma segura tanto login como registro
      })
      if (verifyError) throw verifyError

      if (data.session?.user) {
        setUser(data.session.user)
        await fetchProfile(data.session.user.id)
      }
      return { success: true, session: data.session }
    } catch (err: any) {
      console.error('Error in verifyOtp:', err)
      const friendlyMessage = err.message || 'Código OTP inválido o expirado'
      setError(friendlyMessage)
      return { success: false, error: err }
    } finally {
      setLoading(false)
    }
  }, [supabase, fetchProfile])

  // Cerrar sesión activa
  const signOut = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
      setUser(null)
      setProfile(null)
    } catch (err: any) {
      console.error('Error in signOut:', err)
      setError(err.message || 'Error al cerrar sesión')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Guardar o actualizar datos de perfil en public.users
  const upsertProfile = useCallback(async (profileData: {
    full_name: string
    phone?: string
    id_number?: string
  }) => {
    if (!user) {
      const err = new Error('Usuario no autenticado para crear perfil')
      setError(err.message)
      return { success: false, error: err }
    }

    setLoading(true)
    setError(null)
    try {
      const { data, error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email!,
          full_name: profileData.full_name,
          phone: profileData.phone || null,
          id_number: profileData.id_number || null,
          role: 'customer', // Por defecto los que entran por OTP son clientes
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (upsertError) throw upsertError
      setProfile(data)
      return { success: true, data }
    } catch (err: any) {
      console.error('Error in upsertProfile:', err)
      setError(err.message || 'Error al actualizar perfil en base de datos')
      return { success: false, error: err }
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  const contextValue: AuthContextType = {
    user,
    profile,
    loading,
    error,
    signInWithOtp,
    verifyOtp,
    signOut,
    upsertProfile,
    clearError,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

/**
 * Hook de consumidor de sesión de saliendo.ve.
 * Permite acceder de forma reactiva al usuario actual y su perfil en public.users.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}
