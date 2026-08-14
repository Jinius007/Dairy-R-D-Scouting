import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const STEPS = [
  {
    n: '01',
    title: 'Install on this Chrome',
    body: 'Use the browser you actually work in. Each person installs once on their own Chrome — Animal Health on one machine, Robotics on another, and so on.',
  },
  {
    n: '02',
    title: 'Choose your department',
    body: 'Click the teal RD icon and pick your function. That choice stays on this Chrome. You will not be asked again.',
  },
  {
    n: '03',
    title: 'Allow notifications, then leave it',
    body: 'When Chrome asks, allow notifications and pin the icon. After that it updates itself. At 4:00 PM IST it pops today if anything new landed for your department, otherwise yesterday.',
  },
];

export default function ExtensionPage() {
  return (
    <main>
      <Header />
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-muted uppercase mb-3">
          For every department · personal Chrome
        </p>
        <h1 className="text-4xl lg:text-[2.75rem] font-bold text-ink leading-tight mb-4">
          Install once.{' '}
          <span className="font-serif italic font-medium text-accent-gold">It briefs you daily.</span>
        </h1>
        <p className="text-muted text-[15px] leading-relaxed mb-8 max-w-2xl">
          This is not email and not a desktop app. Each colleague adds a small Chrome extension,
          sets their department, and gets a 4:00 PM IST pop with that function’s latest items.
          The feed behind it refreshes every afternoon on its own.
        </p>

        <div className="flex flex-wrap gap-3 mb-12">
          <a
            href="/dairy-rd-extension.zip"
            className="px-6 py-3 bg-ink text-white text-xs font-semibold tracking-[0.14em] hover:bg-ink/90"
          >
            DOWNLOAD FOR CHROME
          </a>
          <Link
            href="/"
            className="px-6 py-3 border border-ink/15 bg-white/40 text-ink text-xs font-semibold tracking-[0.14em] hover:bg-white/70"
          >
            BACK TO THE TRACKER
          </Link>
        </div>

        <ol className="space-y-4 mb-12">
          {STEPS.map((step) => (
            <li key={step.n} className="glass rounded-2xl p-5">
              <p className="text-[11px] font-mono font-semibold text-muted mb-1">{step.n}</p>
              <h2 className="text-lg font-semibold text-ink mb-1">{step.title}</h2>
              <p className="text-sm text-muted leading-relaxed">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="glass rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-ink mb-3">Install from this zip (about a minute)</h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-muted leading-relaxed">
            <li>
              Download <span className="font-medium text-ink">dairy-rd-extension.zip</span> and unzip it
              to a folder you will not delete (for example Documents → Dairy-RD-Chrome).
            </li>
            <li>
              In Chrome open <span className="font-mono text-ink">chrome://extensions</span>
            </li>
            <li>Turn on Developer mode (top right).</li>
            <li>
              Click <span className="font-medium text-ink">Load unpacked</span> and select the unzipped
              folder (the one that contains manifest.json).
            </li>
            <li>Click the puzzle-piece icon → pin Dairy R&amp;D Department Briefing.</li>
            <li>Click the RD icon → choose your department → Allow notifications.</li>
          </ol>
        </div>

        <div className="glass rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-ink mb-3">What updates by itself after that</h2>
          <ul className="space-y-2 text-sm text-muted leading-relaxed">
            <li>
              <span className="font-medium text-ink">The briefing content</span> — the tracker ingests
              new papers and trade press at 3:00 PM IST. At 4:00 PM IST the extension fetches that
              feed and pops today, or yesterday if today is still empty for your department.
            </li>
            <li>
              <span className="font-medium text-ink">If Chrome is closed at 4 PM</span> — the pop
              happens the next time that person opens Chrome after 4:00 PM IST the same day.
            </li>
            <li>
              <span className="font-medium text-ink">Department choice</span> — saved only in that
              Chrome. Robotics staff pick Robotics; Nutrition picks Nutrition. No shared login.
            </li>
          </ul>
          <p className="text-sm text-muted mt-4 leading-relaxed">
            For a more reliable 4 PM pop, in Chrome open{' '}
            <span className="font-mono text-ink">chrome://settings/system</span> and turn on{' '}
            <span className="font-medium text-ink">Continue running background apps when Google Chrome
            is closed</span>.
          </p>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white/50 p-6">
          <h2 className="text-lg font-semibold text-ink mb-2">When you roll this out to everyone</h2>
          <p className="text-sm text-muted leading-relaxed">
            Chrome will not let a website silently install an extension. The zip method above works
            now, but each person must use Developer mode. The clean long-term path is one{' '}
            <span className="font-medium text-ink">unlisted Chrome Web Store</span> listing: you send
            the store link (or this page later), they click Add to Chrome, pick a department, and
            Chrome then auto-updates the extension itself. Until that listing exists, send colleagues
            this page and the zip.
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
