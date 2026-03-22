import { formatDistanceToNow } from "date-fns"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type DiscoverSessionProgressProps = {
  position: number
  total: number
  loadedAt: Date | null
  className?: string
}

export function DiscoverSessionProgress({ position, total, loadedAt, className }: DiscoverSessionProgressProps) {
  const pct = total > 0 ? Math.round(((position - 1) / total) * 100) : 0

  return (
    <Card className={cn("overflow-hidden p-4 shadow-sm sm:p-5", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-0.5">
          <p className="font-body text-sm font-semibold tracking-tight text-foreground">
            Session · Card {position} of {total}
          </p>
          <p className="font-body text-xs text-muted-foreground">
            Up to 20 roles per load, newest first. Passing doesn&apos;t notify anyone.
          </p>
        </div>
        {loadedAt ? (
          <p className="shrink-0 font-data text-[11px] tabular-nums text-muted-foreground sm:text-right">
            Loaded {formatDistanceToNow(loadedAt, { addSuffix: true })}
          </p>
        ) : null}
      </div>
      <div
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress through this batch"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </Card>
  )
}
