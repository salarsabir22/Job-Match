import { NextResponse, type NextRequest } from "next/server"
import { DASHBOARD_ORIGIN } from "@/lib/auth-sites"

function staysOnLanding(pathname: string) {
  if (pathname === "/") return true
  if (pathname === "/waitlist" || pathname.startsWith("/waitlist/")) return true
  if (pathname === "/universities" || pathname.startsWith("/universities/")) return true
  if (pathname === "/corporates" || pathname.startsWith("/corporates/")) return true
  if (pathname === "/privacy" || pathname === "/terms") return true
  if (pathname === "/api/waitlist" || pathname.startsWith("/api/waitlist/")) return true
  if (pathname === "/auth/native" || pathname.startsWith("/auth/native/")) return true
  if (pathname === "/auth/google" || pathname.startsWith("/auth/google/")) return true
  return false
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  if (staysOnLanding(pathname)) return NextResponse.next()

  const dest = new URL(pathname + search, DASHBOARD_ORIGIN)
  return NextResponse.redirect(dest)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
