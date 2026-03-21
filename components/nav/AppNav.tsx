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
  { href: "/discover",  label: "Discover",  desc: "Browse roles" },
  { href: "/matches",   label: "Matches",   desc: "Conversations" },
  { href: "/saved",     label: "Saved",     desc: "Bookmarks" },
  { href: "/community", label: "Community", desc: "Channels" },
  { href: "/profile",   label: "Profile",   desc: "Account" },
]

const recruiterLinks = [
  { href: "/dashboard", label: "Dashboard", desc: "Overview" },
  { href: "/jobs",      label: "Jobs",      desc: "Postings" },
  { href: "/discover",  label: "Discover",  desc: "Candidates" },
  { href: "/matches",   label: "Matches",   desc: "Pipeline" },
  { href: "/community", label: "Community", desc: "Channels" },
  { href: "/profile",   label: "Profile",   desc: "Account" },
]

const adminLinks = [
  { href: "/admin",            label: "Overview",   desc: "Dashboard" },
  { href: "/admin/users",      label: "Users",      desc: "All accounts" },
  { href: "/admin/recruiters", label: "Recruiters", desc: "Review" },
  { href: "/admin/channels",   label: "Channels",   desc: "Community" },
]

interface AppNavProps {
  role:      UserRole | "admin"
  fullName?: string | null
  email?:    string | null
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
  const initials    = displayName.charAt(0).toUpperCase()

  const roleLabel = role === "admin" ? "Admin" : role === "recruiter" ? "Recruiter" : "Student"

  return (
    <>
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-56 bg-black border-r border-white/[0.06] z-40">
        <div className="h-[52px] flex items-center px-5 border-b border-white/[0.06] shrink-0">
          <Link
            href="/"
            className="text-[15px] font-semibold tracking-[-0.03em] lowercase text-white/90 hover:text-white transition-colors"
          >
            jobmatch<span className="opacity-40">.</span>
          </Link>
        </div>

        <div className="px-4 pt-4 pb-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/30">{roleLabel}</p>
        </div>

        <nav className="flex-1 px-2 space-y-px overflow-y-auto">
          {links.map(({ href, label, desc }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "block rounded-lg px-3 py-2.5 transition-colors duration-200",
                  active
                    ? "bg-white/[0.08] text-white"
                    : "text-white/55 hover:bg-white/[0.04] hover:text-white/90"
                )}
              >
                <span className="block text-[13px] font-medium leading-tight tracking-[-0.01em]">{label}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-white/35">{desc}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-2 border-t border-white/[0.06] space-y-2">
          <div className="flex items-center gap-2.5 px-2 pb-1 pt-1">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-white/[0.1] shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/[0.1] flex items-center justify-center text-[12px] font-semibold text-white/90 shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white/90 truncate leading-none">{displayName}</p>
              <p className="text-[11px] text-white/35 truncate mt-1">{email ?? ""}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-[13px] text-white/45 hover:text-white/75 hover:bg-white/[0.05] transition-colors"
          >
            <LogOut className="h-3.5 w-3.5 opacity-70" strokeWidth={1.75} />
            Sign out
          </button>
        </div>
      </aside>

      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/[0.06] h-[52px] flex items-center justify-between px-4">
        <Link href="/" className="text-[15px] font-semibold tracking-[-0.03em] lowercase text-white/90">
          jobmatch<span className="opacity-40">.</span>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button
            type="button"
            onClick={handleSignOut}
            className="px-2.5 py-1.5 text-[12px] text-white/50 hover:text-white/85 transition-colors"
          >
            Out
          </button>
        </div>
      </header>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/[0.06] safe-area-pb">
        <div className="flex">
          {links.map(({ href, label }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-2.5 min-h-[52px] transition-colors",
                  active ? "text-white" : "text-white/40"
                )}
              >
                <span className="text-[10px] font-medium tracking-[-0.01em] text-center leading-tight px-0.5 max-w-full truncate">
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
