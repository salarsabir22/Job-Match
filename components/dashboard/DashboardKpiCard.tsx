import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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
    <Card className="group relative overflow-hidden">
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl"
        aria-hidden
      />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="rounded-xl bg-primary/12 p-2.5 text-primary">
            <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </div>
          {trend && trend.some((n) => n > 0) ? <KpiSparkline values={trend} /> : null}
        </div>
        <p className="font-data mt-4 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="font-heading mt-1.5 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
          {value}
        </p>
        {hint ? <p className="font-body mt-2 text-[13px] leading-snug text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}
