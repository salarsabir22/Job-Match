"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { easeOutExpo } from "@/components/motion/waitlist-motion"
import { cn } from "@/lib/utils"

type Lane = "candidate" | "recruiter" | "decision" | "match" | "none"

type FlowNode = {
  id: string
  label: string
  sub: string
  lane: Lane
  /** Centre point and width, in viewBox units (1000 x 440). */
  x: number
  y: number
  w: number
}

const VB_W = 1000
const VB_H = 440

const NODES: FlowNode[] = [
  { id: "profile", label: "Build a profile", sub: "School, skills, résumé", lane: "candidate", x: 125, y: 110, w: 210 },
  { id: "swipe", label: "Swipe right on a role", sub: "Interest, for one job", lane: "candidate", x: 415, y: 110, w: 210 },
  { id: "post", label: "Post a role", sub: "City, pay band, skills", lane: "recruiter", x: 125, y: 330, w: 210 },
  { id: "hand", label: "See who raised a hand", sub: "Only people who want it", lane: "recruiter", x: 415, y: 330, w: 210 },
  { id: "back", label: "Swipe back?", sub: "Mutual yes only", lane: "decision", x: 640, y: 220, w: 160 },
  { id: "match", label: "Match: chat opens", sub: "One thread, tied to the role", lane: "match", x: 875, y: 110, w: 210 },
  { id: "none", label: "Nothing is sent", sub: "No cold DM, no ghosting", lane: "none", x: 875, y: 330, w: 210 },
]

const VIOLET = "#6d5cff"
const MINT = "#12b886"
const CORAL = "#ff7a5c"

/** Edge endpoints sit exactly on node borders: right edge = x + w/2, left edge = x - w/2. */
const EDGES: { id: string; d: string; color: string }[] = [
  { id: "e1", d: "M230 110 H310", color: VIOLET },
  { id: "e2", d: "M230 330 H310", color: VIOLET },
  { id: "e3", d: "M520 110 C 565 110, 535 220, 560 220", color: VIOLET },
  { id: "e4", d: "M520 330 C 565 330, 535 220, 560 220", color: VIOLET },
  { id: "e5", d: "M720 220 C 755 220, 735 110, 770 110", color: MINT },
  { id: "e6", d: "M720 220 C 755 220, 735 330, 770 330", color: CORAL },
]

const COLORS = [VIOLET, MINT, CORAL]

const laneStyle: Record<Lane, string> = {
  candidate: "border-[var(--lp-accent)]/40 bg-white text-foreground shadow-[0_6px_20px_-10px_rgba(90,72,255,0.45)]",
  recruiter: "border-transparent bg-[#14102e] text-white shadow-[0_6px_20px_-10px_rgba(20,16,46,0.6)]",
  decision:
    "border-transparent bg-[var(--lp-mint)] text-[#06241a] shadow-[0_8px_24px_-10px_rgba(18,184,134,0.7)]",
  match: "border-transparent bg-primary text-white shadow-[0_8px_24px_-10px_rgba(90,72,255,0.8)]",
  none: "border-dashed border-[var(--lp-coral)] bg-white text-foreground",
}

const STAGES = [
  { k: "Chatting", d: "Questions, links and scheduling, all on the role." },
  { k: "Interview", d: "Time agreed in the thread, so nothing is lost in email." },
  { k: "Offer", d: "The decision is made with the whole conversation in view." },
  { k: "Hired", d: "The match closes with a result, not a ghosted thread." },
]

function NodeBody({ node }: { node: FlowNode }) {
  return (
    <>
      <span className="block text-[15px] font-semibold leading-tight tracking-[-0.02em]">{node.label}</span>
      <span className="mt-1 block text-[12px] leading-snug opacity-75">{node.sub}</span>
    </>
  )
}

