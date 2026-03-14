import Link from "next/link"
import { Zap, Shield, Users, Briefcase } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#030304] flex flex-col lg:flex-row relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[400px] bg-[#F7931A] opacity-[0.04] blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-[#EA580C] opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />

      {/* Left panel (desktop only) */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] shrink-0 flex-col justify-between p-12 border-r border-white/6 relative z-10">
        <div>
          <Link href="/" className="flex items-center gap-2.5 mb-14">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center shadow-[0_0_20px_-4px_rgba(247,147,26,0.6)]">
              <Zap className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-bold text-xl text-white tracking-tight">
              Job<span className="gradient-text">Match</span>
            </span>
          </Link>

          <div className="space-y-8">
            <div>
              <h2 className="font-heading font-bold text-3xl text-white leading-tight mb-3">
                Your next opportunity<br />
                <span className="gradient-text">starts here.</span>
              </h2>
              <p className="font-body text-[#64748B] text-base leading-relaxed">
                Swipe through jobs and candidates, get mutual matches, and connect — just like a dating app, but for careers.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: Briefcase, title: "Smart job matching", desc: "AI-powered swipe matching based on your skills and preferences" },
                { icon: Users, title: "Verified companies", desc: "Every recruiter account is reviewed before going live" },
                { icon: Shield, title: "Private & secure", desc: "Your data is encrypted and never shared without consent" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F7931A]/12 border border-[#F7931A]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-[#F7931A]" />
                  </div>
                  <div>
                    <p className="font-body font-semibold text-sm text-white">{title}</p>
                    <p className="font-body text-xs text-[#4A5568] mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust badge */}
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/3 border border-white/6">
          <div className="flex -space-x-2">
            {["#EA580C", "#F7931A", "#FFD600"].map((c, i) => (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-[#030304] flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: c }}>
                {["J", "M", "S"][i]}
              </div>
            ))}
          </div>
          <div>
            <p className="font-body text-xs font-semibold text-white">Join thousands of students</p>
            <p className="font-body text-[10px] text-[#4A5568]">Finding jobs through JobMatch every week</p>
          </div>
        </div>
      </div>

      {/* Right panel — form area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-12 relative z-10 min-h-screen lg:min-h-0">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-6 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center shadow-[0_0_15px_-3px_rgba(247,147,26,0.6)]">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-heading font-bold text-lg text-white tracking-tight">
            Job<span className="gradient-text">Match</span>
          </span>
        </Link>

        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
