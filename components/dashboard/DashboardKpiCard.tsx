import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type DashboardKpiCardProps = {
  icon: LucideIcon
  label: string
  value: string | number
  hint?: string | null
}

export function DashboardKpiCard({ icon: Icon, label, value, hint }: DashboardKpiCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-5",
        "transition-shadow duration-200 hover:shadow-[0_1px_0_0_rgba(10,22,40,0.06)]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </div>
      </div>
      <p className="font-data mt-4 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="font-heading mt-1.5 text-3xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
      {hint ? <p className="font-body mt-2 text-[13px] leading-snug text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
