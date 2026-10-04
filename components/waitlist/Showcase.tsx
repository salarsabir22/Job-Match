"use client"

import type { ReactNode } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Chip, Rise } from "@/components/waitlist/lp-ui"
import { cn } from "@/lib/utils"

/* ─── Built-for band ─────────────────────────────────────────────── */

type Campus = { name: string; file: string }

const KARACHI: Campus[] = [
  { name: "IoBM", file: "iobm.png" },
  { name: "IBA Karachi", file: "iba.png" },
  { name: "SZABIST", file: "szabist.png" },
  { name: "FAST-NUCES", file: "fast.png" },
  { name: "Bahria University", file: "bahria.png" },
  { name: "Habib University", file: "habib.webp" },
  { name: "PAF-KIET", file: "kiet.png" },
  { name: "NUST", file: "nust.png" },
  { name: "NED University", file: "ned.png" },
  { name: "University of Karachi", file: "karachi.png" },
  { name: "KSBL", file: "ksbl.png" },
  { name: "TMUC", file: "tmuc.png" },
  { name: "Denning", file: "denning.png" },
  { name: "Indus University", file: "indus.png" },
  { name: "Iqra University", file: "iqra.png" },
]

const PAKISTAN: Campus[] = [
  { name: "LUMS", file: "lums.png" },
  { name: "GIKI", file: "giki.png" },
  { name: "UET Lahore", file: "uet.png" },
  { name: "PIEAS", file: "pieas.jpg" },
  { name: "Lahore School of Economics", file: "lse.jpg" },
  { name: "Sukkur IBA University", file: "siba.jpg" },
  { name: "Mehran UET", file: "mehran.png" },
  { name: "UET Taxila", file: "taxila.png" },
  { name: "IMSciences Peshawar", file: "imsciences.jpg" },
  { name: "Beaconhouse National University", file: "bnu.png" },
]

function LogoGrid({ campuses }: { campuses: Campus[] }) {
  return (
    <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {campuses.map((campus) => (
        <li
          key={campus.file}
          title={campus.name}
          className="flex h-24 items-center justify-center rounded-2xl border border-border bg-white p-4 transition-shadow hover:shadow-[0_12px_30px_-16px_rgba(90,72,255,0.5)]"
        >
          <Image
            src={`/universities/${campus.file}`}
            alt={`${campus.name} logo`}
            width={160}
            height={64}
            sizes="160px"
            className="h-full w-full object-contain"
          />
        </li>
      ))}
    </ul>
  )
}

export function BuiltForBand() {
  return (
    <section className="border-y border-border bg-[var(--lp-surface)]" aria-labelledby="campuses-heading">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-14 sm:px-8 sm:py-16">
        <h2
          id="campuses-heading"
          className="max-w-[30ch] text-balance text-[clamp(1.4rem,2.6vw,2rem)] font-semibold leading-[1.1] tracking-[-0.035em]"
        >
          Built for students at the schools you already know.
        </h2>

        <div className="mt-4">
          <LogoGrid campuses={[...KARACHI, ...PAKISTAN]} />
        </div>
      </div>
    </section>
  )
}

/* ─── Bento grid ─────────────────────────────────────────────────── */

function Mini({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("relative h-44 overflow-hidden rounded-2xl border border-border bg-[#f1efff] p-4", className)}
    >
      {children}
    </div>
  )
}

function MiniSwipe() {
  return (
    <Mini>
      <div className="absolute left-1/2 top-6 h-28 w-40 -translate-x-1/2 rotate-[-6deg] rounded-xl bg-primary/30" />
      <div className="absolute left-1/2 top-4 h-28 w-40 -translate-x-1/2 rotate-[3deg] rounded-xl bg-[#d9d4ff]" />
      <div className="absolute left-1/2 top-3 w-44 -translate-x-1/2 rounded-xl border border-border bg-white p-3 text-[#0f0b1e] shadow-xl">
        <p className="text-[14px] font-semibold tracking-[-0.03em]">Engineering intern</p>
        <p className="text-[11px] text-[#5a48ff]">Systems Limited</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="rounded-md bg-[#e9e6ff] px-1.5 py-0.5 text-[10px] font-medium">PKR 80–120k</span>
          <span className="flex gap-1.5">
            <span className="flex size-6 items-center justify-center rounded-full border border-[#0f0b1e]/20 text-[11px]">×</span>
            <span className="flex size-6 items-center justify-center rounded-full bg-[#5a48ff] text-[10px] text-white">♥</span>
          </span>
        </div>
      </div>
    </Mini>
  )
}

