"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import { AnimatePresence, motion, useAnimation, useReducedMotion } from "framer-motion"
import { easeOutExpo } from "@/components/motion/waitlist-motion"
import { Logo } from "@/components/brand/Logo"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QAAccordion, type AccordionItemData } from "@/components/waitlist/Accordion"
import { AudienceBlocks } from "@/components/waitlist/AudienceBlocks"
import { FlowChart } from "@/components/waitlist/FlowChart"
import { UniversityPanel } from "@/components/waitlist/ProductPanels"
import { BentoGrid, BuiltForBand, PersonaTabs } from "@/components/waitlist/Showcase"
import { SwipeDeck } from "@/components/waitlist/SwipeDeck"
import { Rise } from "@/components/waitlist/lp-ui"
import { cn } from "@/lib/utils"

const CONTACT = "mailto:hello@swypejobs.app"
const UNIVERSITY_MAIL = "mailto:hello@swypejobs.app?subject=University%20partnership"
const YEAR = new Date().getFullYear()

type HeroMode = "jobs" | "people" | "campus"

const formShake = {
  x: [0, -8, 8, -5, 5, 0],
  transition: { duration: 0.4, ease: "easeInOut" as const },
}

const heroCopy: Record<HeroMode, { a: string; b: string; lede: string }> = {
  jobs: {
    a: "Swipe the jobs",
    b: "you’d actually take.",
    lede: "swypejobs is a hiring platform for students and early-career talent. Pay, city and team are on every card. A swipe is your application, and chat opens only if the recruiter swipes back.",
  },
  people: {
    a: "Swipe the students",
    b: "who already want it.",
    lede: "Every student in your deck already swiped your role. Swipe back to open a thread tied to that job. No cold outreach and no inbox full of résumés.",
  },
  campus: {
    a: "A better way to get",
    b: "your students hired.",
    lede: "swypejobs sits beside career services. Students opt in, employers talk to them only after a mutual match, and your office sees aggregate outcomes where consent allows.",
  },
}

const heroTiles: { id: HeroMode; label: string }[] = [
  { id: "jobs", label: "Candidate" },
  { id: "people", label: "Recruiter" },
  { id: "campus", label: "University" },
]

