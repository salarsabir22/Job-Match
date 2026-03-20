import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import { Space_Grotesk, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { SpeedInsights } from "@vercel/speed-insights/next"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
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
        className={`${geist.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased bg-white text-black`}
      >
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  )
}