function MiniMatch() {
  return (
    <Mini className="flex items-center justify-center">
      <div className="flex items-center gap-3">
        <span className="flex size-14 items-center justify-center rounded-2xl border border-border bg-white font-mono text-[13px] font-semibold text-[#0f0b1e]">
          AR
        </span>
        <span className="flex flex-col items-center gap-1.5">
          <span className="h-px w-10 border-t-2 border-dashed border-[var(--lp-accent)]" />
          <Chip tone="mint">Match</Chip>
          <span className="h-px w-10 border-t-2 border-dashed border-[var(--lp-accent)]" />
        </span>
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary font-mono text-[13px] font-semibold text-white">
          SL
        </span>
      </div>
    </Mini>
  )
}

function MiniChat() {
  return (
    <Mini>
      <p className="mt-2 w-fit max-w-[80%] rounded-2xl rounded-bl-md bg-white px-3 py-2 text-[12px] text-[#0f0b1e] shadow-sm">
        Thursday at 4pm work for a call?
      </p>
      <p className="ml-auto mt-2 w-fit max-w-[80%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-[12px] text-white">
        Yes, sending my portfolio.
      </p>
      <p className="mt-2 w-fit rounded-2xl rounded-bl-md bg-[#14102e]/10 px-3 py-2 text-[12px] text-muted-foreground">Typing…</p>
    </Mini>
  )
}

function MiniPipeline() {
  const stages = ["Chatting", "Interview", "Offer", "Hired"]
  return (
    <Mini className="flex flex-col justify-center gap-3">
      {stages.map((stage, i) => (
        <div key={stage} className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-[11px] font-medium text-foreground">{stage}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#14102e]/10">
            <span
              className="block h-full rounded-full bg-[var(--lp-mint)]"
              style={{ width: `${[88, 62, 34, 18][i]}%` }}
            />
          </span>
        </div>
      ))}
    </Mini>
  )
}

function MiniCampus() {
  const bars = [78, 64, 55, 41]
  return (
    <Mini className="flex items-end gap-3 px-6">
      {bars.map((h, i) => (
        <span key={i} className="flex flex-1 flex-col justify-end">
          <span className="rounded-t-lg bg-[var(--lp-accent)]" style={{ height: `${h * 1.2}px`, opacity: 1 - i * 0.15 }} />
        </span>
      ))}
    </Mini>
  )
}

function MiniReview() {
  const rows = [
    ["Recruiter account", "Reviewed"],
    ["Company page", "Live"],
    ["First role", "Published"],
  ]
  return (
    <Mini className="flex flex-col justify-center gap-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 shadow-sm">
          <span className="text-[12px] font-medium text-foreground">{k}</span>
          <Chip tone="mint">{v}</Chip>
        </div>
      ))}
    </Mini>
  )
}

const bento: { title: string; body: string; visual: ReactNode }[] = [
  {
    title: "Swipe-first discovery",
    body: "Roles and candidates are cards. Pass in a tap, show interest in another.",
    visual: <MiniSwipe />,
  },
  {
    title: "Mutual match",
    body: "A match needs a yes from both sides. One-sided interest stays one-sided.",
    visual: <MiniMatch />,
  },
  {
    title: "Chat tied to the role",
    body: "Each thread belongs to one job, so scheduling and next steps stay together.",
    visual: <MiniChat />,
  },
  {
    title: "A pipeline you can read",
    body: "Chatting, interview, offer, hired. Every match sits in a clear stage.",
    visual: <MiniPipeline />,
  },
  {
    title: "Campus insight",
    body: "Career offices see opt-in volume and interest in aggregate, where consent allows.",
    visual: <MiniCampus />,
  },
  {
    title: "Reviewed recruiters",
    body: "Recruiter accounts are approved before roles go live, which keeps decks clean.",
    visual: <MiniReview />,
  },
]

