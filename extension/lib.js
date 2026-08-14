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
];

export const TIMELINES = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
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

export function yesterdayIsoIst(now = new Date()) {
  const noonIst = new Date(`${istParts(now).dateIso}T12:00:00+05:30`);
  noonIst.setUTCDate(noonIst.getUTCDate() - 1);
  return istParts(noonIst).dateIso;
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
  const yestIso = yesterdayIsoIst(now);
  const end = new Date(`${todayIso}T23:59:59+05:30`);

  switch (timeline) {
    case 'today':
      return { start: startOfIso(todayIso), end, startIso: todayIso, endIso: todayIso, heading: 'Today' };
    case 'yesterday':
      return {
        start: startOfIso(yestIso),
        end: new Date(`${yestIso}T23:59:59+05:30`),
        startIso: yestIso,
        endIso: yestIso,
        heading: 'Yesterday',
      };
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
  const range = rangeFor(timeline);
  const items = departmentItems(all, slug)
    .filter((d) => inRange(d.date, range.start, range.end))
    .sort((a, b) => b.date.localeCompare(a.date));
  return { ...range, items, count: items.length };
}

export async function loadDailyPop(slug) {
  const dept = departmentBySlug(slug);
  if (!dept) throw new Error('Unknown department');
  const all = await fetchDevelopments();
  const today = itemsForTimeline(all, slug, 'today');
  const yesterday = itemsForTimeline(all, slug, 'yesterday');
  const useToday = today.count > 0;
  const focus = useToday ? today : yesterday;
  const top = focus.items[0];
  const label = useToday ? 'Today' : 'Yesterday';
  const head = useToday
    ? `Today: ${today.count} new`
    : `No new items today · Yesterday: ${yesterday.count}`;
  const body = top ? `${head}. ${top.title}` : `${head}. Open the extension for the full briefing.`;

  return {
    slug: dept.slug,
    name: dept.name,
    focus: useToday ? 'today' : 'yesterday',
    today,
    yesterday,
    items: focus.items.slice(0, 20),
    notification: {
      title: `Dairy R&D · ${dept.name} · ${label}`,
      body: body.slice(0, 220),
      context: `${focus.startIso}${focus.startIso === focus.endIso ? '' : ` – ${focus.endIso}`}`,
    },
  };
}

export async function loadFeed(slug, timeline) {
  const dept = departmentBySlug(slug);
  if (!dept) throw new Error('Unknown department');
  const all = await fetchDevelopments();
  const view = itemsForTimeline(all, slug, timeline);
  const today = itemsForTimeline(all, slug, 'today');
  const yesterday = itemsForTimeline(all, slug, 'yesterday');
  return {
    slug: dept.slug,
    name: dept.name,
    timeline,
    view,
    todayCount: today.count,
    yesterdayCount: yesterday.count,
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

export function defaultTimeline(todayCount) {
  if (isAtOrAfterFourPmIst() && todayCount > 0) return 'today';
  return 'yesterday';
}
