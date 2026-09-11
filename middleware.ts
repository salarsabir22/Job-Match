import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseFetch } from "@/lib/supabase/fetch"

/** Stay well under Vercel’s middleware limit (~25s). Fail open if Auth is slow. */
const AUTH_FETCH_TIMEOUT_MS = 2500

const PUBLIC_PREFIXES = [
  "/login",
  "/signup",
  "/auth",
  "/forgot-password",
  "/reset-password",
  "/waitlist",
  "/privacy",
  "/terms",
]

function isPublicPath(pathname: string) {
  return pathname === "/" || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}

function hasSupabaseSessionCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => {
    const name = cookie.name
    if (!name.includes("-auth-token") || name.includes("code-verifier")) return false
    return Boolean(cookie.value)
  })
}

function fetchWithTimeout(timeoutMs: number): typeof fetch {
  const inner = createSupabaseFetch()
  return async (input, init) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const upstream = init?.signal
    if (upstream) {
      if (upstream.aborted) controller.abort()
      else upstream.addEventListener("abort", () => controller.abort(), { once: true })
    }
    try {
      return await inner(input, { ...init, signal: controller.signal })
    } finally {
      clearTimeout(timer)
    }
  }
}

function dashboardPath(role: unknown) {
  if (role === "student") return "/discover"
  if (role === "recruiter") return "/jobs"
  if (role === "admin") return "/admin"
  return "/onboarding"
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const publicPath = isPublicPath(pathname)
  const isAuthCallback = pathname.startsWith("/auth/callback")
  const isApiRoute = pathname.startsWith("/api")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    console.error("[middleware] Supabase env vars missing - skipping auth check")
    return NextResponse.next({ request })
  }

  // Anonymous waitlist / marketing / API: do not call Auth at all.
  // getUser() is a network round-trip; if it hangs, Vercel returns
  // MIDDLEWARE_INVOCATION_TIMEOUT (504).
  if (!hasSupabaseSessionCookie(request)) {
    if (publicPath || isApiRoute || isAuthCallback) {
      return NextResponse.next({ request })
    }
    const login = new URL("/login", request.url)
    login.searchParams.set("next", pathname + request.nextUrl.search)
    return NextResponse.redirect(login)
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    global: {
      fetch: fetchWithTimeout(AUTH_FETCH_TIMEOUT_MS),
    },
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (err) {
    console.error("[middleware] getUser failed:", err)
    return supabaseResponse
  }

  if (!user && !publicPath && !isApiRoute) {
    const login = new URL("/login", request.url)
    login.searchParams.set("next", pathname + request.nextUrl.search)
    return NextResponse.redirect(login)
  }

  const stayPublicWhenAuthed =
    pathname === "/" ||
    pathname.startsWith("/waitlist") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms")

  // Bounce signed-in users off auth screens. Role comes from the JWT so we
  // never wait on PostgREST in Edge (that extra hop was hanging in sin1).
  if (user && publicPath && !isAuthCallback && !stayPublicWhenAuthed) {
    return NextResponse.redirect(new URL(dashboardPath(user.user_metadata?.role), request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
