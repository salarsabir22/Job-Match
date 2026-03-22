"use client"

import type { ReactNode } from "react"
import { Reveal } from "@/components/motion/waitlist-motion"

const RECRUITER_MAIL = "mailto:hello@jobmatch.app?subject=Recruiter%20inquiry"
const UNIVERSITY_MAIL = "mailto:hello@jobmatch.app?subject=University%20partnership"

function Chevron() {
  return (
    <span className="text-[1.1em] font-light leading-none opacity-90" aria-hidden>
      ›
    </span>
  )
}

function PrimaryCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-2 rounded-full bg-[var(--waitlist-blue)] px-6 py-3 text-[14px] font-semibold tracking-[-0.02em] text-white shadow-[0_4px_18px_rgba(37,99,235,0.35)] transition-[transform,background-color] duration-200 hover:bg-[var(--waitlist-blue-hover)] active:scale-[0.98]"
    >
      {children}
      <Chevron />
    </a>
  )
}

function MetricRow({
  label,
  valueLabel,
  fillClass,
  barClass,
}: {
  label: string
  valueLabel: string
  fillClass: string
  barClass: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-semibold tracking-[-0.01em] text-black/72 sm:text-xs">{label}</span>
        <span className="shrink-0 tabular-nums text-[11px] font-semibold text-black/55 sm:text-xs">{valueLabel}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-black/[0.07] sm:h-3">
        <div className={`h-full w-full rounded-full ${barClass} ${fillClass}`} />
      </div>
    </div>
  )
}

