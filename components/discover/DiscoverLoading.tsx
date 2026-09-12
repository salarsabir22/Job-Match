import { AppleActivityIndicator } from "@/components/ui/apple-activity-indicator"
import { cn } from "@/lib/utils"

type DiscoverLoadingProps = {
  label?: string
  className?: string
}

export function DiscoverLoading({ label = "Loading…", className }: DiscoverLoadingProps) {
  return (
    <div
      className={cn("flex min-h-[40vh] items-center justify-center py-24", className)}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        <AppleActivityIndicator size={36} />
        <p className="font-body text-[13px] font-medium tracking-[-0.01em] text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  )
}
