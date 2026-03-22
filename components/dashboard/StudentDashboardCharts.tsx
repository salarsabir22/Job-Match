"use client"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

export type StudentActivityPoint = { label: string; applied: number; saved: number }
export type StudentMatchesPoint = { label: string; matches: number }

const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid rgba(10, 22, 40, 0.12)",
  borderRadius: 8,
  fontSize: 12,
}

const axisTick = { fill: "#6b7280", fontSize: 10 }
const gridStroke = "rgba(10, 22, 40, 0.08)"
const axisLine = "rgba(10, 22, 40, 0.12)"

export function StudentDashboardCharts({
  activity,
  matchesSeries,
  footnote,
}: {
  activity: StudentActivityPoint[]
  matchesSeries: StudentMatchesPoint[]
  footnote?: string
}) {
  const emptyActivity = activity.every((p) => p.applied === 0 && p.saved === 0)
  const emptyMatches = matchesSeries.every((p) => p.matches === 0)

  return (
    <div className="space-y-3">
      {footnote ? (
        <p className="font-body text-[13px] leading-relaxed text-muted-foreground">{footnote}</p>
      ) : null}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <p className="font-data text-[9px] tracking-widest uppercase text-muted-foreground">Swipes over time</p>
          <p className="font-body mt-1 text-sm text-foreground">Applications vs saves (last 30 days, UTC)</p>
          <div className="mt-4 h-[240px] w-full">
            {emptyActivity ? (
              <p className="flex h-full items-center justify-center font-body text-sm text-muted-foreground">
                No swipe activity in this window yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activity} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: axisLine }} />
                  <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={28} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "var(--foreground)", fontWeight: 600 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="applied" name="Applied" stroke="#1e3a5f" strokeWidth={2} dot={false} />
                  <Line
                    type="monotone"
                    dataKey="saved"
                    name="Saved"
                    stroke="#6b7280"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <p className="font-data text-[9px] tracking-widest uppercase text-muted-foreground">New matches</p>
          <p className="font-body mt-1 text-sm text-foreground">Mutual matches per day (last 30 days, UTC)</p>
          <div className="mt-4 h-[240px] w-full">
            {emptyMatches ? (
              <p className="flex h-full items-center justify-center font-body text-sm text-muted-foreground">
                No new matches in this window yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={matchesSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: axisLine }} />
                  <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={28} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="matches"
                    name="Matches"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
