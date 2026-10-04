"use client"

import { useId, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  Reveal,
  StaggerChild,
  StaggerMount,
  easeOutExpo,
  faqStaggerItem,
  faqStaggerParent,
  slideInLeft,
  slideInRight,
  staggerContainer,
  staggerItem,
  useReducedEnterVariants,
  viewportOnce,
} from "@/components/motion/waitlist-motion"
import { WaitlistEarthCanvas } from "@/components/waitlist/WaitlistEarthCanvas"
import { WaitlistFooter } from "@/components/waitlist/WaitlistFooter"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const CONTACT_MAIL = "mailto:hello@swypejobs.app"
const RECRUITER_MAIL = "mailto:hello@swypejobs.app?subject=Recruiter%20inquiry"
const UNIVERSITY_MAIL = "mailto:hello@swypejobs.app?subject=University%20partnership"

type Audience = "university" | "corporate"

type PageCopy = {
  kicker: string
  title: string
  lede: string
  chips: string[]
  ctaLabel: string
  ctaHref: string
  problemKicker: string
  problemTitle: string
  problemLede: string
  pains: { title: string; body: string }[]
  stepsKicker: string
  stepsTitle: string
  steps: { n: string; title: string; body: string }[]
  asideKicker: string
  asideTitle: string
  asideFacts: string[]
  offerKicker: string
  offerTitle: string
  offers: { title: string; body: string }[]
  compareTitle: string
  compare: { old: string; next: string }[]
  processTitle: string
  process: { title: string; body: string }[]
  faqs: { q: string; a: string }[]
  closeTitle: string
  closeLede: string
  otherHref: string
  otherLabel: string
  mockup: "university" | "recruiter"
}

