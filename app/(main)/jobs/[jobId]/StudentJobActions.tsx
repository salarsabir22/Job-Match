"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/lib/hooks/use-toast"
import { Heart, Bookmark, X } from "lucide-react"

type Direction = "right" | "left" | "saved"

export function StudentJobActions({
  userId,
  jobId,
  jobTitle,
}: {
  userId: string
  jobId: string
  jobTitle: string
}) {
  const { toast } = useToast()
  const [direction, setDirection] = useState<Direction | null>(null)
  const [loadingState, setLoadingState] = useState<"idle" | "fetch" | "act">("fetch")

  const loadSwipe = useCallback(async () => {
    setLoadingState("fetch")
    const supabase = createClient()
    const { data } = await supabase
      .from("job_swipes")
      .select("direction")
      .eq("student_id", userId)
      .eq("job_id", jobId)
      .maybeSingle()
    const d = data?.direction as Direction | undefined
    setDirection(d ?? null)
    setLoadingState("idle")
  }, [userId, jobId])

  useEffect(() => {
    void loadSwipe()
  }, [loadSwipe])

  const act = async (next: Direction) => {
    setLoadingState("act")
    const supabase = createClient()
    const { error } = await supabase.from("job_swipes").insert({
      student_id: userId,
      job_id: jobId,
      direction: next,
    })
    if (error) {
      const dup = error.message.toLowerCase().includes("duplicate") || error.code === "23505"
      toast({
        variant: "destructive",
        title: "Could not save",
        description: dup ? "You already responded to this role." : error.message,
      })
      setLoadingState("idle")
      void loadSwipe()
      return
    }
    setDirection(next)
    if (next === "right") {
      toast({ title: "Applied", description: jobTitle })
    } else if (next === "saved") {
      toast({ title: "Saved for later" })
    }
    setLoadingState("idle")
  }

  if (loadingState === "fetch") {
    return (
      <div className="flex items-center gap-3 py-2">
        <div
          className="h-6 w-6 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin shrink-0"
          aria-hidden
        />
        <span className="font-body text-sm text-neutral-500">Loading your status…</span>
      </div>
    )
  }

  if (direction === "right") {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5 space-y-3">
        <p className="font-body text-sm text-neutral-700">
          You have applied to this role. Recruiters see your profile when they review applicants.
        </p>
        <Link
          href="/matches"
          className="inline-flex text-sm font-medium text-neutral-950 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-950"
        >
          View matches
        </Link>
      </div>
    )
  }

  if (direction === "saved") {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5">
        <p className="font-body text-sm text-neutral-700">
          Saved for later. Find it from Discover or your dashboard.
        </p>
        <Link
          href="/discover"
          className="inline-flex mt-3 text-sm font-medium text-neutral-950 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-950"
        >
          Back to Discover
        </Link>
      </div>
    )
  }

  if (direction === "left") {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
        <p className="font-body text-sm text-neutral-600">You passed on this listing.</p>
        <Link
          href="/discover"
          className="inline-flex rounded-full bg-neutral-950 px-5 py-2.5 font-body text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          Discover more roles
        </Link>
      </div>
    )
  }

  const busy = loadingState === "act"

  return (
    <div className="space-y-3">
      <p className="font-body text-sm text-neutral-500">Apply, save for later, or pass.</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void act("left")}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 py-3 font-body text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50"
        >
          <X className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
          Pass
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void act("saved")}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 py-3 font-body text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
        >
          <Bookmark className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
          Save
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void act("right")}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-950 py-3 font-body text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
        >
          <Heart className="h-4 w-4 shrink-0" fill="currentColor" stroke="currentColor" strokeWidth={1.5} aria-hidden />
          Apply
        </button>
      </div>
    </div>
  )
}
