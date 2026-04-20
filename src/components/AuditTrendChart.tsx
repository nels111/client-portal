"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
  Dot
} from "recharts";

type Point = { date: string; score: number };

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
  } catch {
    return iso;
  }
}

function bandFill(score: number) {
  if (score >= 80) return "#2c5f2d";
  if (score >= 70) return "#b8860b";
  return "#a33a2a";
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Point }> }) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  const label = p.score >= 80 ? "Healthy" : p.score >= 70 ? "Action plan" : "Intervention";
  return (
    <div className="rounded-xs border border-border-strong bg-surface px-3 py-2 shadow-e3 text-xs">
      <div className="font-mono uppercase tracking-[0.14em] text-text-soft text-[10px] mb-1">
        {formatDate(p.date)}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums text-text">{p.score}</span>
        <span className="text-xs text-text-muted">{label}</span>
      </div>
    </div>
  );
}

function ScoreDot(props: { cx?: number; cy?: number; payload?: Point }) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill={bandFill(payload.score)} stroke="#ffffff" strokeWidth={2} />
    </g>
  );
}

export default function AuditTrendChart({
  points,
  height = 260,
  showThresholdLabels = true
}: {
  points: Point[];
  height?: number;
  showThresholdLabels?: boolean;
}) {
  if (points.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xs border border-dashed border-border bg-surface-muted text-sm text-text-soft"
        style={{ height }}
      >
        No audit data yet.
      </div>
    );
  }

  const data = points.map((p) => ({ ...p, label: formatDate(p.date) }));

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="auditLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2c5f2d" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#3d7a3e" stopOpacity={0.9} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#ecebe7" strokeDasharray="3 4" vertical={false} />

          {/* Audit band shading (subtle) */}
          <ReferenceArea y1={80} y2={100} fill="#2c5f2d" fillOpacity={0.04} />
          <ReferenceArea y1={70} y2={80} fill="#b8860b" fillOpacity={0.05} />
          <ReferenceArea y1={50} y2={70} fill="#a33a2a" fillOpacity={0.05} />

          <XAxis
            dataKey="label"
            stroke="#8a8883"
            tick={{ fill: "#5f5f5f", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#e8e6e1" }}
            minTickGap={24}
          />
          <YAxis
            domain={[50, 100]}
            ticks={[50, 60, 70, 80, 90, 100]}
            stroke="#8a8883"
            tick={{ fill: "#5f5f5f", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={32}
          />

          <ReferenceLine
            y={80}
            stroke="#2c5f2d"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
            label={
              showThresholdLabels
                ? { value: "Healthy 80", position: "right", fill: "#2c5f2d", fontSize: 10 }
                : undefined
            }
          />
          <ReferenceLine
            y={70}
            stroke="#b8860b"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
            label={
              showThresholdLabels
                ? { value: "Action 70", position: "right", fill: "#b8860b", fontSize: 10 }
                : undefined
            }
          />

          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#d6d3cc", strokeDasharray: "2 4" }} />

          <Line
            type="monotone"
            dataKey="score"
            stroke="url(#auditLineGradient)"
            strokeWidth={2.5}
            dot={<ScoreDot />}
            activeDot={{ r: 7, fill: "#2c5f2d", stroke: "#ffffff", strokeWidth: 2 }}
            isAnimationActive={true}
            animationDuration={600}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
