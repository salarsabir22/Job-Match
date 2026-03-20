"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Briefcase, Users, Heart, MessageCircle, User, Bell } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/jobs",      icon: Briefcase,      label: "Jobs" },
  { href: "/discover",  icon: Users,          label: "Discover" },
  { href: "/matches",   icon: Heart,          label: "Matches" },
  { href: "/notifications", icon: Bell,      label: "Alerts" },
  { href: "/community", icon: MessageCircle,  label: "Community" },
  { href: "/profile",   icon: User,           label: "Profile" },
]

export function RecruiterBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-black/10 lg:hidden">
      <div className="max-w-md mx-auto flex">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 px-1 font-data text-[9px] tracking-wider uppercase transition-all duration-200",
                active
                  ? "text-[#FAFAFA]"
                  : "text-neutral-700 hover:text-black"
              )}
            >
              <Icon
                className={cn("h-5 w-5 transition-all", active && "drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]")}
                strokeWidth={active ? 2.5 : 1.8}
              />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
