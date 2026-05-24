import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Supabase client para uso en Client Components (browser).
 * Llama esta función dentro de componentes marcados con 'use client'.
 * Nunca uses SUPABASE_SERVICE_ROLE_KEY aquí.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
