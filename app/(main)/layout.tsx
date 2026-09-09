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
    role = (profile?.role as UserRole | "admin") || "student"
    fullName = profile?.full_name ?? null
    avatarUrl = profile?.avatar_url ?? null
  }

  return (
    <div className="dark min-h-screen apple-grouped-bg text-foreground selection:bg-primary/20">
      <AppNav
        role={role}
        fullName={fullName}
        email={user?.email ?? null}
        avatarUrl={avatarUrl}
      />

      <main className="pt-16">
        <div className="mx-auto w-full max-w-[1728px] min-h-[calc(100vh-4rem)] px-4 py-5 sm:px-6 lg:px-10 xl:px-14 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