const university: PageCopy = {
  kicker: "For career centers & universities",
  title: "Help students get hired without turning your office into another job board",
  lede:
    "swypejobs sits beside career services. Students opt in. Employers only talk after a mutual match. You keep the advising relationship — we handle discovery, intent, and the conversation tied to the role.",
  chips: ["Student opt-in", "Mutual match before chat", "Partnership reporting"],
  ctaLabel: "Request a partnership briefing",
  ctaHref: UNIVERSITY_MAIL,
  problemKicker: "The gap on campus",
  problemTitle: "Portals collect applications. They do not tell you who actually wants the role.",
  problemLede:
    "Students spray résumés. Employers ghost. Advisors cannot see what happened after the fair. swypejobs is built for that gap — interest first, conversation second.",
  pains: [
    {
      title: "Students drown in noise",
      body: "Inboxes and LinkedIn fill with one-way outreach. Serious candidates stop answering. Average students never hear back.",
    },
    {
      title: "Employers cannot read intent",
      body: "A thousand applications is not a pipeline. Career fairs expire in a day. Nobody knows who still wants the internship in March.",
    },
    {
      title: "The office is blamed either way",
      body: "You are asked for placements without a product students will actually use, and without reporting you can share with leadership.",
    },
  ],
  stepsKicker: "How a campus cycle works",
  stepsTitle: "Students join. Employers swipe. Chat opens only when both sides say yes.",
  steps: [
    {
      n: "01",
      title: "Students opt in",
      body: "They build a profile — school, skills, résumé, links — and swipe roles with pay band, location, and team context on the card.",
    },
    {
      n: "02",
      title: "Employers shortlist",
      body: "Hiring teams post internships and new-grad roles, then swipe on students who already raised a hand for that listing.",
    },
    {
      n: "03",
      title: "Mutual match unlocks chat",
      body: "No cold DMs. The thread is tied to the job, so advising, interviews, and next steps live in one place.",
    },
    {
      n: "04",
      title: "You stay in the loop",
      body: "Partnerships can include co-branded sessions, advisor materials, and aggregate outcomes where policy and consent allow.",
    },
  ],
  asideKicker: "Campus workspace",
  asideTitle: "One layer students and employers will actually use",
  asideFacts: [
    "Students create their own accounts — no registrar dump.",
    "Chat opens only after a mutual match, and it stays on that role.",
    "Partner reporting is aggregate, and only where consent allows.",
  ],
  offerKicker: "What the office gets",
  offerTitle: "A layer you can recommend — not a system you have to run",
  offers: [
    {
      title: "No bulk student upload",
      body: "Students create their own accounts. You are not asked to ship a registrar dump into a vendor you barely know.",
    },
    {
      title: "Consent-first by design",
      body: "Profiles and messages belong to the people in them. Reporting for partners is aggregate and opt-in framed.",
    },
    {
      title: "Sits with career services",
      body: "Use it in workshops, employer sessions, and 1:1 advising. We do not replace the systems you already run.",
    },
    {
      title: "A story leadership can hear",
      body: "Who opted in, where interest concentrated, how mutual matches formed — not vanity clicks from a portal.",
    },
  ],
  compareTitle: "Next to what you already use",
  compare: [
    {
      old: "Job boards reward whoever applies fastest, not whoever is the best fit.",
      next: "Students swipe with context. Employers only see people who wanted that role.",
    },
    {
      old: "Career fairs are high energy and zero follow-through.",
      next: "Interest stays in the product after the event — match and chat when both sides are ready.",
    },
    {
      old: "LinkedIn is a public inbox. Students get spammed; you cannot moderate it.",
      next: "No message until a mutual match. The thread is about one job, not a cold pitch.",
    },
  ],
  processTitle: "How a partnership starts",
  process: [
    {
      title: "Briefing",
      body: "A 30-minute call on your calendar, student mix, and what “success” means for the office this year.",
    },
    {
      title: "Pilot shape",
      body: "We agree on schools or faculties, a window, and what we will (and will not) report. Students still opt in themselves.",
    },
    {
      title: "Campus launch",
      body: "Co-branded session, advisor one-pager, and a single contact. You invite; we do not cold-email your directory.",
    },
  ],
  faqs: [
    {
      q: "Do we have to migrate off our existing career platform?",
      a: "No. swypejobs is an extra discovery layer. Keep your events, appointments, and employer database. Students use swypejobs when they want swipe-based matching with chat only after mutual interest.",
    },
    {
      q: "Will you email our student list?",
      a: "Not from a dump you send us. Students join with their own email. If we co-run a session, you control the invitation — we do not buy or scrape campus directories.",
    },
    {
      q: "What reporting can leadership actually see?",
      a: "Where policy and consent allow: opt-in volume, interest by role type, and mutual-match activity in aggregate. We do not hand employers a spreadsheet of every student at the university.",
    },
    {
      q: "Is this only for computer science?",
      a: "Early-career and internships are the focus — including but not limited to tech. Channels and roles follow what employers post and what students swipe.",
    },
    {
      q: "What does it cost the university?",
      a: "Early partnerships are scoped on a call. We would rather a clean pilot than a bloated RFP. Email us with timing and roughly how many students you want in the first wave.",
    },
  ],
  closeTitle: "Put a product in students’ hands that employers will respect",
  closeLede:
    "If you run career services, employer relations, or a faculty placement office, we will send a short briefing — no deck spam, one conversation.",
  otherHref: "/corporates",
  otherLabel: "Hiring for internships or new grad? See the corporate page",
  mockup: "university",
}

