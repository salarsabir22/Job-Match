import Link from "next/link"

export default async function WaitlistSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string }>
}) {
  const sp = searchParams ? await searchParams : undefined
  const success = sp?.success === "1"

  if (!success) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col">
        <header className="w-full max-w-6xl mx-auto px-5 sm:px-8 pt-8 sm:pt-10 flex items-center justify-between gap-4">
          <Link href="/" className="font-bold text-xl sm:text-2xl tracking-tight lowercase text-black">
            jobmatch<span className="text-black">.</span>
          </Link>
          <a
            href="mailto:hello@jobmatch.app"
            className="text-sm font-medium text-black underline-offset-4 hover:underline"
          >
            Contact
          </a>
        </header>

        <main className="flex-1 flex items-center justify-center px-5 py-16">
          <div className="w-full max-w-lg text-center space-y-6">
            <h1 className="font-heading font-black text-3xl sm:text-4xl tracking-tight text-black">Waitlist</h1>
            <p className="font-body text-black/70 text-base leading-relaxed">
              Join the waitlist from the home page to get early access.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-black text-white px-8 py-3.5 text-sm font-semibold hover:bg-black/90 transition-colors"
            >
              Back home
            </Link>
          </div>
        </main>

        <footer className="w-full max-w-6xl mx-auto px-5 sm:px-8 py-8 flex justify-end">
          <p className="text-xs text-black/50 font-body">© {new Date().getFullYear()} JobMatch</p>
        </footer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-white/10">
      <header className="relative z-10 w-full max-w-[1120px] mx-auto px-5 sm:px-10 lg:px-12 pt-7 sm:pt-9 flex items-center justify-between gap-6">
        <Link
          href="/"
          className="text-lg sm:text-[1.15rem] font-semibold tracking-[-0.02em] lowercase text-white/90 hover:text-white transition-colors duration-300"
        >
          jobmatch<span className="opacity-50">.</span>
        </Link>
        <a
          href="mailto:hello@jobmatch.app"
          className="text-[13px] font-medium text-white/40 hover:text-white/80 transition-colors duration-300"
        >
          Contact
        </a>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-16 sm:py-24">
        <div
          className="w-full max-w-lg flex flex-col items-center gap-4 rounded-2xl border border-white/[0.12] bg-white/[0.06] px-6 py-10 sm:py-12 backdrop-blur-sm text-center"
          role="status"
        >
          <div
            className="flex size-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_24px_-4px_rgba(16,185,129,0.55)]"
            aria-hidden
          >
            <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
              <path
                d="M6 12l4 4 8-9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-[17px] sm:text-[18px] font-semibold tracking-[-0.02em] text-white">
              You&apos;re on the waitlist
            </h1>
            <p className="mt-2 text-[13px] sm:text-[14px] text-white/45 leading-relaxed max-w-sm mx-auto">
              Check your inbox for a confirmation email. We&apos;ll reach out again when early access opens &mdash;
              one focused note, no spam.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2 w-full sm:w-auto">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-[14px] font-semibold tracking-[-0.01em] text-black hover:bg-white/90 transition-colors"
            >
              Back home
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-transparent px-8 py-3 text-[14px] font-semibold text-white/90 hover:border-white/35 hover:bg-white/[0.06] transition-colors"
            >
              Create account
            </Link>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-[1120px] mx-auto px-5 sm:px-10 lg:px-12 py-8 flex justify-center sm:justify-end">
        <p className="text-[11px] sm:text-xs text-white/28 font-body">© {new Date().getFullYear()} JobMatch</p>
      </footer>
    </div>
  )
}
