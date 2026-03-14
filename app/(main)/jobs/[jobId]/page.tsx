import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Wifi, Calendar } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { JobToggleButton } from "./JobToggleButton"

export default async function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: job } = await supabase
    .from("jobs").select("*").eq("id", jobId).eq("recruiter_id", user!.id).single()

  if (!job) notFound()

  const { count: swipeCount } = await supabase
    .from("job_swipes").select("*", { count: "exact", head: true }).eq("job_id", jobId).eq("direction", "right")

  const { count: matchCount } = await supabase
    .from("matches").select("*", { count: "exact", head: true }).eq("job_id", jobId)

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center gap-3 py-2">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link href="/jobs"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-xl font-bold flex-1 truncate">{job.title}</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-violet-50 p-4 text-center">
          <p className="text-2xl font-bold text-primary">{swipeCount || 0}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Interested Students</p>
        </div>
        <div className="rounded-xl bg-green-50 p-4 text-center">
          <p className="text-2xl font-bold text-success">{matchCount || 0}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Matches</p>
        </div>
      </div>

      <div className="rounded-xl border border-border p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant={job.is_active ? "default" : "secondary"}>{job.is_active ? "Active" : "Paused"}</Badge>
          <Badge variant="outline" className="capitalize">{job.job_type.replace("_", " ")}</Badge>
          {job.is_remote && <Badge variant="outline"><Wifi className="h-3 w-3 mr-1" />Remote</Badge>}
          {job.location && !job.is_remote && <Badge variant="outline"><MapPin className="h-3 w-3 mr-1" />{job.location}</Badge>}
        </div>
        {job.description && (
          <div>
            <h3 className="font-semibold text-sm mb-1">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{job.description}</p>
          </div>
        )}
        {job.required_skills?.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-2">Required Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {(job.required_skills as string[]).map(s => <Badge key={s} variant="skill">{s}</Badge>)}
            </div>
          </div>
        )}
        {job.nice_to_have_skills?.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-2">Nice to Have</h3>
            <div className="flex flex-wrap gap-1.5">
              {(job.nice_to_have_skills as string[]).map(s => <Badge key={s} variant="outline">{s}</Badge>)}
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />Posted {formatDate(job.created_at)}
        </p>
      </div>

      <JobToggleButton jobId={job.id} isActive={job.is_active} />
    </div>
  )
}