const navLinks = [
  { href: "#platform", label: "Platform" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#candidates", label: "Candidates" },
  { href: "#recruiters", label: "Recruiters" },
  { href: "#universities", label: "Universities" },
  { href: "#faq", label: "FAQ" },
]

const principles = [
  { v: "0", l: "cold messages", d: "Nobody can message first." },
  { v: "2", l: "yeses to unlock chat", d: "Candidate and recruiter both opt in." },
  { v: "1", l: "thread per role", d: "Every conversation is tied to a job." },
  { v: "3", l: "sides, one platform", d: "Candidates, recruiters and campuses." },
]

const compareCols = ["Job boards", "Cold DMs and email", "swypejobs"]
const compareRows: { k: string; v: [string, string, string] }[] = [
  { k: "Who can message first", v: ["The candidate applies, then waits", "Whoever hits send", "Nobody, until both swipe yes"] },
  { k: "Signal of intent", v: ["A click on Apply", "None", "A swipe on one specific role"] },
  { k: "Pay and city up front", v: ["Sometimes", "Rarely", "On every card"] },
  { k: "Where the conversation lives", v: ["Email", "Scattered DMs", "One thread per role"] },
]

const faqs: AccordionItemData[] = [
  {
    q: "How does swypejobs work for students?",
    a: "You browse roles with pay band, location and team context. Swipe to pass or show interest. If the recruiter swipes back, it is a mutual match and you can message in-app, tied to that job.",
  },
  {
    q: "Why mutual match before chat?",
    a: "So neither side burns time on one-way outreach. Students are not buried in recruiter spam, and recruiters focus on people who actually want that role.",
  },
  {
    q: "Is it only for internships?",
    a: "The focus is early-career and campus-heavy hiring: internships and new-grad roles. Other full-time roles may appear as we grow.",
  },
  {
    q: "When does early access open?",
    a: "We are onboarding in waves. Join the waitlist and we will email you once when your wave opens. Recruiters and universities can also reach out for partner timing.",
  },
  {
    q: "How do recruiters get on?",
    a: "We are working with a small set of hiring teams first. Email us with your volume and target schools and we will share early-access details.",
  },
  {
    q: "Can career centers and universities partner?",
    a: "Yes. The product is designed to sit beside your office, not replace it. Partnerships can include co-branded sessions, advisor materials and aggregate reporting where policy allows.",
  },
]

function Wordmark() {
  return (
    <Link href="/" aria-label="swypejobs home">
      <Logo size={32} />
    </Link>
  )
}

function Signup({ id }: { id: string }) {
  const reduceMotion = useReducedMotion()
  const formControls = useAnimation()

  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [confirmationEmailSent, setConfirmationEmailSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shake = () => {
    if (!reduceMotion) void formControls.start(formShake)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    const value = email.trim().toLowerCase()
    if (!value) {
      setError("Email is required.")
      shake()
      return
    }
    if (!value.includes("@") || !value.includes(".")) {
      setError("Enter a valid email.")
      shake()
      return
    }
    setSubmitting(true)
    setConfirmationEmailSent(false)
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; confirmationEmailSent?: boolean }
      if (!res.ok) throw new Error(data.error || "Failed to join waitlist.")
      setSubmitting(false)
      setConfirmationEmailSent(data.confirmationEmailSent === true)
      setDone(true)
    } catch (err: unknown) {
      setSubmitting(false)
      setError(err instanceof Error ? err.message : "Failed to join waitlist.")
      shake()
    }
  }

  return (
    <div className="w-full max-w-lg">
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.div
            key="done"
            role="status"
            initial={reduceMotion ? false : { y: 6 }}
            animate={{ y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: easeOutExpo }}
          >
            <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--lp-mint-ink)]">Confirmed</p>
            <p className="mt-2 text-[1.5rem] font-semibold tracking-[-0.035em]">You’re on the list.</p>
            <p className="mt-2 max-w-[38ch] text-[15px] leading-relaxed text-muted-foreground">
              {confirmationEmailSent
                ? "We sent a confirmation. We’ll email you again when your wave opens."
                : "We’ll email you when your wave opens."}
            </p>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={submit} animate={formControls} className="flex flex-col gap-2 sm:flex-row">
            <Label htmlFor={id} className="sr-only">
              Email address
            </Label>
            <Input
              id={id}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address"
              type="email"
              autoComplete="email"
              disabled={submitting}
              className="h-12 flex-1 rounded-full border-input bg-white px-5 text-[15px] text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
            />
            <Button
              type="submit"
              disabled={submitting}
              className="h-12 shrink-0 bg-primary px-6 text-[15px] font-semibold text-white hover:bg-[var(--clearpath-navy-hover)]"
            >
              {submitting ? "Joining…" : "Join waitlist"}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
      {error && !done ? (
        <p role="alert" className="mt-3 text-[14px] font-medium text-[var(--lp-coral-ink)]">
          {error}
        </p>
      ) : null}
      {!done ? (
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          One email when your wave opens. Unsubscribe anytime.
        </p>
      ) : null}
    </div>
  )
}

