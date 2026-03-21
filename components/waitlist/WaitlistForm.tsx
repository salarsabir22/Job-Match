"use client"

import { useState, type FormEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion, useAnimation, useReducedMotion } from "framer-motion"
import { StaggerChild, StaggerMount, easeOutExpo } from "@/components/motion/waitlist-motion"
import { WaitlistAudienceSections } from "@/components/waitlist/AudienceSections"
import { WaitlistFaq } from "@/components/waitlist/WaitlistFaq"
import { WaitlistFooter } from "@/components/waitlist/WaitlistFooter"
import { WaitlistUspSections } from "@/components/waitlist/UspSections"
import { HeroCanvas } from "@/components/waitlist/HeroCanvas"

const CONTACT_MAIL = "mailto:hello@jobmatch.app"

const formShake = {
  x: [0, -10, 10, -8, 8, -4, 4, 0],
  transition: { duration: 0.45, ease: "easeInOut" as const },
}

/** Stock portraits (Unsplash) — face-cropped, stable IDs */
const WAITLIST_FACE_AVATARS: { src: string; alt: string }[] = [
  {
    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&crop=faces&w=128&h=128&q=80",
    alt: "Student on the JobMatch waitlist",
  },
  {
    src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&crop=faces&w=128&h=128&q=80",
    alt: "Student on the JobMatch waitlist",
  },
  {
    src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&crop=faces&w=128&h=128&q=80",
    alt: "Student on the JobMatch waitlist",
  },
  {
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&crop=faces&w=128&h=128&q=80",
    alt: "Student on the JobMatch waitlist",
  },
]

