import Link from "next/link"
import { Card } from "@/components/ui/card"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export function DiscoverHowItWorks({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden p-0 shadow-sm", className)}>
      <details className="group">
        <summary
          className={cn(
            "flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 font-body text-sm font-semibold tracking-tight text-foreground sm:px-5 sm:py-4",
            "[&::-webkit-details-marker]:hidden"
          )}
        >
          <span>How this feed works</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="border-t border-border bg-muted/20 px-4 pb-5 pt-4 sm:px-5">
          <div className="grid gap-6 sm:grid-cols-2">
            <section className="space-y-2">
              <p className="font-data text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                What you&apos;re seeing
              </p>
              <p className="font-body text-sm leading-relaxed text-muted-foreground">
                Active jobs only, from teams that have passed a basic review. We exclude roles you&apos;ve already
                swiped on so you don&apos;t duplicate decisions.
              </p>
            </section>
            <section className="space-y-2">
              <p className="font-data text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                When you apply
              </p>
              <p className="font-body text-sm leading-relaxed text-muted-foreground">
                The employer can view the profile you&apos;ve built here. Messaging unlocks after a{" "}
                <span className="font-medium text-foreground">mutual match</span> — see{" "}
                <Link href="/matches" className="font-medium text-primary underline-offset-4 hover:underline">
                  Matches
                </Link>
                .
              </p>
            </section>
            <section className="space-y-2">
              <p className="font-data text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Save &amp; pass
              </p>
              <p className="font-body text-sm leading-relaxed text-muted-foreground">
                Saved roles live in{" "}
                <Link href="/saved" className="font-medium text-primary underline-offset-4 hover:underline">
                  Saved
                </Link>
                . Pass moves you forward; open a full listing from the panel anytime.
              </p>
            </section>
            <section className="space-y-2">
              <p className="font-data text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Timing
              </p>
              <p className="font-body text-sm leading-relaxed text-muted-foreground">
                Recruiters respond on different schedules. Outcomes surface in Matches and notifications when we have
                them.
              </p>
            </section>
          </div>
        </div>
      </details>
    </Card>
  )
}
