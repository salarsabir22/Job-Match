import Link from "next/link"

export default function TermsPage() {
  return (
    <main className="min-h-[50vh] bg-white px-5 py-16 text-black">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-semibold tracking-tight">Terms</h1>
        <p className="mt-4 text-sm leading-relaxed text-black/60">
          Terms of use for JobMatch are in progress. Reach us at{" "}
          <a href="mailto:hello@jobmatch.app" className="underline underline-offset-2">
            hello@jobmatch.app
          </a>{" "}
          for product or partnership questions.
        </p>
        <Link href="/" className="mt-8 inline-block text-sm font-medium text-black/50 hover:text-black">
          ← Back home
        </Link>
      </div>
    </main>
  )
}
