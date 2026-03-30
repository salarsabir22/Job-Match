"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Loader2, X, Plus, GraduationCap, Building2, CheckCircle2,
  AlertCircle, Info, ExternalLink, FileText, ImageIcon,
  Heart, Briefcase, MessageCircle, Star, TrendingUp, Users,
  ChevronRight, Send, Bell, Video, Lock, Globe
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types"

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const SKILL_SUGGESTIONS = [
  "JavaScript", "TypeScript", "React", "Python", "Node.js", "SQL",
  "Java", "C++", "Data Analysis", "Machine Learning", "UX Design",
  "Product Management", "Marketing", "Finance", "Go", "Figma",
]
const JOB_CATEGORIES = [
  "Software Engineering", "Data Science", "Product Management", "Design",
  "Marketing", "Finance", "Operations", "Sales", "HR", "Consulting",
]
const STEPS_STUDENT = [
  { title: "Photo & bio", description: "Photo and short bio (optional).", required: false },
  { title: "Education", description: "School, degree, and graduation year.", required: false },
  { title: "Skills & interests", description: "Skills and preferred role categories.", required: false },
  { title: "Links & resume", description: "Links, CV, and optional intro video.", required: false },
]
const STEPS_RECRUITER = [
  { title: "Company", description: "Company name, description, and website.", required: true },
  { title: "Hiring & video", description: "Your bio, hiring focus, optional video, and review status.", required: false },
]

/* ─────────────────────────────────────────────
   Animated product demo
───────────────────────────────────────────── */

