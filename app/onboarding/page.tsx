"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Loader2, X, Plus, GraduationCap, Building2, CheckCircle2,
  Zap, AlertCircle, Info, ExternalLink, FileText, ImageIcon,
  Heart, Briefcase, MessageCircle, Star, TrendingUp, Users,
  ChevronRight, ArrowRight, MapPin, Clock, Send, Bell, Video
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
  { title: "Profile Photo & Bio", description: "First impressions matter — add a photo and tell recruiters who you are", required: false },
  { title: "Education", description: "Share your academic background", required: false },
  { title: "Skills & Interests", description: "Help us match you with the right opportunities", required: false },
  { title: "Links & Resume", description: "Add your online presence and CV", required: false },
]
const STEPS_RECRUITER = [
  { title: "Company Details", description: "Tell candidates about your company", required: true },
  { title: "Hiring Focus", description: "Who are you looking to hire?", required: false },
]

/* ─────────────────────────────────────────────
   Animated product demo
───────────────────────────────────────────── */

/* ─────────────────────────────────────────────
   Shared phone shell
───────────────────────────────────────────── */
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto" style={{ width: 272, height: 556 }}>
      {/* Outer shell */}
      <div className="absolute inset-0 rounded-[44px] bg-gradient-to-b from-[#1C1F26] to-[#0D0F13] border border-black/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.08)]" />
      {/* Side buttons */}
      <div className="absolute -right-[3px] top-24 w-[3px] h-8 rounded-r-sm bg-[#2A2D35]" />
      <div className="absolute -left-[3px] top-20 w-[3px] h-6 rounded-l-sm bg-[#2A2D35]" />
      <div className="absolute -left-[3px] top-28 w-[3px] h-10 rounded-l-sm bg-[#2A2D35]" />
      {/* Dynamic island */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full bg-white z-20 flex items-center justify-center gap-1.5 border border-black/10">
        <div className="w-1.5 h-1.5 rounded-full bg-[#1C2128]" />
        <div className="w-3 h-3 rounded-full bg-[#0D0F13] border border-black/10 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[#1C2128]" />
        </div>
      </div>
      {/* Screen area */}
      <div className="absolute top-2 inset-x-2 bottom-2 rounded-[36px] overflow-hidden bg-[#07090C]">
        {children}
      </div>
      {/* Home bar */}
      <div className="absolute bottom-[14px] left-1/2 -translate-x-1/2 w-28 h-[4px] rounded-full bg-white/25" />
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
    <div className="h-full flex flex-col bg-[#07090C]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-10 pb-3">
        <div>
          <p className="font-heading font-bold text-sm text-black">Discover</p>
          <p className="font-body text-[10px] text-[#4A5568]">Jobs picked for you</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-[#FAFAFA]/15 border border-[#FAFAFA]/25 flex items-center justify-center">
              <Bell className="h-3.5 w-3.5 text-[#FAFAFA]" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 border border-[#07090C] flex items-center justify-center">
              <span className="font-data text-[7px] text-black font-bold">3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card stack */}
      <div className="flex-1 relative mx-4 mb-3">
        {/* Back card (peeking) */}
        <div className="absolute inset-x-3 top-2 bottom-0 rounded-3xl border border-black/10 overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${back.accentBg}, #0D0F13)`, transform: "scale(0.95) translateY(6px)", zIndex: 1 }}>
          <div className="p-4 pt-5">
            <div className="w-9 h-9 rounded-2xl border border-black/10 flex items-center justify-center mb-2"
              style={{ background: back.accentBg }}>
              <Briefcase className="h-4 w-4 text-[#64748B]" />
            </div>
            <p className="font-heading font-semibold text-sm text-black/60">{back.title}</p>
            <p className="font-body text-[10px] text-[#334155]">{back.company}</p>
          </div>
        </div>

        {/* Front card */}
        <div className="absolute inset-0 rounded-3xl border border-black/10 overflow-hidden flex flex-col"
          style={{ background: `linear-gradient(145deg, ${card.accentBg} 0%, #0D0F13 55%)`, boxShadow: `0 24px 48px -10px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06), 0 0 40px -15px ${card.accent}40`, zIndex: 2 }}>

          {/* Card top accent bar */}
          <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${card.accent}, transparent)` }} />

          <div className="flex-1 p-4 flex flex-col">
            {/* Company row */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-2xl border border-black/10 flex items-center justify-center shrink-0"
                  style={{ background: `linear-gradient(135deg, ${card.accentBg}, #0D0F13)`, boxShadow: `0 0 20px -5px ${card.accent}50` }}>
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
            <div className="h-px bg-white/6 mb-3" />

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
          <div className="flex items-center justify-center gap-5 px-4 py-3 border-t border-black/10">
            <button className="w-11 h-11 rounded-full flex items-center justify-center border border-neutral-500/30 bg-red-500/10 shadow-[0_0_12px_-4px_rgba(255,255,255,0.4)]">
              <X className="h-4.5 w-4.5 text-neutral-500" style={{ width: 18, height: 18 }} />
            </button>
            <button className="w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_24px_-4px_rgba(255,255,255,0.7)]"
              style={{ background: `linear-gradient(135deg, #525252, #FAFAFA)` }}>
              <Heart className="h-6 w-6 text-black fill-white" />
            </button>
            <button className="w-11 h-11 rounded-full flex items-center justify-center border border-neutral-500/30 bg-neutral-500/10 shadow-[0_0_12px_-4px_rgba(255,255,255,0.4)]">
              <Star className="h-4.5 w-4.5 text-neutral-400" style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <div className="flex items-center justify-center gap-4 pb-8 pt-1">
        <div className="flex items-center gap-1.5 text-[#334155]">
          <X className="h-3 w-3 text-neutral-500/50" />
          <span className="font-body text-[10px]">Pass</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-white/10" />
        <div className="flex items-center gap-1.5 text-[#334155]">
          <Heart className="h-3 w-3 text-[#FAFAFA]/50" />
          <span className="font-body text-[10px]">Like</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-white/10" />
        <div className="flex items-center gap-1.5 text-[#334155]">
          <Star className="h-3 w-3 text-neutral-400/50" />
          <span className="font-body text-[10px]">Super</span>
        </div>
      </div>
    </div>
  )
}

