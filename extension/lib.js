export const DATA_URL =
  'https://raw.githubusercontent.com/Jinius007/Dairy-R-D-Scouting/main/data/developments.json';

export const DEPARTMENTS = [
  { slug: 'animal-health', name: 'Animal Health' },
  { slug: 'nutrition-and-feeding', name: 'Nutrition & Feeding' },
  { slug: 'breeding-and-genetics', name: 'Breeding & Genetics' },
  { slug: 'engineering-and-automation', name: 'Engineering & Automation' },
  { slug: 'robotics-and-ai', name: 'Robotics & AI' },
  { slug: 'quality-and-food-safety', name: 'Quality & Food Safety' },
  { slug: 'product-development', name: 'Product Development' },
  { slug: 'sustainability-and-traceability', name: 'Sustainability & Traceability' },
  { slug: 'digital-platforms-and-innovation', name: 'Digital Platforms & Innovation' },
  { slug: 'dairy-processing', name: 'Dairy Processing' },
  { slug: 'farm-management', name: 'Farm Management' },
  { slug: 'animal-welfare', name: 'Animal Welfare' },
  { slug: 'marketing', name: 'Marketing' },
];

export const TIMELINES = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
  { id: 'all', label: 'All time' },
];

export function departmentBySlug(slug) {
  return DEPARTMENTS.find((d) => d.slug === slug);
}

function pad(n) {
  return String(n).padStart(2, '0');
}

export function istParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type)?.value || '00';
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    dateIso: `${get('year')}-${get('month')}-${get('day')}`,
  };
}

export function todayLocalIso(now = new Date()) {
  return istParts(now).dateIso;
}

export function isAtOrAfterFourPmIst(now = new Date()) {
  const p = istParts(now);
  return p.hour * 60 + p.minute >= 16 * 60;
}

export function nextFourPmIstMs(now = new Date()) {
  const p = istParts(now);
  const minutesNow = p.hour * 60 + p.minute;
  const target = 16 * 60;
  let delta = target - minutesNow;
  if (delta <= 1) delta += 24 * 60;
  return now.getTime() + delta * 60 * 1000;
}

function startOfIso(iso) {
  return new Date(`${iso}T00:00:00+05:30`);
}

function shiftIstDays(iso, days) {
  const d = new Date(`${iso}T12:00:00+05:30`);
  d.setTime(d.getTime() + days * 86_400_000);
  return istParts(d).dateIso;
}

export function rangeFor(timeline, now = new Date()) {
  const todayIso = todayLocalIso(now);
  const end = new Date(`${todayIso}T23:59:59+05:30`);

  switch (timeline) {
    case 'week': {
      const startIso = shiftIstDays(todayIso, -6);
      return { start: startOfIso(startIso), end, startIso, endIso: todayIso, heading: 'This week' };
    }
    case 'month': {
      const startIso = shiftIstDays(todayIso, -30);
      return { start: startOfIso(startIso), end, startIso, endIso: todayIso, heading: 'This month' };
    }
    case 'year': {
      const startIso = shiftIstDays(todayIso, -365);
      return { start: startOfIso(startIso), end, startIso, endIso: todayIso, heading: 'Last 12 months' };
    }
    default:
      return {
        start: new Date('2020-01-01T00:00:00Z'),
        end,
        startIso: '2020-01-01',
        endIso: todayIso,
        heading: 'All time',
      };
  }
}

function inRange(itemDate, start, end) {
  const date = new Date(`${itemDate}T12:00:00+05:30`);
  return date >= start && date <= end;
}

export function departmentItems(all, slug) {
  const dept = departmentBySlug(slug);
  if (!dept) return [];
  return all.filter((d) => d.function === dept.name);
}

let developmentsCache = null;

export async function fetchDevelopments() {
  if (developmentsCache) return developmentsCache;
  const res = await fetch(DATA_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Could not load briefing (${res.status})`);
  const data = await res.json();
  developmentsCache = data.developments || [];
  return developmentsCache;
}

export function itemsForTimeline(all, slug, timeline) {
  const range = rangeFor(normalizeTimeline(timeline));
  const items = departmentItems(all, slug)
    .filter((d) => inRange(d.date, range.start, range.end))
    .sort((a, b) => b.date.localeCompare(a.date));
  return { ...range, items, count: items.length };
}

export async function loadDailyPop(slug) {
  const dept = departmentBySlug(slug);
  if (!dept) throw new Error('Unknown department');
  const all = await fetchDevelopments();
  const week = itemsForTimeline(all, slug, 'week');
  const month = itemsForTimeline(all, slug, 'month');
  const body = `This week: ${week.count} · This month: ${month.count}`;

  return {
    slug: dept.slug,
    name: dept.name,
    focus: 'week',
    week,
    month,
    items: week.items.slice(0, 20),
    notification: {
      title: `Dairy R&D · ${dept.name}`,
      body,
      context: 'Week and month counts',
    },
  };
}

export async function loadFeed(slug, timeline) {
  const dept = departmentBySlug(slug);
  if (!dept) throw new Error('Unknown department');
  const range = normalizeTimeline(timeline);
  const all = await fetchDevelopments();
  const view = itemsForTimeline(all, slug, range);
  const week = itemsForTimeline(all, slug, 'week');
  const month = itemsForTimeline(all, slug, 'month');
  return {
    slug: dept.slug,
    name: dept.name,
    timeline: range,
    view,
    weekCount: week.count,
    monthCount: month.count,
    afterFourPm: isAtOrAfterFourPmIst(),
  };
}

export async function getSettings() {
  return chrome.storage.local.get({
    department: '',
    lastNotifyDate: '',
    timeline: '',
  });
}

export async function saveDepartment(slug) {
  await chrome.storage.local.set({ department: slug, lastNotifyDate: '' });
}

export async function saveTimeline(timeline) {
  await chrome.storage.local.set({ timeline });
}

export function defaultTimeline() {
  return 'week';
}

export function normalizeTimeline(timeline) {
  if (TIMELINES.some((t) => t.id === timeline)) return timeline;
  return defaultTimeline();
}
