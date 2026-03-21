import Link from "next/link"

const CONTACT_MAIL = "mailto:hello@jobmatch.app"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-white/10">
      <header className="relative z-10 w-full max-w-[1120px] mx-auto px-5 sm:px-10 lg:px-12 pt-7 sm:pt-9 flex items-center justify-between gap-6 shrink-0">
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
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 sm:py-16">
        <div className="w-full max-w-md lg:max-w-lg">{children}</div>
      </div>

      <footer className="w-full max-w-[1120px] mx-auto px-5 sm:px-10 lg:px-12 py-8 flex justify-center sm:justify-end shrink-0">
        <p className="text-[11px] sm:text-xs text-white/28 font-body">
          © {new Date().getFullYear()} JobMatch
        </p>
      </footer>
    </div>
  )
}
