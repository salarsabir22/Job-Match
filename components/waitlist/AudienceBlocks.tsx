"use client"

import { Button } from "@/components/ui/button"
import { QAAccordion, type AccordionItemData } from "@/components/waitlist/Accordion"
import type { HeroMode } from "@/components/waitlist/landing-mode"
import { CandidatePanel, RecruiterPanel, UniversityPanel } from "@/components/waitlist/ProductPanels"
import { Rise } from "@/components/waitlist/lp-ui"

const RECRUITER_MAIL = "mailto:hello@swypejobs.app?subject=Recruiter%20inquiry"
const UNIVERSITY_MAIL = "mailto:hello@swypejobs.app?subject=University%20partnership"

const candidateItems: AccordionItemData[] = [
  {
    q: "What is on a job card?",
    a: "Title, type, city, remote or on-site, required skills and the pay band. Enough to decide in a few seconds instead of opening ten tabs.",
  },
  {
    q: "What does a swipe actually do?",
    a: "Swiping right tells that recruiter you want this exact role. Passing sends nothing. You can also save a role to come back to it.",
  },
  {
    q: "When can I message someone?",
    a: "Only after a mutual match. The chat belongs to that job, so scheduling and next steps stay in one place.",
  },
  {
    q: "Who is it for?",
    a: "Students and recent graduates looking for internships and early-career roles. Senior backfills belong in other tools.",
  },
]

const recruiterItems: AccordionItemData[] = [
  {
    q: "Where do candidates come from?",
    a: "Your Discover feed is students who swiped your listing. It is not a public résumé database and nobody is pushed at you.",
  },
  {
    q: "How does the pipeline work?",
    a: "Each match moves through chatting, interview, offer and hired. Notes stay on the match, so the process is readable at a glance.",
  },
  {
    q: "Who can post roles?",
    a: "Recruiter accounts are reviewed before jobs go live. We are onboarding in waves, starting with teams that hire from campus.",
  },
  {
    q: "Can I message people who have not matched?",
    a: "No, and that is the point. You can swipe, save and wait for a mutual match, which keeps the student side free of spam.",
  },
]

const universityItems: AccordionItemData[] = [
  {
    q: "Do we have to upload student data?",
    a: "No. Students create their own accounts and opt in. We never ask for a registrar dump or a directory.",
  },
  {
    q: "Does it replace our career portal?",
    a: "No. It sits beside your office and the systems you already run, and works around fairs, workshops and advising.",
  },
  {
    q: "What can the office see?",
    a: "Where policy and consent allow: opt-in volume, interest by role type and match activity in aggregate. Never a list of every student.",
  },
  {
    q: "What does a partnership look like?",
    a: "A short briefing, a pilot scoped to the schools or faculties you choose, then a co-branded campus session. Students still join themselves.",
  },
]

const h2 =
  "mt-4 text-balance text-[clamp(2rem,4vw,3.1rem)] font-semibold leading-[1.04] tracking-[-0.04em]"
const lede = "mt-5 max-w-[44ch] text-[16px] leading-[1.6] text-muted-foreground"
const wrap =
  "mx-auto grid w-full max-w-[1120px] items-center gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-2 lg:gap-16 lg:py-28"

export function AudienceBlocks({ mode }: { mode: HeroMode }) {
  if (mode === "people") {
    return (
      <section id="recruiters" className="scroll-mt-20 bg-[var(--lp-surface)]" aria-labelledby="recruiters-heading">
        <div className={wrap}>
          <Rise className="lg:order-2">
            <h2 id="recruiters-heading" className={`${h2} max-w-[16ch]`}>
              A shortlist of people who already said yes.
            </h2>
            <p className={lede}>Built for campus and early-career hiring, where volume is easy and intent is not.</p>
            <QAAccordion items={recruiterItems} className="mt-8" />
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button asChild className="h-11 px-6 text-[14px] font-semibold">
                <a href={RECRUITER_MAIL}>Talk to us</a>
              </Button>
            </div>
          </Rise>
          <Rise className="lg:order-1">
            <RecruiterPanel />
          </Rise>
        </div>
      </section>
    )
  }

  if (mode === "campus") {
    return (
      <section id="universities" className="scroll-mt-20" aria-labelledby="universities-heading">
        <div className={wrap}>
          <Rise>
            <h2 id="universities-heading" className={`${h2} max-w-[15ch]`}>
              A product career offices can recommend.
            </h2>
            <p className={lede}>
              swypejobs sits next to career services. Students opt in, employers talk only after a mutual match, and
              the office keeps the advising relationship.
            </p>
            <QAAccordion items={universityItems} className="mt-8" />
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button asChild className="h-11 px-6 text-[14px] font-semibold">
                <a href={UNIVERSITY_MAIL}>Request a briefing</a>
              </Button>
            </div>
          </Rise>
          <Rise>
            <UniversityPanel />
          </Rise>
        </div>
      </section>
    )
  }

  return (
    <section id="candidates" className="scroll-mt-20" aria-labelledby="candidates-heading">
      <div className={wrap}>
        <Rise>
          <h2 id="candidates-heading" className={`${h2} max-w-[14ch]`}>
            Judge a job in one glance.
          </h2>
          <p className={lede}>
            Internships and new-grad roles, shown as cards with the details that matter. No forty-field forms and no
            applying into the void.
          </p>
          <QAAccordion items={candidateItems} className="mt-8" />
          <Button asChild className="mt-8 h-11 px-6 text-[14px] font-semibold">
            <a href="#early-access">Join the waitlist</a>
          </Button>
        </Rise>
        <Rise>
          <CandidatePanel />
        </Rise>
      </div>
    </section>
  )
}
