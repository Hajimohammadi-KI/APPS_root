"use client";

import { Activity, Target } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface WeekActivityPoint {
  readonly day: string;
  readonly activity: number;
}

interface ProgressInsightsProps {
  readonly level: string;
  readonly coverage: number;
  readonly mastery: number;
  readonly automaticity: number;
  readonly weekActivity: readonly WeekActivityPoint[];
}

const tooltipStyle = {
  border: "1px solid #ddd6fe",
  borderRadius: "12px",
  boxShadow: "0 14px 35px rgb(76 29 149 / 14%)",
  color: "#172033",
} as const;

export function ProgressInsights({
  level,
  coverage,
  mastery,
  automaticity,
  weekActivity,
}: Readonly<ProgressInsightsProps>) {
  const competencyData = [
    { name: "Coverage", value: Math.round(coverage), fill: "#2563eb" },
    { name: "Mastery", value: Math.round(mastery), fill: "#7c3aed" },
    {
      name: "Automaticity",
      value: Math.round(automaticity),
      fill: "#d97706",
    },
  ];
  const overall = Math.round(
    (coverage + mastery + automaticity) / competencyData.length,
  );
  const hasActivity = weekActivity.some((point) => point.activity > 0);

  return (
    <section aria-labelledby="learning-insights-title" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-kicker">Measurable learning progress</p>
          <h2 id="learning-insights-title" className="section-title">
            Your learning insights
          </h2>
        </div>
        <Badge variant="secondary">Level {level}</Badge>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="overflow-hidden border-violet-200/80 bg-gradient-to-br from-white via-violet-50/45 to-blue-50/70 shadow-[0_18px_50px_-30px_rgba(76,29,149,0.5)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-5 text-violet-700" />
              Competency profile
            </CardTitle>
            <CardDescription>
              Content seen, securely learned, and used without help.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid items-center gap-4 sm:grid-cols-[minmax(220px,0.9fr)_1.1fr]">
              <div
                className="relative mx-auto h-64 w-full max-w-72"
                role="img"
                aria-label={`Competency profile: Coverage ${Math.round(coverage)} percent, Mastery ${Math.round(mastery)} percent, Automaticity ${Math.round(automaticity)} percent`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    accessibilityLayer
                    data={competencyData}
                    innerRadius="36%"
                    outerRadius="96%"
                    startAngle={90}
                    endAngle={-270}
                    barSize={13}
                  >
                    <RadialBar
                      dataKey="value"
                      background={{ fill: "#e9e7f2" }}
                      cornerRadius={12}
                      isAnimationActive={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
                  <strong className="text-4xl tracking-tight text-slate-950">
                    {overall}%
                  </strong>
                  <span className="text-xs font-semibold text-slate-500">
                    Overall profile
                  </span>
                </div>
              </div>

              <dl className="grid gap-2">
                {competencyData.map((metric) => (
                  <div
                    key={metric.name}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border bg-white/80 p-3"
                  >
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: metric.fill }}
                      aria-hidden="true"
                    />
                    <dt className="font-medium text-slate-800">
                      {metric.name}
                    </dt>
                    <dd className="font-bold tabular-nums text-slate-950">
                      {metric.value}%
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-blue-200/80 bg-gradient-to-br from-white to-sky-50/75 shadow-[0_18px_50px_-30px_rgba(30,64,175,0.45)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5 text-blue-700" />
              Activity in the last 7 days
            </CardTitle>
            <CardDescription>
              Only learning activity that was actually saved is shown.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="h-72 w-full"
              role="img"
              aria-label="Area chart of saved learning activity in the last seven days"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  accessibilityLayer
                  data={[...weekActivity]}
                  margin={{ top: 12, right: 8, left: -22, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="english-activity-fill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.42} />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="#dbe4f0"
                    strokeDasharray="4 6"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#52627a", fontSize: 12 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="activity"
                    name="Activities"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fill="url(#english-activity-fill)"
                    activeDot={{ r: 6, fill: "#7c3aed", stroke: "white" }}
                    dot={{
                      r: 4,
                      fill: "white",
                      stroke: "#2563eb",
                      strokeWidth: 2,
                    }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {!hasActivity ? (
              <p className="mt-2 rounded-xl border border-blue-200 bg-white/85 p-3 text-sm text-slate-700">
                No activity has been saved yet. Your real learning curve will
                appear after the first exercise.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
