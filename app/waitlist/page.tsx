import Link from "next/link"

export default async function WaitlistSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string }>
}) {
  const sp = searchParams ? await searchParams : undefined
  const success = sp?.success === "1"

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
          <h1 className="font-heading font-black text-3xl sm:text-4xl tracking-tight text-black">
            {success ? "You’re on the list." : "Waitlist"}
          </h1>
          <p className="font-body text-black/70 text-base leading-relaxed">
            {success
              ? "We’ll email you when early access opens. Thanks for being early."
              : "Join the waitlist from the home page to get early access."}
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-black/20 bg-white px-8 py-3.5 text-sm font-semibold text-black hover:border-black transition-colors"
            >
              Back home
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center rounded-full bg-black text-white px-8 py-3.5 text-sm font-semibold hover:bg-black/90 transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-6xl mx-auto px-5 sm:px-8 py-8 flex justify-end">
        <p className="text-xs text-black/50 font-body">© {new Date().getFullYear()} JobMatch</p>
      </footer>
    </div>
  )
}
