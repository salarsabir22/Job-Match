"use client"

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react"
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion"
import { Button } from "@/components/ui/button"

export type DeckVariant = "jobs" | "people"

type FlashCard = {
  id: string
  eyebrow: string
  title: string
  org: string
  place: string
  fact: string
  tags: string[]
}

const JOBS: FlashCard[] = [
  {
    id: "systems",
    eyebrow: "Internship · Lahore",
    title: "Engineering intern",
    org: "Systems Limited",
    place: "Hybrid · Summer 2026",
    fact: "PKR 80–120k / month",
    tags: ["TypeScript", "APIs"],
  },
  {
    id: "markets",
    eyebrow: "New grad · Karachi",
    title: "Markets analyst",
    org: "Corporate banking rotation",
    place: "On-site · Class of 2026",
    fact: "PKR 95–140k / month",
    tags: ["Excel", "Markets"],
  },
  {
    id: "design",
    eyebrow: "Internship · Remote",
    title: "Product design intern",
    org: "Product studio",
    place: "PKT overlap · 4 days",
    fact: "$700–1,000 / month",
    tags: ["Figma", "Research"],
  },
  {
    id: "backend",
    eyebrow: "New grad · Islamabad",
    title: "Backend engineer",
    org: "Infrastructure team",
    place: "On-site · Mentored first quarter",
    fact: "PKR 120–180k / month",
    tags: ["Go", "Postgres"],
  },
  {
    id: "growth",
    eyebrow: "Internship · Lahore",
    title: "Growth intern",
    org: "Consumer app",
    place: "Hybrid · One channel to own",
    fact: "PKR 60–90k / month",
    tags: ["Lifecycle", "SQL"],
  },
  {
    id: "data",
    eyebrow: "New grad · Remote",
    title: "Data analyst",
    org: "Early-career cohort",
    place: "Remote · Weekly review",
    fact: "PKR 100–150k / month",
    tags: ["Python", "SQL"],
  },
]

const PEOPLE: FlashCard[] = [
  {
    id: "ayesha",
    eyebrow: "LUMS · Computer science",
    title: "Ayesha Rahman",
    org: "Class of 2026",
    place: "Lahore",
    fact: "Wants: summer internship in product",
    tags: ["React", "Python"],
  },
  {
    id: "hamza",
    eyebrow: "NUST · Electrical engineering",
    title: "Hamza Ali",
    org: "Class of 2026",
    place: "Islamabad",
    fact: "Wants: embedded systems internship",
    tags: ["C++", "Embedded"],
  },
  {
    id: "sara",
    eyebrow: "IBA · Accounting and finance",
    title: "Sara Iqbal",
    org: "Class of 2025",
    place: "Karachi",
    fact: "Wants: new grad, audit or markets",
    tags: ["Excel", "Audit"],
  },
  {
    id: "zain",
    eyebrow: "FAST · Software engineering",
    title: "Zain Ahmed",
    org: "Class of 2026",
    place: "Lahore",
    fact: "Wants: new grad backend role",
    tags: ["Go", "Distributed systems"],
  },
  {
    id: "maryam",
    eyebrow: "Habib University · Design",
    title: "Maryam Khan",
    org: "Class of 2026",
    place: "Karachi",
    fact: "Wants: design internship",
    tags: ["Figma", "Brand"],
  },
  {
    id: "ibrahim",
    eyebrow: "GIKI · Mechanical engineering",
    title: "Ibrahim Shah",
    org: "Class of 2025",
    place: "Topi",
    fact: "Wants: graduate role in manufacturing",
    tags: ["CAD", "Production"],
  },
]

const EASE = [0.22, 1, 0.36, 1] as const

type SwipeHandle = {
  leave: (dir: 1 | -1) => void
}

