import Link from "next/link"

const CONTACT_MAIL = "mailto:hello@jobmatch.app"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/15">
      <header className="relative z-10 w-full max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-24 pt-7 sm:pt-9 flex items-center justify-between gap-6 shrink-0">
        <Link
          href="/"
          className="text-lg sm:text-[1.15rem] font-semibold tracking-[-0.02em] lowercase text-foreground hover:opacity-80 transition-colors duration-300"
        >
          jobmatch<span className="text-muted-foreground">.</span>
        </Link>
        <a
          href={CONTACT_MAIL}
          className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-300"
        >
          Contact
        </a>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-10 sm:py-16">
        <div className="w-full max-w-md lg:max-w-lg">{children}</div>
      </div>

      <footer className="w-full max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-24 py-8 flex justify-center sm:justify-end shrink-0">
        <p className="text-[11px] sm:text-xs text-muted-foreground font-body">
          © {new Date().getFullYear()} JobMatch
        </p>
      </footer>
    </div>
  )
}
