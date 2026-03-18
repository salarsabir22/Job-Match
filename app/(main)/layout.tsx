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
    <div className="min-h-screen bg-[#030304] flex">
      <AppNav
        role={role}
        fullName={fullName}
        email={user?.email ?? null}
        avatarUrl={avatarUrl}
      />

      {/* Main content */}
      <div className="flex-1 min-h-screen flex flex-col">

        {/* Page content */}
        <main className="flex-1 pt-16 pb-24 lg:pb-0 overflow-y-auto">
          <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-screen-xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
