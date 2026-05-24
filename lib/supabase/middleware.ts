import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

/**
 * updateSession refresca la sesión del usuario en cada request del middleware.
 * Es obligatorio llamar a esta función en el middleware para que los tokens
 * de Supabase no expiren durante la navegación.
 *
 * Retorna la Response con las cookies actualizadas y el usuario autenticado
 * (o null si la sesión no existe o expiró).
 */
type SessionUser = Pick<
  Database['public']['Tables']['users']['Row'],
  'id' | 'role' | 'is_active' | 'operator_id'
>

export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse
  user: SessionUser | null
  supabaseUser: { id: string; email?: string } | null
}> {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Primero actualiza las cookies en la request
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // Luego recrea la response con las cookies actualizadas
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: No ejecutar ninguna lógica entre createServerClient y
  // getUser(). getUser() refresca el token si es necesario y esa
  // actualización debe propagarse a supabaseResponse inmediatamente.
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser()

  // Si hay usuario autenticado, obtener su perfil con el rol
  let appUser: SessionUser | null = null
  if (supabaseUser) {
    const { data } = await supabase
      .from('users')
      .select('id, role, is_active, operator_id')
      .eq('id', supabaseUser.id)
      .single()
    appUser = data
  }

  return {
    response: supabaseResponse,
    user: appUser,
    supabaseUser: supabaseUser ? { id: supabaseUser.id, email: supabaseUser.email } : null,
  }
}