/* ─────────────────────────────────────────────
   Browser-style preview (clean tab + omnibar)
───────────────────────────────────────────── */
function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[20rem] overflow-hidden rounded-xl border border-border/90 bg-card shadow-[0_22px_44px_-14px_rgba(15,23,42,0.2)] ring-1 ring-black/[0.04] sm:max-w-[21rem]">
      {/* Title bar */}
      <div className="flex h-8 items-center border-b border-border bg-muted/55 px-3">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-[#FF5F57] ring-1 ring-black/[0.08]" />
          <span className="size-2.5 rounded-full bg-[#FEBC2E] ring-1 ring-black/[0.08]" />
          <span className="size-2.5 rounded-full bg-[#28C840] ring-1 ring-black/[0.08]" />
        </div>
      </div>
      {/* Tab strip — single active tab */}
      <div className="border-b border-border bg-muted/75 px-1.5 pt-1.5">
        <div className="flex max-w-full items-center gap-2 rounded-t-lg border border-b-0 border-border bg-background px-3 py-2 shadow-[0_-1px_0_0_var(--background)]">
          <Globe className="size-3.5 shrink-0 text-primary" aria-hidden />
          <span className="truncate font-data text-[11px] font-medium tracking-tight text-foreground">jobmatch.app</span>
        </div>
      </div>
      {/* Omnibox */}
      <div className="border-b border-border bg-muted/30 px-2 py-2">
        <div className="flex h-8 items-center gap-2 rounded-lg border border-border bg-background px-2.5 shadow-sm">
          <Lock className="size-3 shrink-0 text-emerald-600" aria-hidden />
          <span className="min-w-0 flex-1 truncate font-data text-[10px] text-muted-foreground tabular-nums">
            https://jobmatch.app/discover
          </span>
        </div>
      </div>
      {/* Viewport */}
      <div className="h-[408px] w-full overflow-hidden bg-background sm:h-[428px]">{children}</div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   STUDENT demo screens
───────────────────────────────────────────── */
const STUDENT_JOBS = [
  {
    title: "Frontend Engineer", company: "Stripe", salary: "$120–150k",
    type: "Full-time · Remote", match: 95,
    accent: "#635BFF", accentBg: "rgba(99,91,255,0.15)",
    skills: ["React", "TypeScript", "GraphQL"],
    perks: ["Remote-first", "Equity + RSUs", "Top-tier benefits"],
  },
  {
    title: "Product Manager", company: "Notion", salary: "$90–110k",
    type: "Internship · SF", match: 91,
    accent: "#000000", accentBg: "rgba(255,255,255,0.06)",
    skills: ["Product", "Figma", "Analytics"],
    perks: ["Housing stipend", "Mentorship", "Return offer potential"],
  },
  {
    title: "Data Analyst", company: "Airbnb", salary: "$100–130k",
    type: "Full-time · NYC", match: 88,
    accent: "#FF5A5F", accentBg: "rgba(255,90,95,0.12)",
    skills: ["Python", "SQL", "Tableau"],
    perks: ["Travel credits", "Flexible hours", "Learning budget"],
  },
]

function StudentSwipeScreen({ cardIdx }: { cardIdx: number }) {
  const card = STUDENT_JOBS[cardIdx % STUDENT_JOBS.length]
  const back = STUDENT_JOBS[(cardIdx + 1) % STUDENT_JOBS.length]
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-4 pb-3 pt-4">
        <div>
          <p className="font-heading text-sm font-bold text-foreground">Discover</p>
          <p className="font-body text-[10px] text-muted-foreground">Open roles</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-muted">
              <Bell className="h-3.5 w-3.5 text-foreground" />
            </div>
            <div className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full border border-background bg-red-500">
              <span className="font-data text-[7px] font-bold text-primary-foreground">3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card stack */}
      <div className="flex-1 relative mx-4 mb-3">
        {/* Back card (peeking) */}
        <div
          className="absolute inset-x-3 top-2 bottom-0 z-[1] overflow-hidden rounded-3xl border border-border"
          style={{ background: back.accentBg, transform: "scale(0.95) translateY(6px)" }}
        >
          <div className="p-4 pt-5">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-2xl border border-border"
              style={{ background: back.accentBg }}>
              <Briefcase className="h-4 w-4 text-[#64748B]" />
            </div>
            <p className="font-heading font-semibold text-sm text-black/60">{back.title}</p>
            <p className="font-body text-[10px] text-[#334155]">{back.company}</p>
          </div>
        </div>

        {/* Front card */}
        <div className="absolute inset-0 z-[2] flex flex-col overflow-hidden rounded-3xl border border-border"
          style={{ background: card.accentBg, boxShadow: `0 20px 40px -12px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.06), 0 0 32px -12px ${card.accent}35` }}>

          {/* Card top accent bar */}
          <div className="h-1 w-full" style={{ background: card.accent }} />

          <div className="flex-1 p-4 flex flex-col">
            {/* Company row */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border"
                  style={{ background: card.accentBg, boxShadow: `0 0 20px -5px ${card.accent}50` }}>
                  <Briefcase className="h-5 w-5" style={{ color: card.accent === "#000000" ? "#94A3B8" : card.accent }} />
                </div>
                <div>
                  <p className="font-heading font-bold text-sm text-black leading-tight">{card.company}</p>
                  <p className="font-body text-[10px] text-[#64748B]">{card.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-neutral-500/12 border border-neutral-500/25 rounded-full px-2 py-0.5">
                <div className="w-1 h-1 rounded-full bg-neutral-400" />
                <span className="font-data text-[9px] text-neutral-400 font-bold">{card.match}%</span>
              </div>
            </div>

            {/* Role + salary */}
            <p className="font-heading font-bold text-xl text-black mb-0.5 leading-tight">{card.title}</p>
            <p className="font-body text-sm font-semibold mb-3" style={{ color: card.accent === "#000000" ? "#94A3B8" : card.accent }}>{card.salary}</p>

            {/* Skills */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {card.skills.map(s => (
                <span key={s} className="font-data text-[10px] px-2 py-0.5 rounded-full border"
                  style={{ background: `${card.accentBg}`, borderColor: `${card.accent}30`, color: card.accent === "#000000" ? "#94A3B8" : card.accent }}>
                  {s}
                </span>
              ))}
            </div>

            {/* Divider */}
            <div className="mb-3 h-px bg-border" />

            {/* Perks */}
            <div className="space-y-1.5 flex-1">
              {card.perks.map(p => (
                <div key={p} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-neutral-400 shrink-0" />
                  <span className="font-body text-[11px] text-[#64748B]">{p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Swipe buttons */}
          <div className="mt-3 flex items-center justify-center gap-5 border-t border-border px-4 py-3">
            <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10">
              <X className="h-[18px] w-[18px] text-destructive" />
            </button>
            <button
              type="button"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
            >
              <Heart className="h-6 w-6 fill-current" />
            </button>
            <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-muted">
              <Star className="h-[18px] w-[18px] text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <div className="flex items-center justify-center gap-4 pb-8 pt-1">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <X className="h-3 w-3 opacity-70" />
          <span className="font-body text-[10px]">Pass</span>
        </div>
        <div className="h-1 w-1 rounded-full bg-muted-foreground/25" />
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Heart className="h-3 w-3 opacity-70" />
          <span className="font-body text-[10px]">Apply</span>
        </div>
        <div className="h-1 w-1 rounded-full bg-muted-foreground/25" />
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Star className="h-3 w-3 opacity-70" />
          <span className="font-body text-[10px]">Save</span>
        </div>
      </div>
    </div>
  )
}

function StudentMatchScreen() {
  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden">
      {/* Burst rings */}
      {[80, 130, 190].map((size, i) => (
        <div key={i} className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#FAFAFA] opacity-[0.08] animate-ping"
          style={{ width: size, height: size, animationDelay: `${i * 0.4}s`, animationDuration: "2.5s" }} />
      ))}
      <div className="absolute top-0 left-0 right-0 h-48 bg-neutral-100/80" />

      <div className="flex-1 flex flex-col items-center justify-center px-5 relative z-10">
        {/* Avatars */}
        <div className="flex items-center gap-0 mb-5">
          <div className="w-16 h-16 rounded-full bg-neutral-200 border-[3px] border-border flex items-center justify-center shadow-[0_0_20px_-4px_rgba(255,255,255,0.6)] z-10">
            <GraduationCap className="h-8 w-8 text-black" />
          </div>
          <div className="w-9 h-9 rounded-full bg-neutral-200 border-2 border-border flex items-center justify-center -mx-1 z-20 shadow-[0_0_16px_-4px_rgba(255,255,255,0.8)]">
            <Heart className="h-4 w-4 text-black fill-white" />
          </div>
          <div className="w-16 h-16 rounded-full bg-neutral-700 border-[3px] border-border flex items-center justify-center shadow-md z-10">
            <Building2 className="h-8 w-8 text-black" />
          </div>
        </div>

        <div className="font-data text-[10px] tracking-[0.2em] uppercase text-neutral-900 mb-1.5 bg-[#FAFAFA]/10 border border-[#FAFAFA]/20 rounded-full px-3 py-0.5">
          New Match
        </div>
        <h3 className="font-heading font-bold text-2xl text-black mb-1">Match</h3>
        <p className="font-body text-xs text-[#4A5568] mb-1 text-center">
          You and Stripe both expressed interest
        </p>

        {/* Job preview */}
        <div className="mb-5 mt-3 flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <Briefcase className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-body text-xs font-semibold text-foreground">Frontend Engineer</p>
            <p className="font-body text-[10px] text-muted-foreground">Stripe · $120–150k</p>
          </div>
          <span className="font-data rounded-full border border-border bg-muted px-2 py-0.5 text-[9px] text-muted-foreground">
            95%
          </span>
        </div>

        <button
          type="button"
          className="mb-2.5 h-10 w-full rounded-xl bg-primary font-body text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          Send message
        </button>
        <button type="button" className="h-10 w-full rounded-xl border border-border bg-card font-body text-sm text-muted-foreground hover:bg-muted">
          Continue browsing
        </button>
      </div>
    </div>
  )
}

function StudentChatScreen() {
  const msgs = [
    { from: "them", text: "Hi — we liked your profile. Are you free to chat?" },
    { from: "me", text: "Yes, I am interested in the role." },
    { from: "them", text: "Can you do a call Thursday at 3pm?" },
    { from: "me", text: "Thursday works." },
    { from: "them", text: "Sending a calendar invite." },
  ]
  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border px-4 pb-3 pt-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border bg-primary text-primary-foreground">
          <Building2 className="h-[18px] w-[18px]" />
        </div>
        <div className="flex-1">
          <p className="font-body text-xs font-bold text-foreground">Sarah · Stripe Recruiter</p>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-primary/80" />
            <span className="font-data text-[9px] text-muted-foreground">Online now</span>
          </div>
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-border bg-muted">
          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
      <div className="flex-1 px-3 py-3 space-y-2 overflow-hidden flex flex-col justify-end">
        {msgs.map((m, i) => (
          <div key={i} className={cn("flex items-end gap-2", m.from === "me" ? "justify-end" : "justify-start")}>
            {m.from === "them" && (
              <div className="w-5 h-5 rounded-full bg-neutral-700 flex items-center justify-center shrink-0 mb-0.5">
                <Building2 className="h-3 w-3 text-black" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[78%] px-3 py-2 font-body text-[11px] leading-relaxed",
                m.from === "me"
                  ? "rounded-2xl rounded-br-sm bg-primary text-primary-foreground shadow-sm"
                  : "rounded-2xl rounded-bl-sm border border-border bg-muted text-foreground"
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="px-3 pb-6 pt-2">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2.5">
          <span className="flex-1 font-body text-[11px] text-muted-foreground">Write a message…</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Send className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </div>
  )
}

function StudentProfileScreen() {
  return (
    <div className="h-full flex flex-col bg-background">
      <div className="h-28 relative bg-neutral-100">
        <div className="absolute inset-x-0 top-8 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-border bg-primary text-primary-foreground shadow-md">
            <GraduationCap className="h-8 w-8" />
          </div>
        </div>
      </div>
      <div className="flex-1 px-4 pt-2 pb-4 flex flex-col overflow-hidden">
        <div className="text-center mb-3">
          <p className="font-heading font-bold text-sm text-black">Alex Johnson</p>
          <p className="font-body text-[10px] text-[#4A5568]">B.Sc. Computer Science · MIT · 2026</p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            {["React", "Python", "Node.js", "+4"].map(s => (
              <span key={s} className="font-data text-[9px] px-1.5 py-0.5 rounded-full bg-[#FAFAFA]/10 border border-[#FAFAFA]/20 text-neutral-900">{s}</span>
            ))}
          </div>
        </div>
        <div className="mb-3 grid grid-cols-3 gap-2">
          {[{ l: "Matches", v: "12", c: "text-foreground" }, { l: "Views", v: "84", c: "text-muted-foreground" }, { l: "Score", v: "94%", c: "text-muted-foreground" }].map(({ l, v, c }) => (
            <div key={l} className="rounded-2xl border border-border bg-card p-2 text-center">
              <p className={cn("font-heading text-base font-bold", c)}>{v}</p>
              <p className="font-data text-[9px] text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
        <p className="mb-2 font-data text-[9px] uppercase tracking-wider text-muted-foreground">Activity</p>
        <div className="space-y-1.5">
          {[
            { icon: Heart, text: "Stripe liked your profile", t: "2m ago", c: "text-foreground", bg: "bg-primary/10" },
            { icon: MessageCircle, text: "New message from Notion", t: "1h ago", c: "text-muted-foreground", bg: "bg-muted" },
            { icon: TrendingUp, text: "Profile views +23% this week", t: "Today", c: "text-muted-foreground", bg: "bg-muted" },
          ].map(({ icon: Icon, text, t, c, bg }) => (
            <div key={text} className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-2">
              <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-lg", bg)}>
                <Icon className={cn("h-3 w-3", c)} />
              </div>
              <span className="flex-1 font-body text-[10px] leading-tight text-muted-foreground">{text}</span>
              <span className="shrink-0 font-data text-[9px] text-muted-foreground">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   RECRUITER demo screens
───────────────────────────────────────────── */
const RECRUITER_CANDIDATES = [
  {
    name: "Alex Chen", university: "MIT", degree: "B.Sc. CS", grad: "2026",
    match: 97, skills: ["React", "TypeScript", "Node.js"],
    gpa: "3.9", projects: 12, accent: "#D4D4D4",
    highlight: "Built a 10k user SaaS during sophomore year",
  },
  {
    name: "Sara Kim", university: "Stanford", degree: "M.Sc. Data Science", grad: "2025",
    match: 93, skills: ["Python", "ML", "SQL"],
    gpa: "4.0", projects: 8, accent: "#A3A3A3",
    highlight: "Published ML research in NeurIPS 2024",
  },
  {
    name: "Jake Moore", university: "UC Berkeley", degree: "B.Sc. EECS", grad: "2026",
    match: 89, skills: ["Java", "Go", "Kubernetes"],
    gpa: "3.8", projects: 15, accent: "#8B5CF6",
    highlight: "OSS contributor · 2.4k GitHub stars",
  },
]

function RecruiterSwipeScreen({ cardIdx }: { cardIdx: number }) {
  const card = RECRUITER_CANDIDATES[cardIdx % RECRUITER_CANDIDATES.length]
  const back = RECRUITER_CANDIDATES[(cardIdx + 1) % RECRUITER_CANDIDATES.length]
  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 pb-3 pt-4">
        <div>
          <p className="font-heading text-sm font-bold text-foreground">Find Talent</p>
          <p className="font-body text-[10px] text-muted-foreground">Candidates matching your roles</p>
        </div>
        <div className="flex items-center gap-1 bg-neutral-500/10 border border-neutral-500/20 rounded-full px-2.5 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse" />
          <span className="font-data text-[9px] text-neutral-400">34 new</span>
        </div>
      </div>

      <div className="flex-1 relative mx-4 mb-3">
        {/* Back card */}
        <div className="absolute inset-x-3 top-2 bottom-0 rounded-3xl border border-border bg-muted overflow-hidden"
          style={{ transform: "scale(0.95) translateY(6px)", zIndex: 1 }}>
          <div className="h-16 bg-muted" />
          <div className="px-3 -mt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-muted-foreground/15">
              <span className="font-heading font-bold text-base text-black/40">{back.name[0]}</span>
            </div>
            <p className="font-heading font-semibold text-sm text-black/40 mt-2">{back.name}</p>
            <p className="font-body text-[10px] text-[#1E293B]">{back.university}</p>
          </div>
        </div>

        {/* Front card */}
        <div
          className="absolute inset-0 z-[2] flex flex-col overflow-hidden rounded-3xl border border-border bg-card"
          style={{ boxShadow: `0 20px 40px -12px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.06), 0 0 32px -12px ${card.accent}35` }}
        >

          {/* Cover */}
          <div className="relative h-[90px] shrink-0 bg-muted">
            <div className="absolute inset-x-0 bottom-0 h-px bg-border" />
            {/* School badge */}
            <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-xl border border-border bg-background/90 px-2 py-1 backdrop-blur-sm">
              <GraduationCap className="h-3 w-3 text-muted-foreground" />
              <span className="font-data text-[9px] text-muted-foreground">{card.university}</span>
            </div>
          </div>

          {/* Avatar overlapping cover */}
          <div className="mb-2 -mt-7 flex items-end gap-3 px-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-[3px] border-card shadow-md"
              style={{ background: `${card.accent}35` }}
            >
              <span className="font-heading font-bold text-xl text-black">{card.name[0]}</span>
            </div>
            <div className="mb-1 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-heading font-bold text-sm text-black">{card.name}</p>
                <div className="flex items-center gap-1 rounded-full px-1.5 py-0.5"
                  style={{ background: `${card.accent}15`, border: `1px solid ${card.accent}30` }}>
                  <div className="w-1 h-1 rounded-full" style={{ background: card.accent }} />
                  <span className="font-data text-[9px] font-bold" style={{ color: card.accent }}>{card.match}%</span>
                </div>
              </div>
              <p className="font-body text-[10px] text-[#4A5568]">{card.degree} · {card.grad}</p>
            </div>
          </div>

          <div className="px-4 flex-1 flex flex-col">
            {/* Highlight */}
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2">
              <Star className="mt-0.5 h-3 w-3 shrink-0" style={{ color: card.accent }} />
              <p className="font-body text-[10px] leading-relaxed text-muted-foreground">{card.highlight}</p>
            </div>

            {/* Skills */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {card.skills.map(s => (
                <span key={s} className="font-data text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: `${card.accent}12`, border: `1px solid ${card.accent}25`, color: card.accent }}>
                  {s}
                </span>
              ))}
            </div>

            {/* Stats row */}
            <div className="mb-auto grid grid-cols-3 gap-2">
              {[{ l: "GPA", v: card.gpa }, { l: "Projects", v: card.projects.toString() }, { l: "Match", v: `${card.match}%` }].map(({ l, v }) => (
                <div key={l} className="rounded-xl border border-border bg-muted/40 p-2 text-center">
                  <p className="font-heading font-bold text-sm text-black">{v}</p>
                  <p className="font-data text-[9px] text-[#334155]">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Swipe buttons */}
          <div className="mt-3 flex items-center justify-center gap-5 border-t border-border px-4 py-3">
            <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10">
              <X className="h-[18px] w-[18px] text-destructive" />
            </button>
            <button
              type="button"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
            >
              <Heart className="h-6 w-6 fill-current" />
            </button>
            <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-muted">
              <Star className="h-[18px] w-[18px] text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 pb-8 pt-1">
        <span className="font-body text-[10px] text-muted-foreground">Pass</span>
        <div className="h-1 w-1 rounded-full bg-muted-foreground/25" />
        <span className="font-body text-[10px] text-muted-foreground/80">Interested</span>
        <div className="h-1 w-1 rounded-full bg-muted-foreground/25" />
        <span className="font-body text-[10px] text-muted-foreground">Save</span>
      </div>
    </div>
  )
}

function RecruiterMatchScreen() {
  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden">
      {[80, 130, 190].map((size, i) => (
        <div key={i} className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-neutral-500 opacity-[0.06] animate-ping"
          style={{ width: size, height: size, animationDelay: `${i * 0.5}s`, animationDuration: "2.5s" }} />
      ))}
      <div className="absolute inset-0 bg-neutral-100/40" />

      <div className="flex-1 flex flex-col items-center justify-center px-5 relative z-10">
        <div className="mb-4 flex items-center gap-0">
          <div className="z-10 flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-border bg-primary/15 shadow-sm">
            <span className="font-heading text-xl font-bold text-primary">A</span>
          </div>
          <div className="z-20 -mx-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-primary text-primary-foreground shadow-md">
            <Heart className="h-4 w-4 fill-current" />
          </div>
          <div className="z-10 flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-border bg-muted shadow-sm">
            <Building2 className="h-8 w-8 text-foreground" />
          </div>
        </div>

        <div className="font-data text-[10px] tracking-[0.2em] uppercase text-neutral-400 mb-1.5 bg-neutral-500/10 border border-neutral-500/20 rounded-full px-3 py-0.5">
          Candidate Match
        </div>
        <h3 className="font-heading font-bold text-2xl text-black mb-1">Match</h3>
        <p className="font-body text-xs text-[#4A5568] text-center mb-4">
          Alex Chen also expressed interest in your posting
        </p>

        {/* Candidate preview */}
        <div className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
            <span className="font-heading text-sm font-bold text-muted-foreground">A</span>
          </div>
          <div className="flex-1">
            <p className="font-body text-xs font-semibold text-foreground">Alex Chen · MIT</p>
            <p className="font-body text-[10px] text-muted-foreground">React · TypeScript · Node.js</p>
          </div>
          <span className="font-data rounded-full border border-border bg-muted px-2 py-0.5 text-[9px] text-muted-foreground">
            97%
          </span>
        </div>

        <button type="button" className="mb-2.5 h-10 w-full rounded-xl bg-primary font-body text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
          Start conversation
        </button>
        <button type="button" className="h-10 w-full rounded-xl border border-border bg-card font-body text-sm text-muted-foreground hover:bg-muted">
          View profile
        </button>
      </div>
    </div>
  )
}

function RecruiterPipelineScreen() {
  const candidates = [
    { name: "Alex Chen", role: "Frontend Eng", match: 97, status: "Matched", dot: "bg-neutral-400", uni: "MIT" },
    { name: "Sara Kim",  role: "Data Analyst",  match: 93, status: "Interview", dot: "bg-primary", uni: "Stanford" },
    { name: "Jake Moore", role: "Backend Eng", match: 89, status: "Reviewing", dot: "bg-blue-400", uni: "UC Berkeley" },
    { name: "Priya Patel", role: "PM Intern",  match: 84, status: "New",       dot: "bg-neutral-400", uni: "CMU" },
  ]
  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border px-4 pb-3 pt-4">
        <p className="font-heading text-sm font-bold text-foreground">Your Pipeline</p>
        <p className="font-body text-[10px] text-muted-foreground">Frontend Engineer · 34 matches</p>
      </div>

      {/* Stats row */}
      <div className="mb-3 grid grid-cols-3 gap-2 px-4">
        {[{ l: "Total", v: "34", c: "text-foreground" }, { l: "Interviews", v: "6", c: "text-foreground" }, { l: "Hired", v: "2", c: "text-muted-foreground" }].map(({ l, v, c }) => (
          <div key={l} className="rounded-2xl border border-border bg-card py-2.5 text-center">
            <p className={cn("font-heading text-lg font-bold", c)}>{v}</p>
            <p className="font-data text-[9px] text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 space-y-2 overflow-hidden px-4">
        <p className="font-data text-[9px] uppercase tracking-wider text-muted-foreground">Candidates</p>
        {candidates.map((c) => (
          <div key={c.name} className="flex items-center gap-2.5 rounded-2xl border border-border bg-card p-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted font-heading text-sm font-bold text-muted-foreground">
              {c.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-body text-xs font-semibold text-foreground">{c.name}</p>
              <p className="truncate font-body text-[10px] text-muted-foreground">
                {c.uni} · {c.role}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-data text-[10px] font-bold text-foreground">{c.match}%</p>
              <div className="flex items-center justify-end gap-1">
                <div className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
                <span className="font-data text-[9px] text-muted-foreground">{c.status}</span>
              </div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </div>
        ))}
      </div>
      <div className="px-4 pb-8 pt-2">
        <button
          type="button"
          className="h-9 w-full rounded-2xl border border-border bg-muted font-body text-xs text-foreground hover:bg-muted/80"
        >
          + Post Another Job
        </button>
      </div>
    </div>
  )
}

function RecruiterChatScreen() {
  const msgs = [
    { from: "them", text: "Hi — I am interested in this role." },
    { from: "me", text: "Thanks for applying. Your background looks strong." },
    { from: "them", text: "Happy to share more detail on my projects." },
    { from: "me", text: "Can you do a technical interview Friday at 2pm?" },
    { from: "them", text: "Friday works." },
  ]
  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border px-4 pb-3 pt-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted">
          <span className="font-heading text-sm font-bold text-muted-foreground">A</span>
        </div>
        <div className="flex-1">
          <p className="font-body text-xs font-bold text-foreground">Alex Chen · MIT</p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
            <span className="font-data text-[9px] text-neutral-400">97% match · Online</span>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-border bg-muted px-2 py-1">
          <Star className="h-3 w-3 text-primary" />
          <span className="font-data text-[9px] text-foreground">Top</span>
        </div>
      </div>
      <div className="flex-1 px-3 py-3 space-y-2 overflow-hidden flex flex-col justify-end">
        {msgs.map((m, i) => (
          <div key={i} className={cn("flex items-end gap-2", m.from === "me" ? "justify-end" : "justify-start")}>
            {m.from === "them" && (
              <div className="w-5 h-5 rounded-full bg-neutral-500/20 flex items-center justify-center shrink-0 mb-0.5">
                <span className="font-heading font-bold text-[9px] text-neutral-400">A</span>
              </div>
            )}
            <div
              className={cn(
                "max-w-[78%] px-3 py-2 font-body text-[11px] leading-relaxed",
                m.from === "me"
                  ? "rounded-2xl rounded-br-sm bg-primary text-primary-foreground shadow-sm"
                  : "rounded-2xl rounded-bl-sm border border-border bg-muted text-foreground"
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="px-3 pb-6 pt-2">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2.5">
          <span className="flex-1 font-body text-[11px] text-muted-foreground">Message…</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Send className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   ProductDemo — role-aware
───────────────────────────────────────────── */
const STUDENT_SCREENS = [
  { tag: "Apply", label: "Job feed" },
  { tag: "Match", label: "Mutual match" },
  { tag: "Messages", label: "Recruiter chat" },
  { tag: "Profile", label: "Your profile" },
]
const RECRUITER_SCREENS = [
  { tag: "Review", label: "Candidate feed" },
  { tag: "Match", label: "Mutual match" },
  { tag: "Pipeline", label: "Pipeline" },
  { tag: "Messages", label: "Candidate chat" },
]
const STUDENT_FEATURES = [
  { icon: Briefcase, text: "Browse and apply to roles" },
  { icon: Heart, text: "Alerts when interest is mutual" },
  { icon: MessageCircle, text: "Message recruiters in the app" },
  { icon: TrendingUp, text: "See activity on your profile" },
]
const RECRUITER_FEATURES = [
  { icon: Users, text: "Review students in a swipe feed" },
  { icon: Heart, text: "Notifications for mutual matches" },
  { icon: ChevronRight, text: "Track candidates in a pipeline" },
  { icon: MessageCircle, text: "Message candidates in the app" },
]

function ProductDemo({ role }: { role: UserRole | null }) {
  const isRecruiter = role === "recruiter"
  const screens = isRecruiter ? RECRUITER_SCREENS : STUDENT_SCREENS
  const features = isRecruiter ? RECRUITER_FEATURES : STUDENT_FEATURES

  const [screenIdx, setScreenIdx] = useState(0)
  const [cardIdx, setCardIdx] = useState(0)
  const [visible, setVisible] = useState(true)
  const [animating, setAnimating] = useState(false)

  const goTo = useCallback((next: number) => {
    setAnimating(true)
    setVisible(false)
    setTimeout(() => { setScreenIdx(next % screens.length); setVisible(true); setAnimating(false) }, 300)
  }, [screens.length])

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setScreenIdx(p => (p + 1) % screens.length)
        setCardIdx(p => (p + 1) % (isRecruiter ? RECRUITER_CANDIDATES.length : STUDENT_JOBS.length))
        setVisible(true)
      }, 300)
    }, 3800)
    return () => clearInterval(t)
  }, [screens.length, isRecruiter])

  const screen = screens[screenIdx]

  return (
    <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto overflow-x-hidden px-5 py-8 lg:gap-7 lg:py-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent" />

      {/* Screen label */}
      <div className="relative z-10 max-w-[21rem] space-y-1 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1">
          <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-primary" />
          <span className="font-data text-[10px] font-medium uppercase tracking-[0.18em] text-primary">{screen.tag}</span>
          <span className="text-muted-foreground/40" aria-hidden>
            ·
          </span>
          <span className="font-body text-[10px] text-muted-foreground">{screen.label}</span>
        </div>
      </div>

      {/* Browser preview */}
      <div
        className={cn(
          "relative z-10 w-full transition-[opacity,transform] duration-300 ease-out",
          visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        )}
      >
        <BrowserFrame>
          {isRecruiter ? (
            <>
              {screenIdx === 0 && <RecruiterSwipeScreen cardIdx={cardIdx} />}
              {screenIdx === 1 && <RecruiterMatchScreen />}
              {screenIdx === 2 && <RecruiterPipelineScreen />}
              {screenIdx === 3 && <RecruiterChatScreen />}
            </>
          ) : (
            <>
              {screenIdx === 0 && <StudentSwipeScreen cardIdx={cardIdx} />}
              {screenIdx === 1 && <StudentMatchScreen />}
              {screenIdx === 2 && <StudentChatScreen />}
              {screenIdx === 3 && <StudentProfileScreen />}
            </>
          )}
        </BrowserFrame>
      </div>

      {/* Dot nav */}
      <div className="relative z-10 flex shrink-0 items-center gap-1.5">
        {screens.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            disabled={animating}
            className={cn(
              "rounded-full transition-all duration-300",
              i === screenIdx ? "h-1.5 w-5 bg-primary" : "h-1.5 w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            aria-label={`Preview slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Feature list */}
      <div className="relative z-10 w-full max-w-[21rem] space-y-1.5 pb-4">
        {features.map(({ icon: Icon, text }, i) => (
          <div
            key={text}
            className={cn(
              "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all duration-300",
              i === screenIdx ? "border-primary/20 bg-card shadow-sm" : "border-transparent bg-transparent"
            )}
          >
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-300",
                i === screenIdx ? "bg-primary/10" : "bg-muted/50"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", i === screenIdx ? "text-primary" : "text-muted-foreground")} />
            </div>
            <span className={cn("font-body text-xs", i === screenIdx ? "font-medium text-foreground" : "text-muted-foreground")}>{text}</span>
            {i === screenIdx && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-primary" />}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Micro helpers
───────────────────────────────────────────── */
const inputClass =
  "w-full h-11 rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-colors"
const textareaClass =
  "w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-colors"
const labelClass = "mb-1.5 block font-data text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground"

function HelpText({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-1.5 flex items-start gap-1.5">
      <Info className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
      <p className="font-body text-[11px] leading-relaxed text-muted-foreground">{children}</p>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Main page
───────────────────────────────────────────── */
export default function OnboardingPage() {
  const [role, setRole] = useState<UserRole | null>(null)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [stepError, setStepError] = useState<string | null>(null)

  /* Student fields */
  const [bio, setBio] = useState("")
  const [university, setUniversity] = useState("")
  const [degree, setDegree] = useState("")
  const [graduationYear, setGraduationYear] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState("")
  const [preferredCategories, setPreferredCategories] = useState<string[]>([])
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [githubUrl, setGithubUrl] = useState("")
  const [portfolioUrl, setPortfolioUrl] = useState("")
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [profileVideoFile, setProfileVideoFile] = useState<File | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  /* Recruiter fields */
  const [companyName, setCompanyName] = useState("")
  const [companyDescription, setCompanyDescription] = useState("")
  const [hiringFocus, setHiringFocus] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = "/login"; return }

      const pendingRole = localStorage.getItem("pending_role") as UserRole | null
      if (pendingRole === "recruiter" || pendingRole === "student") {
        setRole(pendingRole)
        await supabase.from("profiles").update({ role: pendingRole }).eq("id", user.id)
        localStorage.removeItem("pending_role")
        return
      }
      const metaRole = user.user_metadata?.role as UserRole | undefined
      if (metaRole === "recruiter" || metaRole === "student") { setRole(metaRole); return }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
      if (profile?.role === "recruiter" || profile?.role === "student") {
        setRole(profile.role as UserRole)
      } else {
        setRole("student")
      }
    })
  }, [])

  const addSkill = (skill: string) => {
    const s = skill.trim()
    if (s && !skills.includes(s) && skills.length < 20) setSkills([...skills, s])
    setSkillInput("")
  }

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const supabase = createClient()
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  const canProceed = () => {
    setStepError(null)
    if (role === "recruiter" && step === 0 && !companyName.trim()) {
      setStepError("Company name is required to continue")
      return false
    }
    return true
  }

  const handleComplete = async () => {
    if (!canProceed()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      let avatarUrl: string | undefined
      if (avatarFile) { setUploading(true); avatarUrl = await uploadFile(avatarFile, "avatars", `${user.id}/avatar`); setUploading(false) }

      let profileVideoUrl: string | undefined
      if (profileVideoFile) {
        setUploading(true)
        const ext = profileVideoFile.name.split(".").pop()?.toLowerCase() || "mp4"
        profileVideoUrl = await uploadFile(profileVideoFile, "profile-videos", `${user.id}/video.${ext}`)
        setUploading(false)
      }

      const profileUpdate: Record<string, unknown> = { bio }
      if (avatarUrl) profileUpdate.avatar_url = avatarUrl
      if (profileVideoUrl) profileUpdate.profile_video_url = profileVideoUrl
      const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle()
      if (existingProfile) {
        await supabase.from("profiles").update(profileUpdate).eq("id", user.id)
      } else {
        await supabase.from("profiles").insert({
          id: user.id, role: role ?? "student",
          full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email,
          ...profileUpdate,
        })
      }

      if (role === "student") {
        let resumeUrl: string | undefined
        if (resumeFile) resumeUrl = await uploadFile(resumeFile, "resumes", `${user.id}/resume.pdf`)
        const studentData = {
          id: user.id, university, degree,
          graduation_year: graduationYear ? parseInt(graduationYear) : null,
          skills, preferred_job_categories: preferredCategories,
          linkedin_url: linkedinUrl || null, github_url: githubUrl || null,
          portfolio_url: portfolioUrl || null, resume_url: resumeUrl || null,
        }
        const { data: updated } = await supabase.from("student_profiles").update(studentData).eq("id", user.id).select()
        if (!updated || updated.length === 0) await supabase.from("student_profiles").insert(studentData)
        window.location.href = "/discover"
      } else if (role === "recruiter") {
        const recruiterData = {
          id: user.id, company_name: companyName, description: companyDescription,
          hiring_focus: hiringFocus, website_url: websiteUrl || null,
        }
        const { data: updated } = await supabase.from("recruiter_profiles").update(recruiterData).eq("id", user.id).select()
        if (!updated || updated.length === 0) await supabase.from("recruiter_profiles").insert(recruiterData)
        window.location.href = "/jobs"
      }
    } catch {
      setStepError("Something went wrong saving your profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const steps = role === "student" ? STEPS_STUDENT : STEPS_RECRUITER
  const totalSteps = steps.length
  const progress = Math.round(((step + 1) / totalSteps) * 100)
  const currentStep = steps[step]

  if (!role) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="font-body text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-background">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-50" />
      <div className="pointer-events-none absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-muted opacity-[0.35] blur-[160px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-muted opacity-[0.25] blur-[120px]" />

      {/* ── Top bar ── */}
      <header className="relative z-10 flex items-center justify-between gap-4 border-b border-border bg-card/90 px-4 py-3.5 backdrop-blur-md sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/80">
            {role === "recruiter" ? (
              <Building2 className="h-4 w-4 text-primary" />
            ) : (
              <GraduationCap className="h-4 w-4 text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <span className="font-heading text-base font-semibold tracking-tight text-foreground">JobMatch</span>
            <p className="truncate font-data text-[10px] uppercase tracking-wide text-muted-foreground">Set up your account</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5">
          <span className="font-data text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Progress</span>
          <span className="font-heading text-sm font-semibold tabular-nums text-primary">{progress}%</span>
        </div>
      </header>

      {/* ── Main two-column layout ── */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col lg:flex-row">

        {/* ──────── LEFT: Form (50%) ──────── */}
        <div className="flex w-full min-h-0 flex-col justify-start overflow-y-auto px-4 py-8 sm:px-6 lg:w-1/2 lg:justify-center lg:px-10 xl:px-12">
          <div className="mx-auto w-full max-w-lg">
            {/* Step overview */}
            <div className="mb-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <p className="font-data text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Step {step + 1} of {totalSteps}
                  </p>
                  <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
                    {currentStep.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {!currentStep.required ? (
                      <span className="rounded-md border border-border bg-muted/80 px-2 py-0.5 font-data text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Optional
                      </span>
                    ) : (
                      <span className="rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 font-data text-[10px] font-medium uppercase tracking-wide text-primary">
                        Required
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="font-body text-sm leading-relaxed text-muted-foreground">{currentStep.description}</p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-md">
              {/* Form fields */}
              <div className="space-y-5 px-5 py-6 sm:px-6">

              {/* ── STUDENT STEP 0: Photo & Bio ── */}
              {role === "student" && step === 0 && (
                <div className="space-y-6">
                  <div>
                    <label className={labelClass}>Profile photo</label>
                    <label className="group relative flex cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-5 transition-colors hover:border-primary/30 hover:bg-muted/50 sm:flex-row sm:items-center sm:gap-5">
                      <div className="relative shrink-0">
                        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-border bg-background shadow-sm">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-9 w-9 text-muted-foreground/80" />
                          )}
                        </div>
                        <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-card transition-transform group-hover:scale-105">
                          <Plus className="h-4 w-4" />
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) {
                              setAvatarFile(f)
                              setAvatarPreview(URL.createObjectURL(f))
                            }
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1 text-center sm:text-left">
                        <p className="font-body text-sm font-semibold text-foreground">Tap to upload</p>
                        <p className="mt-1 font-body text-xs text-muted-foreground">JPG, PNG, or GIF · max 5MB</p>
                        <p className="mt-2 font-body text-xs leading-relaxed text-muted-foreground">
                          Appears on your profile and when you message recruiters.
                        </p>
                      </div>
                    </label>
                  </div>
                  <div>
                    <label className={labelClass}>Short Bio</label>
                    <textarea
                      className={textareaClass}
                      placeholder="Brief background and what you are looking for next."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      maxLength={300}
                    />
                    <div className="mt-1.5 flex items-start justify-between">
                      <HelpText>Two or three sentences: background and what you&apos;re looking for.</HelpText>
                      <span className="ml-2 shrink-0 font-data text-[10px] text-muted-foreground">{bio.length}/300</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STUDENT STEP 1: Education ── */}
              {role === "student" && step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>University / Institution</label>
                    <input className={inputClass} placeholder="e.g. MIT, Stanford, Oxford" value={university} onChange={(e) => setUniversity(e.target.value)} />
                    <HelpText>Include country if outside the US</HelpText>
                  </div>
                  <div>
                    <label className={labelClass}>Degree & Field of Study</label>
                    <input className={inputClass} placeholder="e.g. B.Sc. Computer Science" value={degree} onChange={(e) => setDegree(e.target.value)} />
                    <HelpText>Include both the level (B.Sc. / M.Sc. / PhD) and the field</HelpText>
                  </div>
                  <div>
                    <label className={labelClass}>Expected Graduation Year</label>
                    <select className={inputClass} value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)}>
                      <option value="">Select year…</option>
                      {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                        <option key={y} value={String(y)}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* ── STUDENT STEP 2: Skills ── */}
              {role === "student" && step === 2 && (
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={cn(labelClass, "mb-0")}>Skills</label>
                      <span className="font-data text-[10px] text-muted-foreground">{skills.length}/20</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        className={inputClass}
                        placeholder="Type a skill and press Enter"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput) } }}
                      />
                      <button
                        type="button"
                        onClick={() => addSkill(skillInput)}
                        disabled={!skillInput.trim()}
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-foreground transition-colors hover:bg-muted/80 disabled:opacity-40"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {SKILL_SUGGESTIONS.filter(s => !skills.includes(s)).slice(0, 8).map(s => (
                        <button key={s} type="button" onClick={() => addSkill(s)}
                          className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground">
                          + {s}
                        </button>
                      ))}
                    </div>
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {skills.map(s => (
                          <span
                            key={s}
                            className="flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-foreground"
                          >
                            {s}
                            <button
                              type="button"
                              onClick={() => setSkills(skills.filter((sk) => sk !== s))}
                              className="ml-0.5 transition-colors hover:text-muted-foreground"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <HelpText>Add up to 20 skills so we can match you to relevant roles.</HelpText>
                  </div>

                  <div>
                    <label className={labelClass}>Preferred Job Categories</label>
                    <div className="flex flex-wrap gap-1.5">
                      {JOB_CATEGORIES.map(c => (
                        <button key={c} type="button"
                          onClick={() => setPreferredCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs transition-colors",
                            preferredCategories.includes(c)
                              ? "border-border bg-muted text-foreground"
                              : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          )}>
                          {c}
                        </button>
                      ))}
                    </div>
                    <HelpText>You can change these later in your profile.</HelpText>
                  </div>
                </div>
              )}

              {/* ── STUDENT STEP 3: Links & Resume ── */}
              {role === "student" && step === 3 && (
                <div className="space-y-4">
                  {[
                    { label: "LinkedIn URL", value: linkedinUrl, setter: setLinkedinUrl, placeholder: "https://linkedin.com/in/your-name" },
                    { label: "GitHub URL", value: githubUrl, setter: setGithubUrl, placeholder: "https://github.com/your-username" },
                    { label: "Portfolio / Website", value: portfolioUrl, setter: setPortfolioUrl, placeholder: "https://yourportfolio.com" },
                  ].map(({ label, value, setter, placeholder }) => (
                    <div key={label}>
                      <label className={labelClass}>{label}</label>
                      <div className="relative">
                        <input className={cn(inputClass, "pl-10")} placeholder={placeholder} value={value} onChange={(e) => setter(e.target.value)} />
                        <ExternalLink className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                  <div>
                    <label className={labelClass}>Resume / CV (PDF)</label>
                    <label className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-4 transition-all",
                      resumeFile ? "border-border bg-muted/40" : "border-border hover:bg-muted/30"
                    )}>
                      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", resumeFile ? "bg-muted" : "bg-muted/50")}>
                        <FileText className={cn("h-5 w-5", resumeFile ? "text-foreground" : "text-muted-foreground")} />
                      </div>
                      {resumeFile
                        ? <div><p className="font-body text-sm font-medium text-foreground">{resumeFile.name}</p><p className="font-body text-xs text-muted-foreground">Click to replace</p></div>
                        : <div><p className="font-body text-sm text-muted-foreground">Upload CV (PDF)</p><p className="font-body text-xs text-muted-foreground">Max 10MB</p></div>}
                      <input type="file" accept=".pdf" className="hidden" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
                    </label>
                    <HelpText>Recruiters can download your CV when you apply to a role.</HelpText>
                  </div>
                  <div>
                    <label className={labelClass}>Profile video (optional)</label>
                    <label className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-4 transition-all",
                      profileVideoFile ? "border-border bg-muted/40" : "border-border hover:bg-muted/30"
                    )}>
                      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", profileVideoFile ? "bg-muted" : "bg-muted/50")}>
                        <Video className={cn("h-5 w-5", profileVideoFile ? "text-foreground" : "text-muted-foreground")} />
                      </div>
                      {profileVideoFile
                        ? <div><p className="font-body text-sm font-medium text-foreground">{profileVideoFile.name}</p><p className="font-body text-xs text-muted-foreground">Click to replace</p></div>
                        : <div><p className="font-body text-sm text-muted-foreground">Intro video (optional)</p><p className="font-body text-xs text-muted-foreground">MP4 or WebM · max 50MB · you can also record from Profile</p></div>}
                      <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => setProfileVideoFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                </div>
              )}

              {/* ── RECRUITER STEP 0: Company ── */}
              {role === "recruiter" && step === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Company Name <span className="text-neutral-500/80">*</span></label>
                    <input className={inputClass} placeholder="e.g. Acme Corp" value={companyName}
                      onChange={(e) => { setCompanyName(e.target.value); setStepError(null) }} />
                    <HelpText>Displayed on all your job postings</HelpText>
                  </div>
                  <div>
                    <label className={labelClass}>Company Description</label>
                    <textarea
                      className={textareaClass}
                      placeholder="What you do, who you hire, and what candidates should know."
                      value={companyDescription}
                      onChange={(e) => setCompanyDescription(e.target.value)}
                      rows={4}
                      maxLength={500}
                    />
                    <div className="mt-1.5 flex items-start justify-between">
                      <HelpText>Shown on your company card before candidates swipe.</HelpText>
                      <span className="ml-2 shrink-0 font-data text-[10px] text-muted-foreground">{companyDescription.length}/500</span>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Website URL</label>
                    <div className="relative">
                      <input className={cn(inputClass, "pl-10")} placeholder="https://yourcompany.com" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
                      <ExternalLink className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              )}

              {/* ── RECRUITER STEP 1: Hiring Focus ── */}
              {role === "recruiter" && step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Your Bio</label>
                    <textarea
                      className={textareaClass}
                      placeholder="Tell candidates about yourself and your role at the company…"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      maxLength={300}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Hiring Focus</label>
                    <input
                      className={inputClass}
                      placeholder="e.g. Software engineering interns, Full-stack developers"
                      value={hiringFocus}
                      onChange={(e) => setHiringFocus(e.target.value)}
                    />
                    <HelpText>Helps candidates judge fit before they apply.</HelpText>
                  </div>
                  <div>
                    <label className={labelClass}>Profile video (optional)</label>
                    <label className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-4 transition-all",
                      profileVideoFile ? "border-border bg-muted/40" : "border-border hover:bg-muted/30"
                    )}>
                      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", profileVideoFile ? "bg-muted" : "bg-muted/50")}>
                        <Video className={cn("h-5 w-5", profileVideoFile ? "text-foreground" : "text-muted-foreground")} />
                      </div>
                      {profileVideoFile
                        ? <div><p className="font-body text-sm font-medium text-foreground">{profileVideoFile.name}</p><p className="font-body text-xs text-muted-foreground">Click to replace</p></div>
                        : <div><p className="font-body text-sm text-muted-foreground">Intro video (optional)</p><p className="font-body text-xs text-muted-foreground">MP4 or WebM · max 50MB</p></div>}
                      <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => setProfileVideoFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 p-4">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="mb-1 font-data text-[10px] uppercase tracking-wider text-foreground">Admin review</p>
                      <p className="font-body text-xs leading-relaxed text-muted-foreground">
                        New recruiter accounts are reviewed before listings go live. You can still use the product while pending; we will email you when approved.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              </div>

              <div className="border-t border-border bg-muted/30 px-5 py-4 sm:px-6">
                {stepError && (
                  <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-destructive/25 bg-destructive/10 p-3.5">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <p className="font-body text-sm text-destructive">{stepError}</p>
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    {step > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setStep(step - 1)
                          setStepError(null)
                        }}
                        className="h-11 rounded-xl border border-border bg-background px-5 font-body text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
                      >
                        Back
                      </button>
                    )}
                    {step < totalSteps - 1 && !currentStep.required && (
                      <button
                        type="button"
                        onClick={() => {
                          setStep(step + 1)
                          setStepError(null)
                        }}
                        className="h-11 rounded-xl px-3 font-body text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Skip this step
                      </button>
                    )}
                  </div>
                  <div className="flex w-full min-w-0 sm:w-auto sm:justify-end">
                    {step < totalSteps - 1 ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (canProceed()) setStep(step + 1)
                        }}
                        className="h-11 w-full rounded-xl bg-primary px-8 font-body text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:w-auto"
                      >
                        Continue
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleComplete}
                        disabled={loading || uploading}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 font-body text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-40 sm:w-auto"
                      >
                        {loading || uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {uploading ? "Uploading…" : "Saving…"}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" /> Finish
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Skip all (students only) */}
            {role === "student" && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => handleComplete()}
                  disabled={loading}
                  className="font-body text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline disabled:opacity-40"
                >
                  Finish later — go to Discover with what you have
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ──────── RIGHT: Product demo (50%, desktop only) ──────── */}
        <div className="relative hidden min-h-0 flex-1 flex-col overflow-hidden border-l border-border bg-background lg:flex lg:w-1/2">
          <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-[0.22]" />
          <div className="pointer-events-none absolute left-1/2 top-[42%] h-[min(420px,55vh)] w-[min(420px,55vh)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.06] blur-[90px]" />
          <div className="relative flex min-h-0 flex-1 flex-col">
            <ProductDemo key={role ?? "none"} role={role} />
          </div>
        </div>
      </div>
    </div>
  )
}
