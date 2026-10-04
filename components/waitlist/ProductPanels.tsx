"use client"

import type { ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { easeOutExpo } from "@/components/motion/waitlist-motion"
import { Chip } from "@/components/waitlist/lp-ui"

/** "Product screen" cards: white surfaces with a soft violet glow. */
function Frame({ children }: { children: ReactNode }) {
  return (
    <Card className="border-border bg-white p-5 text-[#14102e] shadow-[0_40px_80px_-40px_rgba(90,72,255,0.45)] sm:p-6">
      {children}
    </Card>
  )
}

function Initials({ text }: { text: string }) {
  return (
    <Avatar className="size-10 rounded-xl">
      <AvatarFallback className="rounded-xl bg-[#e9e6ff] font-mono text-[12px] font-semibold text-[#251c4d]">
        {text}
      </AvatarFallback>
    </Avatar>
  )
}

export function CandidatePanel() {
  const rows = [
    { a: "SL", t: "Engineering intern", s: "Systems Limited · Lahore", chip: <Chip tone="mint">Matched</Chip> },
    { a: "DA", t: "Data analyst", s: "Early-career cohort · Remote", chip: <Chip tone="blue">Waiting</Chip> },
    { a: "PD", t: "Product design intern", s: "Product studio · Remote", chip: <Chip tone="ink">Interview Thu</Chip> },
  ]
  return (
    <Frame>
      <ul className="divide-y divide-[#0f0b1e]/10">
        {rows.map((row) => (
          <li key={row.t} className="flex items-center gap-3 py-3">
            <Initials text={row.a} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold tracking-[-0.01em]">{row.t}</p>
              <p className="truncate text-[12px] text-[#55506b]">{row.s}</p>
            </div>
            {row.chip}
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-2xl bg-[#f1efff] p-4">
        <p className="max-w-[85%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-[13px] leading-snug shadow-sm">
          Would Thursday at 4pm work for a short call?
        </p>
        <p className="ml-auto mt-2 max-w-[85%] rounded-2xl rounded-br-md bg-[#5a48ff] px-3.5 py-2.5 text-[13px] leading-snug text-white">
          Yes. Sending my portfolio link now.
        </p>
      </div>
    </Frame>
  )
}

export function RecruiterPanel() {
  const cols = [
    { k: "Raised hand", people: ["Ayesha R.", "Hamza A.", "Zain A."] },
    { k: "Chatting", people: ["Maryam K.", "Sara I."] },
    { k: "Interview", people: ["Ibrahim S."] },
    { k: "Offer", people: ["Daniyal M."] },
  ]
  return (
    <Frame>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cols.map((col) => (
          <div key={col.k} className="rounded-2xl bg-[#f1efff] p-2.5">
            <p className="flex items-center justify-between px-1 pb-2 pt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#55506b]">
              <span>{col.k}</span>
              <span className="tabular-nums">{col.people.length}</span>
            </p>
            <ul className="space-y-2">
              {col.people.map((person) => (
                <li key={person} className="rounded-xl bg-white px-2.5 py-2 text-[12px] font-medium shadow-sm">
                  {person}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[13px] leading-snug text-[#55506b]">
        Notes and messages stay on each match, so the pipeline does not scatter into email.
      </p>
    </Frame>
  )
}

export function UniversityPanel() {
  const reduce = useReducedMotion()
  const stats = [
    { v: "142", l: "Students opted in" },
    { v: "18", l: "Employers live" },
    { v: "64", l: "Mutual matches" },
  ]
  const bars = [
    { l: "Engineering", p: 78 },
    { l: "Business", p: 64 },
    { l: "Data", p: 55 },
    { l: "Design", p: 41 },
  ]
  return (
    <Frame>
      <div className="grid grid-cols-3 gap-2.5">
        {stats.map((s) => (
          <div key={s.l} className="rounded-2xl bg-[#f1efff] p-3">
            <p className="text-[1.6rem] font-semibold leading-none tracking-[-0.04em]">{s.v}</p>
            <p className="mt-2 text-[11px] leading-tight text-[#55506b]">{s.l}</p>
          </div>
        ))}
      </div>
      <ul className="mt-5 space-y-3">
        {bars.map((bar, i) => (
          <li key={bar.l} className="flex items-center gap-3">
            <span className="w-[5.5rem] shrink-0 text-[12px] text-[#55506b]">{bar.l}</span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#e9e6ff]">
              <motion.span
                className="block h-full origin-left rounded-full bg-[#5a48ff]"
                style={{ width: `${bar.p}%` }}
                initial={reduce ? false : { scaleX: 0.04 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, amount: 0.8 }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: easeOutExpo }}
              />
            </span>
            <span className="w-8 shrink-0 text-right text-[12px] tabular-nums">{bar.p}%</span>
          </li>
        ))}
      </ul>
    </Frame>
  )
}
