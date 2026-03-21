"use client"

import { useState } from "react"

type DashboardAccordionSectionProps = {
  title: string
  subtitle?: string
  badge?: string
  defaultOpen?: boolean
  children: React.ReactNode
}

export function DashboardAccordionSection({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  children,
}: DashboardAccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="rounded-2xl border border-black/10 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-black/[0.02] transition-colors"
      >
        <div className="min-w-0">
          <p className="font-heading text-sm font-semibold text-black truncate">{title}</p>
          {subtitle ? (
            <p className="font-body text-xs text-neutral-700 mt-0.5 truncate">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge ? (
            <span className="font-data text-[9px] tracking-widest uppercase px-2 py-1 rounded-full border border-black/10 text-neutral-700">
              {badge}
            </span>
          ) : null}
          <span className="font-data text-[10px] text-neutral-500 tabular-nums w-8 text-right">{open ? "Hide" : "Show"}</span>
        </div>
      </button>
      {open ? <div className="px-4 pb-4 border-t border-black/10">{children}</div> : null}
    </section>
  )
}

