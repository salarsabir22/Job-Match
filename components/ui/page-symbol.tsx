import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type PageSymbolProps = {
  icon: LucideIcon
  className?: string
  /** Apple-blue tint (default) or neutral gray plate */
  variant?: "tint" | "neutral"
}

/** SF Symbols–style page glyph: thin stroke, rounded plate. Use on page content only, not sidebar nav. */
export function PageSymbol({ icon: Icon, className, variant = "tint" }: PageSymbolProps) {
  return (
    <span
      className={cn(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]",
        variant === "tint" && "bg-[#0071e3]/12 text-[#0071e3]",
        variant === "neutral" && "bg-[#e8e8ed] text-[#1d1d1f]",
        className
      )}
      aria-hidden
    >
      <Icon strokeWidth={1.5} className="h-[22px] w-[22px]" />
    </span>
  )
}
