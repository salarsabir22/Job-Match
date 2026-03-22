import Link from "next/link"
import type { LucideIcon } from "lucide-react"

type DashboardEmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  primaryAction?: { href: string; label: string }
  secondaryAction?: { href: string; label: string }
}

export function DashboardEmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
}: DashboardEmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-muted/25 px-6 py-12 text-center">
      <div className="rounded-2xl bg-muted/80 p-3 text-muted-foreground">
        <Icon className="h-8 w-8" strokeWidth={1.25} aria-hidden />
      </div>
      <h3 className="font-heading mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="font-body mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      {(primaryAction || secondaryAction) && (
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {primaryAction ? (
            <Link
              href={primaryAction.href}
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 font-body text-sm font-medium text-primary-foreground transition hover:bg-[var(--clearpath-navy-hover)]"
            >
              {primaryAction.label}
            </Link>
          ) : null}
          {secondaryAction ? (
            <Link
              href={secondaryAction.href}
              className="inline-flex items-center justify-center rounded-full border-2 border-primary bg-transparent px-6 py-2.5 font-body text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
            >
              {secondaryAction.label}
            </Link>
          ) : null}
        </div>
      )}
    </div>
  )
}
