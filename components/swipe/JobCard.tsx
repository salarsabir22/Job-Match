import { Badge } from "@/components/ui/badge"
import { MapPin, Wifi, Calendar, Building2, ExternalLink } from "lucide-react"
import type { Job } from "@/types"

interface JobCardProps {
  job: Job
}

export function JobCard({ job }: JobCardProps) {
  const company = job.recruiter_profiles

  return (
    <div className="rounded-3xl overflow-hidden bg-card shadow-xl border border-border w-full">
      {/* Header gradient */}
      <div className="h-40 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 flex items-center justify-center relative">
        {company?.logo_url ? (
          <img src={company.logo_url} alt={company.company_name} className="h-20 w-20 rounded-2xl object-cover shadow-lg" />
        ) : (
          <div className="h-20 w-20 rounded-2xl bg-white/20 flex items-center justify-center">
            <Building2 className="h-10 w-10 text-white" />
          </div>
        )}
        <div className="absolute bottom-3 right-4">
          <Badge className="bg-white/20 text-white border-white/30 backdrop-blur text-xs">
            {job.job_type.replace("_", " ")}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <div>
          <h2 className="text-xl font-bold leading-tight">{job.title}</h2>
          {company && (
            <p className="text-muted-foreground text-sm font-medium mt-0.5 flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {company.company_name}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {job.is_remote ? (
            <span className="flex items-center gap-1"><Wifi className="h-3.5 w-3.5 text-green-500" />Remote</span>
          ) : job.location ? (
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
          ) : null}
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {job.job_type === "internship" ? "Internship" : job.job_type === "full_time" ? "Full-time" : job.job_type.replace("_", " ")}
          </span>
        </div>

        {job.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">{job.description}</p>
        )}

        {job.required_skills?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">Required Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {job.required_skills.slice(0, 6).map((s) => (
                <Badge key={s} variant="skill">{s}</Badge>
              ))}
              {job.required_skills.length > 6 && (
                <Badge variant="outline">+{job.required_skills.length - 6}</Badge>
              )}
            </div>
          </div>
        )}

        {company?.website_url && (
          <a
            href={company.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            {company.company_name} website
          </a>
        )}
      </div>
    </div>
  )
}
