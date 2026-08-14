import { ALL_FUNCTIONS, Development, FunctionCategory } from './types';

export interface Department {
  slug: string;
  name: string;
  functions: FunctionCategory[];
}

export const DEPARTMENTS: Department[] = ALL_FUNCTIONS.map((fn) => ({
  slug: slugify(fn),
  name: fn,
  functions: [fn],
}));

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function departmentBySlug(slug: string): Department | undefined {
  return DEPARTMENTS.find((d) => d.slug === slug);
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function weekWindow(now = new Date()): { start: Date; end: Date; startIso: string; endIso: string } {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return {
    start,
    end,
    startIso: isoDate(start),
    endIso: isoDate(end),
  };
}

export function lastWeekDevelopments(all: Development[], now = new Date()): Development[] {
  const { start, end } = weekWindow(now);
  return all
    .filter((d) => {
      const date = new Date(d.date + 'T00:00:00');
      return date >= start && date <= end;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function dayWindow(now = new Date()): { start: Date; end: Date; startIso: string } {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end, startIso: isoDate(start) };
}

export function lastDayDevelopments(all: Development[], now = new Date()): Development[] {
  const { start, end } = dayWindow(now);
  return all
    .filter((d) => {
      const date = new Date(d.date + 'T00:00:00');
      return date >= start && date <= end;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function departmentItems(all: Development[], slug: string): Development[] {
  const dept = departmentBySlug(slug);
  if (!dept) return [];
  return all.filter((d) => dept.functions.includes(d.function));
}

export function notificationCopy(name: string, todayCount: number, weekCount: number, topTitle?: string) {
  const title = `Dairy R&D · ${name}`;
  const head = `Today: ${todayCount} new · This week: ${weekCount}`;
  const body = topTitle ? `${head}. ${topTitle}` : `${head}. Open for the full daily and weekly briefing.`;
  return { title, body: body.slice(0, 220) };
}

export function byDepartment(items: Development[]): Record<string, Development[]> {
  const grouped: Record<string, Development[]> = {};
  for (const dept of DEPARTMENTS) grouped[dept.slug] = [];
  for (const item of items) {
    const dept = DEPARTMENTS.find((d) => d.functions.includes(item.function));
    if (dept) grouped[dept.slug].push(item);
  }
  return grouped;
}

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildRss(opts: {
  title: string;
  description: string;
  siteUrl: string;
  feedUrl: string;
  items: Development[];
}): string {
  const now = new Date().toUTCString();
  const itemsXml = opts.items
    .slice(0, 50)
    .map((d) => {
      const link = d.sourceUrl;
      return `    <item>
      <title>${xmlEscape(d.title)}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="false">${xmlEscape(d.id)}</guid>
      <pubDate>${new Date(d.date + 'T00:00:00Z').toUTCString()}</pubDate>
      <category>${xmlEscape(d.function)}</category>
      <description>${xmlEscape(`${d.summary} (${d.region}${d.institution ? ' · ' + d.institution : d.company ? ' · ' + d.company : ''} · ${d.sourceName})`)}</description>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(opts.title)}</title>
    <link>${xmlEscape(opts.siteUrl)}</link>
    <description>${xmlEscape(opts.description)}</description>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${xmlEscape(opts.feedUrl)}" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>`;
}
