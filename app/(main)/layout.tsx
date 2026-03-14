import { createClient } from "@/lib/supabase/server"
import { AppNav } from "@/components/nav/AppNav"
import type { UserRole } from "@/types"

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let role: UserRole | "admin" = "student"
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    role = (profile?.role as UserRole | "admin") || "student"
  }

  return (
    <div className="min-h-screen bg-[#030304]">
      <AppNav role={role} />

      {/* Desktop: offset content by sidebar width. Mobile: full width with bottom padding */}
      <main className="lg:ml-60 min-h-screen pb-20 lg:pb-10 pt-20 lg:pt-8">
        <div className="w-full max-w-7xl px-4 lg:px-10 mx-auto lg:mx-0">
          {children}
        </div>
      </main>
    </div>
  )
}
