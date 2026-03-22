type DashboardPageHeaderProps = {
  eyebrow: string
  title: string
  description: string
  action?: React.ReactNode
}

export function DashboardPageHeader({ eyebrow, title, description, action }: DashboardPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        <p className="font-data text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl sm:leading-snug">
          {title}
        </h1>
        <p className="font-body max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        <p className="font-data text-[10px] text-muted-foreground/80">
          Figures use your account activity; charts cover the last 30 days (UTC).
        </p>
      </div>
      {action ? <div className="shrink-0 pt-0.5">{action}</div> : null}
    </header>
  )
}
