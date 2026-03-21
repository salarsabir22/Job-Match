"use client"

import type { ReactNode } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Bell, Heart, MapPin, MessageCircle, Search, Sparkles, X } from "lucide-react"
import {
  fadeUpSoft,
  slideInLeft,
  slideInRight,
  useReducedEnterVariants,
  viewportOnce,
} from "@/components/motion/waitlist-motion"

/** Unsplash — one coherent “modern office / early-career” set (same energy, natural light) */
const IMG = {
  swipeFront:
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=720&h=900&q=88",
  swipeMid:
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=560&h=700&q=88",
  swipeBack:
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=560&h=700&q=88",
  /** Neutral office texture — reads as company mark in a circle */
  companyMark:
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=200&h=200&q=85",
  studentFace:
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&h=128&q=80",
  recruiterFace:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=128&h=128&q=80",
} as const

const usps: {
  title: string
  body: string
  demo: "swipe" | "mutual" | "chat" | "pipeline"
}[] = [
  {
    title: "Swipe-first discovery",
    body:
      "See pay band, location, and team context on every card. Pass in one tap or mark interested — your feed learns what you actually want, not what keyword parsers think you meant.",
    demo: "swipe",
  },
  {
    title: "Chat only when it’s mutual",
    body:
      "You swipe right on a role; the recruiter shortlists you back. Until both sides say yes, there’s no inbox — so nobody wastes time on one-way outreach.",
    demo: "mutual",
  },
  {
    title: "Messaging tied to the role",
    body:
      "After a match, conversation stays on that job: schedule links, follow-ups, and next steps live in one thread instead of scattered across email and DMs.",
    demo: "chat",
  },
  {
    title: "Clear intent for everyone",
    body:
      "Students signal real interest with a swipe; recruiters see who raised their hand for that posting. Less guessing, fewer ghost threads, more time on people who actually want to talk.",
    demo: "pipeline",
  },
]

