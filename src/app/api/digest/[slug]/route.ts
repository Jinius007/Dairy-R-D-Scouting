import rawData from '../../../../../data/developments.json';
import { DevelopmentsData } from '@/lib/types';
import {
  dayWindow,
  departmentBySlug,
  departmentItems,
  lastDayDevelopments,
  lastWeekDevelopments,
  notificationCopy,
  weekWindow,
} from '@/lib/briefing';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const dept = departmentBySlug(params.slug);
  if (!dept) {
    return Response.json({ error: 'Unknown department' }, { status: 404 });
  }

  const data = rawData as DevelopmentsData;
  const scoped = departmentItems(data.developments, dept.slug);
  const todayItems = lastDayDevelopments(scoped);
  const weekItems = lastWeekDevelopments(scoped);
  const day = dayWindow();
  const week = weekWindow();
  const top = todayItems[0] ?? weekItems[0];
  const notify = notificationCopy(dept.name, todayItems.length, weekItems.length, top?.title);

  return Response.json({
    slug: dept.slug,
    name: dept.name,
    generatedAt: new Date().toISOString(),
    today: {
      date: day.startIso,
      count: todayItems.length,
      items: todayItems.slice(0, 12),
    },
    week: {
      start: week.startIso,
      end: week.endIso,
      count: weekItems.length,
      items: weekItems.slice(0, 20),
    },
    notification: notify,
  });
}