export function BentoGrid() {
  return (
    <section id="platform" className="scroll-mt-20" aria-labelledby="platform-heading">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-20 sm:px-8 sm:py-24 lg:py-28">
        <Rise>
          <h2
            id="platform-heading"
            className="mt-4 max-w-[20ch] text-balance text-[clamp(2rem,4vw,3.1rem)] font-semibold leading-[1.04] tracking-[-0.04em]"
          >
            The early-career hiring platform, in six pieces.
          </h2>
        </Rise>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bento.map((card, i) => (
            <Rise key={card.title} delay={(i % 3) * 0.05}>
              <Card className="h-full transition-colors duration-300 hover:border-[var(--lp-accent)]/60">
                <CardHeader className="p-6 pb-0">
                  <CardTitle className="text-[1.15rem] leading-snug tracking-[-0.03em]">{card.title}</CardTitle>
                  <CardDescription className="text-[14px] leading-[1.55]">{card.body}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-5">{card.visual}</CardContent>
              </Card>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Persona tabs ───────────────────────────────────────────────── */

const personas = [
  {
    id: "candidate",
    tab: "Candidate",
    title: "From profile to interview, without the inbox.",
    steps: [
      { when: "Today", body: "Build your profile once and start swiping roles you would actually take." },
      { when: "Then", body: "Recruiters see your interest and swipe back on the ones they like." },
      { when: "Soon after", body: "Matches turn into chats tied to the role, then into interviews." },
    ],
  },
  {
    id: "recruiter",
    tab: "Recruiter",
    title: "From a posted role to a shortlist that wants it.",
    steps: [
      { when: "Today", body: "Post a role with pay band, city and skills. Your account is reviewed first." },
      { when: "Then", body: "Students who want it swipe right, and your Discover feed fills with raised hands." },
      { when: "Soon after", body: "Swipe back, chat on the match and move people from interview to offer." },
    ],
  },
  {
    id: "university",
    tab: "University",
    title: "From a briefing to a clear view of outcomes.",
    steps: [
      { when: "Today", body: "Brief your office and choose the schools or faculties for a pilot." },
      { when: "Then", body: "Students join themselves at a co-branded session, with no data upload." },
      { when: "Soon after", body: "See aggregate interest and match activity, where consent allows." },
    ],
  },
]

export function PersonaTabs() {
  return (
    <section className="bg-[var(--lp-surface)]" aria-labelledby="persona-heading">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-20 sm:px-8 sm:py-24 lg:py-28">
        <Rise>
          <h2
            id="persona-heading"
            className="mt-4 max-w-[18ch] text-balance text-[clamp(2rem,4vw,3.1rem)] font-semibold leading-[1.04] tracking-[-0.04em]"
          >
            Accomplish more in less time.
          </h2>
        </Rise>

        <Tabs defaultValue="candidate" className="mt-10">
          <TabsList
            aria-label="Choose a role"
            className="h-auto max-w-full overflow-x-auto rounded-full border border-border bg-secondary p-1"
          >
            {personas.map((p) => (
              <TabsTrigger
                key={p.id}
                value={p.id}
                className="rounded-full px-5 py-2.5 text-[14px] text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                {p.tab}
              </TabsTrigger>
            ))}
          </TabsList>

          {personas.map((p) => (
            <TabsContent key={p.id} value={p.id} className="mt-10">
              <p className="max-w-[28ch] text-[clamp(1.5rem,2.6vw,2.1rem)] font-semibold leading-[1.1] tracking-[-0.035em]">
                {p.title}
              </p>
              <ol className="mt-10 grid gap-4 md:grid-cols-3">
                {p.steps.map((step) => (
                  <li key={step.body}>
                    <Card className="h-full bg-card p-6">
                      <p className="text-[1.15rem] font-semibold leading-snug tracking-[-0.025em]">{step.body}</p>
                    </Card>
                  </li>
                ))}
              </ol>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  )
}
