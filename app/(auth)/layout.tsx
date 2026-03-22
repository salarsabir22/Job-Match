export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/15">
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
