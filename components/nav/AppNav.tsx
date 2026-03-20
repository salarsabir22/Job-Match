"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Layers, Heart, Bookmark, MessageCircle, User, Briefcase,
  Users, Building2, Hash, Zap, LogOut, LayoutDashboard,
  ChevronRight,
  Bell,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { UserRole } from "@/types"

const studentLinks = [
  { href: "/discover",  icon: Layers,       label: "Discover",  desc: "Browse jobs" },
  { href: "/matches",   icon: Heart,         label: "Matches",   desc: "Your matches" },
  { href: "/saved",     icon: Bookmark,      label: "Saved",     desc: "Saved jobs" },
  { href: "/community", icon: MessageCircle, label: "Community", desc: "Channels" },
  { href: "/profile",   icon: User,          label: "Profile",   desc: "Your profile" },
]

const recruiterLinks = [
  { href: "/jobs",      icon: Briefcase,     label: "My Jobs",   desc: "Manage postings" },
  { href: "/discover",  icon: Users,         label: "Discover",  desc: "Find candidates" },
  { href: "/matches",   icon: Heart,         label: "Matches",   desc: "Candidates" },
  { href: "/community", icon: MessageCircle, label: "Community", desc: "Channels" },
  { href: "/profile",   icon: User,          label: "Profile",   desc: "Your profile" },
]

const adminLinks = [
  { href: "/admin",            icon: LayoutDashboard, label: "Overview",   desc: "Dashboard" },
  { href: "/admin/users",      icon: Users,           label: "Users",      desc: "All accounts" },
  { href: "/admin/recruiters", icon: Building2,       label: "Recruiters", desc: "Approvals" },
  { href: "/admin/channels",   icon: Hash,            label: "Channels",   desc: "Community" },
]

interface AppNavProps {
  role:      UserRole | "admin"
  fullName?: string | null
  email?:    string | null
  avatarUrl?: string | null
  unreadNotificationCount?: number
}

export function AppNav({ role, fullName, email, avatarUrl, unreadNotificationCount = 0 }: AppNavProps) {
  const pathname = usePathname()
  const router = useRouter()
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
  const roleDot   = role === "admin" ? "bg-[#FFD600]" : role === "recruiter" ? "bg-[#F7931A]" : "bg-[#94A3B8]"

  return (
    <>
      {/* ── Desktop Sidebar ──────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-[#08090C] border-r border-white/6 z-40">
        {/* Logo */}
        <div className="h-14 flex items-center px-6 border-b border-white/6 shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center shadow-[0_0_15px_-3px_rgba(247,147,26,0.6)]">
              <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-bold text-lg text-white">
              Job<span className="gradient-text">Match</span>
            </span>
          </Link>
        </div>

        {/* Section label */}
        <div className="px-5 pt-5 pb-2">
          <div className="flex items-center gap-2">
            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", roleDot)} />
            <p className="font-data text-[10px] tracking-widest uppercase text-[#94A3B8]">
              {roleLabel} Dashboard
            </p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {links.map(({ href, icon: Icon, label, desc }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                  active
                    ? "bg-[#F7931A]/12 text-[#F7931A] border border-[#F7931A]/20"
                    : "text-[#94A3B8] hover:text-white hover:bg-white/4 border border-transparent"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200",
                  active
                    ? "bg-[#F7931A]/20 shadow-[0_0_10px_-3px_rgba(247,147,26,0.5)]"
                    : "bg-white/4 group-hover:bg-white/8"
                )}>
                  <Icon
                    className={cn("h-4 w-4", active ? "text-[#F7931A]" : "text-[#94A3B8] group-hover:text-white")}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-body text-sm font-medium leading-none", active ? "text-[#F7931A]" : "text-inherit")}>
                    {label}
                  </p>
                  <p className="font-data text-[10px] text-[#94A3B8] mt-0.5 leading-none">{desc}</p>
                </div>
                {active && <ChevronRight className="h-3.5 w-3.5 text-[#F7931A]/60 shrink-0" />}
              </Link>
            )
          })}
        </nav>

        {/* User profile + signout */}
        <div className="p-3 border-t border-white/6 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.025] border border-white/6">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center text-white font-bold text-sm shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm font-medium text-white truncate leading-none">{displayName}</p>
              <p className="font-data text-[10px] text-[#94A3B8] truncate mt-0.5">{email ?? ""}</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[#94A3B8] hover:text-red-400 hover:bg-red-400/6 font-body text-sm transition-all duration-200"
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#08090C]/90 backdrop-blur-md border-b border-white/6 h-14 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center shadow-[0_0_10px_-2px_rgba(247,147,26,0.6)]">
            <Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-heading font-bold text-base text-white">
            Job<span className="gradient-text">Match</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            onClick={(e) => {
              e.preventDefault()
              router.push("/notifications")
            }}
            className="relative z-50 pointer-events-auto h-8 w-8 rounded-lg border border-white/10 text-[#94A3B8] hover:text-[#F7931A] hover:border-[#F7931A]/40 transition-all flex items-center justify-center"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#F7931A] text-[#030304] font-data text-[9px] leading-4 text-center">
                {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
              </span>
            )}
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#94A3B8] hover:text-red-400 hover:bg-red-400/10 font-body text-xs font-medium transition-all duration-200 border border-white/8"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </header>

      {/* ── Mobile Bottom Nav ─────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#08090C]/95 backdrop-blur-md border-t border-white/6">
        <div className="flex">
          {links.map(({ href, icon: Icon, label }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-3 px-1 font-data text-[9px] tracking-wider uppercase transition-all duration-200",
                  active ? "text-[#F7931A]" : "text-[#94A3B8]"
                )}
              >
                <Icon
                  className={cn("h-5 w-5 transition-all", active && "drop-shadow-[0_0_6px_rgba(247,147,26,0.8)]")}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
