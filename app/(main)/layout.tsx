import { createClient } from "@/lib/supabase/server"
import { AppNav } from "@/components/nav/AppNav"
import type { UserRole } from "@/types"
import { NotificationBell } from "@/components/nav/NotificationBell"

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let role: UserRole | "admin" = "student"
  let fullName: string | null = null
  let avatarUrl: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name, avatar_url")
      .eq("id", user.id)
      .single()
    role      = (profile?.role as UserRole | "admin") || "student"
    fullName  = profile?.full_name ?? null
    avatarUrl = profile?.avatar_url ?? null
  }

  return (
    <div className="min-h-screen bg-black text-white flex selection:bg-white/10">
      <AppNav
        role={role}
        fullName={fullName}
        email={user?.email ?? null}
        avatarUrl={avatarUrl}
      />

      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        <div className="hidden lg:flex h-14 shrink-0 items-center border-b border-white/[0.08] bg-black/60 backdrop-blur-md sticky top-0 z-30 px-6">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="text-right">
              <p className="font-body text-sm font-medium text-white/90 leading-none">
                {fullName ?? user?.email?.split("@")[0]}
              </p>
              <p className="font-data text-[10px] tracking-[0.15em] uppercase text-white/38 mt-0.5 capitalize">
                {role}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/[0.12] border border-white/[0.12] flex items-center justify-center text-white font-bold text-sm shrink-0">
              {(fullName ?? user?.email ?? "?").charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <main className="flex-1 pt-16 pb-24 lg:pt-0 lg:pb-0 overflow-y-auto">
          <div className="px-3 py-4 lg:px-6 lg:py-6 max-w-screen-xl mx-auto w-full">
            <div className="rounded-2xl border border-white/[0.1] bg-white text-black min-h-[calc(100vh-6rem)] lg:min-h-[calc(100vh-5.5rem)] px-4 py-6 lg:px-8 lg:py-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
