import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { KpiSparkline } from "@/components/dashboard/KpiSparkline"

type DashboardKpiCardProps = {
  icon: LucideIcon
  label: string
  value: string | number
  hint?: string | null
  trend?: number[]
}

export function DashboardKpiCard({ icon: Icon, label, value, hint, trend }: DashboardKpiCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5">
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100"
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="rounded-xl bg-primary/12 p-2.5 text-primary">
          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </div>
        {trend && trend.some((n) => n > 0) ? <KpiSparkline values={trend} /> : null}
      </div>
      <p className="font-data relative mt-4 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "font-heading relative mt-1.5 text-3xl font-semibold tabular-nums tracking-tight text-foreground"
        )}
      >
        {value}
      </p>
      {hint ? <p className="font-body relative mt-2 text-[13px] leading-snug text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
