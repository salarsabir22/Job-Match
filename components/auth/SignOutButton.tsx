"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut, Loader2 } from "lucide-react"

export function SignOutButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const signOut = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <button
      onClick={signOut}
      disabled={loading}
      className="w-full h-11 rounded-xl border border-neutral-500/25 text-neutral-500 font-body font-medium text-sm hover:bg-red-500/10 hover:border-neutral-500/40 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      Sign Out
    </button>
  )
}
