import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const publicPaths = ["/", "/login", "/signup", "/auth", "/forgot-password", "/reset-password"]
  const isPublicPath =
    pathname === "/" || publicPaths.some((p) => p !== "/" && pathname.startsWith(p))

  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (user && isPublicPath) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }

    const role = profile.role
    if (role === "student") {
      return NextResponse.redirect(new URL("/discover", request.url))
    } else if (role === "recruiter") {
      return NextResponse.redirect(new URL("/jobs", request.url))
    } else if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/users", request.url))
    }
  }

  if (user && pathname === "/") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }

    const role = profile.role
    if (role === "student") {
      return NextResponse.redirect(new URL("/discover", request.url))
    } else if (role === "recruiter") {
      return NextResponse.redirect(new URL("/jobs", request.url))
    } else if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/users", request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
