import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Supabase client para uso en Server Components, Server Actions y Route Handlers.
 * Debe llamarse dentro de una función async (no a nivel de módulo) porque
 * next/headers solo funciona durante una request activa.
 *
 * Para operaciones que requieren privilegios elevados (bypass de RLS),
 * usa createAdminClient() con la service role key — SOLO en Route Handlers
 * seguros o Server Actions con validación de rol previa.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll puede ser llamado desde un Server Component donde
            // no se puede modificar cookies. El middleware se encarga
            // de refrescar la sesión en esos casos.
          }
        },
      },
    }
  )
}

/**
 * Cliente con service role — bypasea RLS completamente.
 * Usar EXCLUSIVAMENTE en operaciones administrativas server-side
 * con validación de permisos previa (admin role check).
 * NUNCA exponer en el cliente ni en rutas públicas.
 * No maneja sesiones de usuario — no necesita cookies.
 */
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
