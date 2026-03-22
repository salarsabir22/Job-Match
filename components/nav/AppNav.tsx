"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { UserRole } from "@/types"
import { NotificationBell } from "@/components/nav/NotificationBell"

const studentLinks = [
  { href: "/dashboard", label: "Dashboard", desc: "Overview" },
  { href: "/discover", label: "Discover", desc: "Browse roles" },
  { href: "/matches", label: "Matches", desc: "Conversations" },
  { href: "/saved", label: "Saved", desc: "Bookmarks" },
  { href: "/community", label: "Community", desc: "Channels" },
  { href: "/profile", label: "Profile", desc: "Account" },
]

const recruiterLinks = [
  { href: "/dashboard", label: "Dashboard", desc: "Overview" },
  { href: "/jobs", label: "Jobs", desc: "Postings" },
  { href: "/discover", label: "Discover", desc: "Candidates" },
  { href: "/matches", label: "Matches", desc: "Pipeline" },
  { href: "/community", label: "Community", desc: "Channels" },
  { href: "/profile", label: "Profile", desc: "Account" },
]

const adminLinks = [
  { href: "/admin", label: "Overview", desc: "Dashboard" },
  { href: "/admin/users", label: "Users", desc: "All accounts" },
  { href: "/admin/recruiters", label: "Recruiters", desc: "Review" },
  { href: "/admin/channels", label: "Channels", desc: "Community" },
]

interface AppNavProps {
  role: UserRole | "admin"
  fullName?: string | null
  email?: string | null
  avatarUrl?: string | null
}

export function AppNav({ role, fullName, email, avatarUrl }: AppNavProps) {
  const pathname = usePathname()
  const links = role === "student" ? studentLinks : role === "recruiter" ? recruiterLinks : adminLinks

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const displayName = fullName ?? email?.split("@")[0] ?? "User"
  const initials = displayName.charAt(0).toUpperCase()

  const roleLabel = role === "admin" ? "Admin" : role === "recruiter" ? "Recruiter" : "Student"

  return (
    <>
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-56 z-40 bg-[#ffffff] border-r border-border">
        <div className="h-[52px] flex items-center px-5 border-b border-border shrink-0">
          <Link
            href="/"
            className="text-[17px] font-semibold tracking-tight text-foreground hover:opacity-70 transition-opacity"
          >
            jobmatch<span className="text-muted-foreground">.</span>
          </Link>
        </div>

        <div className="px-4 pt-4 pb-1">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{roleLabel}</p>
        </div>

        <nav className="flex-1 px-2.5 space-y-0.5 overflow-y-auto">
          {links.map(({ href, label, desc }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "block rounded-[12px] px-3 py-2.5 transition-all duration-200 ease-out",
                  active
                    ? "bg-muted text-primary border border-border"
                    : "text-foreground hover:bg-muted/80"
                )}
              >
                <span className="block text-[13px] font-semibold leading-tight tracking-tight">{label}</span>
                <span
                  className={cn(
                    "mt-0.5 block text-[11px] leading-snug tracking-tight",
                    active ? "text-primary/80" : "text-muted-foreground"
                  )}
                >
                  {desc}
                </span>
              </Link>
            )
          })}
        </nav>

        <div className="p-2.5 border-t border-border space-y-2">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-[12px] bg-muted/60 border border-border">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-[13px] font-semibold text-foreground shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground truncate leading-tight tracking-tight">
                {displayName}
              </p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{email ?? ""}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-[12px] text-[13px] font-medium text-primary hover:bg-primary/8 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} />
            Sign out
          </button>
        </div>
      </aside>

      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-[52px] flex items-center justify-between px-4 border-b border-border bg-[#ffffff]/90 backdrop-blur-2xl backdrop-saturate-180 supports-[backdrop-filter]:bg-[#ffffff]/85">
        <Link href="/" className="text-[17px] font-semibold tracking-tight text-foreground">
          jobmatch<span className="text-muted-foreground">.</span>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button
            type="button"
            onClick={handleSignOut}
            className="px-3 py-1.5 text-[13px] font-medium text-primary rounded-full hover:bg-primary/8 transition-colors"
          >
            Out
          </button>
        </div>
      </header>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-[#ffffff]/90 backdrop-blur-2xl backdrop-saturate-180 supports-[backdrop-filter]:bg-[#ffffff]/85 safe-area-pb">
        <div className="flex">
          {links.map(({ href, label }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-2 min-h-[50px] transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span className="text-[10px] font-semibold tracking-tight text-center leading-tight px-0.5 max-w-full truncate">
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