const corporate: PageCopy = {
  kicker: "For hiring teams & corporates",
  title: "Campus hiring with signal — not another thousand unread applications",
  lede:
    "Post internships and new-grad roles. Swipe on students who already showed interest. Chat opens only after a mutual match, and it stays on that listing. Your pipeline is intent, not keyword spray.",
  chips: ["Mutual match only", "Chat tied to the role", "Built for intern cycles"],
  ctaLabel: "Talk to us about early access",
  ctaHref: RECRUITER_MAIL,
  problemKicker: "Why campus pipelines stall",
  problemTitle: "Volume is easy. Knowing who still wants the job is not.",
  problemLede:
    "Boards reward spray-and-pray. Fairs expire. LinkedIn is a cold inbox. swypejobs is for teams that want a shortlist of people who actually raised their hand.",
  pains: [
    {
      title: "Applications without intent",
      body: "Students tap Apply on twenty roles before lunch. You cannot tell who would show up to an interview next week.",
    },
    {
      title: "Screening time goes to the wrong people",
      body: "Résumé parsers rank keywords. They do not tell you who read the posting and still wanted it.",
    },
    {
      title: "Chat is a mess of channels",
      body: "Email, WhatsApp, LinkedIn — none of it is tied to the req. Offers slip. Ghosting looks like your process.",
    },
  ],
  stepsKicker: "How hiring works here",
  stepsTitle: "Post the role. Swipe the people who want it. Talk only when it is mutual.",
  steps: [
    {
      n: "01",
      title: "Publish a listing",
      body: "Title, type, location, remote, skills, pay band. Students see that context on the card before they swipe.",
    },
    {
      n: "02",
      title: "Discover students",
      body: "Browse profiles — school, skills, résumé, video when they add one. Swipe yes, pass, or save. Filter by university and year.",
    },
    {
      n: "03",
      title: "Match, then message",
      body: "If they applied and you like them back, chat unlocks on that job. No fishing DMs to people who never asked.",
    },
    {
      n: "04",
      title: "Run a pipeline",
      body: "Move people through chatting, interview, offer, hired. Notes stay on the match. The thread does not vanish into email.",
    },
  ],
  asideKicker: "Hiring workspace",
  asideTitle: "A pipeline you can read in a glance",
  asideFacts: [
    "You swipe people who already raised a hand for the listing.",
    "The thread is about that job — screens, links, next steps.",
    "New recruiter accounts are approved before they can post.",
  ],
  offerKicker: "What your team gets",
  offerTitle: "A campus workflow that respects everyone’s time",
  offers: [
    {
      title: "Listings students can actually read",
      body: "Pay band, location, and team context on the card. Fewer “just applying everywhere” taps.",
    },
    {
      title: "A feed of raised hands",
      body: "Discover is people who swiped your role — not a public résumé dump.",
    },
    {
      title: "Chat after yes + yes",
      body: "Mutual match is the gate. Conversation is about that job: screens, links, next steps.",
    },
    {
      title: "A pipeline you can run in a cycle",
      body: "Stages for chatting, interview, offer, hired. Built for intern waves, not enterprise ATS theatre.",
    },
  ],
  compareTitle: "Instead of the usual campus stack",
  compare: [
    {
      old: "Job boards: 800 applicants, 12 who would take the offer.",
      next: "Swipe interest both ways. Your list is people who wanted this posting.",
    },
    {
      old: "Campus fair: a stack of cards and a forgotten follow-up.",
      next: "Keep the same students in Discover and pipeline after the event.",
    },
    {
      old: "LinkedIn InMail: you are interrupting someone who did not ask.",
      next: "No message until they swiped your role and you swiped them back.",
    },
  ],
  processTitle: "Getting on swypejobs",
  process: [
    {
      title: "Fit call",
      body: "Tell us volume, intern vs new grad, and which schools you actually hire from. We will say if we are the right layer.",
    },
    {
      title: "Account review",
      body: "Recruiter profiles are approved before jobs go live. Company page, listings, then Discover.",
    },
    {
      title: "First cycle",
      body: "Post one or two roles, swipe a real stack, and run chat only on matches. We stay close for the first wave.",
    },
  ],
  faqs: [
    {
      q: "Do we need a full ATS replacement?",
      a: "No. swypejobs is where campus interest is qualified. Export or copy people you hire into whatever you already use for offers and onboarding.",
    },
    {
      q: "Can we message students who have not matched?",
      a: "No — that is the product. You can swipe, save, and wait for a mutual match. It is how we keep the student side from turning into spam.",
    },
    {
      q: "Which roles work best?",
      a: "Internships and new-grad / early-career full-time. High-volume campus cycles are the design center. Senior backfills belong in your usual tools.",
    },
    {
      q: "How are students verified?",
      a: "They build school, degree, skills, and usually a résumé or links. You see that on the profile before you swipe. We are adding depth with partners, not claiming a national ID check on day one.",
    },
    {
      q: "What does early access include?",
      a: "A reviewed recruiter account, live listings, Discover, pipeline, and chat on matches. Email us your volume and target schools — we onboard in waves, not a public self-serve free-for-all.",
    },
  ],
  closeTitle: "Run the next intern class on intent, not hope",
  closeLede:
    "If you hire from campus — talent, university relations, or a founder doing it yourself — send a note. We will tell you honestly if the timing fits.",
  otherHref: "/universities",
  otherLabel: "Career office or university partner? See the university page",
  mockup: "recruiter",
}

const pages: Record<Audience, PageCopy> = { university, corporate }

