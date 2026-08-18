import {
  Development,
  Filters,
  TimelinePreset,
  FunctionCategory,
} from './types';


export function getUniqueValues(developments: Development[]) {
  const regions = new Set<string>();
  const companies = new Set<string>();
  const institutions = new Set<string>();

  for (const d of developments) {
    regions.add(d.region);
    if (d.company) companies.add(d.company);
    if (d.institution) institutions.add(d.institution);
  }

  return {
    regions: Array.from(regions).sort(),
    companies: Array.from(companies).sort(),
    institutions: Array.from(institutions).sort(),
  };
}

const SEARCH_STOPWORDS = new Set([
  'a', 'an', 'the', 'of', 'and', 'or', 'in', 'on', 'for', 'to', 'with', 'from',
  'by', 'at', 'as', 'is', 'are', 'was', 'be', 'this', 'that', 'into', 'over',
]);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function tokenizeQuery(raw: string): string[] {
  return raw
    .toLowerCase()
    .split(/[^a-z0-9+]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !SEARCH_STOPWORDS.has(t));
}

function fieldHitsToken(haystack: string, token: string): boolean {
  if (token.length <= 2) {
    return new RegExp(`\\b${escapeRegExp(token)}\\b`, 'i').test(haystack);
  }
  return haystack.includes(token) || new RegExp(`\\b${escapeRegExp(token)}`, 'i').test(haystack);
}

function scoreDevelopment(d: Development, tokens: string[]): number {
  const title = d.title.toLowerCase();
  const summary = d.summary.toLowerCase();
  const extra = [
    d.company,
    d.institution,
    d.region,
    d.sourceName,
    d.function,
    d.rdType,
    ...(d.tags ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  let score = 0;
  let hits = 0;
  for (const token of tokens) {
    let hit = 0;
    if (fieldHitsToken(title, token)) hit += 8;
    if (fieldHitsToken(summary, token)) hit += 3;
    if (fieldHitsToken(extra, token)) hit += 2;
    if (hit > 0) {
      hits += 1;
      score += hit;
    }
  }
  if (hits === 0) return 0;
  score += hits * 10;
  if (hits === tokens.length) score += 24;
  return score;
}

function getDateRange(preset: TimelinePreset, customDate?: string): [Date, Date] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (customDate) {
    const d = new Date(customDate);
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
    return [d, end];
  }

  switch (preset) {
    case 'week': {
      const w = new Date(today);
      w.setDate(w.getDate() - 7);
      return [w, now];
    }
    case 'month': {
      const m = new Date(today);
      m.setMonth(m.getMonth() - 1);
      return [m, now];
    }
    case '12months': {
      const y = new Date(today);
      y.setFullYear(y.getFullYear() - 1);
      return [y, now];
    }
    case '2years': {
      const y = new Date(today);
      y.setFullYear(y.getFullYear() - 2);
      return [y, now];
    }
    case 'all':
    default:
      return [new Date('2020-01-01'), now];
  }
}

export function filterDevelopments(
  developments: Development[],
  filters: Filters
): Development[] {
  const searching = tokenizeQuery(filters.search).length > 0;
  const [start, end] = searching
    ? [new Date('2020-01-01'), new Date()]
    : getDateRange(filters.timeline, filters.customDate);

  const matched = developments.filter((d) => {
    const date = new Date(d.date);
    if (date < start || date > end) return false;

    if (filters.functions.size > 0 && !filters.functions.has(d.function))
      return false;

    if (filters.regions.size > 0 && !filters.regions.has(d.region))
      return false;

    if (filters.companies.size > 0) {
      if (!d.company || !filters.companies.has(d.company)) return false;
    }

    if (filters.institutions.size > 0) {
      if (!d.institution || !filters.institutions.has(d.institution))
        return false;
    }

    if (filters.rdTypes.size > 0 && !filters.rdTypes.has(d.rdType))
      return false;

    if (filters.search) {
      const tokens = tokenizeQuery(filters.search);
      if (tokens.length > 0) {
        if (scoreDevelopment(d, tokens) <= 0) return false;
      } else {
        const q = filters.search.toLowerCase().trim();
        const haystack = [
          d.title,
          d.summary,
          d.company,
          d.institution,
          d.region,
          d.sourceName,
          ...(d.tags ?? []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
    }

    return true;
  });

  if (!filters.search) return matched;

  const tokens = tokenizeQuery(filters.search);
  if (tokens.length === 0) return matched;

  return matched
    .map((d) => ({ d, score: scoreDevelopment(d, tokens) }))
    .sort((a, b) => b.score - a.score || new Date(b.d.date).getTime() - new Date(a.d.date).getTime())
    .map((row) => row.d);
}

export function countByFunction(
  developments: Development[]
): Record<FunctionCategory, number> {
  const counts = {} as Record<FunctionCategory, number>;
  for (const d of developments) {
    counts[d.function] = (counts[d.function] ?? 0) + 1;
  }
  return counts;
}

export function getMomentumData(developments: Development[]) {
  const months: Record<string, number> = {};
  const now = new Date();
  const start = new Date(now);
  start.setMonth(start.getMonth() - 23);

  for (let i = 0; i < 24; i++) {
    const d = new Date(start);
    d.setMonth(start.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months[key] = 0;
  }

  for (const dev of developments) {
    const d = new Date(dev.date);
    if (d >= start) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (key in months) months[key]++;
    }
  }

  return Object.entries(months).map(([month, count]) => ({
    month,
    label: new Date(month + '-01').toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit',
    }),
    count,
  }));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeDate(dateStr: string): string {
  const then = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(then.getFullYear(), then.getMonth(), then.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86_400_000);

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  if (diffDays >= 7 && diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  return formatDate(dateStr);
}

export function timelineHeading(preset: TimelinePreset, customDate?: string): string {
  if (customDate) return formatDate(customDate);
  switch (preset) {
    case 'week':
      return "This week's pulse";
    case 'month':
      return 'This month';
    case '12months':
      return 'The last 12 months';
    case '2years':
      return 'The last 2 years';
    default:
      return 'All time';
  }
}

export function getThisWeekCount(developments: Development[]): number {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return developments.filter((d) => new Date(d.date) >= weekAgo).length;
}

export function getEntityLabel(d: Development): string {
  const parts = [d.region];
  if (d.institution) parts.push(d.institution);
  else if (d.company) parts.push(d.company);
  return parts.join(' · ');
}
