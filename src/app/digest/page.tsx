'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DevelopmentGrid } from '@/components/DevelopmentCard';
import { DEPARTMENTS } from '@/lib/briefing';
import { Development } from '@/lib/types';
import { loadSettings, saveSettings, showDailyNotification } from '@/lib/desktop';
import { formatDate } from '@/lib/utils';

type DigestPayload = {
  name: string;
  slug: string;
  today: { date: string; count: number; items: Development[] };
  week: { start: string; end: string; count: number; items: Development[] };
};

export default function DigestPage() {
  const [slug, setSlug] = useState<string | null>(null);
  const [digest, setDigest] = useState<DigestPayload | null>(null);
  const [changing, setChanging] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings().then((s) => setSlug(s.department ?? null));
  }, []);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/digest/${slug}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        setDigest(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const switchDept = async (next: string) => {
    const current = await loadSettings();
    await saveSettings({ ...current, department: next, lastNotifyDate: undefined });
    setSlug(next);
    setChanging(false);
    try {
      await showDailyNotification(true);
    } catch {
      /* ignore */
    }
  };

  return (
    <main>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-muted mb-2">
          Desktop briefing · saved on this laptop
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-ink">
              {digest?.name ?? 'Your department'}{' '}
              <span className="font-serif italic font-medium text-accent-gold">daily + week</span>
            </h1>
            <p className="text-sm text-muted mt-2 max-w-2xl">
              Today&apos;s new items and this week&apos;s roll-up. Department is remembered on this
              machine. The desktop pop (once per day) includes both counts. In Chrome or Edge:
              install the app, allow notifications, then you will not be asked again.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => showDailyNotification(true)}
              className="text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 bg-white/70"
            >
              Test today&apos;s pop
            </button>
            <button
              onClick={() => setChanging((v) => !v)}
              className="text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 bg-white/70"
            >
              {changing ? 'Cancel' : 'Change department'}
            </button>
          </div>
        </div>

        {changing && (
          <div className="glass rounded-2xl p-4 mb-6 grid sm:grid-cols-3 gap-2">
            {DEPARTMENTS.map((d) => (
              <button
                key={d.slug}
                onClick={() => switchDept(d.slug)}
                className={`text-left text-sm px-3 py-2 rounded-lg ${
                  d.slug === slug ? 'bg-ink text-white' : 'hover:bg-white'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        )}

        {!slug && (
          <p className="text-sm text-muted">
            Choose your department on first launch (the setup card). Then this page fills itself.
          </p>
        )}

        {loading && slug && <p className="text-sm text-muted">Loading briefing…</p>}

        {digest && (
          <>
            <section className="mb-10">
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <h2 className="text-xl font-serif italic text-ink">Today</h2>
                <p className="text-xs text-muted">
                  {formatDate(digest.today.date)} · {digest.today.count} new
                </p>
              </div>
              {digest.today.items.length === 0 ? (
                <p className="text-sm text-muted glass rounded-2xl px-5 py-8">
                  No new {digest.name} items dated today. This week&apos;s briefing is below.
                </p>
              ) : (
                <DevelopmentGrid developments={digest.today.items} />
              )}
            </section>

            <section>
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <h2 className="text-xl font-serif italic text-ink">This week</h2>
                <p className="text-xs text-muted">
                  {formatDate(digest.week.start)} – {formatDate(digest.week.end)} · {digest.week.count}{' '}
                  items
                </p>
              </div>
              {digest.week.items.length === 0 ? (
                <p className="text-sm text-muted glass rounded-2xl px-5 py-8">
                  Nothing in this department for the last 7 days.
                </p>
              ) : (
                <DevelopmentGrid developments={digest.week.items} />
              )}
            </section>
          </>
        )}

        <p className="text-xs text-muted mt-10">
          <Link href="/" className="underline underline-offset-2">
            Back to the full tracker
          </Link>
        </p>
      </div>
      <Footer />
    </main>
  );
}
