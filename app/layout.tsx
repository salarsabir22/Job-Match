import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "JobMatch – Swipe Right on Your Dream Career",
  description:
    "The Tinder-style job platform connecting students and recruiters through mutual swipe-based matching, real-time chat, and community channels.",
  openGraph: {
    title: "JobMatch – Swipe Right on Your Dream Career",
    description:
      "Swipe on jobs. Match with recruiters. Chat directly. No cold emails. No ghosting.",
    type: "website",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased bg-black text-white font-sans selection:bg-white/10`}
      >
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  )
}
