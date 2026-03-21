"use client"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

export type RecruiterTimelinePoint = { label: string; applications: number; matches: number }
export type RecruiterJobBarPoint = { name: string; applications: number }

const tooltipStyle = {
  backgroundColor: "#fff",
  border: "1px solid rgba(0,0,0,0.1)",
  borderRadius: 8,
  fontSize: 12,
}

const axisTick = { fill: "#737373", fontSize: 10 }

export function RecruiterDashboardCharts({
  timeline,
  jobBars,
}: {
  timeline: RecruiterTimelinePoint[]
  jobBars: RecruiterJobBarPoint[]
}) {
  const emptyTimeline = timeline.every((p) => p.applications === 0 && p.matches === 0)
  const emptyBars = jobBars.length === 0 || jobBars.every((p) => p.applications === 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      <div className="rounded-xl border border-black/10 p-4 bg-white">
        <p className="font-data text-[9px] tracking-widest uppercase text-neutral-500 mb-1">Pipeline trend</p>
        <p className="font-body text-sm text-black mb-3">Applications and matches (last 30 days)</p>
        <div className="h-[260px] w-full">
          {emptyTimeline ? (
            <p className="font-body text-sm text-neutral-500 h-full flex items-center justify-center">No data in this range yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: "rgba(0,0,0,0.08)" }} />
                <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={28} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="applications"
                  name="Applications"
                  stroke="#525252"
                  strokeWidth={2}
                  dot={false}
                />
                <Line type="monotone" dataKey="matches" name="Matches" stroke="#171717" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-black/10 p-4 bg-white">
        <p className="font-data text-[9px] tracking-widest uppercase text-neutral-500 mb-1">By job</p>
        <p className="font-body text-sm text-black mb-3">Applications received per posting (top roles)</p>
        <div className="h-[260px] w-full">
          {emptyBars ? (
            <p className="font-body text-sm text-neutral-500 h-full flex items-center justify-center">Post a job to see application volume.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={jobBars} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={axisTick} tickLine={false} axisLine={{ stroke: "rgba(0,0,0,0.08)" }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ ...axisTick, fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="applications" name="Applications" fill="rgba(23,23,23,0.22)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