function DemoSwipe() {
  return (
    <div
      className="mx-auto w-full max-w-[min(380px,100%)] overflow-hidden rounded-[14px] border border-black/[0.08] bg-white shadow-[0_28px_56px_-28px_rgba(0,0,0,0.14),0_0_0_1px_rgba(0,0,0,0.03)_inset]"
      aria-hidden
    >
      {/* Web app chrome — Discover (student) */}
      <header className="flex items-center justify-between gap-2 border-b border-black/[0.06] bg-white px-3 py-2.5 sm:px-3.5">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-black text-[10px] font-bold tracking-tight text-white">
            JM
          </div>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold tracking-[-0.02em] text-black">Discover</p>
            <p className="truncate font-mono text-[9px] text-black/38">jobmatch.app/student</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span
            className="inline-flex size-8 items-center justify-center rounded-lg border border-black/[0.08] text-black/50"
            title="Search"
          >
            <Search className="size-3.5" strokeWidth={2} />
          </span>
          <span
            className="relative inline-flex size-8 items-center justify-center rounded-lg border border-black/[0.08] text-black/50"
            title="Alerts"
          >
            <Bell className="size-3.5" strokeWidth={2} />
            <span className="absolute right-1 top-1 size-1.5 rounded-full bg-black" />
          </span>
        </div>
      </header>

      <div className="border-b border-black/[0.05] bg-black/[0.02] px-3 py-2.5">
        <p className="text-center text-[10px] font-medium leading-snug text-black/42">
          <span className="text-black/55">Pass</span> moves to the next role ·{" "}
          <span className="text-[#E11D48]">Heart</span> sends interest ·{" "}
          <span className="tabular-nums text-black/50">7 left</span> in this batch
        </p>
      </div>

      {/* Card deck + Pass / Interested flanking (not below) */}
      <div className="flex items-center justify-center gap-1.5 px-2 pb-4 pt-4 sm:gap-2 sm:px-3 sm:pb-5 sm:pt-5">
        {/* Pass — left of stack */}
        <div className="flex w-11 shrink-0 flex-col items-center justify-center gap-1 self-center sm:w-12">
          <span className="flex size-8 items-center justify-center rounded-full border border-black/12 bg-white text-black/40 shadow-sm sm:size-9">
            <X className="size-3.5 sm:size-4" strokeWidth={2.25} />
          </span>
          <span className="text-center text-[7px] font-semibold uppercase tracking-wider text-black/38 sm:text-[8px]">
            Pass
          </span>
        </div>

        <div className="relative mx-auto h-[min(280px,52vw)] w-full min-w-0 max-w-[268px] flex-1 sm:h-[300px] sm:max-w-[288px]">
          {/* Back */}
          <div className="absolute left-1/2 top-2 w-[88%] max-w-[248px] -translate-x-1/2 aspect-[3/4] overflow-hidden rounded-[16px] border border-black/10 bg-white shadow-[0_12px_32px_-18px_rgba(0,0,0,0.22)] -translate-x-[52%] rotate-[-7deg]">
            <Image
              src={IMG.swipeBack}
              alt=""
              fill
              className="object-cover"
              sizes="250px"
            />
            <div className="absolute inset-0 bg-black/28" />
          </div>
          {/* Middle */}
          <div className="absolute left-1/2 top-1 w-[90%] max-w-[254px] -translate-x-1/2 aspect-[3/4] overflow-hidden rounded-[16px] border border-black/10 bg-white shadow-[0_14px_36px_-18px_rgba(0,0,0,0.24)] -translate-x-[48%] rotate-[-3deg]">
            <Image
              src={IMG.swipeMid}
              alt=""
              fill
              className="object-cover"
              sizes="255px"
            />
            <div className="absolute inset-0 bg-black/18" />
          </div>
          {/* Front — animated swipe */}
          <div className="absolute inset-x-0 top-0 z-10 flex justify-center">
            <div className="usp-demo-swipe-card relative w-[92%] max-w-[260px] aspect-[3/4] overflow-hidden rounded-[16px] border border-black/[0.12] bg-white shadow-[0_24px_48px_-22px_rgba(0,0,0,0.28)] flex flex-col ring-1 ring-black/[0.04]">
              <div className="relative min-h-0 flex-[1.12] border-b border-black/[0.08]">
                <Image
                  src={IMG.swipeFront}
                  alt=""
                  fill
                  className="object-cover object-[center_25%]"
                  sizes="260px"
                  priority
                />
              </div>
              <div className="flex flex-col items-center gap-2 bg-white px-4 pb-3.5 pt-3 text-center sm:px-5 sm:pt-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45">
                  Engineering intern · Summer &apos;26
                </p>
                <p className="text-[17px] font-semibold leading-[1.15] tracking-[-0.03em] text-black sm:text-lg">
                  Brightline Analytics
                </p>
                <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-black/48">
                  <MapPin className="size-3 shrink-0 text-black/35" strokeWidth={2.25} aria-hidden />
                  Austin · Hybrid · $28–32/hr
                </p>
                <div className="mt-3 flex w-full items-center justify-between gap-3 border-t border-black/[0.06] pt-3">
                  <div className="relative size-9 shrink-0 overflow-hidden rounded-full border border-black/[0.1] bg-black/[0.04] shadow-sm">
                    <Image
                      src={IMG.companyMark}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  </div>
                  <span className="rounded-full border border-black/15 bg-white px-3.5 py-2 text-[10px] font-medium tracking-wide text-black/65 shadow-sm">
                    Save for later
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interested — right of stack */}
        <div className="flex w-11 shrink-0 flex-col items-center justify-center gap-1 self-center sm:w-12">
          <span className="flex size-8 items-center justify-center rounded-full bg-[#E11D48] text-white shadow-[0_8px_18px_-4px_rgba(225,29,72,0.4)] ring-2 ring-[#E11D48]/15 sm:size-9">
            <Heart className="size-3.5 fill-white text-white sm:size-4" strokeWidth={1.75} />
          </span>
          <span className="max-w-[3rem] text-center text-[7px] font-semibold uppercase leading-tight tracking-wide text-[#E11D48] sm:max-w-none sm:text-[8px] sm:tracking-wider">
            Interested
          </span>
        </div>
      </div>
    </div>
  )
}

