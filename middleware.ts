import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import type { UserRole } from '@/types/database'

/**
 * Rutas protegidas y los roles que pueden acceder a ellas.
 * El orden importa: se evalúan de arriba hacia abajo y se usa
 * el primer match.
 */
const PROTECTED_ROUTES: Array<{
  pattern: RegExp
  allowedRoles: UserRole[]
  loginRedirect: string
}> = [
  {
    // Panel administrativo — solo admin
    pattern: /^\/admin(\/.*)?$/,
    allowedRoles: ['admin'],
    loginRedirect: '/login?redirect=/admin',
  },
  {
    // Panel de oficina — operator_staff y admin
    pattern: /^\/oficina(\/.*)?$/,
    allowedRoles: ['operator_staff', 'admin'],
    loginRedirect: '/login?redirect=/oficina',
  },
  {
    // Panel de chofer — driver y admin
    pattern: /^\/chofer(\/.*)?$/,
    allowedRoles: ['driver', 'admin'],
    loginRedirect: '/login?redirect=/chofer',
  },
]

/**
 * Rutas que son completamente públicas y no requieren verificación de sesión.
 * Las rutas de checkout y boleto se incluyen aquí porque la validación de
 * acceso al recurso específico ocurre en el Server Component/Route Handler,
 * no en el middleware.
 */
const PUBLIC_PATHS: RegExp[] = [
  /^\/$/, // home
  /^\/buscar(\/.*)?$/,
  /^\/viaje\/[^/]+(\/.*)?$/,
  /^\/checkout\/[^/]+(\/.*)?$/,
  /^\/boleto\/[^/]+(\/.*)?$/,
  /^\/login(\/.*)?$/,
  /^\/registro(\/.*)?$/,
  /^\/recuperar-contrasena(\/.*)?$/,
  /^\/auth\/callback(\/.*)?$/, // callback de OAuth/Magic Link
]

/**
 * Rutas de Next.js que deben ignorarse completamente en el middleware
 * (archivos estáticos, rutas de internals, etc.).
 */
function isInternalPath(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/') || pathname.startsWith('/api/') || pathname.includes('.') // archivos estáticos con extensión
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignorar paths internos de Next.js
  if (isInternalPath(pathname)) {
    return NextResponse.next()
  }

  // Refrescar sesión y obtener usuario
  const { response, user } = await updateSession(request)

  // Verificar si la ruta requiere un rol específico
  const protectedRoute = PROTECTED_ROUTES.find(({ pattern }) => pattern.test(pathname))

  if (protectedRoute) {
    // Sin usuario autenticado → redirigir a login
    if (!user) {
      const loginUrl = new URL(protectedRoute.loginRedirect, request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Con usuario pero sin el rol requerido → redirigir a inicio con error
    if (!protectedRoute.allowedRoles.includes(user.role)) {
      const unauthorizedUrl = new URL('/?error=unauthorized', request.url)
      return NextResponse.redirect(unauthorizedUrl)
    }

    // Rol correcto → continuar con la response que tiene cookies actualizadas
    return response
  }

  // Rutas públicas — solo actualizar sesión si existe
  return response
}

export const config = {
  matcher: [
    /*
     * Ejecutar middleware en todas las rutas EXCEPTO:
     * - _next/static (archivos estáticos de Next.js)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     * - archivos con extensión explícita (png, jpg, svg, etc.)
     *
     * El regex de abajo viene de la documentación oficial de Supabase SSR.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
