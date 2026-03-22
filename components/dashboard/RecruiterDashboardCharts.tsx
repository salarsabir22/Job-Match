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
  backgroundColor: "#ffffff",
  border: "1px solid rgba(10, 22, 40, 0.12)",
  borderRadius: 8,
  fontSize: 12,
}

const axisTick = { fill: "#6b7280", fontSize: 10 }
const gridStroke = "rgba(10, 22, 40, 0.08)"
const axisLine = "rgba(10, 22, 40, 0.12)"

export function RecruiterDashboardCharts({
  timeline,
  jobBars,
  footnote,
}: {
  timeline: RecruiterTimelinePoint[]
  jobBars: RecruiterJobBarPoint[]
  footnote?: string
}) {
  const emptyTimeline = timeline.every((p) => p.applications === 0 && p.matches === 0)
  const emptyBars = jobBars.length === 0 || jobBars.every((p) => p.applications === 0)

  return (
    <div className="space-y-3">
      {footnote ? (
        <p className="font-body text-[13px] leading-relaxed text-muted-foreground">{footnote}</p>
      ) : null}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <p className="font-data text-[9px] tracking-widest uppercase text-muted-foreground">Pipeline trend</p>
          <p className="font-body mt-1 text-sm text-foreground">Inbound applications vs new matches (last 30 days, UTC)</p>
          <div className="mt-4 h-[260px] w-full">
            {emptyTimeline ? (
              <p className="flex h-full items-center justify-center font-body text-sm text-muted-foreground">
                No inbound or match activity in this window yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: axisLine }} />
                  <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={28} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    name="Applications"
                    stroke="#6b7280"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line type="monotone" dataKey="matches" name="Matches" stroke="var(--primary)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <p className="font-data text-[9px] tracking-widest uppercase text-muted-foreground">Volume by role</p>
          <p className="font-body mt-1 text-sm text-foreground">Applications received per posting (top roles)</p>
          <div className="mt-4 h-[260px] w-full">
            {emptyBars ? (
              <p className="flex h-full items-center justify-center font-body text-sm text-muted-foreground">
                Post a role to start collecting inbound applications.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={jobBars} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={axisTick} tickLine={false} axisLine={{ stroke: axisLine }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ ...axisTick, fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="applications"
                    name="Applications"
                    fill="var(--primary)"
                    fillOpacity={0.35}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
