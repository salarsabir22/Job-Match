import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const publicPaths = ["/", "/login", "/signup", "/auth", "/forgot-password", "/reset-password"]
  const isPublicPath =
    pathname === "/" || publicPaths.some((p) => p !== "/" && pathname.startsWith(p))

  // Guard: if env vars are missing, fail open (don't crash the site)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    console.error("[middleware] Supabase env vars missing — skipping auth check")
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
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

  // Wrap in try/catch so a Supabase outage never breaks the whole site
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (err) {
    console.error("[middleware] getUser failed:", err)
    return NextResponse.next({ request })
  }

  // Unauthenticated user hitting a protected route → send to login
  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Authenticated user hitting a public/auth page → redirect to their dashboard
  if (user && isPublicPath) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      if (!profile) return NextResponse.redirect(new URL("/onboarding", request.url))

      if (profile.role === "student") return NextResponse.redirect(new URL("/discover", request.url))
      if (profile.role === "recruiter") return NextResponse.redirect(new URL("/jobs", request.url))
      if (profile.role === "admin") return NextResponse.redirect(new URL("/admin", request.url))
    } catch (err) {
      console.error("[middleware] profile lookup failed:", err)
      // Don't crash — just let the request through
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