export function WaitlistForm() {
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const formControls = useAnimation()

  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runShake = () => {
    if (!reduceMotion) void formControls.start(formShake)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const v = email.trim().toLowerCase()
    if (!v) {
      setError("Email is required.")
      runShake()
      return
    }
    if (!v.includes("@") || !v.includes(".")) {
      setError("Enter a valid email.")
      runShake()
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: v }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }

      if (!res.ok) {
        throw new Error(data.error || "Failed to join waitlist.")
      }

      setSubmitting(false)
      setSubmitSuccess(true)
      window.setTimeout(() => {
        router.push("/waitlist?success=1")
      }, reduceMotion ? 200 : 900)
    } catch (err: unknown) {
      setSubmitting(false)
      const message = err instanceof Error ? err.message : "Failed to join waitlist."
      setError(message)
      runShake()
    }
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col selection:bg-white/10">

      {/* ── Hero (full-bleed black) — anchor for footer / deep links ───────── */}
      <div id="early-access" className="relative flex min-h-screen scroll-mt-0 flex-col bg-black text-white">
        {/* Three.js canvas fills the whole hero */}
        <HeroCanvas />

        {/* Radial vignette so edges fade into deeper black */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, rgba(0,0,0,0.55) 100%)",
          }}
          aria-hidden
        />

        {/* Bottom fade into white below */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-32"
          style={{ background: "linear-gradient(to bottom, transparent, #000 100%)" }}
          aria-hidden
        />

        {/* Header — sits on top of canvas */}
        <motion.header
          className="relative z-10 mx-auto flex w-full max-w-[1120px] items-center justify-between gap-6 px-5 pt-7 sm:px-10 sm:pt-9 lg:px-12"
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, ease: easeOutExpo }}
        >
          <Link
            href="/"
            className="text-lg sm:text-[1.15rem] font-semibold tracking-[-0.02em] lowercase text-white/90 hover:text-white transition-colors duration-300"
          >
            jobmatch<span className="opacity-50">.</span>
          </Link>
          <a
            href={CONTACT_MAIL}
            className="text-[13px] font-medium text-white/40 hover:text-white/80 transition-colors duration-300"
          >
            Contact
          </a>
        </motion.header>

        {/* Hero content — centered in the remaining space */}
        <StaggerMount className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-24 pt-8 text-center sm:px-10 sm:pb-28 lg:px-12">
          <StaggerChild>
            <p className="text-[11px] sm:text-xs font-medium uppercase tracking-[0.28em] text-white/38">Early access</p>
            <h1 className="mx-auto mt-6 max-w-[13ch] text-balance font-heading text-[clamp(2.8rem,7.5vw,5rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-white">
              Students.&nbsp;Jobs.<br className="hidden sm:block" /> Matches.
            </h1>
            <p className="mx-auto mt-6 max-w-md text-base font-normal leading-[1.6] text-white/45 sm:mt-8 sm:text-[1.2rem]">
              Swipe on roles. Match with intent. Chat only when both sides are in.
            </p>
          </StaggerChild>

          <StaggerChild>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:mt-12 sm:flex-row sm:gap-5">
              <div className="flex items-center pl-1">
                {WAITLIST_FACE_AVATARS.map((person, i) => (
                  <div
                    key={person.src}
                    className="relative -ml-3 size-10 overflow-hidden rounded-full border-2 border-white/20 bg-white/10 first:ml-0 sm:size-11"
                    style={{ zIndex: i + 1 }}
                  >
                    <Image
                      src={person.src}
                      alt={person.alt}
                      width={88}
                      height={88}
                      className="size-full object-cover"
                      sizes="44px"
                    />
                  </div>
                ))}
              </div>
              <p className="max-w-[240px] text-center text-[13px] font-medium leading-snug tracking-[-0.01em] text-white/40 sm:text-left sm:text-sm sm:max-w-none">
                Join <span className="font-semibold text-white/80">600+</span> students and recruiters
              </p>
            </div>
          </StaggerChild>

          <StaggerChild>
            <div className="mx-auto mt-10 w-full max-w-lg sm:mt-12">
              <AnimatePresence mode="wait">
                {submitSuccess ? (
                  <motion.div
                    key="success"
                    role="status"
                    aria-live="polite"
                    initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.94, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 320, damping: 26, mass: 0.9 }
                    }
                    className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.12] bg-white/[0.06] px-6 py-8 backdrop-blur-sm"
                  >
                    <motion.div
                      className="flex size-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_24px_-4px_rgba(16,185,129,0.55)]"
                      initial={reduceMotion ? false : { scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 400, damping: 18, delay: 0.06 }
                      }
                      aria-hidden
                    >
                      <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                        <motion.path
                          d="M6 12l4 4 8-9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={reduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: reduceMotion ? 0 : 0.45, ease: easeOutExpo, delay: 0.12 }}
                        />
                      </svg>
                    </motion.div>
                    <div className="text-center">
                      <p className="text-[16px] font-semibold tracking-[-0.02em] text-white">You&apos;re on the list</p>
                      <p className="mt-1.5 text-[13px] text-white/45">Taking you to confirmation…</p>
                    </div>
                    <motion.div
                      className="mt-1 flex gap-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: reduceMotion ? 0 : 0.35 }}
                      aria-hidden
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="size-1.5 rounded-full bg-white/35"
                          animate={
                            reduceMotion
                              ? {}
                              : { opacity: [0.35, 1, 0.35], scale: [1, 1.15, 1] }
                          }
                          transition={{
                            duration: 0.9,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={submit}
                    animate={formControls}
                    initial={{ x: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                    transition={{ duration: reduceMotion ? 0 : 0.25 }}
                    className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:gap-2"
                  >
                    <label htmlFor="waitlist-email" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="waitlist-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      type="email"
                      autoComplete="email"
                      disabled={submitting}
                      className="min-h-[3.25rem] w-full min-w-0 flex-1 rounded-full border border-white/[0.15] bg-white/[0.07] px-5 text-[15px] text-white outline-none backdrop-blur-sm transition-all duration-300 placeholder:text-white/30 focus:border-white/35 focus:bg-white/[0.11] focus:ring-2 focus:ring-white/[0.08] disabled:opacity-50 sm:px-6"
                    />
                    <motion.button
                      type="submit"
                      disabled={submitting}
                      className="relative min-h-[3.25rem] shrink-0 overflow-hidden rounded-full bg-white px-8 text-[15px] font-semibold tracking-[-0.01em] text-black transition-colors duration-300 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none sm:min-w-[10.5rem]"
                      animate={
                        submitting && !reduceMotion
                          ? { scale: [1, 1.02, 1] }
                          : { scale: 1 }
                      }
                      transition={
                        submitting && !reduceMotion
                          ? { duration: 0.85, repeat: Infinity, ease: "easeInOut" }
                          : { duration: 0.2 }
                      }
                      whileTap={reduceMotion || submitting ? undefined : { scale: 0.98 }}
                    >
                      <span className={submitting ? "opacity-90" : ""}>
                        {submitting ? "Joining…" : "Join waitlist"}
                      </span>
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {error && !submitSuccess ? (
                  <motion.p
                    key={error}
                    role="alert"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.22, ease: easeOutExpo }}
                    className="mx-auto mt-4 max-w-lg text-center text-sm text-red-400"
                  >
                    {error}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>
          </StaggerChild>

          <StaggerChild>
            <p className="mx-auto mt-4 max-w-sm text-[12px] leading-relaxed text-white/28 sm:text-[13px]">
              We&apos;ll email you once when early access opens. Unsubscribe anytime.
            </p>
          </StaggerChild>
        </StaggerMount>
      </div>

      {/* ── Below-fold white sections ────────────────────────────────── */}
      <main className="flex-1 w-full flex flex-col bg-white text-black">
        <WaitlistUspSections />
        <WaitlistAudienceSections />
        <WaitlistFaq />
      </main>

      <WaitlistFooter />
    </div>
  )
}
