"use client"

import type { ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { easeOutExpo } from "@/components/motion/waitlist-motion"
import { cn } from "@/lib/utils"

export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--lp-accent)]",
        className
      )}
    >
      <span aria-hidden className="size-1.5 bg-[var(--lp-mint)]" />
      {children}
    </p>
  )
}

/** Content is always visible. It only drifts up a few pixels as it scrolls into view. */
export function Rise({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { y: 18 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, delay, ease: easeOutExpo }}
    >
      {children}
    </motion.div>
  )
}

const tones = {
  blue: "bg-[#e9e6ff] text-[#251c4d]",
  mint: "bg-[#c8fbe6] text-[#053d2c]",
  ink: "bg-[#14102e] text-white",
  coral: "bg-[#ffe1da] text-[#6b1d0e]",
} as const

export function Chip({
  children,
  tone = "blue",
  className,
}: {
  children: ReactNode
  tone?: keyof typeof tones
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn("shrink-0 border-transparent px-2.5 py-1 text-[11px] font-medium", tones[tone], className)}
    >
      {children}
    </Badge>
  )
}