function AudienceMetricMockup({
  variant,
}: {
  variant: "recruiter" | "university"
}) {
  const isRecruiter = variant === "recruiter"
  const barTint = "bg-gradient-to-r from-[var(--waitlist-blue-deep)] to-[var(--waitlist-blue)]"
  const glow = isRecruiter
    ? "bg-[radial-gradient(ellipse_at_75%_15%,rgba(0,0,0,0.06),transparent_55%)]"
    : "bg-[radial-gradient(ellipse_at_25%_20%,rgba(0,0,0,0.06),transparent_55%)]"

  return (
    <div className="relative mx-auto w-full max-w-[min(420px,100%)] select-none" aria-hidden>
      <div className={`pointer-events-none absolute -inset-6 -z-10 rounded-[28px] ${glow}`} />

      {/* Back window */}
      <div
        className={`relative mb-[-3.25rem] rounded-[14px] border border-black/[0.08] bg-white shadow-[0_12px_40px_-24px_rgba(0,0,0,0.18)] sm:mb-[-4rem] ${isRecruiter ? "ml-0 mr-6 sm:mr-10" : "ml-6 mr-0 sm:ml-10"}`}
      >
        <div className="flex items-center gap-2 border-b border-black/[0.06] bg-[#FAFAFA] px-3 py-2">
          <div className="flex shrink-0 gap-1" aria-hidden>
            <span className="size-2 rounded-full bg-[#FECACA]" />
            <span className="size-2 rounded-full bg-[#FDE68A]" />
            <span className="size-2 rounded-full bg-[#BBF7D0]" />
          </div>
          <span className="truncate text-center text-[10px] font-semibold text-black/45 sm:text-[11px]">
            {isRecruiter ? "Hiring workspace" : "Campus program"}
          </span>
          <span className="w-8 shrink-0 sm:w-10" />
        </div>
        <div className="space-y-2 px-3 py-4 sm:px-4 sm:py-5">
          <div className="h-2.5 w-3/4 rounded bg-black/[0.06]" />
          <div className="h-2.5 w-1/2 rounded bg-black/[0.05]" />
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="h-14 rounded-lg bg-black/[0.04]" />
            <div className="h-14 rounded-lg bg-black/[0.04]" />
            <div className="h-14 rounded-lg bg-black/[0.04]" />
          </div>
        </div>
      </div>

      {/* Front metric card */}
      <div
        className={`relative z-10 rounded-[16px] border border-black/[0.08] bg-white p-4 shadow-[0_28px_56px_-28px_rgba(15,23,42,0.22),0_0_0_1px_rgba(0,0,0,0.03)_inset] sm:p-5 ${isRecruiter ? "ml-4 sm:ml-8" : "mr-4 sm:mr-8"}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-black/[0.06] pb-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-medium tracking-tight text-black/55">
              {isRecruiter ? "campus-eng · #4281" : "state-u · FY26"}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-black">
              {isRecruiter ? "Pipeline health" : "Engagement overview"}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--waitlist-blue)]/30 bg-[var(--waitlist-blue)]/[0.12] px-2 py-0.5 text-[9px] font-semibold text-[var(--waitlist-blue-deep)]">
            <span className="size-1.5 rounded-full bg-[var(--waitlist-blue)]" />
            Active
          </span>
        </div>

        <div className="mt-4 space-y-4">
          {isRecruiter ? (
            <>
              <MetricRow
                label="Qualified interest"
                valueLabel="91%"
                fillClass="audience-metric-fill-a"
                barClass={barTint}
              />
              <MetricRow
                label="Mutual match rate"
                valueLabel="84%"
                fillClass="audience-metric-fill-b"
                barClass={barTint}
              />
              <MetricRow
                label="Noise filtered"
                valueLabel="96%"
                fillClass="audience-metric-fill-c"
                barClass={barTint}
              />
            </>
          ) : (
            <>
              <MetricRow
                label="Student opt-in clarity"
                valueLabel="72%"
                fillClass="audience-metric-fill-d"
                barClass={barTint}
              />
              <MetricRow
                label="Advisor resource use"
                valueLabel="38%"
                fillClass="audience-metric-fill-e"
                barClass={barTint}
              />
              <MetricRow
                label="Outcomes visibility"
                valueLabel="55%"
                fillClass="audience-metric-fill-f"
                barClass={barTint}
              />
            </>
          )}
        </div>

        <div className="mt-4 border-t border-black/[0.06] pt-3 font-mono text-[9px] leading-relaxed text-black/38">
          {isRecruiter ? (
            <>
              <p>Posting · Summer intern — Engineering</p>
              <p>Channel · JobMatch · Mutual-only chat</p>
            </>
          ) : (
            <>
              <p>Program · Career services partnership</p>
              <p>Reporting · Aggregate · Consent-based</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function WaitlistAudienceSections() {
  return (
    <div className="w-full">
      {/* Recruiters */}
      <section
        className="w-full border-t border-black/[0.06] bg-white"
        aria-labelledby="recruiters-heading"
      >
        <Reveal className="mx-auto max-w-[1120px] px-5 py-16 sm:px-10 sm:py-20 md:py-24 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-0 xl:gap-x-20">
            <div className="lg:pr-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-black/38">For recruiters</p>
              <h2
                id="recruiters-heading"
                className="mt-4 text-[clamp(1.75rem,3.8vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.035em] text-black text-balance"
              >
                Hire from real intent, not inbox noise
              </h2>
              <p className="mt-5 max-w-[42ch] text-[16px] leading-[1.55] text-black/48 sm:text-[17px]">
                JobMatch is built for teams that want signal before the first message — especially for internships, new
                grad, and high-volume campus pipelines. Swipe interest, mutual match, then chat tied to the role.
              </p>
              <ul className="mt-6 max-w-[44ch] space-y-3 text-[15px] leading-[1.5] text-black/50">
                <li className="flex gap-2.5">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-[var(--waitlist-blue)]" aria-hidden />
                  <span>Your pipeline reflects who actually raised their hand — not keyword spray-and-pray.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-[var(--waitlist-blue)]" aria-hidden />
                  <span>Early partner access: launch timing, feedback loops, and campus-heavy workflows.</span>
                </li>
              </ul>
              <div className="mt-9">
                <PrimaryCta href={RECRUITER_MAIL}>Get recruiter early access</PrimaryCta>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <AudienceMetricMockup variant="recruiter" />
            </div>
          </div>
        </Reveal>
      </section>

      {/* Universities */}
      <section
        className="w-full border-t border-black/[0.06] bg-white"
        aria-labelledby="universities-heading"
      >
        <Reveal className="mx-auto max-w-[1120px] px-5 py-16 sm:px-10 sm:py-20 md:py-24 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-0 xl:gap-x-20">
            <div className="lg:order-2 lg:pl-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-black/38">For universities</p>
              <h2
                id="universities-heading"
                className="mt-4 text-[clamp(1.75rem,3.8vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.035em] text-black text-balance"
              >
                Career services & partnerships
              </h2>
              <p className="mt-5 max-w-[42ch] text-[16px] leading-[1.55] text-black/48 sm:text-[17px]">
                We fit alongside your office — students opt in, you stay in the loop on partnership-friendly reporting
                and co-branded touchpoints when you&apos;re ready.
              </p>
              <ul className="mt-6 max-w-[44ch] space-y-3 text-[15px] leading-[1.5] text-black/50">
                <li className="flex gap-2.5">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-[var(--waitlist-blue)]" aria-hidden />
                  <span>Aggregate outcomes framing (where policy and consent allow).</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-[var(--waitlist-blue)]" aria-hidden />
                  <span>Advisor one-pagers, sessions, and a clear line for partnership questions.</span>
                </li>
              </ul>
              <div className="mt-9">
                <PrimaryCta href={UNIVERSITY_MAIL}>Request partnership info</PrimaryCta>
              </div>
            </div>
            <div className="flex justify-center lg:order-1 lg:justify-start">
              <AudienceMetricMockup variant="university" />
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
