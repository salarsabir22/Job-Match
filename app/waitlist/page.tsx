import Link from "next/link"

export default function WaitlistSuccessPage({ searchParams }: { searchParams?: { success?: string } }) {
  const success = searchParams?.success === "1"

  return (
    <div className="min-h-screen bg-[#030304] text-white flex items-center">
      <div className="w-full px-4 py-10 max-w-2xl mx-auto">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-sm shadow-[0_0_50px_-25px_rgba(255,255,255,0.5)] overflow-hidden">
          <div className="p-6 sm:p-10 space-y-6 text-center">
            <h1 className="font-heading font-bold text-3xl">
              {success ? "You’re on the waitlist!" : "Waitlist"}
            </h1>
            <p className="font-body text-[#94A3B8]">
              {success
                ? "Thanks! We’ll email you when early access opens."
                : "Join the waitlist to get early access."}
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-full border border-white/20 hover:border-white/60 hover:bg-white/5 transition-colors font-body font-semibold text-sm"
              >
                Back
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-gradient-to-r from-[#525252] to-[#FAFAFA] text-white font-body font-semibold text-sm tracking-wide hover:scale-[1.01] transition-all duration-200"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

