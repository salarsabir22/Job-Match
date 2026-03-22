import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type DiscoverStatItem = {
  label: string
  value: number | string
  hint?: string
  icon?: LucideIcon
}

type DiscoverStatStripProps = {
  items: DiscoverStatItem[]
  caption?: string
  className?: string
}

export function DiscoverStatStrip({ items, caption, className }: DiscoverStatStripProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {caption ? (
        <p className="font-data text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{caption}</p>
      ) : null}
      <Card className="overflow-hidden p-0 shadow-sm">
        <div className="grid grid-cols-3 divide-x divide-border bg-card">
          {items.map(({ label, value, hint, icon: Icon }) => (
            <div
              key={label}
              className="group relative px-4 py-4 text-center sm:px-5 sm:text-left"
              title={hint}
            >
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                {Icon ? (
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground opacity-80 group-hover:opacity-100" aria-hidden />
                ) : null}
                <p className="font-heading text-2xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
              </div>
              <p className="font-body text-[11px] font-medium text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
