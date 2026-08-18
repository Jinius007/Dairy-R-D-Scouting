'use client';

import { Development, FUNCTION_COLORS } from '@/lib/types';
import { FUNCTION_ICONS } from '@/lib/icons';
import { formatRelativeDate, getEntityLabel } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

export function DevelopmentCard({ development: d }: { development: Development }) {
  const color = FUNCTION_COLORS[d.function];
  const Icon = FUNCTION_ICONS[d.function];

  return (
    <article className="bg-white/75 backdrop-blur-sm rounded-2xl p-5 border border-white/80 shadow-sm card-hover flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} strokeWidth={2} />
          <span
            className="text-[10px] font-semibold tracking-[0.12em] uppercase truncate"
            style={{ color }}
          >
            {d.function}
          </span>
        </div>
        <time className="text-[11px] text-muted whitespace-nowrap">{formatRelativeDate(d.date)}</time>
      </div>

      <h3 className="text-[15px] font-semibold text-ink leading-snug mb-2">{d.title}</h3>

      <p className="text-[13px] text-muted leading-relaxed mb-4 line-clamp-3 flex-1">{d.summary}</p>

      <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        <p className="text-[11px] text-ink/70 truncate">{getEntityLabel(d)}</p>
        <a
          href={d.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] font-medium text-ink/60 hover:text-accent-blue flex-shrink-0"
        >
          {d.sourceName}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </article>
  );
}

export function DevelopmentGrid({ developments }: { developments: Development[] }) {
  if (developments.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-muted text-sm">No related articles match those keywords.</p>
        <p className="text-xs text-muted mt-1">Try different terms, or clear search and adjust filters.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {developments.map((d) => (
          <DevelopmentCard key={d.id} development={d} />
        ))}
      </div>
    </div>
  );
}
