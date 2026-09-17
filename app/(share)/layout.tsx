import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ShareLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4">
          <Link href={user ? "/discover" : "/"} className="font-heading text-[17px] font-semibold tracking-tight">
            jobmatch<span className="text-muted-foreground">.</span>
          </Link>
          {user ? (
            <Button asChild size="sm" className="rounded-full">
              <Link href="/discover">Open app</Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </header>
      <main className="px-4 py-6 sm:py-8">{children}</main>
    </div>
  )
}
