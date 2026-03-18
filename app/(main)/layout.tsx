import { createClient } from "@/lib/supabase/server"
import { AppNav } from "@/components/nav/AppNav"
import type { UserRole } from "@/types"

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
    <div className="min-h-screen bg-[#030304]">
      <AppNav
        role={role}
        fullName={fullName}
        email={user?.email ?? null}
        avatarUrl={avatarUrl}
      />

      {/* Page content */}
      <main className="min-h-screen pt-14 pb-24 lg:pb-0 overflow-y-auto">
        <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-screen-xl mx-auto">
          {/* Card-style wrapper to match the dashboard design */}
          <div className="rounded-3xl border border-white/6 bg-white/[0.02] backdrop-blur-sm shadow-[0_0_40px_-20px_rgba(247,147,26,0.25)] overflow-hidden">
            <div className="p-5 lg:p-8">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
