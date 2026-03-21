"use client"

import type { ReactNode } from "react"
import { motion, useReducedMotion, type Variants } from "framer-motion"

/** Premium ease — fast out, no bounce */
export const easeOutExpo = [0.16, 1, 0.3, 1] as const

export const viewportOnce = {
  once: true,
  amount: 0.18,
  margin: "-72px 0px -48px 0px",
} as const

const duration = 0.58

export const fadeUpSoft: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration, ease: easeOutExpo },
  },
}

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -28 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: duration + 0.06, ease: easeOutExpo },
  },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 28 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: duration + 0.06, ease: easeOutExpo },
  },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.12 },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration, ease: easeOutExpo },
  },
}

export const faqStaggerParent: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.065, delayChildren: 0.05 },
  },
}

export const faqStaggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: easeOutExpo },
  },
}

function reducedVariants(v: Variants): Variants {
  return {
    hidden: { opacity: 1, y: 0, x: 0 },
    visible: { opacity: 1, y: 0, x: 0, transition: { duration: 0 } },
  }
}

/** Use for any `variants` prop when respecting reduced motion */
export function useReducedEnterVariants(base: Variants): Variants {
  const reduce = useReducedMotion()
  return reduce ? reducedVariants(base) : base
}

/** Scroll-triggered fade-up */
export function Reveal({
  children,
  className,
  variants = fadeUpSoft,
}: {
  children: ReactNode
  className?: string
  variants?: Variants
}) {
  const reduce = useReducedMotion()
  const v = reduce ? reducedVariants(variants) : variants
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={v}
    >
      {children}
    </motion.div>
  )
}

/** Hero / above-fold: animate on mount */
export function StaggerMount({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={reduce ? { hidden: {}, visible: { transition: { staggerChildren: 0 } } } : staggerContainer}
    >
      {children}
    </motion.div>
  )
}

export function StaggerChild({ children, className }: { children: ReactNode; className?: string }) {
  const v = useReducedEnterVariants(staggerItem)
  return (
    <motion.div className={className} variants={v}>
      {children}
    </motion.div>
  )
}