export function FlowChart() {
  const reduce = useReducedMotion()
  const pct = (v: number, total: number) => `${(v / total) * 100}%`

  return (
    <div>
      <Card className="overflow-hidden bg-[var(--lp-surface)] p-4 sm:p-6">
        {/* Desktop: two rows that merge into one decision, then split */}
        <div
          className="relative mx-auto hidden w-full max-w-[1100px] lg:block"
          style={{ aspectRatio: `${VB_W} / ${VB_H}` }}
        >
          {/* Row tints, aligned to the node rows */}
          <div
            className="absolute inset-x-0 rounded-3xl bg-primary/[0.08]"
            style={{ top: pct(30, VB_H), height: pct(160, VB_H) }}
            aria-hidden
          />
          <div
            className="absolute inset-x-0 rounded-3xl bg-[#14102e]/[0.05]"
            style={{ top: pct(250, VB_H), height: pct(160, VB_H) }}
            aria-hidden
          />

          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            aria-hidden
          >
            <defs>
              {COLORS.map((c) => (
                <marker
                  key={c}
                  id={`arrow-${c.slice(1)}`}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="9"
                  markerHeight="9"
                  markerUnits="userSpaceOnUse"
                  orient="auto-start-reverse"
                >
                  <path d="M1 1 L9 5 L1 9 Z" fill={c} />
                </marker>
              ))}
            </defs>
            {EDGES.map((edge) => (
              <g key={edge.id}>
                <path
                  d={edge.d}
                  fill="none"
                  stroke={edge.color}
                  strokeOpacity={0.28}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  markerEnd={`url(#arrow-${edge.color.slice(1)})`}
                />
                <path
                  d={edge.d}
                  fill="none"
                  stroke={edge.color}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  className="lp-flow"
                />
              </g>
            ))}
          </svg>

          {NODES.map((node, i) => (
            <div
              key={node.id}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: pct(node.x, VB_W), top: pct(node.y, VB_H), width: pct(node.w, VB_W) }}
            >
              <motion.div
                initial={reduce ? false : { y: 10, scale: 0.97 }}
                whileInView={{ y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: easeOutExpo }}
              >
                <div
                  className={cn(
                    "w-full border px-4 py-3.5 text-left",
                    node.lane === "decision" ? "rounded-full px-5 text-center" : "rounded-2xl",
                    laneStyle[node.lane]
                  )}
                >
                  <NodeBody node={node} />
                </div>
              </motion.div>
            </div>
          ))}
        </div>

        {/* Mobile and tablet: ordered steps */}
        <ol className="relative ml-3 space-y-3 border-l-2 border-border pl-6 lg:hidden">
          {NODES.map((node) => (
            <li key={node.id} className="relative">
              <span
                aria-hidden
                className={cn(
                  "absolute -left-[31px] top-5 size-3 rounded-full ring-4 ring-[var(--lp-surface)]",
                  node.lane === "none"
                    ? "bg-[var(--lp-coral)]"
                    : node.lane === "decision"
                      ? "bg-[var(--lp-mint)]"
                      : "bg-[var(--lp-accent)]"
                )}
              />
              <div className={cn("w-full rounded-2xl border px-4 py-3 text-left", laneStyle[node.lane])}>
                <NodeBody node={node} />
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {/* After the match */}
      <div className="mt-14">
        <p className="max-w-[48ch] text-[1.4rem] font-semibold leading-snug tracking-[-0.03em]">
          Every match moves through the same four stages, so a hiring cycle is easy to read.
        </p>
        <ol className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 sm:gap-x-0">
          {STAGES.map((stage, i) => (
            <motion.li
              key={stage.k}
              initial={reduce ? false : { y: 12 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: easeOutExpo }}
              className="relative border-t-2 border-[#14102e]/20 pr-4 pt-5"
            >
              <span
                aria-hidden
                className={cn(
                  "absolute -top-[7px] left-0 size-3 rounded-full",
                  i === STAGES.length - 1 ? "bg-[var(--lp-mint)]" : "bg-[var(--lp-accent)]"
                )}
              />
              <p className="text-[1.1rem] font-semibold tracking-[-0.02em]">{stage.k}</p>
              <p className="mt-1 text-[14px] leading-[1.55] text-muted-foreground">{stage.d}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </div>
  )
}
