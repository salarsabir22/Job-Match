import { cn } from "@/lib/utils"

type DiscoverLoadingProps = {
  label?: string
  className?: string
}

export function DiscoverLoading({ label = "Loading…", className }: DiscoverLoadingProps) {
  return (
    <div className={cn("flex min-h-[40vh] items-center justify-center py-24", className)}>
      <div className="flex w-full max-w-sm flex-col items-center gap-6 px-4">
        <div className="relative h-14 w-14">
          <div
            className="absolute inset-0 rounded-2xl border border-border bg-muted/40"
            aria-hidden
          />
          <div
            className="absolute inset-0 animate-pulse rounded-2xl bg-gradient-to-br from-primary/15 to-transparent"
            aria-hidden
          />
          <div
            className="absolute inset-0 m-auto h-7 w-7 rounded-full border-2 border-muted border-t-primary animate-spin"
            aria-hidden
          />
        </div>
        <div className="w-full space-y-3">
          <div className="mx-auto h-2 w-32 rounded-full bg-muted animate-pulse" />
          <div className="mx-auto h-2 w-48 max-w-full rounded-full bg-muted/70 animate-pulse" />
        </div>
        <p className="font-body text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
