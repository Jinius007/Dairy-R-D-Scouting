import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const STEPS = [
  {
    n: '01',
    title: 'Download the folder from this page',
    body: 'Use the button below. Unzip it. You will get a folder named dairy-rd-extension with manifest.json inside. That is the folder Chrome loads — not the zip file.',
  },
  {
    n: '02',
    title: 'Load unpacked in Chrome',
    body: 'Open chrome://extensions, turn on Developer mode, then Load unpacked and select the dairy-rd-extension folder.',
  },
  {
    n: '03',
    title: 'Choose your department',
    body: 'Pin the teal RD icon, pick your function once, and allow notifications. At 4:00 PM IST it pops this week’s and this month’s counts.',
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
          Download the extension folder from this site, load it in Chrome, and set your department.
          At 4:00 PM IST you get that function’s latest items. The feed behind it refreshes every
          afternoon on its own.
        </p>

        <div className="flex flex-wrap gap-3 mb-12">
          <a
            href="/dairy-rd-extension.zip"
            download="dairy-rd-extension.zip"
            className="px-6 py-3 bg-ink text-white text-xs font-semibold tracking-[0.14em] hover:bg-ink/90"
          >
            DOWNLOAD EXTENSION FOLDER
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
          <h2 className="text-lg font-semibold text-ink mb-3">Install from this download (about a minute)</h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-muted leading-relaxed">
            <li>
              Click <span className="font-medium text-ink">Download extension folder</span> on this
              page. Save <span className="font-mono text-ink">dairy-rd-extension.zip</span>.
            </li>
            <li>
              Right-click the zip → <span className="font-medium text-ink">Extract All</span>. You
              should now have a folder named{' '}
              <span className="font-mono text-ink">dairy-rd-extension</span>. Open it —{' '}
              <span className="font-mono text-ink">manifest.json</span> must be inside that folder,
              not sitting loose in Downloads.
            </li>
            <li>
              In Chrome open <span className="font-mono text-ink">chrome://extensions</span>
            </li>
            <li>Turn on Developer mode (top right).</li>
            <li>
              Click <span className="font-medium text-ink">Load unpacked</span> and select the{' '}
              <span className="font-mono text-ink">dairy-rd-extension</span> folder — the unzipped
              folder that contains <span className="font-mono text-ink">manifest.json</span>. Do not
              pick the <span className="font-mono text-ink">.zip</span> file.
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
              feed and pops this week’s and this month’s counts.
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
      </section>
      <Footer />
    </main>
  );
}
