'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { FunctionCategory, FUNCTION_COLORS, ALL_FUNCTIONS } from '@/lib/types';

interface ChartsProps {
  momentumData: { label: string; count: number }[];
  functionCounts: Record<FunctionCategory, number>;
  onFunctionClick: (fn: FunctionCategory) => void;
}

export function ChartsSection({ momentumData, functionCounts, onFunctionClick }: ChartsProps) {
  const ranked = ALL_FUNCTIONS.map((fn) => ({
    name: fn,
    value: functionCounts[fn] ?? 0,
    color: FUNCTION_COLORS[fn],
  }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <h3 className="text-[10px] font-semibold tracking-[0.16em] text-muted uppercase mb-4">
            Momentum — Last 24 Months
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={momentumData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="momentumFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: '#9ca3af' }}
                interval={2}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={28}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.08)',
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#d97706"
                strokeWidth={2}
                fill="url(#momentumFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="text-[10px] font-semibold tracking-[0.16em] text-muted uppercase mb-4">
            Developments by Function
          </h3>
          <div className="space-y-1">
            {ranked.map(({ name, value, color }) => (
              <button
                key={name}
                onClick={() => onFunctionClick(name as FunctionCategory)}
                className="flex items-center gap-3 w-full text-left px-1 py-1.5 rounded-lg hover:bg-white/60 transition-colors group"
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[13px] text-ink flex-1 truncate group-hover:underline underline-offset-2">
                  {name}
                </span>
                <span
                  className="min-w-[1.75rem] text-center text-[12px] font-bold tabular-nums px-1.5 py-0.5 rounded-md"
                  style={{ color, backgroundColor: color + '18' }}
                >
                  {value}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
