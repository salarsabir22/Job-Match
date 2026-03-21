"use client"

import Link from "next/link"
import { Reveal } from "@/components/motion/waitlist-motion"

const CONTACT = "mailto:hello@jobmatch.app"
const RECRUITER = "mailto:hello@jobmatch.app?subject=Recruiter%20inquiry"
const UNIVERSITY = "mailto:hello@jobmatch.app?subject=University%20partnership"
const YEAR = new Date().getFullYear()

const focusRing =
  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050506]"

function ExternalArrow({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <span className="text-white/35 transition-colors duration-200 group-hover:text-white/60" aria-hidden>
        ↗
      </span>
    </span>
  )
}

const exploreLinks = [
  { href: "#early-access", label: "Join waitlist" },
  { href: "#usp-heading", label: "Why JobMatch" },
  { href: "#waitlist-faq-heading", label: "FAQ" },
  { href: "#recruiters-heading", label: "For recruiters" },
  { href: "#universities-heading", label: "For universities" },
] as const

const socialLinks = [
  { href: "https://www.linkedin.com", label: "LinkedIn" },
  { href: "https://x.com", label: "X" },
  { href: "https://www.instagram.com", label: "Instagram" },
] as const

export function WaitlistFooter() {
  return (
    <footer
      role="contentinfo"
      aria-labelledby="footer-brand-heading"
      className="footer-premium-surface relative w-full overflow-hidden text-white"
    >
      {/* Top hairline — full viewport width */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-white/[0.18] to-transparent"
        aria-hidden
      />

      {/* Ambient wordmark — decorative, never steals focus */}
      <div
        className="pointer-events-none absolute -bottom-[18%] left-1/2 z-0 -translate-x-1/2 select-none whitespace-nowrap font-semibold tracking-[-0.06em] text-white/[0.022]"
        style={{ fontSize: "clamp(5rem, 22vw, 16rem)" }}
        aria-hidden
      >
        jobmatch
      </div>

      <div className="relative z-10 w-full px-[clamp(1.25rem,5vw,4.5rem)]">
        {/* ── Brand row: full-width flex, no max-width cage ─────────────── */}
        <Reveal className="flex w-full flex-col gap-10 border-b border-white/[0.07] py-14 sm:gap-12 sm:py-16 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl lg:max-w-[min(100%,36rem)]">
            <p id="footer-brand-heading" className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30">
              JobMatch
            </p>
            <Link
              href="/"
              className={`${focusRing} mt-3 inline-block text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-[-0.045em] text-white`}
            >
              jobmatch<span className="text-white/35">.</span>
            </Link>
            <p className="mt-5 text-pretty text-[15px] leading-[1.65] text-white/48 sm:text-base sm:leading-relaxed">
              Early-access hiring for students, recruiters, and university partners. Swipe with context, match with
              intent — chat opens only when both sides opt in, tied to the role.
            </p>
          </div>

          <div className="flex w-full flex-col gap-8 sm:flex-row sm:items-stretch sm:justify-between sm:gap-10 lg:w-auto lg:max-w-none lg:flex-row lg:items-end lg:gap-16 xl:gap-24">
            <div className="min-w-0 sm:text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30">Contact</p>
              <a
                href={CONTACT}
                className={`${focusRing} mt-3 block w-fit text-[17px] font-medium tracking-[-0.02em] text-white transition-colors hover:text-white/90 sm:ml-auto`}
              >
                hello@jobmatch.app
              </a>
              <p className="mt-2 max-w-xs text-[13px] leading-snug text-white/38 sm:ml-auto sm:text-right">
                We read every message — typically within two to three business days.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:items-end">
              <a
                href="#early-access"
                className={`${focusRing} inline-flex h-12 w-full items-center justify-center rounded-full bg-white px-8 text-[14px] font-semibold tracking-[-0.02em] text-[#050506] transition-[transform,box-shadow] duration-200 hover:bg-white/92 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12)] active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 sm:w-auto`}
              >
                Join the waitlist
              </a>
              <p className="text-center text-[11px] text-white/30 sm:text-right">One email when you&apos;re in. Unsubscribe anytime.</p>
            </div>
          </div>
        </Reveal>

        {/* ── Link grids: true full-width columns ───────────────────────── */}
        <Reveal className="grid w-full grid-cols-1 gap-12 border-b border-white/[0.07] py-14 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-14 xl:grid-cols-12 xl:gap-8 xl:py-16">
          <section className="xl:col-span-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/32">About</h3>
            <p className="mt-5 text-pretty text-[14px] leading-[1.7] text-white/48 sm:text-[15px]">
              Less noise, more signal. JobMatch is built for early-career pipelines where spray-and-pray inboxes
              don&apos;t scale — for students who want clarity and teams who want intent they can trust.
            </p>
          </section>

          <nav aria-label="Explore JobMatch" className="xl:col-span-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/32">Explore</h3>
            <ul className="mt-5 flex flex-col gap-3">
              {exploreLinks.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className={`${focusRing} text-[14px] text-white/45 transition-colors duration-200 hover:text-white/90`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <section className="xl:col-span-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/32">Partners</h3>
            <ul className="mt-5 flex flex-col gap-3 text-[14px]">
              <li>
                <a href={RECRUITER} className={`${focusRing} text-white/45 transition-colors hover:text-white/90`}>
                  Recruiter early access
                </a>
              </li>
              <li>
                <a href={UNIVERSITY} className={`${focusRing} text-white/45 transition-colors hover:text-white/90`}>
                  University partnerships
                </a>
              </li>
            </ul>
          </section>

          <section className="xl:col-span-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/32">Availability</h3>
            <ul className="mt-5 space-y-3 text-[14px] leading-[1.55] text-white/45">
              <li>
                <span className="text-white/55">Waitlist:</span> open — join anytime
              </li>
              <li>
                <span className="text-white/55">Replies:</span> usually 2–3 business days
              </li>
              <li>
                <span className="text-white/55">Invites:</span> rolling waves
              </li>
            </ul>
          </section>

          <div className="flex flex-col gap-10 sm:flex-row sm:gap-12 xl:col-span-2 xl:flex-col xl:gap-8">
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/32">Where</h3>
              <p className="mt-5 text-[14px] leading-[1.65] text-white/45">
                Remote-first
                <br />
                US · EU-friendly hours for partners
              </p>
            </section>

            <nav aria-label="Social media">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/32">Follow</h3>
              <ul className="mt-5 flex flex-col gap-3">
                {socialLinks.map((s) => (
                  <li key={s.href}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group ${focusRing} text-[14px] text-white/45 transition-colors hover:text-white/90`}
                    >
                      <ExternalArrow label={s.label} />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </Reveal>

        {/* ── Sub-footer: full-width bar ─────────────────────────────────── */}
        <Reveal className="grid w-full grid-cols-1 gap-6 py-10 text-[12px] sm:py-12 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-4">
          <p className="text-white/32 tabular-nums tracking-[-0.01em] lg:justify-self-start">
            © {YEAR} JobMatch. All rights reserved.
          </p>
          <p className="text-center text-[11px] font-medium uppercase tracking-[0.35em] text-white/22 lg:px-6">
            Swipe · Match · Hire
          </p>
          <nav
            aria-label="Legal"
            className="flex flex-wrap items-center gap-x-8 gap-y-2 lg:justify-self-end"
          >
            <Link
              href="/privacy"
              className={`${focusRing} text-white/35 transition-colors hover:text-white/70`}
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className={`${focusRing} text-white/35 transition-colors hover:text-white/70`}
            >
              Terms
            </Link>
          </nav>
        </Reveal>
      </div>
    </footer>
  )
}
