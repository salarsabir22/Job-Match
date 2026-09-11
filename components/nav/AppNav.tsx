"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Menu, MessageSquareText, Share2, UserRound } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types"
import { NotificationBell } from "@/components/nav/NotificationBell"
import { ShareProfileMenuItem } from "@/components/share/ShareButton"
import { profileSharePath } from "@/lib/share/profile-path"
import { shareOrCopyLink } from "@/lib/share/share-link"
import { useToast } from "@/lib/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type NavLink = { href: string; label: string }

const studentLinks: NavLink[] = [
  { href: "/discover", label: "Discover" },
  { href: "/matches", label: "Matches" },
  { href: "/chat", label: "Messages" },
  { href: "/dashboard", label: "Insights" },
  { href: "/community", label: "Community" },
]

const recruiterLinks: NavLink[] = [
  { href: "/jobs", label: "Jobs" },
  { href: "/discover", label: "Discover" },
  { href: "/chat", label: "Messages" },
  { href: "/dashboard", label: "Insights" },
  { href: "/community", label: "Community" },
]

const adminLinks: NavLink[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/recruiters", label: "Recruiters" },
  { href: "/admin/channels", label: "Channels" },
]

interface AppNavProps {
  role: UserRole | "admin"
  userId?: string | null
  fullName?: string | null
  email?: string | null
  avatarUrl?: string | null
  shareTitle?: string | null
}

export function AppNav({ role, userId, fullName, email, avatarUrl, shareTitle }: AppNavProps) {
  const pathname = usePathname()
  const { toast } = useToast()
  const [mobileOpen, setMobileOpen] = useState(false)
  const signedIn = Boolean(userId)
  const canShareProfile = signedIn && role !== "admin" && Boolean(userId)
  const sharePath = userId && role !== "admin" ? profileSharePath(role, userId) : null
  const resolvedShareTitle = shareTitle || fullName || (role === "recruiter" ? "Company profile" : "Profile")
  const links = !signedIn
    ? []
    : role === "student"
      ? studentLinks
      : role === "recruiter"
        ? recruiterLinks
        : adminLinks

  const shareOwnProfile = async () => {
    if (!sharePath) return
    const result = await shareOrCopyLink({ path: sharePath, title: resolvedShareTitle })
    if (result === "copied") {
      toast({ title: "Link copied ✨", description: "Send it to whoever needs it." })
    } else if (result === "failed") {
      toast({ variant: "destructive", title: "Could not copy link" })
    }
  }

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
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-full w-full max-w-[1728px] items-center gap-3 px-4 sm:px-6 lg:px-10 xl:px-14">
        {signedIn ? (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-80 flex-col p-0">
            <SheetHeader className="border-b border-border px-5 py-4 text-left">
              <SheetTitle className="font-heading text-base tracking-tight">
                jobmatch<span className="text-muted-foreground">.</span>
              </SheetTitle>
              <SheetDescription>{roleLabel} menu</SheetDescription>
            </SheetHeader>
            <nav className="grid gap-1 p-3" aria-label="Mobile">
              {links.map((link) => (
                <SheetClose asChild key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive(link.href)
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              ))}
              {signedIn && role !== "admin" ? (
                <>
                  <SheetClose asChild>
                    <Link
                      href="/profile"
                      className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      Profile
                    </Link>
                  </SheetClose>
                  {canShareProfile ? (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        void shareOwnProfile()
                        setMobileOpen(false)
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                      Share profile
                    </button>
                  ) : null}
                  <SheetClose asChild>
                    <Link
                      href="/feedback"
                      className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      Feedback
                    </Link>
                  </SheetClose>
                </>
              ) : null}
            </nav>
            <div className="mt-auto border-t border-border p-3">
              <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        ) : null}

        <Link href="/" className="shrink-0 font-heading text-[17px] font-semibold tracking-tight text-foreground">
          jobmatch<span className="text-muted-foreground">.</span>
        </Link>
        {signedIn ? (
          <Badge variant="secondary" className="hidden uppercase tracking-[0.14em] sm:inline-flex">
            {roleLabel}
          </Badge>
        ) : null}

        <NavigationMenu viewport={false} className={cn("hidden min-w-0 flex-1 justify-start lg:flex", !signedIn && "lg:hidden")}>
          <NavigationMenuList className="justify-start">
            {links.map((link) => (
              <NavigationMenuItem key={link.href}>
                <NavigationMenuLink asChild active={isActive(link.href)}>
                  <Link
                    href={link.href}
                    data-active={isActive(link.href)}
                    className={cn(navigationMenuTriggerStyle(), "bg-transparent")}
                  >
                    {link.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex items-center gap-1.5">
          {signedIn ? (
            <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatarUrl ?? undefined} alt="" />
                      <AvatarFallback className="bg-primary/15 text-xs text-primary">{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="truncate text-sm font-medium leading-none">{displayName}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{email ?? roleLabel}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {role !== "admin" ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <UserRound />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      {sharePath ? <ShareProfileMenuItem path={sharePath} title={resolvedShareTitle} /> : null}
                      <DropdownMenuItem asChild>
                        <Link href="/feedback">
                          <MessageSquareText />
                          Feedback
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  ) : null}
                  <DropdownMenuItem onSelect={() => void handleSignOut()}>
                    <LogOut />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild size="sm" className="rounded-full">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