function Cta({
  href,
  children,
  light = false,
  className,
}: {
  href: string
  children: string
  light?: boolean
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.a
      href={href}
      whileHover={reduce ? undefined : { y: -2, scale: 1.02 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.22, ease: easeOutExpo }}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold tracking-[-0.02em]",
        light
          ? "bg-white text-[#050506] hover:bg-white/92"
          : "bg-[var(--waitlist-blue)] text-white shadow-[0_4px_18px_rgba(30,58,95,0.35)] hover:bg-[var(--waitlist-blue-hover)]",
        className
      )}
    >
      {children}
      <motion.span
        className="text-[1.1em] font-light leading-none opacity-90"
        aria-hidden
        animate={reduce ? undefined : { x: [0, 3, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        ›
      </motion.span>
    </motion.a>
  )
}

function PartnerHeroMockup({ variant }: { variant: "university" | "recruiter" }) {
  const isRecruiter = variant === "recruiter"
  const rows = isRecruiter
    ? [
        { name: "Maya Chen", meta: "CS · intern", mark: "Match" },
        { name: "Jordan Park", meta: "ECE · intern", mark: "Interested" },
        { name: "A. Shah", meta: "Stats · intern", mark: "New" },
      ]
    : [
        { name: "Students opted in", meta: "This cycle", mark: "142" },
        { name: "Employers live", meta: "Reviewed accounts", mark: "18" },
        { name: "Mutual matches", meta: "Chat unlocked", mark: "64" },
      ]

  return (
    <div
      className="w-full max-w-[22.5rem] rounded-2xl border border-white/10 bg-white p-5 text-left shadow-[0_24px_50px_-24px_rgba(0,0,0,0.55)] sm:p-6"
      aria-hidden
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/35">
            {isRecruiter ? "Summer intern · Eng" : "Career services"}
          </p>
          <p className="mt-1 text-[15px] font-semibold tracking-[-0.02em] text-black">
            {isRecruiter ? "Who raised a hand" : "This cycle"}
          </p>
        </div>
        <span className="rounded-full bg-[var(--waitlist-blue)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--waitlist-blue)]">
          Live
        </span>
      </div>
      <ul className="mt-5 divide-y divide-black/[0.06]">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium tracking-[-0.02em] text-black">{row.name}</p>
              <p className="mt-0.5 text-[12px] text-black/42">{row.meta}</p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                row.mark === "Match"
                  ? "bg-[var(--waitlist-blue)] text-white"
                  : "bg-black/[0.05] text-black/55"
              )}
            >
              {row.mark}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-black/[0.06] pt-3 text-[12px] text-black/40">
        Chat opens after a mutual match
      </p>
    </div>
  )
}

function StaggerBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  const v = useReducedEnterVariants(staggerContainer)
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

function StaggerCard({
  children,
  className,
  lift = true,
}: {
  children: React.ReactNode
  className?: string
  lift?: boolean
}) {
  const reduce = useReducedMotion()
  const v = useReducedEnterVariants(staggerItem)
  return (
    <motion.div
      className={className}
      variants={v}
      whileHover={reduce || !lift ? undefined : { y: -6 }}
      transition={{ duration: 0.28, ease: easeOutExpo }}
    >
      {children}
    </motion.div>
  )
}

