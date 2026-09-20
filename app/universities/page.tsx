import type { Metadata } from "next"
import { AudienceLanding } from "@/components/waitlist/AudienceLanding"

export const metadata: Metadata = {
  title: "Universities — JobMatch",
  description:
    "A campus hiring layer for career services. Students opt in, employers only chat after a mutual match, and the office stays in the loop — without running another job board.",
}

export default function UniversitiesPage() {
  return <AudienceLanding audience="university" />
}
