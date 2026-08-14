import rawData from '../../../data/developments.json';
import { DevelopmentsData } from '@/lib/types';
import { buildRss, lastWeekDevelopments, weekWindow } from '@/lib/briefing';

export const dynamic = 'force-dynamic';

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://github.com/Jinius007/Dairy-R-D-Scouting';
}

export async function GET() {
  const data = rawData as DevelopmentsData;
  const { startIso, endIso } = weekWindow();
  const items = lastWeekDevelopments(data.developments);
  const origin = siteUrl();
  const xml = buildRss({
    title: 'Dairy R&D — last 7 days',
    description: `Rolling weekly briefing of dairy research and development (${startIso} to ${endIso}). Updates automatically. No login required.`,
    siteUrl: `${origin}/briefing`,
    feedUrl: `${origin}/feed.xml`,
    items,
  });

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800',
    },
  });
}