export function WaitlistForm() {
  const reduceMotion = useReducedMotion()
  const [mode, setMode] = useState<HeroMode>("jobs")
  const copy = heroCopy[mode]

  return (
    <div className="lp min-h-screen overflow-x-clip selection:bg-primary selection:text-white">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1360px] items-center justify-between gap-4 px-5 sm:px-8">
          <Wordmark />

          <NavigationMenu viewport={false} className="hidden md:flex" aria-label="Sections">
            <NavigationMenuList>
              {navLinks.map((link) => (
                <NavigationMenuItem key={link.href}>
                  <NavigationMenuLink asChild>
                    <a
                      href={link.href}
                      className={cn(navigationMenuTriggerStyle(), "text-[14px] text-muted-foreground hover:text-foreground")}
                    >
                      {link.label}
                    </a>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden text-[14px] text-muted-foreground hover:text-foreground sm:inline-flex">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild className="h-9 bg-primary px-4 text-[13px] font-semibold text-white hover:bg-[var(--clearpath-navy-hover)]">
              <a href="#early-access">Join waitlist</a>
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground md:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="border-border bg-background">
                <SheetHeader>
                  <SheetTitle>swypejobs</SheetTitle>
                </SheetHeader>
                <nav aria-label="Mobile sections" className="mt-8 flex flex-col">
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <a href={link.href} className="border-b border-border py-4 text-[16px] font-medium">
                        {link.label}
                      </a>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <Link href="/login" className="py-4 text-[16px] font-medium text-muted-foreground">
                      Log in
                    </Link>
                  </SheetClose>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section
          id="early-access"
          className="relative scroll-mt-16 bg-[radial-gradient(ellipse_70%_70%_at_20%_0%,rgba(90,72,255,0.22),transparent_70%),var(--background)] lg:flex lg:h-[calc(100svh-4rem)] lg:min-h-[600px] lg:items-center"
        >
          <div className="lp-grid pointer-events-none absolute inset-0" aria-hidden />
          <div className="lp-hero-grid relative mx-auto w-full max-w-[1360px] px-5 pb-16 pt-10 sm:px-8 sm:pt-14 lg:px-12 lg:py-6">
            <div className="lp-area-copy">
              <Tabs value={mode} onValueChange={(value) => setMode(value as HeroMode)}>
                <TabsList
                  aria-label="Choose your side"
                  className="h-12 w-full max-w-[460px] rounded-full border border-border bg-secondary p-1"
                >
                  {heroTiles.map((tile) => (
                    <TabsTrigger
                      key={tile.id}
                      value={tile.id}
                      className="h-full flex-1 rounded-full text-[15px] font-semibold text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none"
                    >
                      {tile.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  initial={reduceMotion ? false : { y: 8 }}
                  animate={{ y: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.28, ease: easeOutExpo }}
                >
                  <h1 className="mt-6 lg:mt-[min(2rem,3svh)] text-[clamp(2.4rem,min(5.4vw,8svh),4.8rem)] font-semibold leading-[0.98] tracking-[-0.05em]">
                    {copy.a}
                    <br />
                    <span className="bg-gradient-to-r from-[#5a48ff] via-[#7a54ff] to-[#0fa97a] bg-clip-text text-transparent">
                      {copy.b}
                    </span>
                  </h1>
                  <p className="mt-6 max-w-[48ch] text-[17px] leading-[1.6] text-muted-foreground">{copy.lede}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="lp-area-deck">
              <div className="relative flex min-h-[520px] items-center justify-center overflow-hidden rounded-[28px] border border-border px-4 py-8 sm:px-8 lg:h-[min(calc(100svh-8rem),720px)] lg:min-h-0 lg:py-6">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_30%,rgba(90,72,255,0.22),transparent_70%),linear-gradient(180deg,#ffffff,#ecebff)]" />

                <div className="relative z-20 w-full">
                  {mode === "campus" ? <UniversityPanel /> : <SwipeDeck key={mode} variant={mode} />}
                </div>
              </div>
            </div>

            <div className="lp-area-form">
              {mode === "campus" ? (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <Button asChild className="h-12 bg-primary px-6 text-[15px] font-semibold text-white hover:bg-[var(--clearpath-navy-hover)]">
                    <a href={UNIVERSITY_MAIL}>Request a briefing</a>
                  </Button>
                </div>
              ) : (
                <Signup id="waitlist-email" />
              )}
              <p className="mt-6 text-[14px] text-muted-foreground">
                <span className="font-semibold text-foreground">600+</span> students and recruiters are already on the list.
              </p>
            </div>
          </div>
        </section>

        <BuiltForBand />
        <BentoGrid />
        <PersonaTabs />

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20" aria-labelledby="how-heading">
          <div className="mx-auto w-full max-w-[1120px] px-5 py-20 sm:px-8 sm:py-24 lg:py-28">
            <Rise>
              <h2
                id="how-heading"
                className="mt-4 max-w-[18ch] text-balance text-[clamp(2rem,4vw,3.1rem)] font-semibold leading-[1.04] tracking-[-0.04em]"
              >
                Two swipes. One conversation.
              </h2>
              <p className="mt-5 max-w-[54ch] text-[16px] leading-[1.6] text-muted-foreground">
                Follow a role from the day it is posted to the day it is filled.
              </p>
            </Rise>
            <div className="mt-12">
              <FlowChart />
            </div>
          </div>
        </section>

        <AudienceBlocks />

        {/* Numbers */}
        <section
          className="border-y border-border bg-[radial-gradient(ellipse_70%_100%_at_50%_0%,rgba(90,72,255,0.14),transparent_70%),var(--lp-surface)]"
          aria-label="What makes swypejobs different"
        >
          <div className="mx-auto w-full max-w-[1120px] px-5 py-16 sm:px-8 sm:py-20">
            <h2 className="max-w-[22ch] text-[clamp(1.6rem,3vw,2.3rem)] font-semibold leading-[1.1] tracking-[-0.035em]">
              Built around intent, so everyone’s time counts.
            </h2>
            <ul className="mt-12 grid grid-cols-2 gap-y-10 lg:grid-cols-4">
              {principles.map((item) => (
                <li key={item.l} className="border-border pr-4 lg:border-l lg:pl-6 lg:first:border-l-0 lg:first:pl-0">
                  <p className="text-[clamp(2.8rem,5.5vw,4.2rem)] font-semibold leading-none tracking-[-0.05em]">
                    {item.v}
                  </p>
                  <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--lp-mint-ink)]">{item.l}</p>
                  <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">{item.d}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Compare */}
        <section aria-labelledby="compare-heading">
          <div className="mx-auto w-full max-w-[1120px] px-5 py-20 sm:px-8 sm:py-24 lg:py-28">
            <Rise>
              <h2
                id="compare-heading"
                className="mt-4 max-w-[20ch] text-balance text-[clamp(2rem,4vw,3.1rem)] font-semibold leading-[1.04] tracking-[-0.04em]"
              >
                Next to how early-career hiring usually goes.
              </h2>
            </Rise>
            <Rise className="mt-10">
              <Card className="overflow-hidden bg-card">
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-14 px-5">
                        <span className="sr-only">Question</span>
                      </TableHead>
                      {compareCols.map((col, i) => (
                        <TableHead
                          key={col}
                          className={cn(
                            "h-14 px-5 font-mono text-[11px] uppercase tracking-[0.1em]",
                            i === 2 ? "bg-primary text-white" : "text-muted-foreground"
                          )}
                        >
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {compareRows.map((row) => (
                      <TableRow key={row.k}>
                        <TableHead scope="row" className="h-auto px-5 py-5 text-[14px] font-semibold text-foreground">
                          {row.k}
                        </TableHead>
                        {row.v.map((cell, i) => (
                          <TableCell
                            key={cell}
                            className={cn(
                              "px-5 py-5 text-[14px] leading-snug",
                              i === 2 ? "bg-primary/10 font-medium text-foreground" : "text-muted-foreground"
                            )}
                          >
                            {cell}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </Rise>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 bg-[var(--lp-surface)]" aria-labelledby="faq-heading">
          <div className="mx-auto grid w-full max-w-[1120px] gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-12 lg:gap-16 lg:py-28">
            <Rise className="lg:col-span-5">
              <h2
                id="faq-heading"
                className="mt-4 max-w-[14ch] text-balance text-[clamp(2rem,4vw,3.1rem)] font-semibold leading-[1.04] tracking-[-0.04em]"
              >
                Straight answers.
              </h2>
              <p className="mt-5 max-w-[34ch] text-[16px] leading-[1.6] text-muted-foreground">
                Still unsure? Write to us and a person will reply.
              </p>
              <Button asChild variant="outline" className="mt-7 h-11 border-[#14102e]/30 bg-white px-6 text-[14px] font-semibold text-foreground hover:bg-[#14102e] hover:text-white">
                <a href={CONTACT}>Contact us</a>
              </Button>
            </Rise>
            <Rise className="lg:col-span-7">
              <QAAccordion items={faqs} defaultOpen={0} />
            </Rise>
          </div>
        </section>

        {/* Closing CTA */}
        <section
          className="bg-[radial-gradient(ellipse_70%_90%_at_50%_120%,rgba(90,72,255,0.28),transparent_70%),var(--background)]"
          aria-labelledby="cta-heading"
        >
          <div className="mx-auto grid w-full max-w-[1120px] items-center gap-8 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1fr_minmax(0,32rem)] lg:gap-16 lg:py-28">
            <div>
              <h2
                id="cta-heading"
                className="max-w-[16ch] text-balance text-[clamp(2.2rem,4.6vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.045em]"
              >
                Get in line for the first wave.
              </h2>
              <p className="mt-4 max-w-[40ch] text-[16px] leading-[1.6] text-muted-foreground">
                Candidates, recruiters and campus teams are all onboarding in waves.
              </p>
            </div>
            <Signup id="waitlist-email-cta" />
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-white">
        <div className="mx-auto w-full max-w-[1120px] px-5 py-14 sm:px-8 sm:py-16">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Wordmark />
              <p className="mt-4 max-w-[34ch] text-[14px] leading-relaxed text-muted-foreground">
                Early-career hiring for students, recruiters and university partners. Chat opens only when both sides
                opt in.
              </p>
              <a href={CONTACT} className="mt-5 inline-block text-[15px] font-medium text-foreground hover:text-primary">
                hello@swypejobs.app
              </a>
              <p className="mt-1 text-[13px] text-muted-foreground">We reply within two to three business days.</p>
            </div>

            <nav aria-label="Platform" className="lg:col-span-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--lp-accent)]">Platform</p>
              <ul className="mt-4 space-y-3 text-[14px] text-muted-foreground">
                <li><a href="#platform" className="hover:text-primary">Overview</a></li>
                <li><a href="#how-it-works" className="hover:text-primary">How it works</a></li>
                <li><a href="#faq" className="hover:text-primary">FAQ</a></li>
                <li><a href="#early-access" className="hover:text-primary">Join the waitlist</a></li>
              </ul>
            </nav>

            <nav aria-label="Audiences" className="lg:col-span-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--lp-accent)]">Who it is for</p>
              <ul className="mt-4 space-y-3 text-[14px] text-muted-foreground">
                <li><a href="#candidates" className="hover:text-primary">Candidates</a></li>
                <li><a href="#recruiters" className="hover:text-primary">Recruiters</a></li>
                <li><a href="#universities" className="hover:text-primary">Universities</a></li>
              </ul>
            </nav>

            <nav aria-label="Company" className="lg:col-span-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--lp-accent)]">Company</p>
              <ul className="mt-4 space-y-3 text-[14px] text-muted-foreground">
                <li><a href={CONTACT} className="hover:text-primary">Contact</a></li>
                <li><Link href="/login" className="hover:text-primary">Log in</Link></li>
                <li><Link href="/privacy" className="hover:text-primary">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-primary">Terms</Link></li>
              </ul>
            </nav>
          </div>

          <Separator className="mt-14" />
          <div className="flex flex-col gap-3 pt-6 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>© {YEAR} swypejobs. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
