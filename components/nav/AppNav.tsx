"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Layers, Heart, Bookmark, MessageCircle, User, Briefcase, Users, Building2, Hash, Zap, LogOut, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { UserRole } from "@/types"

const studentLinks = [
  { href: "/discover",  icon: Layers,         label: "Discover" },
  { href: "/matches",   icon: Heart,           label: "Matches" },
  { href: "/saved",     icon: Bookmark,        label: "Saved" },
  { href: "/community", icon: MessageCircle,   label: "Community" },
  { href: "/profile",   icon: User,            label: "Profile" },
]

const recruiterLinks = [
  { href: "/jobs",      icon: Briefcase,       label: "Jobs" },
  { href: "/discover",  icon: Users,           label: "Discover" },
  { href: "/matches",   icon: Heart,           label: "Matches" },
  { href: "/community", icon: MessageCircle,   label: "Community" },
  { href: "/profile",   icon: User,            label: "Profile" },
]

const adminLinks = [
  { href: "/admin",            icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/users",      icon: Users,           label: "Users" },
  { href: "/admin/recruiters", icon: Building2,       label: "Recruiters" },
  { href: "/admin/channels",   icon: Hash,            label: "Channels" },
]

interface AppNavProps {
  role: UserRole | "admin"
}

export function AppNav({ role }: AppNavProps) {
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

  return (
    <>
      {/* ── Desktop Sidebar (lg+) ───────────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-60 bg-[#0A0B0E] border-r border-white/8 z-40">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center shadow-[0_0_15px_-3px_rgba(247,147,26,0.6)]">
              <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-bold text-lg text-white">
              Job<span className="gradient-text">Match</span>
            </span>
          </div>
        </div>

        {/* Role badge */}
        <div className="px-4 pt-4 pb-2">
          <span className="font-data text-[10px] tracking-widest uppercase text-[#94A3B8]">
            {role === "admin" ? "Admin Panel" : role === "recruiter" ? "Recruiter" : "Student"}
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 space-y-0.5">
          {links.map(({ href, icon: Icon, label }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl font-body text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-[#F7931A]/15 text-[#F7931A] border border-[#F7931A]/25 shadow-[0_0_15px_-5px_rgba(247,147,26,0.3)]"
                    : "text-[#94A3B8] hover:text-white hover:bg-white/5"
                )}
              >
                <Icon
                  className={cn("h-4.5 w-4.5 shrink-0", active && "drop-shadow-[0_0_6px_rgba(247,147,26,0.7)]")}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t border-white/8">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#94A3B8] hover:text-red-400 hover:bg-red-400/8 font-body text-sm font-medium transition-all duration-200"
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile Top Header (< lg) ────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-white/8 h-14 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center shadow-[0_0_10px_-2px_rgba(247,147,26,0.6)]">
            <Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-heading font-bold text-base text-white">
            Job<span className="gradient-text">Match</span>
          </span>
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#94A3B8] hover:text-red-400 hover:bg-red-400/10 font-body text-xs font-medium transition-all duration-200 border border-white/8"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </button>
      </header>

      {/* ── Mobile Bottom Nav (< lg) ────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/8">
        <div className="flex">
          {links.map(({ href, icon: Icon, label }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-3 px-1 font-data text-[9px] tracking-wider uppercase transition-all duration-200",
                  active ? "text-[#F7931A]" : "text-[#94A3B8] hover:text-white"
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
