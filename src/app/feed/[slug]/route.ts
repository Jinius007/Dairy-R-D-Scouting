import rawData from '../../../../data/developments.json';
import { DevelopmentsData } from '@/lib/types';
import {
  buildRss,
  byDepartment,
  departmentBySlug,
  lastWeekDevelopments,
  weekWindow,
} from '@/lib/briefing';

export const dynamic = 'force-dynamic';

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://github.com/Jinius007/Dairy-R-D-Scouting';
}

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const dept = departmentBySlug(params.slug);
  if (!dept) {
    return new Response('Unknown department', { status: 404 });
  }

  const data = rawData as DevelopmentsData;
  const { startIso, endIso } = weekWindow();
  const grouped = byDepartment(lastWeekDevelopments(data.developments));
  const items = grouped[dept.slug] ?? [];
  const origin = siteUrl();

  const xml = buildRss({
    title: `Dairy R&D — ${dept.name} — last 7 days`,
    description: `Weekly ${dept.name} briefing (${startIso} to ${endIso}). Updates automatically. No login required.`,
    siteUrl: `${origin}/briefing/${dept.slug}`,
    feedUrl: `${origin}/feed/${dept.slug}`,
    items,
  });

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800',
    },
  });
}
