"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Briefcase, Columns3, Layers, MessageCircle, User } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types"

const studentItems = [
  { href: "/discover", icon: Layers, label: "Discover" },
  { href: "/matches", icon: Briefcase, label: "Applications" },
  { href: "/chat", icon: MessageCircle, label: "Messages" },
  { href: "/profile", icon: User, label: "Profile" },
]

const recruiterItems = [
  { href: "/discover", icon: Layers, label: "Discover" },
  { href: "/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/matches", icon: Columns3, label: "Pipeline" },
  { href: "/chat", icon: MessageCircle, label: "Messages" },
  { href: "/profile", icon: User, label: "Profile" },
]

export function AppBottomNav({ role }: { role: UserRole | "admin" }) {
  const pathname = usePathname()
  if (role === "admin") return null
  if (pathname.startsWith("/chat")) return null

  const items = role === "recruiter" ? recruiterItems : studentItems

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl backdrop-saturate-150 lg:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex h-[3.25rem] max-w-lg items-stretch">
        {items.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-center transition-colors duration-150",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.15 : 1.7} />
              <span className="max-w-full truncate text-[10px] font-medium leading-none tracking-[-0.01em]">
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
