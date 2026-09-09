"use client"

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import {
  chartAxisLine,
  chartAxisTick,
  chartGridStroke,
  chartPrimary,
  chartSecondary,
} from "@/components/dashboard/chart-theme"
import { ChartTooltip } from "@/components/dashboard/ChartTooltip"
import { InsightRing } from "@/components/dashboard/InsightRing"

export type StudentActivityPoint = { label: string; applied: number; saved: number }
export type StudentMatchesPoint = { label: string; matches: number }

export function StudentDashboardCharts({
  activity,
  matchesSeries,
  matchRate,
  footnote,
}: {
  activity: StudentActivityPoint[]
  matchesSeries: StudentMatchesPoint[]
  matchRate: number
  footnote?: string
}) {
  const hasActivity = activity.some((p) => p.applied > 0 || p.saved > 0)
  const hasMatches = matchesSeries.some((p) => p.matches > 0)

  return (
    <div className="space-y-3">
      {footnote ? (
        <p className="font-body text-[13px] leading-relaxed text-muted-foreground">{footnote}</p>
      ) : null}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        <div className="rounded-2xl border border-border bg-card/80 p-4 sm:p-5 lg:col-span-2">
          <p className="font-data text-[10px] tracking-[0.16em] uppercase text-muted-foreground">Swipes over time</p>
          <p className="font-body mt-1 text-sm text-foreground">Applications vs saves · 30 days</p>
          <div className="relative mt-4 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="appliedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartPrimary} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={chartPrimary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="savedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartSecondary} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={chartSecondary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                <XAxis dataKey="label" tick={chartAxisTick} tickLine={false} axisLine={{ stroke: chartAxisLine }} interval="preserveStartEnd" minTickGap={18} />
                <YAxis allowDecimals={false} tick={chartAxisTick} tickLine={false} axisLine={false} width={28} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted-foreground)" }} />
                <Area type="monotone" dataKey="applied" name="Applied" stroke={chartPrimary} fill="url(#appliedFill)" strokeWidth={2.25} />
                <Area type="monotone" dataKey="saved" name="Saved" stroke={chartSecondary} fill="url(#savedFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            {!hasActivity ? (
              <p className="pointer-events-none absolute inset-x-8 top-10 text-center font-body text-sm text-muted-foreground">
                Axes are live. Swipe on Discover to fill this chart.
              </p>
            ) : null}
          </div>
        </div>

        <InsightRing
          value={matchRate}
          label="Match rate"
          caption="Mutual matches ÷ applications"
          emptyLabel="Apply to see a rate"
          detail="of applications matched"
        />

        <div className="rounded-2xl border border-border bg-card/80 p-4 sm:p-5 lg:col-span-3">
          <p className="font-data text-[10px] tracking-[0.16em] uppercase text-muted-foreground">New matches</p>
          <p className="font-body mt-1 text-sm text-foreground">Mutual matches per day · 30 days</p>
          <div className="relative mt-4 h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={matchesSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="matchesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartPrimary} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={chartPrimary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                <XAxis dataKey="label" tick={chartAxisTick} tickLine={false} axisLine={{ stroke: chartAxisLine }} interval="preserveStartEnd" minTickGap={18} />
                <YAxis allowDecimals={false} tick={chartAxisTick} tickLine={false} axisLine={false} width={28} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="matches"
                  name="Matches"
                  stroke={chartPrimary}
                  fill="url(#matchesFill)"
                  strokeWidth={2.25}
                />
              </AreaChart>
            </ResponsiveContainer>
            {!hasMatches ? (
              <p className="pointer-events-none absolute inset-x-8 top-8 text-center font-body text-sm text-muted-foreground">
                New matches will plot here as recruiters return interest.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
