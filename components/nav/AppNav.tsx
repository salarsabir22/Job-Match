"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
  { href: "/notifications", icon: Bell,     label: "Alerts",    desc: "Your notifications" },
  { href: "/saved",     icon: Bookmark,      label: "Saved",     desc: "Saved jobs" },
  { href: "/community", icon: MessageCircle, label: "Community", desc: "Channels" },
  { href: "/profile",   icon: User,          label: "Profile",   desc: "Your profile" },
]

const recruiterLinks = [
  { href: "/jobs",      icon: Briefcase,     label: "My Jobs",   desc: "Manage postings" },
  { href: "/discover",  icon: Users,         label: "Discover",  desc: "Find candidates" },
  { href: "/matches",   icon: Heart,         label: "Matches",   desc: "Candidates" },
  { href: "/notifications", icon: Bell,     label: "Alerts",    desc: "Your notifications" },
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
  const roleDot   = role === "admin" ? "bg-[#FFD600]" : role === "recruiter" ? "bg-[#F7931A]" : "bg-[#94A3B8]"

  return (
    <>
      {/* Top header (no sidebar) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#08090C]/90 backdrop-blur-md border-b border-white/6 h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center shadow-[0_0_10px_-2px_rgba(247,147,26,0.6)]">
              <Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-bold text-base text-white">
              Job<span className="gradient-text">Match</span>
            </span>
          </Link>

          {/* Desktop nav (was previously in the sidebar) */}
          <nav className="hidden lg:flex items-center gap-2 ml-2">
            {links.map(({ href, icon: Icon, label }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 border",
                    active
                      ? "bg-[#F7931A]/12 text-[#F7931A] border-[#F7931A]/30"
                      : "bg-white/0 text-[#94A3B8] border-white/0 hover:bg-white/4 hover:text-white border"
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={active ? 2.5 : 1.8} />
                  <span className="font-body text-xs tracking-wider uppercase">{label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#94A3B8] hover:text-red-400 hover:bg-red-400/10 font-body text-xs font-medium transition-all duration-200 border border-white/8"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </button>
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
