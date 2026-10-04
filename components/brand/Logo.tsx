import { cn } from "@/lib/utils"

/**
 * Wordmark only. Set in Bagoss Condensed (see `.lp-logo-font` in globals.css), which needs a
 * licensed font file in public/fonts/. Until then it falls back to Outfit, then Arial.
 */
export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("lp-logo-font inline-block font-bold tracking-[-0.03em] text-foreground", className)}
      style={{ fontSize: Math.round(size * 0.85), lineHeight: 1 }}
    >
      swypejobs<span className="text-primary">.</span>
    </span>
  )
}
