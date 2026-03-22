type DashboardPanelProps = {
  title: string
  description?: string
  badge?: string
  children: React.ReactNode
}

/** Primary content section — always expanded (no accordion) for scan-friendly dashboards */
export function DashboardPanel({ title, description, badge, children }: DashboardPanelProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-col gap-1 border-b border-border bg-muted/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div className="min-w-0">
          <h2 className="font-heading text-base font-semibold tracking-tight text-foreground">{title}</h2>
          {description ? <p className="font-body mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {badge ? (
          <span className="font-data w-fit shrink-0 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}
