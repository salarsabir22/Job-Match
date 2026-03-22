"use client"

import { useId, useState } from "react"
import { motion } from "framer-motion"
import {
  faqStaggerItem,
  faqStaggerParent,
  Reveal,
  slideInLeft,
  useReducedEnterVariants,
  viewportOnce,
} from "@/components/motion/waitlist-motion"
import { cn } from "@/lib/utils"

const CONTACT_MAIL = "mailto:hello@jobmatch.app"

const faqs: { q: string; a: string }[] = [
  {
    q: "How does JobMatch work for students?",
    a: "You browse roles with context on pay band, location, and team. Swipe to pass or show interest. If a recruiter shortlists you back, it’s a mutual match — only then can you message in-app, tied to that job.",
  },
  {
    q: "Why mutual match before chat?",
    a: "So neither side burns time on one-way outreach. Students aren’t buried in recruiter spam, and recruiters focus on people who actually want that role.",
  },
  {
    q: "Is JobMatch only for internships?",
    a: "We’re focused on early-career and campus-heavy hiring — internships and new grad roles are the sweet spot. Other full-time roles may appear as we grow.",
  },
  {
    q: "When does early access open?",
    a: "We’re onboarding in waves. Join the waitlist with your email and we’ll notify you once — no spam. Recruiters and universities can also reach out via Contact for partner timing.",
  },
  {
    q: "How do recruiters get on JobMatch?",
    a: "We’re working with a small set of hiring teams first. Email us from the recruiters section (or Contact) with your volume and target schools — we’ll share early-access details.",
  },
  {
    q: "Can career centers or universities partner?",
    a: "Yes. We’re designed to sit alongside your office, not replace it. Partnerships can include co-branded sessions, advisor materials, and aggregate-friendly reporting where policy allows.",
  },
]

export function WaitlistFaq() {
  const baseId = useId()
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const faqParentV = useReducedEnterVariants(faqStaggerParent)
  const faqItemV = useReducedEnterVariants(faqStaggerItem)

  return (
    <section
      className="w-full border-t border-black/[0.06] bg-white"
      aria-labelledby="waitlist-faq-heading"
    >
      <div className="relative mx-auto max-w-[1120px] overflow-hidden px-5 py-16 sm:px-10 sm:py-20 md:py-24 lg:px-12">
        <div className="relative grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-0 xl:gap-x-20">
          {/* Left: intro + CTA */}
          <Reveal className="lg:max-w-md lg:pr-4" variants={slideInLeft}>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--waitlist-blue)]">FAQ&apos;s</p>
            <h2
              id="waitlist-faq-heading"
              className="mt-4 text-[clamp(1.85rem,4vw,2.65rem)] font-semibold leading-[1.1] tracking-[-0.035em] text-black"
            >
              Frequently Asked Questions
            </h2>
            <p className="mt-5 text-[16px] leading-[1.55] text-black/48 sm:text-[17px]">
              Get answers to commonly asked questions about JobMatch, early access, and how students, recruiters, and
              schools fit together.
            </p>
            <a
              href={CONTACT_MAIL}
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-[var(--waitlist-blue)] px-6 py-3 text-[14px] font-semibold tracking-[-0.02em] text-white shadow-[0_4px_18px_rgba(30,58,95,0.35)] transition-[background-color,box-shadow] duration-200 hover:bg-[var(--waitlist-blue-hover)] hover:shadow-[0_6px_22px_rgba(30,58,95,0.4)] active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              Contact us
              <span className="text-[1.1em] font-light leading-none opacity-95" aria-hidden>
                ›
              </span>
            </a>
          </Reveal>

          {/* Right: accordion */}
          <motion.div
            className="flex flex-col gap-3 sm:gap-3.5"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={faqParentV}
          >
            {faqs.map((item, index) => {
              const isOpen = openIndex === index
              const panelId = `${baseId}-panel-${index}`
              const triggerId = `${baseId}-trigger-${index}`
              return (
                <motion.div
                  key={item.q}
                  variants={faqItemV}
                  className="overflow-hidden rounded-2xl border border-black/[0.06] bg-black/[0.025] transition-colors hover:bg-black/[0.035]"
                >
                  <button
                    type="button"
                    id={triggerId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center gap-4 px-4 py-4 text-left sm:px-5 sm:py-[1.125rem]"
                  >
                    <span className="min-w-0 flex-1 text-[15px] font-medium leading-snug tracking-[-0.02em] text-black sm:text-[15px]">
                      {item.q}
                    </span>
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--waitlist-blue)] text-white shadow-[0_2px_12px_rgba(30,58,95,0.35)] transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none sm:size-10",
                        isOpen && "rotate-45 bg-[var(--waitlist-blue-hover)]"
                      )}
                      aria-hidden
                    >
                      <span className="text-lg font-light leading-none">+</span>
                    </span>
                  </button>
                  {/* Grid 0fr → 1fr: smooth height without fixed max-height */}
                  <div
                    className={cn(
                      "grid motion-reduce:transition-none transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]",
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={triggerId}
                        aria-hidden={!isOpen}
                        className="border-t border-black/[0.06] px-4 pb-4 sm:px-5 sm:pb-5"
                      >
                        <p className="pt-3 text-[14px] leading-[1.6] text-black/52 sm:text-[15px]">{item.a}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