function DemoMutual() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-3 sm:py-4" aria-hidden>
      <div className="flex items-center justify-center gap-5 sm:gap-10">
        <div className="relative size-[52px] shrink-0 overflow-hidden rounded-2xl border-2 border-black shadow-md sm:size-14">
          <Image
            src={IMG.studentFace}
            alt=""
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>
        <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center sm:h-16 sm:w-16">
          <div className="usp-demo-heart-ring absolute inset-0 rounded-full border-2 border-black/12" />
          <Heart className="usp-demo-heart-icon relative size-8 fill-black text-black sm:size-9" strokeWidth={1.5} />
        </div>
        <div className="relative size-[52px] shrink-0 overflow-hidden rounded-2xl border-2 border-black shadow-md sm:size-14">
          <Image
            src={IMG.recruiterFace}
            alt=""
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>
      </div>
      <div className="max-w-[260px] text-center">
        <p className="text-[11px] font-semibold text-black">You &amp; Jordan · Brightline</p>
        <p className="mt-1 text-[10px] leading-snug text-black/50">
          Both opted in — chat is open for this role only.
        </p>
      </div>
    </div>
  )
}

function DemoChat() {
  return (
    <div className="flex flex-col gap-2 px-2 py-4 sm:px-4" aria-hidden>
      <p className="mb-1 text-center text-[9px] font-semibold uppercase tracking-wider text-black/40">
        Brightline · Eng intern
      </p>
      <div className="usp-demo-chat-a self-end max-w-[90%] rounded-2xl rounded-br-md bg-black px-3 py-2.5 text-[11px] leading-snug text-white shadow-sm">
        Is the hybrid schedule fixed to Tue/Thu in-office, or flexible within the week?
      </div>
      <div className="usp-demo-chat-b self-start max-w-[90%] rounded-2xl rounded-bl-md border border-black/12 bg-white px-3 py-2.5 text-[11px] leading-snug text-black shadow-sm">
        Tue/Thu anchor days — we can flex one day per month for exams. Want a short call Thursday?
      </div>
      <div className="usp-demo-chat-c flex items-center gap-1 self-start rounded-full border border-black/10 bg-white px-3 py-2 shadow-sm">
        <span className="usp-demo-typing-dot size-1.5 rounded-full bg-black/40" />
        <span className="usp-demo-typing-dot size-1.5 rounded-full bg-black/40 [animation-delay:120ms]" />
        <span className="usp-demo-typing-dot size-1.5 rounded-full bg-black/40 [animation-delay:240ms]" />
      </div>
    </div>
  )
}

function DemoPipeline() {
  return (
    <div className="px-3 py-5 sm:px-5" aria-hidden>
      <p className="mb-3 text-center text-[9px] font-semibold uppercase tracking-wider text-black/40">
        Your status on this posting
      </p>
      <div className="relative overflow-hidden rounded-xl border border-black/10 bg-black/[0.02] p-1">
        <div className="pointer-events-none absolute inset-1">
          <div className="usp-demo-pipeline-highlight absolute left-0 top-0 h-full w-[calc((100%-8px)/3)] rounded-lg bg-white shadow-[0_1px_4px_rgba(0,0,0,0.1)]" />
        </div>
        <div className="relative z-10 flex gap-1">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-1 py-3 text-center">
            <Sparkles className="size-4 text-black/70" strokeWidth={2} />
            <span className="text-[10px] font-semibold leading-tight text-black">Interested</span>
            <span className="text-[8px] text-black/45">You swiped</span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-center gap-1 py-3 text-center">
            <Heart className="size-4 text-black/70" strokeWidth={2} />
            <span className="text-[10px] font-semibold leading-tight text-black">Matched</span>
            <span className="text-[8px] text-black/45">Recruiter too</span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-center gap-1 py-3 text-center">
            <MessageCircle className="size-4 text-black/70" strokeWidth={2} />
            <span className="text-[10px] font-semibold leading-tight text-black">Chat</span>
            <span className="text-[8px] text-black/45">In-app thread</span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-[10px] leading-snug text-black/45">
        Recruiters see the same progression for every applicant on the job.
      </p>
    </div>
  )
}