function CardFace({ card }: { card: FlashCard }) {
  return (
    <div className="flex h-full flex-col bg-white p-6 text-[#0f0b1e]">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#55506b]">{card.eyebrow}</p>
      <p className="mt-7 text-balance text-[2rem] font-semibold leading-[1.03] tracking-[-0.045em]">{card.title}</p>
      <p className="mt-3 text-[15px] font-medium tracking-[-0.01em] text-[#5a48ff]">{card.org}</p>
      <p className="mt-1 text-[14px] leading-snug text-[#55506b]">{card.place}</p>
      <div className="mt-auto">
        <p className="rounded-xl bg-[#e9e6ff] px-3.5 py-3 text-[14px] font-medium tracking-[-0.01em] text-[#251c4d]">
          {card.fact}
        </p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {card.tags.map((tag) => (
            <li key={tag} className="rounded-full border border-[#0f0b1e]/20 px-2.5 py-1 text-[12px] text-[#55506b]">
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function StackCard({ className }: { className: string }) {
  return <div aria-hidden className={`pointer-events-none absolute inset-0 rounded-[22px] ${className}`} />
}

function Stamp({
  children,
  className,
  opacity,
}: {
  children: string
  className: string
  opacity: MotionValue<number>
}) {
  return (
    <motion.span
      style={{ opacity }}
      aria-hidden
      className={`pointer-events-none absolute rounded-md border-2 bg-white/90 px-2 py-1 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] ${className}`}
    >
      {children}
    </motion.span>
  )
}

const DraggableCard = forwardRef<
  SwipeHandle,
  {
    card: FlashCard
    reduce: boolean
    yesLabel: string
    onCommit: (dir: 1 | -1) => void
  }
>(function DraggableCard({ card, reduce, yesLabel, onCommit }, ref) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], reduce ? [0, 0] : [-8, 8])
  const yesOpacity = useTransform(x, [28, 110], [0, 1])
  const noOpacity = useTransform(x, [-110, -28], [1, 0])
  const locked = useRef(false)

  const leave = useCallback(
    async (dir: 1 | -1) => {
      if (locked.current) return
      locked.current = true
      if (!reduce) {
        await animate(x, dir * 560, { duration: 0.32, ease: EASE })
      }
      onCommit(dir)
    },
    [onCommit, reduce, x]
  )

  useImperativeHandle(ref, () => ({ leave }), [leave])

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.28, ease: EASE }}
      className="absolute inset-0 z-20 cursor-grab touch-none select-none overflow-hidden rounded-[22px] border border-border bg-white shadow-[0_30px_60px_-24px_rgba(90,72,255,0.5)] active:cursor-grabbing"
      style={{ x, rotate }}
      drag={reduce ? false : "x"}
      dragMomentum={false}
      dragElastic={0.14}
      onDragEnd={(_, info) => {
        if (locked.current) return
        const { offset, velocity } = info
        if (offset.x > 88 || velocity.x > 850) void leave(1)
        else if (offset.x < -88 || velocity.x < -850) void leave(-1)
        else void animate(x, 0, { type: "spring", stiffness: 480, damping: 36 })
      }}
      aria-label={`${card.title}. ${card.org}. ${card.fact}`}
    >
      <CardFace card={card} />
      <Stamp opacity={yesOpacity} className="left-5 top-5 -rotate-6 border-[#5a48ff] text-[#5a48ff]">
        {yesLabel}
      </Stamp>
      <Stamp opacity={noOpacity} className="right-5 top-5 rotate-6 border-[#e5502f] text-[#b3361d]">
        Pass
      </Stamp>
    </motion.article>
  )
})

export function SwipeDeck({ variant }: { variant: DeckVariant }) {
  const cards = variant === "jobs" ? JOBS : PEOPLE
  const reduce = useReducedMotion()
  const cardRef = useRef<SwipeHandle>(null)
  const [index, setIndex] = useState(0)
  const [decision, setDecision] = useState<{ text: string; match: boolean } | null>(null)

  const top = cards[index % cards.length]
  const yesLabel = variant === "jobs" ? "Interested" : "Match"

  function describe(dir: 1 | -1, name: string) {
    if (dir < 0) return { text: `Passed on ${name}. No message is sent.`, match: false }
    if (variant === "jobs") {
      return { text: `Interest sent for ${name}. Chat opens only if the recruiter swipes back.`, match: false }
    }
    return { text: `Matched with ${name}. Chat is now open for this role.`, match: true }
  }

  return (
    <div className="flex w-full flex-col items-center">
      <div className="relative h-[420px] w-full max-w-[320px] lg:max-w-[380px] sm:h-[460px] lg:h-[clamp(300px,calc(100svh-20rem),540px)]">
        <StackCard className="z-0 translate-y-4 scale-[0.93] border border-border bg-[#e4e1ff]" />
        <StackCard className="z-10 translate-y-2 scale-[0.965] border border-border bg-[#f1efff]" />
        <DraggableCard
          key={`${variant}-${index}`}
          ref={cardRef}
          card={top}
          reduce={!!reduce}
          yesLabel={yesLabel}
          onCommit={(dir) => {
            setDecision(describe(dir, top.title))
            setIndex((current) => current + 1)
          }}
        />
      </div>

      <div
        className="mt-6 grid w-full max-w-[320px] lg:max-w-[380px] grid-cols-2 gap-2"
        role="group"
        aria-label="Swipe actions"
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault()
            cardRef.current?.leave(1)
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault()
            cardRef.current?.leave(-1)
          }
        }}
      >
        <Button
          type="button"
          variant="outline"
          onClick={() => cardRef.current?.leave(-1)}
          className="h-11 border border-[#14102e]/30 bg-white text-[14px] font-medium text-[#14102e] hover:bg-[#14102e] hover:text-white"
        >
          Pass
        </Button>
        <Button
          type="button"
          onClick={() => cardRef.current?.leave(1)}
          className="h-11 bg-primary text-[14px] font-semibold text-white hover:bg-[var(--clearpath-navy-hover)]"
        >
          {variant === "jobs" ? "Interested" : "Swipe back"}
        </Button>
      </div>

      <p
        aria-live="polite"
        className={`mt-4 min-h-10 w-full max-w-[320px] lg:max-w-[380px] text-center text-[13px] leading-snug ${
          decision?.match ? "font-medium text-[var(--lp-mint-ink)]" : "text-muted-foreground"
        }`}
      >
        {decision?.text}
      </p>
    </div>
  )
}