function StudentMatchScreen() {
  return (
    <div className="h-full flex flex-col bg-[#07090C] relative overflow-hidden">
      {/* Burst rings */}
      {[80, 130, 190].map((size, i) => (
        <div key={i} className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#FAFAFA] opacity-[0.08] animate-ping"
          style={{ width: size, height: size, animationDelay: `${i * 0.4}s`, animationDuration: "2.5s" }} />
      ))}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#FAFAFA]/12 to-transparent" />

      <div className="flex-1 flex flex-col items-center justify-center px-5 relative z-10">
        {/* Avatars */}
        <div className="flex items-center gap-0 mb-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#525252] to-[#FAFAFA] border-[3px] border-[#07090C] flex items-center justify-center shadow-[0_0_20px_-4px_rgba(255,255,255,0.6)] z-10">
            <GraduationCap className="h-8 w-8 text-black" />
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#525252] to-[#FAFAFA] border-2 border-[#07090C] flex items-center justify-center -mx-1 z-20 shadow-[0_0_16px_-4px_rgba(255,255,255,0.8)]">
            <Heart className="h-4 w-4 text-black fill-white" />
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#635BFF] to-[#4338CA] border-[3px] border-[#07090C] flex items-center justify-center shadow-[0_0_20px_-4px_rgba(99,91,255,0.5)] z-10">
            <Building2 className="h-8 w-8 text-black" />
          </div>
        </div>

        <div className="font-data text-[10px] tracking-[0.2em] uppercase text-[#FAFAFA] mb-1.5 bg-[#FAFAFA]/10 border border-[#FAFAFA]/20 rounded-full px-3 py-0.5">
          New Match
        </div>
        <h3 className="font-heading font-bold text-2xl text-black mb-1">It&apos;s a Match!</h3>
        <p className="font-body text-xs text-[#4A5568] text-center mb-1">
          <span className="text-black font-medium">You</span> and <span className="text-[#635BFF] font-medium">Stripe</span> both liked each other
        </p>

        {/* Job preview */}
        <div className="w-full bg-white/4 border border-black/10 rounded-2xl p-3 mb-5 mt-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#635BFF]/20 flex items-center justify-center shrink-0">
            <Briefcase className="h-4 w-4 text-[#635BFF]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-body text-xs font-semibold text-black">Frontend Engineer</p>
            <p className="font-body text-[10px] text-[#4A5568]">Stripe · $120–150k</p>
          </div>
          <span className="font-data text-[9px] text-neutral-400 bg-neutral-500/10 border border-neutral-500/20 rounded-full px-2 py-0.5">95%</span>
        </div>

        <button className="w-full h-10 rounded-2xl text-black font-body font-semibold text-sm shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)] mb-2.5"
          style={{ background: "linear-gradient(135deg, #525252, #FAFAFA)" }}>
          💬 Send a Message
        </button>
        <button className="w-full h-10 rounded-2xl border border-black/10 text-[#64748B] font-body text-sm">
          Keep Swiping
        </button>
      </div>
    </div>
  )
}

