import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Next.js 16 proxy (formerly middleware).
 * Handles:
 * - Session cookie refresh
 * - Route protection + role-based redirects
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — important: do NOT remove this call
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes that don't require auth
  const publicRoutes = ['/', '/login', '/register', '/unauthorized']
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith('/_next') || pathname.startsWith('/api')
  )

  // If not authenticated and trying to access protected routes
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If authenticated, get role and enforce dashboard access
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    // Redirect from login/register to correct dashboard if already logged in
    if (pathname === '/login' || pathname === '/register') {
      const url = request.nextUrl.clone()
      if (role === 'ADMIN') url.pathname = '/admin'
      else if (role === 'FOUNDER') url.pathname = '/founder'
      else if (role === 'STAFF') url.pathname = '/staff'
      else url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // Enforce role-based route access
    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      const url = request.nextUrl.clone()
      url.pathname = '/unauthorized'
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/founder') && role !== 'FOUNDER') {
      const url = request.nextUrl.clone()
      url.pathname = '/unauthorized'
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/staff') && role !== 'STAFF') {
      const url = request.nextUrl.clone()
      url.pathname = '/unauthorized'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
