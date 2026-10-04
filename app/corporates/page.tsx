import type { Metadata } from "next"
import { AudienceLanding } from "@/components/waitlist/AudienceLanding"

export const metadata: Metadata = {
  title: "Corporates — swypejobs",
  description:
    "Campus hiring from intent, not résumé floods. Post internships and new-grad roles, swipe students who raised a hand, and chat only after a mutual match.",
}

export default function CorporatesPage() {
  return <AudienceLanding audience="corporate" />
}
