"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import {
  Zap,
  MessageCircle,
  Users,
  BarChart3,
  FileText,
  Bell,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Star,
  Briefcase,
  GraduationCap,
  Building2,
  Heart,
  Menu,
  X,
  TrendingUp,
  Shield,
  Globe,
  Layers,
  Target,
  Sparkles,
} from "lucide-react"

/* ─── Shared primitives ──────────────────────────────────────────── */
function OrangeBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FAFAFA]/30 bg-[#FAFAFA]/10 font-data text-xs tracking-widest uppercase text-[#FAFAFA]">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FAFAFA] opacity-60" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FAFAFA]" />
      </span>
      {children}
    </span>
  )
}

function PrimaryButton({
  href,
  children,
  className = "",
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#525252] to-[#FAFAFA] text-black font-body font-semibold text-sm tracking-wide shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)] hover:scale-105 hover:shadow-[0_0_35px_-5px_rgba(255,255,255,0.7)] transition-all duration-300 ${className}`}
    >
      {children}
    </Link>
  )
}

function OutlineButton({
  href,
  children,
  className = "",
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/20 text-black font-body font-semibold text-sm tracking-wide hover:border-black/100 hover:bg-white/5 transition-all duration-300 ${className}`}
    >
      {children}
    </Link>
  )
}

/* ─── Navbar ─────────────────────────────────────────────────────── */
function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  const links = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Community", href: "#community" },
    { label: "For Recruiters", href: "#recruiters" },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass border-b border-black/10 py-3" : "py-5"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-5 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#525252] to-[#FAFAFA] flex items-center justify-center shadow-[0_0_15px_-3px_rgba(255,255,255,0.6)]">
            <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
          </div>
          <span className="font-heading font-bold text-lg tracking-tight">
            Job<span className="gradient-text">Match</span>
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="font-data text-xs tracking-wider uppercase text-neutral-700 hover:text-black transition-colors duration-200"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="font-body text-sm text-neutral-700 hover:text-black transition-colors duration-200 px-4 py-2"
          >
            Log In
          </Link>
          <PrimaryButton href="/signup">Get Started Free</PrimaryButton>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-neutral-700 hover:text-black transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden glass border-t border-black/10 px-5 py-6 flex flex-col gap-5">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="font-data text-xs tracking-widest uppercase text-neutral-700 hover:text-black transition-colors"
            >
              {l.label}
            </a>
          ))}
          <div className="flex flex-col gap-3 pt-2 border-t border-black/10">
            <Link
              href="/login"
              className="text-center font-body text-sm border border-white/20 rounded-full py-3 hover:bg-white/5 transition-all"
            >
              Log In
            </Link>
            <PrimaryButton href="/signup" className="justify-center">
              Get Started Free
            </PrimaryButton>
          </div>
        </div>
      )}
    </header>
  )
}

/* ─── Animated Orb ───────────────────────────────────────────────── */
function HeroOrb() {
  return (
    <div className="relative flex items-center justify-center w-[280px] h-[280px] md:w-[420px] md:h-[420px]">
      {/* Ambient background glow */}
      <div className="absolute inset-0 rounded-full bg-[#FAFAFA] opacity-5 blur-[80px] animate-glow-pulse" />

      {/* Outer orbit ring */}
      <div
        className="absolute inset-0 rounded-full border border-[#FAFAFA]/15 animate-orbit-cw"
        style={{ borderStyle: "dashed" }}
      />

      {/* Middle orbit ring */}
      <div
        className="absolute rounded-full border border-[#D4D4D4]/20 animate-orbit-ccw"
        style={{ inset: "14%", borderStyle: "dashed" }}
      />

      {/* Core sphere */}
      <div className="relative z-10 w-[110px] h-[110px] md:w-[160px] md:h-[160px] rounded-full bg-gradient-to-br from-[#525252] via-[#FAFAFA] to-[#D4D4D4] shadow-[0_0_60px_-5px_rgba(255,255,255,0.8)] animate-float flex items-center justify-center">
        <Zap className="w-10 h-10 md:w-16 md:h-16 text-black drop-shadow-lg" strokeWidth={1.5} />
      </div>

      {/* Orbit dots */}
      <div className="absolute inset-0 animate-orbit-cw">
        <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#FAFAFA] shadow-[0_0_10px_2px_rgba(255,255,255,0.8)]" />
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-[#D4D4D4] shadow-[0_0_10px_2px_rgba(255,214,0,0.8)]" />
      </div>
      <div className="absolute animate-orbit-ccw" style={{ inset: "14%" }}>
        <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#525252] shadow-[0_0_8px_2px_rgba(255,255,255,0.8)]" />
      </div>
    </div>
  )
}

/* ─── Floating stat card ─────────────────────────────────────────── */
function StatCard({
  value,
  label,
  icon: Icon,
  className = "",
}: {
  value: string
  label: string
  icon: React.ElementType
  className?: string
}) {
  return (
    <div
      className={`glass-dark rounded-2xl px-4 py-3 flex items-center gap-3 shadow-[0_0_25px_-8px_rgba(255,255,255,0.25)] ${className}`}
    >
      <div className="w-9 h-9 rounded-lg bg-[#525252]/20 border border-[#525252]/40 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-[#FAFAFA]" />
      </div>
      <div>
        <p className="font-data font-medium text-sm text-black leading-none">{value}</p>
        <p className="font-body text-[11px] text-neutral-700 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

/* ─── Hero ───────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
      {/* Grid texture */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />

      {/* Radial blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#FAFAFA] opacity-[0.05] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-[#525252] opacity-[0.06] blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-0">
          {/* Left – Copy */}
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
            <OrangeBadge>Now live · 10,000+ students matched</OrangeBadge>

            <h1 className="font-heading font-bold text-5xl sm:text-6xl md:text-7xl leading-[1.05] mt-7 mb-6 max-w-xl">
              Swipe Right
              <br />
              on Your{" "}
              <span className="gradient-text">Dream Career</span>
            </h1>

            <p className="font-body text-neutral-700 text-base md:text-lg leading-relaxed max-w-md mb-10">
              The first Tinder-style job platform where students and recruiters connect through
              mutual interest. No cold emails. No ghosting. Just{" "}
              <span className="text-black font-medium">real matches</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <PrimaryButton href="/signup" className="justify-center sm:justify-start">
                Start Swiping Free <ArrowRight className="w-4 h-4" />
              </PrimaryButton>
              <OutlineButton href="/signup?role=recruiter" className="justify-center sm:justify-start">
                <Briefcase className="w-4 h-4" /> Post a Job
              </OutlineButton>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3 mt-8">
              <div className="flex -space-x-2">
                {["#525252", "#FAFAFA", "#D4D4D4", "#525252", "#FAFAFA"].map((c, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-[#030304] flex items-center justify-center text-[10px] font-bold text-black"
                    style={{ background: c, zIndex: 5 - i }}
                  >
                    {["A", "B", "C", "D", "E"][i]}
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-[#D4D4D4] text-[#D4D4D4]" />
                  ))}
                </div>
                <p className="font-body text-[11px] text-neutral-700">Loved by 10k+ students</p>
              </div>
            </div>
          </div>

          {/* Right – Orb + floating cards */}
          <div className="flex-1 relative flex items-center justify-center min-h-[360px] md:min-h-[500px] w-full">
            <HeroOrb />

            {/* Floating stat cards */}
            <div className="absolute top-0 right-4 md:right-8 animate-float-card">
              <StatCard value="10,247" label="Active Students" icon={GraduationCap} />
            </div>
            <div className="absolute bottom-8 left-2 md:left-0 animate-float-card-2">
              <StatCard value="584" label="Top Companies" icon={Building2} />
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 -right-2 md:right-4 animate-float-card-3">
              <StatCard value="5,312" label="Mutual Matches" icon={Heart} />
            </div>
            <div className="absolute bottom-0 right-8 md:right-16 animate-float-card-4">
              <StatCard value="200+" label="Daily Jobs" icon={TrendingUp} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Stats Bar ──────────────────────────────────────────────────── */
const STATS = [
  { value: "10K+", label: "Students Registered" },
  { value: "584", label: "Hiring Companies" },
  { value: "5.3K", label: "Mutual Matches" },
  { value: "200+", label: "Jobs Posted Daily" },
  { value: "92%", label: "Match Satisfaction" },
  { value: "48h", label: "Avg. Time to Match" },
]

function StatsBar() {
  return (
    <div className="border-y border-black/10 bg-white py-5 overflow-hidden">
      <div className="flex animate-ticker" style={{ width: "max-content" }}>
        {[...STATS, ...STATS].map((s, i) => (
          <div key={i} className="flex items-center gap-3 px-10 border-r border-black/10 last:border-r-0 flex-shrink-0">
            <span className="font-heading font-bold text-2xl gradient-text">{s.value}</span>
            <span className="font-data text-[11px] tracking-wider uppercase text-neutral-700 whitespace-nowrap">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── How It Works ───────────────────────────────────────────────── */
const STEPS = [
  {
    n: "01",
    icon: FileText,
    title: "Build Your Profile",
    desc: "Upload your resume, add skills and a bio. Recruiters see your full story—not just a keyword list.",
    studentNote: "Resume, skills, education, links",
    recruiterNote: "Company, logo, team culture, job focus",
  },
  {
    n: "02",
    icon: Zap,
    title: "Swipe & Discover",
    desc: "Students swipe on jobs. Recruiters swipe on candidates. Both sides express interest before anything happens.",
    studentNote: "Browse curated job cards",
    recruiterNote: "See matched student profiles",
  },
  {
    n: "03",
    icon: MessageCircle,
    title: "Match & Connect",
    desc: "When both sides swipe right, a chat unlocks. No cold emails. No spam. Only real, mutual interest.",
    studentNote: "Chat with recruiters directly",
    recruiterNote: "Shortlist, archive, or hire",
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 bg-white relative">
      <div className="absolute top-0 left-1/3 w-[400px] h-[400px] bg-[#525252] opacity-[0.04] blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5">
        <div className="text-center mb-20">
          <OrangeBadge>How It Works</OrangeBadge>
          <h2 className="font-heading font-bold text-4xl md:text-5xl mt-6 mb-4">
            Three steps to your{" "}
            <span className="gradient-text">next opportunity</span>
          </h2>
          <p className="font-body text-neutral-700 text-lg max-w-xl mx-auto">
            Designed like your favorite app. Built for your career.
          </p>
        </div>

        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#FAFAFA] via-[#525252]/40 to-transparent hidden sm:block" />

          <div className="flex flex-col gap-16">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              const isEven = i % 2 === 0
              return (
                <div
                  key={step.n}
                  className={`relative flex flex-col md:flex-row items-center gap-8 ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Node */}
                  <div className="relative z-10 flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-[#525252] to-[#FAFAFA] flex items-center justify-center shadow-[0_0_30px_-5px_rgba(255,255,255,0.7)]">
                    <Icon className="w-6 h-6 text-black" />
                  </div>

                  {/* Card */}
                  <div
                    className={`flex-1 max-w-md group bg-white border border-black/10 rounded-2xl p-7 hover:-translate-y-1 hover:border-[#FAFAFA]/40 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.2)] transition-all duration-300 ${
                      isEven ? "md:mr-auto" : "md:ml-auto"
                    }`}
                  >
                    {/* Corner accents */}
                    <span className="absolute top-3 left-3 w-5 h-5 border-t border-l border-[#FAFAFA]/50 rounded-tl-sm" />
                    <span className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-[#FAFAFA]/50 rounded-br-sm" />

                    <span className="font-data text-[11px] tracking-widest text-[#FAFAFA] uppercase">
                      Step {step.n}
                    </span>
                    <h3 className="font-heading font-semibold text-xl mt-2 mb-3">{step.title}</h3>
                    <p className="font-body text-neutral-700 text-sm leading-relaxed mb-5">
                      {step.desc}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FAFAFA]/10 border border-[#FAFAFA]/20">
                        <GraduationCap className="w-3.5 h-3.5 text-[#FAFAFA] flex-shrink-0" />
                        <span className="font-data text-[10px] tracking-wide text-[#FAFAFA]">
                          {step.studentNote}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#D4D4D4]/10 border border-[#D4D4D4]/20">
                        <Building2 className="w-3.5 h-3.5 text-[#D4D4D4] flex-shrink-0" />
                        <span className="font-data text-[10px] tracking-wide text-[#D4D4D4]">
                          {step.recruiterNote}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Features ───────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Zap,
    title: "Smart Swipe Engine",
    desc: "Swipe through curated job cards or candidate profiles. Mutual interest unlocks the conversation. Zero unsolicited contact.",
    color: "#FAFAFA",
  },
  {
    icon: MessageCircle,
    title: "Real-time Chat",
    desc: "Powered by Supabase Realtime. Every matched conversation updates instantly—no refresh required.",
    color: "#525252",
  },
  {
    icon: Users,
    title: "Community Channels",
    desc: "Join interest-based groups—Tech, Design, Finance, and more. Connect with peers and get early access to opportunities.",
    color: "#D4D4D4",
  },
  {
    icon: BarChart3,
    title: "Recruiter Analytics",
    desc: "Track swipes, match rates, and active conversations per job posting. Make data-driven hiring decisions.",
    color: "#FAFAFA",
  },
  {
    icon: FileText,
    title: "Resume Upload",
    desc: "Students upload their PDF resume once. It travels with every swipe—visible to matched recruiters on demand.",
    color: "#525252",
  },
  {
    icon: Bell,
    title: "Live Notifications",
    desc: "Get notified the moment someone swipes right on you. No more refreshing—your next opportunity arrives in real time.",
    color: "#D4D4D4",
  },
]