function StudentChatScreen() {
  const msgs = [
    { from: "them", text: "Hi! We loved your profile 🙌 Want to chat?" },
    { from: "me",   text: "Absolutely! Super excited about this role" },
    { from: "them", text: "Can you do a call Thursday at 3pm?" },
    { from: "me",   text: "Thursday works perfectly 👍" },
    { from: "them", text: "Great! Sending a calendar invite now ✅" },
  ]
  return (
    <div className="h-full flex flex-col bg-[#07090C]">
      <div className="flex items-center gap-3 px-4 pt-10 pb-3 border-b border-black/10">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#635BFF] to-[#4338CA] flex items-center justify-center shrink-0">
          <Building2 className="h-4.5 w-4.5 text-black" style={{ width: 18, height: 18 }} />
        </div>
        <div className="flex-1">
          <p className="font-body text-xs font-bold text-black">Sarah · Stripe Recruiter</p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
            <span className="font-data text-[9px] text-neutral-400">Online now</span>
          </div>
        </div>
        <div className="w-7 h-7 rounded-xl bg-[#FAFAFA]/10 border border-[#FAFAFA]/20 flex items-center justify-center">
          <Briefcase className="h-3.5 w-3.5 text-[#FAFAFA]" />
        </div>
      </div>
      <div className="flex-1 px-3 py-3 space-y-2 overflow-hidden flex flex-col justify-end">
        {msgs.map((m, i) => (
          <div key={i} className={cn("flex items-end gap-2", m.from === "me" ? "justify-end" : "justify-start")}>
            {m.from === "them" && (
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#635BFF] to-[#4338CA] flex items-center justify-center shrink-0 mb-0.5">
                <Building2 className="h-3 w-3 text-black" />
              </div>
            )}
            <div className={cn(
              "max-w-[78%] px-3 py-2 font-body text-[11px] leading-relaxed",
              m.from === "me"
                ? "rounded-2xl rounded-br-sm text-black shadow-[0_4px_12px_-3px_rgba(255,255,255,0.3)]"
                : "rounded-2xl rounded-bl-sm bg-white/6 text-neutral-700"
            )} style={m.from === "me" ? { background: "linear-gradient(135deg, #525252, #FAFAFA)" } : {}}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="px-3 pb-8 pt-2">
        <div className="flex items-center gap-2 bg-white/5 border border-black/10 rounded-2xl px-3 py-2.5">
          <span className="font-body text-[11px] text-[#1E293B] flex-1">Message Sarah…</span>
          <div className="w-7 h-7 rounded-xl flex items-center justify-center shadow-[0_0_10px_-2px_rgba(255,255,255,0.4)]"
            style={{ background: "linear-gradient(135deg, #525252, #FAFAFA)" }}>
            <Send className="h-3.5 w-3.5 text-black" />
          </div>
        </div>
      </div>
    </div>
  )
}

function StudentProfileScreen() {
  return (
    <div className="h-full flex flex-col bg-[#07090C]">
      <div className="h-28 relative" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.08))" }}>
        <div className="absolute inset-x-0 top-8 flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl border-[3px] border-[#07090C] flex items-center justify-center shadow-[0_0_20px_-5px_rgba(255,255,255,0.6)]"
            style={{ background: "linear-gradient(135deg, #525252, #FAFAFA)" }}>
            <GraduationCap className="h-8 w-8 text-black" />
          </div>
        </div>
      </div>
      <div className="flex-1 px-4 pt-2 pb-4 flex flex-col overflow-hidden">
        <div className="text-center mb-3">
          <p className="font-heading font-bold text-sm text-black">Alex Johnson</p>
          <p className="font-body text-[10px] text-[#4A5568]">B.Sc. Computer Science · MIT · 2026</p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            {["React", "Python", "Node.js", "+4"].map(s => (
              <span key={s} className="font-data text-[9px] px-1.5 py-0.5 rounded-full bg-[#FAFAFA]/10 border border-[#FAFAFA]/20 text-[#FAFAFA]">{s}</span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[{ l: "Matches", v: "12", c: "text-[#FAFAFA]" }, { l: "Views", v: "84", c: "text-neutral-400" }, { l: "Score", v: "94%", c: "text-neutral-400" }].map(({ l, v, c }) => (
            <div key={l} className="bg-white/4 border border-black/10 rounded-2xl p-2 text-center">
              <p className={cn("font-heading font-bold text-base", c)}>{v}</p>
              <p className="font-data text-[9px] text-[#4A5568]">{l}</p>
            </div>
          ))}
        </div>
        <p className="font-data text-[9px] tracking-wider uppercase text-[#334155] mb-2">Activity</p>
        <div className="space-y-1.5">
          {[
            { icon: Heart, text: "Stripe liked your profile", t: "2m ago", c: "text-[#FAFAFA]", bg: "bg-[#FAFAFA]/10" },
            { icon: MessageCircle, text: "New message from Notion", t: "1h ago", c: "text-neutral-400", bg: "bg-neutral-500/10" },
            { icon: TrendingUp, text: "Profile views +23% this week", t: "Today", c: "text-neutral-400", bg: "bg-neutral-500/10" },
          ].map(({ icon: Icon, text, t, c, bg }) => (
            <div key={text} className="flex items-center gap-2.5 p-2 rounded-xl bg-white/3 border border-black/10">
              <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0", bg)}>
                <Icon className={cn("h-3 w-3", c)} />
              </div>
              <span className="font-body text-[10px] text-[#4A5568] flex-1 leading-tight">{text}</span>
              <span className="font-data text-[9px] text-[#1E293B] shrink-0">{t}</span>
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
    <div className="h-full flex flex-col bg-[#07090C]">
      <div className="flex items-center justify-between px-5 pt-10 pb-3">
        <div>
          <p className="font-heading font-bold text-sm text-black">Find Talent</p>
          <p className="font-body text-[10px] text-[#4A5568]">Candidates matching your roles</p>
        </div>
        <div className="flex items-center gap-1 bg-neutral-500/10 border border-neutral-500/20 rounded-full px-2.5 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse" />
          <span className="font-data text-[9px] text-neutral-400">34 new</span>
        </div>
      </div>

      <div className="flex-1 relative mx-4 mb-3">
        {/* Back card */}
        <div className="absolute inset-x-3 top-2 bottom-0 rounded-3xl border border-black/10 bg-[#0D0F13] overflow-hidden"
          style={{ transform: "scale(0.95) translateY(6px)", zIndex: 1 }}>
          <div className="h-16 bg-gradient-to-br from-[#1E293B] to-[#0D0F13]" />
          <div className="px-3 -mt-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#334155] to-[#1E293B] border-2 border-[#0D0F13] flex items-center justify-center">
              <span className="font-heading font-bold text-base text-black/40">{back.name[0]}</span>
            </div>
            <p className="font-heading font-semibold text-sm text-black/40 mt-2">{back.name}</p>
            <p className="font-body text-[10px] text-[#1E293B]">{back.university}</p>
          </div>
        </div>

        {/* Front card */}
        <div className="absolute inset-0 rounded-3xl border border-black/10 overflow-hidden flex flex-col"
          style={{ background: "#0D0F13", boxShadow: `0 24px 48px -10px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06), 0 0 40px -20px ${card.accent}40`, zIndex: 2 }}>

          {/* Cover */}
          <div className="relative h-[90px] shrink-0" style={{ background: `linear-gradient(135deg, ${card.accent}20, #0D0F13)` }}>
            <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: `linear-gradient(90deg, ${card.accent}40, transparent)` }} />
            {/* School badge */}
            <div className="absolute top-3 right-3 bg-white/40 border border-black/10 rounded-xl px-2 py-1 flex items-center gap-1.5 backdrop-blur-sm">
              <GraduationCap className="h-3 w-3 text-neutral-700" />
              <span className="font-data text-[9px] text-[#64748B]">{card.university}</span>
            </div>
          </div>

          {/* Avatar overlapping cover */}
          <div className="px-4 -mt-7 mb-2 flex items-end gap-3">
            <div className="w-14 h-14 rounded-2xl border-[3px] border-[#0D0F13] flex items-center justify-center shrink-0 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.6)]"
              style={{ background: `linear-gradient(135deg, ${card.accent}60, ${card.accent}20)` }}>
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
            <div className="bg-white/3 border border-black/10 rounded-xl px-3 py-2 mb-3 flex items-start gap-2">
              <Star className="h-3 w-3 shrink-0 mt-0.5" style={{ color: card.accent }} />
              <p className="font-body text-[10px] text-neutral-700 leading-relaxed">{card.highlight}</p>
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {card.skills.map(s => (
                <span key={s} className="font-data text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: `${card.accent}12`, border: `1px solid ${card.accent}25`, color: card.accent }}>
                  {s}
                </span>
              ))}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mb-auto">
              {[{ l: "GPA", v: card.gpa }, { l: "Projects", v: card.projects.toString() }, { l: "Match", v: `${card.match}%` }].map(({ l, v }) => (
                <div key={l} className="bg-white/3 border border-black/10 rounded-xl p-2 text-center">
                  <p className="font-heading font-bold text-sm text-black">{v}</p>
                  <p className="font-data text-[9px] text-[#334155]">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Swipe buttons */}
          <div className="flex items-center justify-center gap-5 px-4 py-3 border-t border-black/10 mt-3">
            <button className="w-11 h-11 rounded-full flex items-center justify-center border border-neutral-500/30 bg-red-500/10">
              <X className="h-[18px] w-[18px] text-neutral-500" />
            </button>
            <button className="w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_24px_-4px_rgba(255,255,255,0.7)]"
              style={{ background: "linear-gradient(135deg, #525252, #FAFAFA)" }}>
              <Heart className="h-6 w-6 text-black fill-white" />
            </button>
            <button className="w-11 h-11 rounded-full flex items-center justify-center border border-neutral-500/30 bg-neutral-500/10">
              <Star className="h-[18px] w-[18px] text-neutral-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 pb-8 pt-1">
        <span className="font-body text-[10px] text-[#1E293B]">Pass</span>
        <div className="w-1 h-1 rounded-full bg-white/8" />
        <span className="font-body text-[10px] text-[#FAFAFA]/40">Interested</span>
        <div className="w-1 h-1 rounded-full bg-white/8" />
        <span className="font-body text-[10px] text-[#1E293B]">Super like</span>
      </div>
    </div>
  )
}

function RecruiterMatchScreen() {
  return (
    <div className="h-full flex flex-col bg-[#07090C] relative overflow-hidden">
      {[80, 130, 190].map((size, i) => (
        <div key={i} className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-neutral-500 opacity-[0.06] animate-ping"
          style={{ width: size, height: size, animationDelay: `${i * 0.5}s`, animationDuration: "2.5s" }} />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-500/8 via-transparent to-transparent" />

      <div className="flex-1 flex flex-col items-center justify-center px-5 relative z-10">
        <div className="flex items-center gap-0 mb-4">
          <div className="w-16 h-16 rounded-2xl border-[3px] border-[#07090C] flex items-center justify-center shadow-[0_0_20px_-4px_rgba(34,197,94,0.4)] z-10"
            style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.6), rgba(34,197,94,0.2))" }}>
            <span className="font-heading font-bold text-xl text-black">A</span>
          </div>
          <div className="w-9 h-9 rounded-full border-2 border-[#07090C] flex items-center justify-center -mx-1 z-20"
            style={{ background: "linear-gradient(135deg, #525252, #FAFAFA)", boxShadow: "0 0 16px -4px rgba(255,255,255,0.8)" }}>
            <Heart className="h-4 w-4 text-black fill-white" />
          </div>
          <div className="w-16 h-16 rounded-2xl border-[3px] border-[#07090C] flex items-center justify-center z-10"
            style={{ background: "linear-gradient(135deg, #525252, #FAFAFA)", boxShadow: "0 0 20px -4px rgba(255,255,255,0.5)" }}>
            <Building2 className="h-8 w-8 text-black" />
          </div>
        </div>

        <div className="font-data text-[10px] tracking-[0.2em] uppercase text-neutral-400 mb-1.5 bg-neutral-500/10 border border-neutral-500/20 rounded-full px-3 py-0.5">
          Candidate Match
        </div>
        <h3 className="font-heading font-bold text-2xl text-black mb-1">You got a Match!</h3>
        <p className="font-body text-xs text-[#4A5568] text-center mb-4">
          <span className="text-neutral-400 font-medium">Alex Chen</span> also liked your job posting
        </p>

        {/* Candidate preview */}
        <div className="w-full bg-white/4 border border-black/10 rounded-2xl p-3 mb-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-neutral-500/20 flex items-center justify-center shrink-0">
            <span className="font-heading font-bold text-sm text-neutral-400">A</span>
          </div>
          <div className="flex-1">
            <p className="font-body text-xs font-semibold text-black">Alex Chen · MIT</p>
            <p className="font-body text-[10px] text-[#4A5568]">React · TypeScript · Node.js</p>
          </div>
          <span className="font-data text-[9px] text-neutral-400 bg-neutral-500/10 border border-neutral-500/20 rounded-full px-2 py-0.5">97%</span>
        </div>

        <button className="w-full h-10 rounded-2xl text-black font-body font-semibold text-sm mb-2.5"
          style={{ background: "linear-gradient(135deg, #525252, #FAFAFA)" }}>
          💬 Start Interview
        </button>
        <button className="w-full h-10 rounded-2xl border border-black/10 text-[#64748B] font-body text-sm">
          View Full Profile
        </button>
      </div>
    </div>
  )
}

function RecruiterPipelineScreen() {
  const candidates = [
    { name: "Alex Chen", role: "Frontend Eng", match: 97, status: "Matched", dot: "bg-neutral-400", uni: "MIT" },
    { name: "Sara Kim",  role: "Data Analyst",  match: 93, status: "Interview", dot: "bg-[#FAFAFA]", uni: "Stanford" },
    { name: "Jake Moore", role: "Backend Eng", match: 89, status: "Reviewing", dot: "bg-blue-400", uni: "UC Berkeley" },
    { name: "Priya Patel", role: "PM Intern",  match: 84, status: "New",       dot: "bg-neutral-400", uni: "CMU" },
  ]
  return (
    <div className="h-full flex flex-col bg-[#07090C]">
      <div className="px-5 pt-10 pb-3">
        <p className="font-heading font-bold text-sm text-black">Your Pipeline</p>
        <p className="font-body text-[10px] text-[#4A5568]">Frontend Engineer · 34 matches</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 px-4 mb-3">
        {[{ l: "Total", v: "34", c: "text-black" }, { l: "Interviews", v: "6", c: "text-[#FAFAFA]" }, { l: "Hired", v: "2", c: "text-neutral-400" }].map(({ l, v, c }) => (
          <div key={l} className="bg-white/4 border border-black/10 rounded-2xl py-2.5 text-center">
            <p className={cn("font-heading font-bold text-lg", c)}>{v}</p>
            <p className="font-data text-[9px] text-[#334155]">{l}</p>
          </div>
        ))}
      </div>

      <div className="px-4 flex-1 space-y-2 overflow-hidden">
        <p className="font-data text-[9px] tracking-wider uppercase text-[#334155]">Candidates</p>
        {candidates.map((c) => (
          <div key={c.name} className="flex items-center gap-2.5 p-2.5 bg-white/3 border border-black/10 rounded-2xl">
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 font-heading font-bold text-sm text-neutral-700">
              {c.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-xs font-semibold text-black truncate">{c.name}</p>
              <p className="font-body text-[10px] text-[#4A5568] truncate">{c.uni} · {c.role}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-data text-[10px] text-[#FAFAFA] font-bold">{c.match}%</p>
              <div className="flex items-center gap-1 justify-end">
                <div className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
                <span className="font-data text-[9px] text-[#334155]">{c.status}</span>
              </div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-[#1E293B] shrink-0" />
          </div>
        ))}
      </div>
      <div className="pb-8 pt-2 px-4">
        <button className="w-full h-9 rounded-2xl border border-[#FAFAFA]/25 text-[#FAFAFA] font-body text-xs"
          style={{ background: "rgba(255,255,255,0.06)" }}>
          + Post Another Job
        </button>
      </div>
    </div>
  )
}

function RecruiterChatScreen() {
  const msgs = [
    { from: "them", text: "Hi! I'm really interested in this role 🙌" },
    { from: "me",   text: "Hey Alex! Your profile is amazing — 3.9 GPA and 12 projects!" },
    { from: "them", text: "Thanks! I built 3 of them during internships" },
    { from: "me",   text: "Can you do a technical interview Friday at 2pm?" },
    { from: "them", text: "Absolutely! Friday works perfectly ✅" },
  ]
  return (
    <div className="h-full flex flex-col bg-[#07090C]">
      <div className="flex items-center gap-3 px-4 pt-10 pb-3 border-b border-black/10">
        <div className="w-9 h-9 rounded-2xl bg-neutral-500/20 border border-neutral-500/20 flex items-center justify-center shrink-0">
          <span className="font-heading font-bold text-sm text-neutral-400">A</span>
        </div>
        <div className="flex-1">
          <p className="font-body text-xs font-bold text-black">Alex Chen · MIT</p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
            <span className="font-data text-[9px] text-neutral-400">97% match · Online</span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-[#FAFAFA]/10 border border-[#FAFAFA]/20 rounded-xl px-2 py-1">
          <Star className="h-3 w-3 text-[#FAFAFA]" />
          <span className="font-data text-[9px] text-[#FAFAFA]">Top</span>
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
            <div className={cn(
              "max-w-[78%] px-3 py-2 font-body text-[11px] leading-relaxed",
              m.from === "me"
                ? "rounded-2xl rounded-br-sm text-black"
                : "rounded-2xl rounded-bl-sm bg-white/6 text-neutral-700"
            )} style={m.from === "me" ? { background: "linear-gradient(135deg, #525252, #FAFAFA)" } : {}}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="px-3 pb-8 pt-2">
        <div className="flex items-center gap-2 bg-white/5 border border-black/10 rounded-2xl px-3 py-2.5">
          <span className="font-body text-[11px] text-[#1E293B] flex-1">Message Alex…</span>
          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #525252, #FAFAFA)" }}>
            <Send className="h-3.5 w-3.5 text-black" />
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
  { tag: "Swipe to apply", label: "Discover Jobs" },
  { tag: "Mutual interest", label: "It's a Match!" },
  { tag: "Real-time chat", label: "Chat with Recruiter" },
  { tag: "Track progress", label: "Your Dashboard" },
]
const RECRUITER_SCREENS = [
  { tag: "Find top talent", label: "Swipe Candidates" },
  { tag: "Mutual interest", label: "Candidate Match!" },
  { tag: "Manage pipeline", label: "Your Pipeline" },
  { tag: "Start hiring", label: "Chat with Candidate" },
]
const STUDENT_FEATURES = [
  { icon: Briefcase, text: "Swipe on curated job cards" },
  { icon: Heart,     text: "Instant mutual match alerts" },
  { icon: MessageCircle, text: "Chat directly with recruiters" },
  { icon: TrendingUp, text: "Track views & match score" },
]
const RECRUITER_FEATURES = [
  { icon: Users,      text: "Discover pre-vetted students" },
  { icon: Heart,      text: "Get notified on mutual matches" },
  { icon: ChevronRight, text: "Manage hiring pipeline" },
  { icon: MessageCircle, text: "Interview candidates in-app" },
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
    setScreenIdx(0); setCardIdx(0); setVisible(true)
  }, [role])

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
    <div className="h-full flex flex-col items-center justify-center gap-4 relative py-6 px-4 overflow-hidden">
      {/* Ambient glow behind phone */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-[80px] opacity-20 pointer-events-none"
        style={{ background: isRecruiter ? "radial-gradient(circle, #D4D4D4, transparent)" : "radial-gradient(circle, #FAFAFA, transparent)" }} />

      {/* Screen label */}
      <div className="text-center space-y-1 relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 border"
          style={{ background: isRecruiter ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.08)", borderColor: isRecruiter ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.2)" }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: isRecruiter ? "#D4D4D4" : "#FAFAFA" }} />
          <span className="font-data text-[10px] tracking-widest uppercase" style={{ color: isRecruiter ? "#D4D4D4" : "#FAFAFA" }}>{screen.tag}</span>
        </div>
        <p className="font-heading font-semibold text-sm text-black">{screen.label}</p>
      </div>

      {/* Phone */}
      <div className={cn("relative z-10 transition-all duration-300", visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-3 scale-[0.98]")}>
        <PhoneFrame>
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
        </PhoneFrame>
      </div>

      {/* Dot nav */}
      <div className="flex items-center gap-1.5 relative z-10">
        {screens.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} disabled={animating}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === screenIdx ? 20 : 6,
              height: 6,
              background: i === screenIdx ? (isRecruiter ? "#D4D4D4" : "#FAFAFA") : "rgba(255,255,255,0.12)",
            }} />
        ))}
      </div>

      {/* Feature list */}
      <div className="w-full max-w-[260px] space-y-1.5 relative z-10">
        {features.map(({ icon: Icon, text }, i) => (
          <div key={text} className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-300",
            i === screenIdx
              ? "border-black/10"
              : "border-transparent"
          )} style={i === screenIdx ? { background: isRecruiter ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.06)" } : {}}>
            <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300"
              style={i === screenIdx ? { background: isRecruiter ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.15)" } : { background: "rgba(255,255,255,0.03)" }}>
              <Icon className="h-3 w-3" style={{ color: i === screenIdx ? (isRecruiter ? "#D4D4D4" : "#FAFAFA") : "#334155" }} />
            </div>
            <span className="font-body text-xs transition-colors duration-300" style={{ color: i === screenIdx ? "#94A3B8" : "#334155" }}>{text}</span>
            {i === screenIdx && <CheckCircle2 className="h-3.5 w-3.5 ml-auto shrink-0" style={{ color: isRecruiter ? "#D4D4D4" : "#FAFAFA" }} />}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Micro helpers
───────────────────────────────────────────── */
const inputClass = "w-full h-11 px-4 rounded-xl bg-white/60 border border-black/10 text-black text-sm placeholder:text-black/20 focus:outline-none focus:border-[#FAFAFA]/60 focus:shadow-[0_0_15px_-5px_rgba(255,255,255,0.25)] transition-all duration-200"
const textareaClass = "w-full px-4 py-3 rounded-xl bg-white/60 border border-black/10 text-black text-sm placeholder:text-black/20 focus:outline-none focus:border-[#FAFAFA]/60 focus:shadow-[0_0_15px_-5px_rgba(255,255,255,0.25)] transition-all duration-200 resize-none"
const labelClass = "block font-data text-[11px] tracking-wider uppercase text-[#64748B] mb-1.5"

function HelpText({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-1.5 mt-1.5">
      <Info className="h-3 w-3 text-[#334155] shrink-0 mt-0.5" />
      <p className="font-body text-[11px] text-[#334155] leading-relaxed">{children}</p>
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-white gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#FAFAFA]" />
        <p className="font-body text-sm text-neutral-700">Loading your profile…</p>
      </div>
    )
  }

  return (
    <div className="h-screen bg-white flex flex-col relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-50" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#FAFAFA] opacity-[0.03] blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#525252] opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />

      {/* ── Top bar ── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-black/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#525252] to-[#FAFAFA] flex items-center justify-center shadow-[0_0_15px_-3px_rgba(255,255,255,0.5)]">
            <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
          </div>
          <span className="font-heading font-bold text-base text-black tracking-tight">
            Job<span className="gradient-text">Match</span>
          </span>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-1.5">
          {steps.map((_, i) => (
            <div key={i} className={cn(
              "h-1.5 rounded-full transition-all duration-400",
              i < step ? "w-4 bg-[#FAFAFA]"
                : i === step ? "w-6 bg-[#FAFAFA]"
                  : "w-1.5 bg-white/12"
            )} />
          ))}
        </div>

        <div className="flex items-center gap-2 text-right">
          <div className="hidden sm:block">
            <p className="font-data text-[10px] tracking-wider text-[#4A5568]">STEP {step + 1} OF {totalSteps}</p>
            <p className="font-body text-xs text-neutral-700 font-medium">{currentStep.title}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#FAFAFA]/10 border border-[#FAFAFA]/25 flex items-center justify-center">
            <span className="font-data text-[11px] font-bold text-[#FAFAFA]">{progress}%</span>
          </div>
        </div>
      </header>

      {/* ── Main two-column layout ── */}
      <div className="flex-1 flex flex-col lg:flex-row relative z-10 min-h-0">

        {/* ──────── LEFT: Form (50%) ──────── */}
        <div className="w-full lg:w-1/2 flex flex-col justify-start lg:justify-center px-5 py-8 lg:px-10 xl:px-14 overflow-y-auto">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 mb-6 overflow-x-auto">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 shrink-0">
                <div className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-data tracking-wider transition-all",
                  i < step ? "text-[#FAFAFA]/70"
                    : i === step ? "bg-[#FAFAFA]/12 border border-[#FAFAFA]/35 text-[#FAFAFA]"
                      : "text-[#334155]"
                )}>
                  {i < step
                    ? <CheckCircle2 className="h-3 w-3 text-[#FAFAFA]" />
                    : i === step
                      ? <span className="h-1.5 w-1.5 rounded-full bg-[#FAFAFA] animate-pulse" />
                      : <span className="h-1.5 w-1.5 rounded-full bg-white/10" />}
                  {s.title}
                </div>
                {i < steps.length - 1 && <ArrowRight className="h-3 w-3 text-[#1E293B] shrink-0" />}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="bg-[#0B0D10] border border-white/7 rounded-2xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)]">
            {/* Card header */}
            <div className="flex items-start gap-3 px-6 py-5 border-b border-black/10">
              <div className="w-10 h-10 rounded-xl bg-[#FAFAFA]/12 border border-[#FAFAFA]/25 flex items-center justify-center shrink-0">
                {role === "student" ? <GraduationCap className="h-5 w-5 text-[#FAFAFA]" /> : <Building2 className="h-5 w-5 text-[#FAFAFA]" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-semibold text-lg text-black">{currentStep.title}</h2>
                  {!currentStep.required && (
                    <span className="font-data text-[9px] tracking-widest uppercase text-[#334155] bg-white/4 px-2 py-0.5 rounded-full border border-black/10">
                      Optional
                    </span>
                  )}
                </div>
                <p className="font-body text-[#4A5568] text-xs mt-0.5">{currentStep.description}</p>
              </div>
            </div>

            {/* Form fields */}
            <div className="px-6 py-5 space-y-4">

              {/* ── STUDENT STEP 0: Photo & Bio ── */}
              {role === "student" && step === 0 && (
                <div className="space-y-5">
                  <div>
                    <label className={labelClass}>Profile Photo</label>
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        <div className="h-20 w-20 rounded-2xl overflow-hidden bg-white/60 border-2 border-[#FAFAFA]/20 flex items-center justify-center">
                          {avatarPreview
                            ? <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                            : <ImageIcon className="h-7 w-7 text-[#1E293B]" />}
                        </div>
                        <label className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-full bg-gradient-to-r from-[#525252] to-[#FAFAFA] flex items-center justify-center cursor-pointer shadow-[0_0_10px_-2px_rgba(255,255,255,0.5)] hover:scale-110 transition-transform">
                          <Plus className="h-3.5 w-3.5 text-black" />
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)) }
                          }} />
                        </label>
                      </div>
                      <div>
                        <p className="font-body text-sm text-black font-medium">Add a profile photo</p>
                        <p className="font-body text-xs text-[#334155] mt-0.5">JPG, PNG or GIF · Max 5MB</p>
                        <p className="font-body text-[11px] text-[#FAFAFA]/60 mt-1">3× more views with a photo</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Short Bio</label>
                    <textarea
                      className={textareaClass}
                      placeholder="E.g. CS student at MIT passionate about building products. Looking for software engineering internships in 2026."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      maxLength={300}
                    />
                    <div className="flex items-start justify-between mt-1.5">
                      <HelpText>2–3 sentences: your role, passions, and what you&apos;re seeking</HelpText>
                      <span className="font-data text-[10px] text-[#334155] shrink-0 ml-2">{bio.length}/300</span>
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
                      <option value="" className="bg-white">Select year…</option>
                      {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                        <option key={y} value={String(y)} className="bg-white">{y}</option>
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
                      <span className="font-data text-[10px] text-[#334155]">{skills.length}/20</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        className={inputClass}
                        placeholder="Type a skill and press Enter"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput) } }}
                      />
                      <button type="button" onClick={() => addSkill(skillInput)} disabled={!skillInput.trim()}
                        className="h-11 w-11 rounded-xl bg-[#FAFAFA]/15 border border-[#FAFAFA]/30 text-[#FAFAFA] hover:bg-[#FAFAFA]/25 transition-colors flex-shrink-0 flex items-center justify-center disabled:opacity-40">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {SKILL_SUGGESTIONS.filter(s => !skills.includes(s)).slice(0, 8).map(s => (
                        <button key={s} type="button" onClick={() => addSkill(s)}
                          className="text-xs px-2.5 py-1 rounded-full border border-dashed border-black/10 text-[#334155] hover:border-[#FAFAFA]/40 hover:text-[#FAFAFA] transition-all">
                          + {s}
                        </button>
                      ))}
                    </div>
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {skills.map(s => (
                          <span key={s} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#FAFAFA]/12 border border-[#FAFAFA]/25 text-[#FAFAFA]">
                            {s}
                            <button onClick={() => setSkills(skills.filter(sk => sk !== s))} className="hover:text-black transition-colors ml-0.5">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <HelpText>More skills = better job matches. Add up to 20.</HelpText>
                  </div>

                  <div>
                    <label className={labelClass}>Preferred Job Categories</label>
                    <div className="flex flex-wrap gap-1.5">
                      {JOB_CATEGORIES.map(c => (
                        <button key={c} type="button"
                          onClick={() => setPreferredCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                          className={cn("text-xs px-2.5 py-1 rounded-full border transition-all duration-200",
                            preferredCategories.includes(c)
                              ? "bg-[#FAFAFA]/18 border-[#FAFAFA]/50 text-[#FAFAFA]"
                              : "border-black/10 text-[#334155] hover:border-white/18 hover:text-neutral-700"
                          )}>
                          {c}
                        </button>
                      ))}
                    </div>
                    <HelpText>You can update these anytime from your profile</HelpText>
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
                        <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#334155]" />
                      </div>
                    </div>
                  ))}
                  <div>
                    <label className={labelClass}>Resume / CV (PDF)</label>
                    <label className={cn(
                      "flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                      resumeFile ? "border-[#FAFAFA]/40 bg-[#FAFAFA]/5" : "border-black/10 hover:border-[#FAFAFA]/25 hover:bg-[#FAFAFA]/3"
                    )}>
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", resumeFile ? "bg-[#FAFAFA]/18" : "bg-white/4")}>
                        <FileText className={cn("h-5 w-5", resumeFile ? "text-[#FAFAFA]" : "text-[#334155]")} />
                      </div>
                      {resumeFile
                        ? <div><p className="font-body text-sm text-black font-medium">{resumeFile.name}</p><p className="font-body text-xs text-[#4A5568]">Click to replace</p></div>
                        : <div><p className="font-body text-sm text-[#4A5568]">Click to upload your CV</p><p className="font-body text-xs text-[#334155]">PDF only · Max 10MB</p></div>}
                      <input type="file" accept=".pdf" className="hidden" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
                    </label>
                    <HelpText>Profiles with a resume get 5× more recruiter outreach</HelpText>
                  </div>
                  <div>
                    <label className={labelClass}>Profile video (optional)</label>
                    <label className={cn(
                      "flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                      profileVideoFile ? "border-[#FAFAFA]/40 bg-[#FAFAFA]/5" : "border-black/10 hover:border-[#FAFAFA]/25 hover:bg-[#FAFAFA]/3"
                    )}>
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", profileVideoFile ? "bg-[#FAFAFA]/18" : "bg-white/4")}>
                        <Video className={cn("h-5 w-5", profileVideoFile ? "text-[#FAFAFA]" : "text-[#334155]")} />
                      </div>
                      {profileVideoFile
                        ? <div><p className="font-body text-sm text-black font-medium">{profileVideoFile.name}</p><p className="font-body text-xs text-[#4A5568]">Click to replace</p></div>
                        : <div><p className="font-body text-sm text-[#4A5568]">Upload a short intro video</p><p className="font-body text-xs text-[#334155]">MP4, WebM · Max 50MB · or record from Profile later</p></div>}
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
                      placeholder="What does your company do? What's your mission and culture?"
                      value={companyDescription}
                      onChange={(e) => setCompanyDescription(e.target.value)}
                      rows={4}
                      maxLength={500}
                    />
                    <div className="flex items-start justify-between mt-1.5">
                      <HelpText>Students read this before swiping — make it compelling</HelpText>
                      <span className="font-data text-[10px] text-[#334155] shrink-0 ml-2">{companyDescription.length}/500</span>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Website URL</label>
                    <div className="relative">
                      <input className={cn(inputClass, "pl-10")} placeholder="https://yourcompany.com" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
                      <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#334155]" />
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
                    <HelpText>Be specific — helps students know if they&apos;re a fit before swiping</HelpText>
                  </div>
                  <div>
                    <label className={labelClass}>Profile video (optional)</label>
                    <label className={cn(
                      "flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                      profileVideoFile ? "border-[#FAFAFA]/40 bg-[#FAFAFA]/5" : "border-black/10 hover:border-[#FAFAFA]/25 hover:bg-[#FAFAFA]/3"
                    )}>
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", profileVideoFile ? "bg-[#FAFAFA]/18" : "bg-white/4")}>
                        <Video className={cn("h-5 w-5", profileVideoFile ? "text-[#FAFAFA]" : "text-[#334155]")} />
                      </div>
                      {profileVideoFile
                        ? <div><p className="font-body text-sm text-black font-medium">{profileVideoFile.name}</p><p className="font-body text-xs text-[#4A5568]">Click to replace</p></div>
                        : <div><p className="font-body text-sm text-[#4A5568]">Upload a short intro video</p><p className="font-body text-xs text-[#334155]">MP4, WebM · Max 50MB</p></div>}
                      <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => setProfileVideoFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <div className="flex items-start gap-2.5 p-4 rounded-xl bg-[#FAFAFA]/6 border border-[#FAFAFA]/15">
                    <Info className="h-4 w-4 text-[#FAFAFA] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-data text-[10px] tracking-wider uppercase text-[#FAFAFA] mb-1">Pending Admin Approval</p>
                      <p className="font-body text-xs text-[#4A5568] leading-relaxed">
                        Your recruiter account will be reviewed before going live. Usually within 24 hours — you&apos;ll receive an email. You can explore the platform in the meantime.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {stepError && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/8 border border-neutral-500/20">
                  <AlertCircle className="h-4 w-4 text-neutral-500 shrink-0 mt-0.5" />
                  <p className="font-body text-sm text-neutral-400">{stepError}</p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 pt-1">
                {step > 0 && (
                  <button type="button" onClick={() => { setStep(step - 1); setStepError(null) }}
                    className="h-11 px-5 rounded-xl border border-black/10 text-[#64748B] font-body font-medium text-sm hover:border-white/20 hover:text-black transition-all duration-200">
                    ← Back
                  </button>
                )}

                {step < totalSteps - 1 ? (
                  <>
                    {!currentStep.required && (
                      <button type="button" onClick={() => { setStep(step + 1); setStepError(null) }}
                        className="h-11 px-4 rounded-xl text-[#334155] font-body text-sm hover:text-[#64748B] transition-colors">
                        Skip
                      </button>
                    )}
                    <button type="button" onClick={() => { if (canProceed()) setStep(step + 1) }}
                      className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#525252] to-[#FAFAFA] text-black font-body font-semibold text-sm shadow-[0_0_20px_-5px_rgba(255,255,255,0.35)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.5)] transition-all duration-300">
                      Continue →
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={handleComplete} disabled={loading || uploading}
                    className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#525252] to-[#FAFAFA] text-black font-body font-semibold text-sm shadow-[0_0_20px_-5px_rgba(255,255,255,0.35)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2">
                    {loading || uploading
                      ? <><Loader2 className="h-4 w-4 animate-spin" />{uploading ? "Uploading…" : "Saving…"}</>
                      : <><Zap className="h-4 w-4" /> Complete Setup</>}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Skip all (students only) */}
          {role === "student" && (
            <div className="text-center mt-4">
              <button onClick={() => handleComplete()} disabled={loading}
                className="font-body text-xs text-[#1E293B] hover:text-[#334155] transition-colors">
                Skip setup — I&apos;ll complete my profile later
              </button>
            </div>
          )}
        </div>

        {/* ──────── RIGHT: Product demo (50%, desktop only) ──────── */}
        <div className="hidden lg:flex lg:w-1/2 border-l border-black/10 bg-[#060809] relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FAFAFA] opacity-[0.04] blur-[140px] rounded-full pointer-events-none" />
          <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-[#525252] opacity-[0.03] blur-[100px] rounded-full pointer-events-none" />
          <div className="relative w-full h-full">
            <ProductDemo role={role} />
          </div>
        </div>
      </div>
    </div>
  )
}
