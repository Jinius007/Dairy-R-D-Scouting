'use client';

import { useEffect, useState } from 'react';
import { DEPARTMENTS } from '@/lib/briefing';
import { FUNCTION_COLORS, FunctionCategory } from '@/lib/types';
import { FUNCTION_ICONS } from '@/lib/icons';
import {
  isStandalone,
  loadSettings,
  registerDesktopWorker,
  saveSettings,
  showDailyNotification,
} from '@/lib/desktop';
import { Bell, Download } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function DesktopApp() {
  const [needsSetup, setNeedsSetup] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setStandalone(isStandalone());
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    (async () => {
      const settings = await loadSettings();
      if (!settings.department) {
        setNeedsSetup(true);
        return;
      }
      try {
        await registerDesktopWorker();
        await showDailyNotification(false);
      } catch {
        /* notifications optional until permission granted */
      }
    })();

    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const chooseDepartment = async (slug: string) => {
    setBusy(true);
    setError('');
    try {
      await saveSettings({ department: slug });
      await registerDesktopWorker();
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      if (Notification.permission === 'granted') {
        await showDailyNotification(true);
      }
      setNeedsSetup(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save department');
    } finally {
      setBusy(false);
    }
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    setStandalone(isStandalone());
  };

  return (
    <>
      {!standalone && installEvent && !needsSetup && (
        <div className="fixed bottom-4 right-4 z-[70] max-w-sm glass rounded-2xl p-4 shadow-lg">
          <p className="text-sm font-semibold text-ink mb-1">Add to desktop</p>
          <p className="text-xs text-muted mb-3">
            Install once. Daily and weekly pops use the department already chosen on this laptop.
          </p>
          <button
            onClick={install}
            className="flex items-center gap-2 px-4 py-2 bg-ink text-white text-xs font-semibold rounded-lg"
          >
            <Download className="w-3.5 h-3.5" />
            Install desktop app
          </button>
        </div>
      )}

      {needsSetup && (
        <div className="fixed inset-0 z-[80] bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-muted mb-2">
              One-time setup · this laptop only
            </p>
            <h2 className="text-2xl font-bold text-ink mb-2">Which department is this desk?</h2>
            <p className="text-sm text-muted mb-5">
              Choose once. After this, the desktop icon will pop <strong>once a day</strong> with
              that department&apos;s <strong>today summary</strong> and <strong>this week&apos;s
              summary</strong>. No login. You will not be asked again on this machine.
            </p>
            <div className="grid sm:grid-cols-2 gap-2 mb-4">
              {DEPARTMENTS.map((dept) => {
                const Icon = FUNCTION_ICONS[dept.name as FunctionCategory];
                const color = FUNCTION_COLORS[dept.name as FunctionCategory];
                return (
                  <button
                    key={dept.slug}
                    disabled={busy}
                    onClick={() => chooseDepartment(dept.slug)}
                    className="flex items-center gap-3 text-left px-3 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-60"
                  >
                    <span
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: color + '18' }}
                    >
                      <Icon className="w-4 h-4" style={{ color }} />
                    </span>
                    <span className="text-sm font-medium text-ink">{dept.name}</span>
                  </button>
                );
              })}
            </div>
            <p className="flex items-center gap-2 text-[11px] text-muted">
              <Bell className="w-3.5 h-3.5" />
              Allow notifications when the browser asks — that is what creates the daily desktop pop.
            </p>
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