function Features() {
  return (
    <section id="features" className="py-28 bg-white relative">
      <div className="absolute top-1/2 right-0 w-[350px] h-[350px] bg-[#D4D4D4] opacity-[0.03] blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5">
        <div className="text-center mb-16">
          <OrangeBadge>Platform Features</OrangeBadge>
          <h2 className="font-heading font-bold text-4xl md:text-5xl mt-6 mb-4">
            Everything you need,{" "}
            <span className="gradient-text">nothing you don&apos;t</span>
          </h2>
          <p className="font-body text-neutral-700 text-lg max-w-xl mx-auto">
            An MVP built for speed. No fluff, no bloat—just the tools that matter.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="group relative bg-white border border-black/10 rounded-2xl p-7 overflow-hidden hover:-translate-y-1.5 hover:border-[#FAFAFA]/30 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.15)] transition-all duration-300"
              >
                {/* Watermark icon */}
                <Icon
                  className="absolute -bottom-4 -right-4 w-24 h-24 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500"
                  style={{ color: f.color }}
                />

                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 border"
                  style={{
                    background: `${f.color}18`,
                    borderColor: `${f.color}40`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: f.color }} />
                </div>

                <h3 className="font-heading font-semibold text-lg mb-2">{f.title}</h3>
                <p className="font-body text-neutral-700 text-sm leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─── Audience Split ─────────────────────────────────────────────── */
const STUDENT_PERKS = [
  "Swipe through curated job & internship cards",
  "Build a rich profile with resume, skills & links",
  "Only chat with recruiters who matched you first",
  "Save jobs and revisit them anytime",
  "Join community channels for your field",
]
const RECRUITER_PERKS = [
  "Post jobs in under 2 minutes",
  "Browse student profiles and swipe on top candidates",
  "Match unlocks a direct chat channel",
  "Shortlist, archive, or advance candidates",
  "Track job-level swipe and match analytics",
]

function AudienceSplit() {
  return (
    <section className="py-28 bg-white" id="recruiters">
      <div className="max-w-7xl mx-auto px-5">
        <div className="text-center mb-16">
          <OrangeBadge>Who It&apos;s For</OrangeBadge>
          <h2 className="font-heading font-bold text-4xl md:text-5xl mt-6">
            Built for both sides of the{" "}
            <span className="gradient-text">hiring equation</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Students */}
          <div className="relative group bg-white border border-black/10 rounded-2xl p-8 overflow-hidden hover:border-[#FAFAFA]/30 hover:shadow-[0_0_50px_-10px_rgba(255,255,255,0.15)] transition-all duration-300">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#FAFAFA] opacity-[0.04] blur-[60px] rounded-full pointer-events-none" />

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#FAFAFA]/15 border border-[#FAFAFA]/30 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-[#FAFAFA]" />
              </div>
              <div>
                <span className="font-data text-[10px] tracking-widest uppercase text-[#FAFAFA]">
                  For Students
                </span>
                <h3 className="font-heading font-semibold text-xl">Launch your career</h3>
              </div>
            </div>

            <ul className="space-y-3.5 mb-8">
              {STUDENT_PERKS.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#FAFAFA] mt-0.5 flex-shrink-0" />
                  <span className="font-body text-neutral-700 text-sm">{p}</span>
                </li>
              ))}
            </ul>

            <PrimaryButton href="/signup" className="w-full justify-center">
              Join as a Student <ChevronRight className="w-4 h-4" />
            </PrimaryButton>
          </div>

          {/* Recruiters */}
          <div className="relative group bg-white border border-black/10 rounded-2xl p-8 overflow-hidden hover:border-[#D4D4D4]/30 hover:shadow-[0_0_50px_-10px_rgba(255,214,0,0.1)] transition-all duration-300">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4D4D4] opacity-[0.03] blur-[60px] rounded-full pointer-events-none" />

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#D4D4D4]/10 border border-[#D4D4D4]/25 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-[#D4D4D4]" />
              </div>
              <div>
                <span className="font-data text-[10px] tracking-widest uppercase text-[#D4D4D4]">
                  For Recruiters
                </span>
                <h3 className="font-heading font-semibold text-xl">Find top talent fast</h3>
              </div>
            </div>

            <ul className="space-y-3.5 mb-8">
              {RECRUITER_PERKS.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#D4D4D4] mt-0.5 flex-shrink-0" />
                  <span className="font-body text-neutral-700 text-sm">{p}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup?role=recruiter"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-full border-2 border-[#D4D4D4]/40 text-[#D4D4D4] font-body font-semibold text-sm tracking-wide hover:bg-[#D4D4D4]/10 hover:border-[#D4D4D4]/70 hover:shadow-[0_0_20px_-5px_rgba(255,214,0,0.3)] transition-all duration-300"
            >
              Join as a Recruiter <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Community ──────────────────────────────────────────────────── */
const CHANNELS = [
  { name: "Tech & Engineering", members: 2140, icon: "⚡", color: "#FAFAFA" },
  { name: "Product & Design", members: 987, icon: "🎨", color: "#D4D4D4" },
  { name: "Finance & Fintech", members: 1342, icon: "💹", color: "#525252" },
  { name: "Marketing & Growth", members: 754, icon: "📈", color: "#FAFAFA" },
  { name: "Data & AI", members: 1890, icon: "🤖", color: "#D4D4D4" },
  { name: "Startups & VC", members: 631, icon: "🚀", color: "#525252" },
]

function Community() {
  return (
    <section id="community" className="py-28 bg-white relative overflow-hidden">
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-[#FAFAFA] opacity-[0.04] blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5">
        <div className="flex flex-col lg:flex-row items-start gap-16">
          {/* Left copy */}
          <div className="lg:w-2/5 flex-shrink-0">
            <OrangeBadge>Community</OrangeBadge>
            <h2 className="font-heading font-bold text-4xl md:text-5xl mt-6 mb-5">
              Your tribe is{" "}
              <span className="gradient-text">already here</span>
            </h2>
            <p className="font-body text-neutral-700 text-base leading-relaxed mb-8">
              Join interest-based channels where students share opportunities, industry insights,
              and career advice. Get warm introductions before you even start swiping.
            </p>
            <ul className="space-y-4 mb-10">
              {[
                { icon: Globe, text: "6+ interest-based channels" },
                { icon: Shield, text: "Moderated, spam-free environment" },
                { icon: Sparkles, text: "Early access job drops for members" },
              ].map((item) => (
                <li key={item.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FAFAFA]/15 border border-[#FAFAFA]/30 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-[#FAFAFA]" />
                  </div>
                  <span className="font-body text-sm text-neutral-700">{item.text}</span>
                </li>
              ))}
            </ul>
            <PrimaryButton href="/signup">
              Browse Communities <ArrowRight className="w-4 h-4" />
            </PrimaryButton>
          </div>

          {/* Right – channel grid */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CHANNELS.map((ch) => (
              <div
                key={ch.name}
                className="group flex items-center gap-4 bg-white border border-black/10 rounded-xl p-4 hover:-translate-y-1 hover:border-[#FAFAFA]/30 hover:shadow-[0_0_30px_-10px_rgba(255,255,255,0.2)] transition-all duration-300 cursor-pointer"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: `${ch.color}18`, border: `1px solid ${ch.color}30` }}
                >
                  {ch.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-medium text-sm truncate">{ch.name}</p>
                  <p className="font-data text-[11px] text-neutral-700">
                    {ch.members.toLocaleString()} members
                  </p>
                </div>
                <ChevronRight
                  className="w-4 h-4 text-black/20 group-hover:text-[#FAFAFA] transition-colors"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Testimonials ───────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    quote:
      "I landed my first internship in 3 days. The recruiter messaged me the same day we matched—no LinkedIn cold DM needed.",
    name: "Ava T.",
    role: "CS Student, Stanford",
    initials: "AT",
    color: "#FAFAFA",
  },
  {
    quote:
      "We hired two interns last quarter entirely through JobMatch. The mutual match filter cut our screening time by 60%.",
    name: "Marcus L.",
    role: "Head of Talent, Fintech Startup",
    initials: "ML",
    color: "#D4D4D4",
  },
  {
    quote:
      "The community channels alone are worth signing up. I got a referral through the Tech channel before I even swiped on the job.",
    name: "Priya S.",
    role: "Product Design Student",
    initials: "PS",
    color: "#525252",
  },
]

function Testimonials() {
  return (
    <section className="py-28 bg-white relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#FAFAFA] opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5">
        <div className="text-center mb-16">
          <OrangeBadge>Real Stories</OrangeBadge>
          <h2 className="font-heading font-bold text-4xl md:text-5xl mt-6">
            Matches that{" "}
            <span className="gradient-text">changed careers</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="glass-dark rounded-2xl p-7 border border-black/10 hover:border-white/15 hover:-translate-y-1 transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#D4D4D4] text-[#D4D4D4]" />
                ))}
              </div>

              <p className="font-body text-neutral-700 text-sm leading-relaxed mb-6 italic">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3 pt-5 border-t border-black/10">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-black flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${t.color}, #030304)` }}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="font-heading font-medium text-sm">{t.name}</p>
                  <p className="font-data text-[11px] text-neutral-700">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Trust Strip ────────────────────────────────────────────────── */
const TRUST = [
  { icon: Shield, label: "End-to-end encrypted" },
  { icon: Target, label: "Mutual match only" },
  { icon: Layers, label: "Zero cold outreach" },
  { icon: Globe, label: "Global opportunities" },
]

function TrustStrip() {
  return (
    <div className="border-y border-black/10 bg-white py-6">
      <div className="max-w-7xl mx-auto px-5 flex flex-wrap justify-center gap-8 md:gap-12">
        {TRUST.map((t) => (
          <div key={t.label} className="flex items-center gap-2.5">
            <t.icon className="w-4 h-4 text-[#FAFAFA]" />
            <span className="font-data text-[11px] tracking-wider uppercase text-neutral-700">
              {t.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── CTA Section ────────────────────────────────────────────────── */
function CTASection() {
  return (
    <section className="py-28 relative overflow-hidden bg-white">
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[300px] bg-[#FAFAFA] opacity-[0.07] blur-[100px] rounded-full" />
      </div>

      <div className="relative max-w-3xl mx-auto px-5 text-center">
        <OrangeBadge>Get Started Today</OrangeBadge>
        <h2 className="font-heading font-bold text-5xl md:text-6xl mt-7 mb-6 leading-tight">
          Your next opportunity is one{" "}
          <span className="gradient-text">swipe away</span>
        </h2>
        <p className="font-body text-neutral-700 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
          Join 10,000+ students and 500+ companies already building careers through mutual
          matching. Free forever for students.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <PrimaryButton href="/signup" className="justify-center text-base px-9 py-4">
            Start Swiping Free <ArrowRight className="w-5 h-5" />
          </PrimaryButton>
          <OutlineButton href="/signup?role=recruiter" className="justify-center text-base px-9 py-4">
            <Briefcase className="w-4 h-4" /> I&apos;m Hiring
          </OutlineButton>
        </div>

        <p className="font-body text-neutral-700 text-sm mt-6">
          No credit card required &middot; Free for students &middot; Cancel anytime
        </p>
      </div>
    </section>
  )
}

/* ─── Footer ─────────────────────────────────────────────────────── */
function Footer() {
  const cols = [
    {
      title: "Product",
      links: [
        { label: "How It Works", href: "#how-it-works" },
        { label: "Features", href: "#features" },
        { label: "Community", href: "#community" },
        { label: "For Recruiters", href: "#recruiters" },
      ],
    },
    {
      title: "Account",
      links: [
        { label: "Sign Up", href: "/signup" },
        { label: "Log In", href: "/login" },
        { label: "Post a Job", href: "/signup?role=recruiter" },
      ],
    },
  ]

  return (
    <footer className="bg-white border-t border-black/10">
      <div className="max-w-7xl mx-auto px-5 py-16 grid grid-cols-2 md:grid-cols-3 gap-10">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#525252] to-[#FAFAFA] flex items-center justify-center shadow-[0_0_12px_-2px_rgba(255,255,255,0.5)]">
              <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-bold text-lg">
              Job<span className="gradient-text">Match</span>
            </span>
          </Link>
          <p className="font-body text-neutral-700 text-sm leading-relaxed max-w-[180px]">
            Mutual swipe-based hiring for the next generation.
          </p>
        </div>

        {/* Link columns */}
        {cols.map((col) => (
          <div key={col.title}>
            <h4 className="font-data text-[10px] tracking-widest uppercase text-neutral-700 mb-5">
              {col.title}
            </h4>
            <ul className="space-y-3">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="font-body text-sm text-neutral-700 hover:text-black transition-colors duration-200"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-black/10 py-6">
        <div className="max-w-7xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-data text-[11px] tracking-wide text-neutral-700">
            © {new Date().getFullYear()} JobMatch. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <WaitlistRedirector />
  )
}

function WaitlistRedirector() {
  // Keep the existing landing file structure, but show the waitlist UI at `/`.
  // (No redirect needed; user asked to remove landing and collect emails.)
  return <WaitlistForm />
}

function WaitlistForm() {
  // Lazy import pattern to avoid restructuring the rest of this large file.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Waitlist = require("@/components/waitlist/WaitlistForm").WaitlistForm as React.ComponentType
  return <Waitlist />
}
