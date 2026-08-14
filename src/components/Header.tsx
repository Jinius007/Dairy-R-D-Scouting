'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function LiveClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  return <span className="text-[11px] text-muted font-mono">{time}</span>;
}

export function TrackingBadge() {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="text-[11px] font-medium text-emerald-700">Tracking live</span>
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const onExtension = pathname === '/extension';

  return (
    <header className="sticky top-0 z-50 bg-white/55 backdrop-blur-md border-b border-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-sky-500 to-teal-400 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          </div>
          <p className="text-[11px] font-medium tracking-[0.16em] text-ink/80 uppercase font-mono">
            Global Dairy R&amp;D Scouting Tracker
          </p>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/extension"
            className={`text-[11px] font-medium ${
              onExtension ? 'text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            Chrome briefing
          </Link>
          <LiveClock />
          <TrackingBadge />
        </div>
      </div>
    </header>
  );
}