function DemoFrame({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[22px] border border-black/[0.07] bg-white p-4 shadow-[0_24px_64px_-32px_rgba(0,0,0,0.13),0_0_0_1px_rgba(0,0,0,0.03)_inset] sm:p-5">
      {children}
    </div>
  )
}

function renderDemo(kind: (typeof usps)[number]["demo"]) {
  switch (kind) {
    case "swipe":
      /* Self-contained web shell — avoid double frame */
      return <DemoSwipe />
    case "mutual":
      return (
        <DemoFrame>
          <DemoMutual />
        </DemoFrame>
      )
    case "chat":
      return (
        <DemoFrame>
          <DemoChat />
        </DemoFrame>
      )
    case "pipeline":
      return (
        <DemoFrame>
          <DemoPipeline />
        </DemoFrame>
      )
    default:
      return null
  }
}

export function WaitlistUspSections() {
  const introV = useReducedEnterVariants(fadeUpSoft)
  const textFromLeft = useReducedEnterVariants(slideInLeft)
  const textFromRight = useReducedEnterVariants(slideInRight)
  const articleParent = useReducedEnterVariants({
    hidden: {},
    visible: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
  })

  return (
    <section
      className="w-full border-t border-black/[0.06] bg-white"
      aria-labelledby="usp-heading"
    >
      <div className="mx-auto max-w-[1120px] px-5 sm:px-10 lg:px-12">
        <motion.div
          className="pt-20 pb-10 text-center sm:pt-28 sm:pb-14 md:pt-32"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={introV}
        >
          <p
            id="usp-heading"
            className="text-[11px] font-medium uppercase tracking-[0.22em] text-black/38"
          >
            Why JobMatch
          </p>
          <h2 className="mx-auto mt-5 max-w-4xl text-balance text-[clamp(2.35rem,6.5vw,4rem)] font-semibold leading-[1.08] tracking-[-0.038em] text-black md:text-[clamp(2.65rem,5.5vw,3.95rem)]">
            Built for how hiring should feel.
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-[15px] leading-[1.55] text-black/48 sm:text-[17px]">
            Clarity over noise. Motion only where it helps you understand.
          </p>
        </motion.div>

        <div className="flex flex-col">
          {usps.map((usp, index) => {
            const reverse = index % 2 === 1
            return (
              <motion.article
                key={usp.title}
                className="grid grid-cols-1 items-center gap-12 border-t border-black/[0.06] py-16 first:border-t-0 first:pt-0 sm:gap-14 sm:py-20 md:py-24 lg:grid-cols-2 lg:gap-x-20 lg:gap-y-0 lg:py-28"
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                variants={articleParent}
              >
                <motion.div
                  className={reverse ? "lg:order-2 lg:pl-4" : "lg:pr-4"}
                  variants={reverse ? textFromRight : textFromLeft}
                >
                  <span className="text-[11px] font-medium tabular-nums text-black/32 tracking-[0.12em]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 text-[1.35rem] font-semibold leading-snug tracking-[-0.025em] text-black sm:text-2xl md:text-[1.75rem] md:leading-[1.2]">
                    {usp.title}
                  </h3>
                  <p className="mt-5 max-w-[40ch] text-[17px] leading-[1.55] text-black/52 sm:text-[1.0625rem]">
                    {usp.body}
                  </p>
                </motion.div>
                <motion.div className={reverse ? "lg:order-1" : ""} variants={reverse ? textFromLeft : textFromRight}>
                  {renderDemo(usp.demo)}
                </motion.div>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