function AudienceFaq({ items }: { items: { q: string; a: string }[] }) {
  const baseId = useId()
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const reduce = useReducedMotion()
  const parentV = useReducedEnterVariants(faqStaggerParent)
  const itemV = useReducedEnterVariants(faqStaggerItem)

  return (
    <motion.div
      className="flex flex-col gap-3"
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={parentV}
    >
      {items.map((item, index) => {
        const isOpen = openIndex === index
        const panelId = `${baseId}-panel-${index}`
        const triggerId = `${baseId}-trigger-${index}`
        return (
          <motion.div
            key={item.q}
            variants={itemV}
            className="overflow-hidden rounded-2xl border border-black/[0.06] bg-black/[0.025]"
          >
            <Button
              type="button"
              variant="ghost"
              id={triggerId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="h-auto w-full items-center gap-4 rounded-none px-4 py-4 text-left hover:bg-transparent sm:px-5 sm:py-[1.125rem]"
            >
              <span className="min-w-0 flex-1 text-[15px] font-medium leading-snug tracking-[-0.02em] text-black">
                {item.q}
              </span>
              <motion.span
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--waitlist-blue)] text-white sm:size-10"
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: reduce ? 0 : 0.28, ease: easeOutExpo }}
                aria-hidden
              >
                <span className="text-lg font-light leading-none">+</span>
              </motion.span>
            </Button>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  initial={reduce ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? { height: 0, opacity: 1 } : { height: 0, opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 0.34, ease: easeOutExpo }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-black/[0.06] px-4 pb-4 sm:px-5 sm:pb-5">
                    <p className="pt-3 text-[14px] leading-[1.65] text-black/52 sm:text-[15px]">{item.a}</p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

export function AudienceLanding({ audience }: { audience: Audience }) {
  const page = pages[audience]
  const reduce = useReducedMotion()
  const mockupV = useReducedEnterVariants(slideInRight)
  const introLeft = useReducedEnterVariants(slideInLeft)

  return (
    <div className="flex min-h-screen flex-col bg-white text-black selection:bg-black/10">
      <header className="relative overflow-hidden bg-black text-white">
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <div className="absolute inset-0 opacity-[0.5] sm:opacity-[0.58]">
            <WaitlistEarthCanvas className="block h-full w-full" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/35 to-black" />
          <div
            className="absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(ellipse 90% 70% at 72% 42%, transparent 22%, rgba(0,0,0,0.22) 58%, rgba(0,0,0,0.78) 100%)",
            }}
          />
        </div>
        <div
          className="pointer-events-none absolute -bottom-[12%] right-[-8%] z-0 select-none whitespace-nowrap font-semibold lowercase tracking-[-0.06em] text-white/[0.04]"
          style={{ fontSize: "clamp(4.5rem, 16vw, 12rem)" }}
          aria-hidden
        >
          swypejobs.
        </div>
        <motion.div
          className="relative z-10 mx-auto flex w-full max-w-[1120px] items-center justify-between gap-4 px-5 pt-7 sm:px-10 sm:pt-9 lg:px-12"
          initial={reduce ? { opacity: 1, y: 0 } : { opacity: 1, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.48, ease: easeOutExpo }}
        >
          <Link
            href="/"
            className="text-lg font-semibold lowercase tracking-[-0.02em] text-white/90 transition-colors hover:text-white sm:text-[1.15rem]"
          >
            swypejobs<span className="opacity-50">.</span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 sm:gap-6" aria-label="Audience">
            <Link
              href="/universities"
              className={cn(
                "text-[13px] font-medium transition-colors hover:text-[var(--waitlist-blue)]",
                audience === "university" ? "text-white" : "text-white/45"
              )}
            >
              Universities
            </Link>
            <Link
              href="/corporates"
              className={cn(
                "text-[13px] font-medium transition-colors hover:text-[var(--waitlist-blue)]",
                audience === "corporate" ? "text-white" : "text-white/45"
              )}
            >
              Corporates
            </Link>
            <a
              href={CONTACT_MAIL}
              className="text-[13px] font-medium text-white/45 transition-colors hover:text-[var(--waitlist-blue)]"
            >
              Contact
            </a>
          </nav>
        </motion.div>

        <div className="relative z-10 mx-auto grid max-w-[1120px] items-center gap-12 px-5 pb-16 pt-14 sm:px-10 sm:pb-20 sm:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.9fr)] lg:gap-16 lg:px-12 lg:pb-24 lg:pt-20">
          <StaggerMount>
            <StaggerChild hero>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/40">{page.kicker}</p>
            </StaggerChild>
            <StaggerChild hero>
              <h1 className="mt-4 max-w-[18ch] text-balance font-heading text-[clamp(2.15rem,5vw,3.65rem)] font-semibold leading-[1.06] tracking-[-0.04em] text-white">
                {page.title}
              </h1>
            </StaggerChild>
            <StaggerChild>
              <p className="mt-5 max-w-[46ch] text-[16px] leading-[1.65] text-white/52 sm:text-[17px]">{page.lede}</p>
            </StaggerChild>
            <StaggerChild>
              <ul className="mt-6 flex flex-wrap gap-2">
                {page.chips.map((chip) => (
                  <li
                    key={chip}
                    className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[11px] font-medium tracking-[-0.01em] text-white/75"
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            </StaggerChild>
            <StaggerChild>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Cta href={page.ctaHref}>{page.ctaLabel}</Cta>
                <Link
                  href="/#early-access"
                  className="text-[14px] font-medium text-white/50 underline-offset-[5px] transition-colors hover:text-white hover:underline"
                >
                  Student waitlist
                </Link>
              </div>
            </StaggerChild>
          </StaggerMount>
          <motion.div
            className="relative mx-auto w-full max-w-[22.5rem] lg:mx-0 lg:justify-self-end"
            initial="hidden"
            animate="visible"
            variants={mockupV}
          >
            <PartnerHeroMockup variant={page.mockup} />
          </motion.div>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-t border-black/[0.06] bg-[#f7f7f6]">
          <div className="mx-auto max-w-[1120px] px-5 py-16 sm:px-10 sm:py-20 lg:px-12">
            <Reveal>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-black/38">{page.problemKicker}</p>
              <h2 className="mt-3 max-w-[22ch] text-[clamp(1.55rem,3.2vw,2.2rem)] font-semibold leading-[1.15] tracking-[-0.035em] text-black">
                {page.problemTitle}
              </h2>
              <p className="mt-4 max-w-[54ch] text-[16px] leading-[1.6] text-black/48">{page.problemLede}</p>
            </Reveal>
            <StaggerBlock className="mt-10 grid gap-4 sm:grid-cols-3">
              {page.pains.map((pain, i) => (
                <StaggerCard
                  key={pain.title}
                  className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6"
                >
                  <p className="font-mono text-[11px] font-medium tracking-[0.12em] text-[var(--waitlist-blue)]">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-4 font-heading text-[17px] font-semibold tracking-[-0.02em] text-black">
                    {pain.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-[1.6] text-black/50">{pain.body}</p>
                </StaggerCard>
              ))}
            </StaggerBlock>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-[1120px] px-5 py-16 sm:px-10 sm:py-20 lg:px-12">
            <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <Reveal>
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-black/38">{page.stepsKicker}</p>
                  <h2 className="mt-3 max-w-[24ch] text-[clamp(1.55rem,3.2vw,2.2rem)] font-semibold leading-[1.15] tracking-[-0.035em] text-black">
                    {page.stepsTitle}
                  </h2>
                </Reveal>
                <StaggerBlock className="mt-8 space-y-6">
                  {page.steps.map((step) => (
                    <StaggerCard key={step.n} className="flex gap-4 border-t border-black/[0.08] pt-6">
                      <span className="font-mono text-[12px] font-medium text-[var(--waitlist-blue)]">{step.n}</span>
                      <div>
                        <h3 className="font-heading text-[17px] font-semibold tracking-[-0.02em] text-black">{step.title}</h3>
                        <p className="mt-2 text-[14px] leading-[1.65] text-black/50 sm:text-[15px]">{step.body}</p>
                      </div>
                    </StaggerCard>
                  ))}
                </StaggerBlock>
              </div>
              <aside className="rounded-[1.5rem] border border-black/[0.07] bg-[#0a0a0b] p-6 text-white sm:p-8 lg:sticky lg:top-8">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">{page.asideKicker}</p>
                <h3 className="mt-3 max-w-[16ch] font-heading text-[1.45rem] font-semibold leading-[1.15] tracking-[-0.035em]">
                  {page.asideTitle}
                </h3>
                <ul className="mt-8 space-y-5">
                  {page.asideFacts.map((fact, i) => (
                    <li key={fact} className="flex gap-3 border-t border-white/[0.08] pt-5 first:border-0 first:pt-0">
                      <span className="font-mono text-[11px] text-[var(--waitlist-blue)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[14px] leading-snug text-white/70">{fact}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
          </div>
        </section>

        <section className="border-t border-black/[0.06] bg-white">
          <div className="mx-auto max-w-[1120px] px-5 py-16 sm:px-10 sm:py-20 lg:px-12">
            <Reveal>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-black/38">{page.offerKicker}</p>
              <h2 className="mt-3 max-w-[22ch] text-[clamp(1.55rem,3.2vw,2.2rem)] font-semibold leading-[1.15] tracking-[-0.035em] text-black">
                {page.offerTitle}
              </h2>
            </Reveal>
            <StaggerBlock className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-black/[0.07] bg-black/[0.06] sm:grid-cols-2">
              {page.offers.map((offer, i) => (
                <StaggerCard key={offer.title} lift={false} className="bg-white p-5 sm:p-7">
                  <p className="font-mono text-[11px] font-medium tracking-[0.12em] text-[var(--waitlist-blue)]">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-4 font-heading text-[16px] font-semibold tracking-[-0.02em] text-black">
                    {offer.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-[1.6] text-black/50">{offer.body}</p>
                </StaggerCard>
              ))}
            </StaggerBlock>
          </div>
        </section>

        <section className="border-t border-black/[0.06] bg-[#f7f7f6]">
          <div className="mx-auto max-w-[1120px] px-5 py-16 sm:px-10 sm:py-20 lg:px-12">
            <Reveal>
              <h2 className="max-w-[22ch] text-[clamp(1.55rem,3.2vw,2.2rem)] font-semibold leading-[1.15] tracking-[-0.035em] text-black">
                {page.compareTitle}
              </h2>
            </Reveal>
            <StaggerBlock className="mt-10 space-y-3">
              {page.compare.map((row) => (
                <StaggerCard
                  key={row.old}
                  className="grid gap-3 rounded-2xl border border-black/[0.06] bg-white p-4 sm:grid-cols-2 sm:gap-8 sm:p-6"
                >
                  <p className="text-[14px] leading-[1.6] text-black/40">
                    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-black/28">
                      Typical
                    </span>
                    {row.old}
                  </p>
                  <p className="text-[14px] leading-[1.6] text-black/70">
                    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--waitlist-blue)]">
                      On swypejobs
                    </span>
                    {row.next}
                  </p>
                </StaggerCard>
              ))}
            </StaggerBlock>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-[1120px] px-5 py-16 sm:px-10 sm:py-20 lg:px-12">
            <Reveal>
              <h2 className="text-[clamp(1.55rem,3.2vw,2.2rem)] font-semibold tracking-[-0.035em] text-black">
                {page.processTitle}
              </h2>
            </Reveal>
            <StaggerBlock className="mt-10 grid gap-8 md:grid-cols-3">
              {page.process.map((item, i) => (
                <StaggerCard key={item.title} className="border-t border-black/[0.08] pt-6">
                  <p className="font-mono text-[12px] text-[var(--waitlist-blue)]">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-3 font-heading text-[17px] font-semibold tracking-[-0.02em] text-black">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-[1.65] text-black/50">{item.body}</p>
                </StaggerCard>
              ))}
            </StaggerBlock>
          </div>
        </section>

        <section className="border-t border-black/[0.06] bg-white" aria-labelledby="audience-faq-heading">
          <div className="mx-auto grid max-w-[1120px] gap-12 px-5 py-16 sm:px-10 sm:py-20 lg:grid-cols-2 lg:px-12">
            <Reveal variants={introLeft}>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--waitlist-blue)]">FAQ</p>
              <h2
                id="audience-faq-heading"
                className="mt-3 text-[clamp(1.55rem,3.2vw,2.2rem)] font-semibold leading-[1.15] tracking-[-0.035em] text-black"
              >
                Direct answers before a call
              </h2>
              <p className="mt-4 max-w-[40ch] text-[16px] leading-[1.6] text-black/48">
                If this is not a fit, we would rather say so on the first email than waste a committee meeting.
              </p>
            </Reveal>
            <AudienceFaq items={page.faqs} />
          </div>
        </section>

        <section className="bg-[#f4f4f3]" aria-labelledby="audience-close-heading">
          <div className="mx-auto max-w-[1120px] px-5 py-10 sm:px-10 sm:py-12 lg:px-12">
            <Reveal className="rounded-[1.5rem] bg-[var(--waitlist-blue)] px-6 py-8 text-white sm:px-8 sm:py-9 lg:px-10">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
                <div className="min-w-0">
                  <h2
                    id="audience-close-heading"
                    className="max-w-[20ch] font-heading text-[clamp(1.45rem,2.6vw,1.9rem)] font-semibold leading-[1.15] tracking-[-0.035em]"
                  >
                    {page.closeTitle}
                  </h2>
                  <p className="mt-2 max-w-[42ch] text-[14px] leading-[1.55] text-white/65">{page.closeLede}</p>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                  <Cta href={page.ctaHref} light>
                    {page.ctaLabel}
                  </Cta>
                  <Link
                    href={page.otherHref}
                    className="text-[13px] font-medium text-white/55 underline-offset-[5px] transition-colors hover:text-white hover:underline"
                  >
                    {page.otherLabel}
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <WaitlistFooter />
    </div>
  )
}
