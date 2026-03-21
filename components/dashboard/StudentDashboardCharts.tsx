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
  backgroundColor: "#fff",
  border: "1px solid rgba(0,0,0,0.1)",
  borderRadius: 8,
  fontSize: 12,
}

const axisTick = { fill: "#737373", fontSize: 10 }

export function StudentDashboardCharts({
  activity,
  matchesSeries,
}: {
  activity: StudentActivityPoint[]
  matchesSeries: StudentMatchesPoint[]
}) {
  const emptyActivity = activity.every((p) => p.applied === 0 && p.saved === 0)
  const emptyMatches = matchesSeries.every((p) => p.matches === 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      <div className="rounded-xl border border-black/10 p-4 bg-white">
        <p className="font-data text-[9px] tracking-widest uppercase text-neutral-500 mb-1">Swipes over time</p>
        <p className="font-body text-sm text-black mb-3">Applications vs saved (last 30 days)</p>
        <div className="h-[240px] w-full">
          {emptyActivity ? (
            <p className="font-body text-sm text-neutral-500 h-full flex items-center justify-center">No activity in this range yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activity} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: "rgba(0,0,0,0.08)" }} />
                <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={28} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#171717", fontWeight: 600 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="applied" name="Applied" stroke="#171717" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="saved" name="Saved" stroke="#737373" strokeWidth={2} strokeDasharray="4 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-black/10 p-4 bg-white">
        <p className="font-data text-[9px] tracking-widest uppercase text-neutral-500 mb-1">Matches</p>
        <p className="font-body text-sm text-black mb-3">New matches per day (last 30 days)</p>
        <div className="h-[240px] w-full">
          {emptyMatches ? (
            <p className="font-body text-sm text-neutral-500 h-full flex items-center justify-center">No matches in this range yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={matchesSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: "rgba(0,0,0,0.08)" }} />
                <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={28} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="matches" name="Matches" stroke="#171717" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
