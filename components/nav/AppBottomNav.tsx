"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Briefcase, Columns3, LayoutDashboard, Layers, MessageCircle, Newspaper, User, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types"

const studentItems = [
  { href: "/discover", icon: Layers, label: "Discover" },
  { href: "/feed", icon: Newspaper, label: "Feed" },
  { href: "/matches", icon: Briefcase, label: "Apps" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/dashboard", icon: LayoutDashboard, label: "Insights" },
  { href: "/community", icon: Users, label: "Community" },
  { href: "/profile", icon: User, label: "Profile" },
]

const recruiterItems = [
  { href: "/discover", icon: Layers, label: "Discover" },
  { href: "/feed", icon: Newspaper, label: "Feed" },
  { href: "/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/matches", icon: Columns3, label: "Pipeline" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/dashboard", icon: LayoutDashboard, label: "Insights" },
  { href: "/community", icon: Users, label: "Community" },
  { href: "/profile", icon: User, label: "Profile" },
]

export function AppBottomNav({ role }: { role: UserRole | "admin" }) {
  const pathname = usePathname()
  if (role === "admin") return null

  const items = role === "recruiter" ? recruiterItems : studentItems

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/75 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-2xl backdrop-saturate-150 lg:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex h-[var(--app-tabbar-height)] w-full max-w-[1728px] items-stretch px-0.5">
        {items.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Button
              key={href}
              asChild
              variant="ghost"
              className={cn(
                "h-auto min-w-0 flex-1 flex-col gap-0.5 rounded-md px-0 py-1 text-[9px] font-medium leading-none tracking-tight shadow-none",
                "[&_svg]:size-4",
                active ? "text-primary hover:bg-accent hover:text-primary" : "text-muted-foreground"
              )}
            >
              <Link href={href} aria-current={active ? "page" : undefined}>
                <Icon strokeWidth={active ? 2.15 : 1.7} />
                <span className="max-w-full truncate">{label}</span>
              </Link>
            </Button>
          )
        })}
      </div>
    </nav>
  )
}
