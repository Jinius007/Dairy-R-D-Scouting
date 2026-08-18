'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { FunctionCategory, FUNCTION_COLORS } from '@/lib/types';
import { FUNCTION_ICONS, FUNCTION_SHORT } from '@/lib/icons';
import { formatDate } from '@/lib/utils';

interface HeroProps {
  totalTracked: number;
  functionCounts: Record<FunctionCategory, number>;
  search: string;
  onSearch: (query: string) => void;
  onExploreFeed: () => void;
  onSeeThisWeek: () => void;
  onFunctionClick: (fn: FunctionCategory) => void;
}

const FUNCTION_POSITIONS: { fn: FunctionCategory; angle: number }[] = [
  { fn: 'Engineering & Automation', angle: 0 },
  { fn: 'Digital Platforms & Innovation', angle: 27.7 },
  { fn: 'Quality & Food Safety', angle: 55.4 },
  { fn: 'Nutrition & Feeding', angle: 83.1 },
  { fn: 'Product Development', angle: 110.8 },
  { fn: 'Dairy Processing', angle: 138.5 },
  { fn: 'Sustainability & Traceability', angle: 166.2 },
  { fn: 'Farm Management', angle: 193.8 },
  { fn: 'Breeding & Genetics', angle: 221.5 },
  { fn: 'Animal Welfare', angle: 249.2 },
  { fn: 'Animal Health', angle: 276.9 },
  { fn: 'Robotics & AI', angle: 304.6 },
  { fn: 'Marketing', angle: 332.3 },
];

const SIZE = 440;
const CENTER = SIZE / 2;
const SPOKE = 148;
const NODE = 168;

export function Hero({
  totalTracked,
  functionCounts,
  search,
  onSearch,
  onExploreFeed,
  onSeeThisWeek,
  onFunctionClick,
}: HeroProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-muted uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            R&amp;D in the global dairy sector
          </p>
          <h1 className="text-[2.6rem] lg:text-[3.15rem] font-bold text-ink leading-[1.12] mb-6">
            Dairy research &amp; development{' '}
            <span className="font-serif italic font-medium text-accent-gold">Worldwide.</span>
          </h1>
          <p className="text-muted text-[15px] leading-relaxed mb-8 max-w-lg">
            A running, function-by-function repository of research and development reshaping dairy
            worldwide — health, genetics, feed, robotics, processing, sustainability, marketing and
            platforms — pulled from research papers, patents, industry press and academic
            institutions, and refreshed daily.
          </p>
          <form
            className="relative mb-6 max-w-lg"
            onSubmit={(e) => {
              e.preventDefault();
              onExploreFeed();
            }}
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search related articles by keyword"
              className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-accent-blue/30"
              aria-label="Search related articles"
            />
          </form>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onExploreFeed}
              className="px-6 py-3 bg-ink text-white text-xs font-semibold tracking-[0.14em] hover:bg-ink/90 transition-colors"
            >
              EXPLORE THE FEED
            </button>
            <button
              onClick={onSeeThisWeek}
              className="px-6 py-3 border border-ink/15 bg-white/40 text-ink text-xs font-semibold tracking-[0.14em] hover:bg-white/70 transition-colors"
            >
              SEE THIS WEEK
            </button>
            <Link
              href="/extension"
              className="px-6 py-3 border border-ink/15 bg-white/40 text-ink text-xs font-semibold tracking-[0.14em] hover:bg-white/70 transition-colors"
            >
              DAILY CHROME BRIEFING
            </Link>
          </div>
        </div>

        <div className="relative flex items-center justify-center overflow-hidden">
          <div
            className="relative scale-[0.68] sm:scale-90 lg:scale-100 origin-center"
            style={{ width: SIZE, height: SIZE }}
          >
            <svg
              className="absolute inset-0 pointer-events-none"
              width={SIZE}
              height={SIZE}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
            >
              {FUNCTION_POSITIONS.map(({ fn, angle }) => {
                const rad = (angle * Math.PI) / 180;
                return (
                  <line
                    key={fn}
                    x1={CENTER}
                    y1={CENTER}
                    x2={CENTER + Math.sin(rad) * SPOKE}
                    y2={CENTER - Math.cos(rad) * SPOKE}
                    stroke="#d4d4d8"
                    strokeWidth="1"
                  />
                );
              })}
            </svg>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[108px] h-[108px] rounded-full bg-white/90 shadow-sm border border-teal-100 flex flex-col items-center justify-center z-10">
              <span className="text-[10px] font-bold tracking-widest text-teal-700">R&amp;D ×</span>
              <span className="text-sm font-bold text-ink -mt-0.5">DAIRY</span>
              <span className="text-[10px] text-muted mt-0.5">{totalTracked} tracked</span>
            </div>

            {FUNCTION_POSITIONS.map(({ fn, angle }) => {
              const rad = (angle * Math.PI) / 180;
              const x = CENTER + Math.sin(rad) * NODE;
              const y = CENTER - Math.cos(rad) * NODE;
              const color = FUNCTION_COLORS[fn];
              const Icon = FUNCTION_ICONS[fn];
              const count = functionCounts[fn] ?? 0;

              return (
                <button
                  key={fn}
                  onClick={() => onFunctionClick(fn)}
                  title={fn}
                  className="absolute z-20 flex flex-col items-center gap-0.5 -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: x, top: y }}
                >
                  <div
                    className="w-11 h-11 rounded-xl bg-white/90 border flex items-center justify-center shadow-sm transition-transform group-hover:scale-110"
                    style={{ borderColor: color + '55' }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} strokeWidth={1.75} />
                  </div>
                  <span className="text-[9px] font-medium text-ink/70 leading-tight text-center max-w-[78px]">
                    {FUNCTION_SHORT[fn]}
                  </span>
                  <span className="text-[11px] font-bold leading-none" style={{ color }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function StatsBar({
  totalTracked,
  newThisWeek,
  functionsCovered,
  regionsCount,
  lastRefreshed,
  coverageStart,
}: {
  totalTracked: number;
  newThisWeek: number;
  functionsCovered: number;
  regionsCount: number;
  lastRefreshed: string;
  coverageStart: string;
}) {
  const coverageLabel = new Date(coverageStart + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  const refreshed = new Date(lastRefreshed + 'T00:00:00');
  const today = new Date();
  const dayDiff = Math.round(
    (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
      refreshed.getTime()) /
      86_400_000
  );
  const freshness =
    dayDiff <= 0 ? 'updated today · next run ~24h' : dayDiff === 1 ? 'updated yesterday · next run ~24h' : `updated ${dayDiff} days ago`;

  const stats = [
    { label: 'Developments Tracked', value: String(totalTracked), sub: `since ${coverageLabel}` },
    { label: 'New This Week', value: String(newThisWeek), sub: 'last 7 days' },
    { label: 'Functions Covered', value: String(functionsCovered), sub: 'health → platforms' },
    { label: 'Countries & Regions', value: String(regionsCount), sub: 'click a chip to isolate one' },
    { label: 'Last Refreshed', value: formatDate(lastRefreshed), sub: freshness },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      <div className="glass rounded-2xl px-2 py-4 grid grid-cols-2 md:grid-cols-5">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`px-5 py-2 ${i > 0 ? 'md:border-l border-gray-200/70' : ''}`}
          >
            <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase mb-1">
              {s.label}
            </p>
            <p className="text-[1.65rem] font-bold text-ink leading-none">{s.value}</p>
            <p className="text-[10px] text-muted mt-1.5">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
