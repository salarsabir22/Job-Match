"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { RecruiterMatchesView } from "@/app/(main)/matches/RecruiterMatchesView"

export function RecruiterJobsHub({
  userId,
  defaultTab,
  children,
}: {
  userId: string
  defaultTab: "jobs" | "pipeline"
  children: React.ReactNode
}) {
  const [tab, setTab] = useState<"jobs" | "pipeline">(defaultTab)

  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-xl border border-border bg-muted/40 p-1">
        {(
          [
            { key: "jobs" as const, label: "Your jobs" },
            { key: "pipeline" as const, label: "Matches" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-lg py-2 font-body text-sm font-medium transition",
              tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "jobs" ? children : <RecruiterMatchesView userId={userId} />}
    </div>
  )
}
