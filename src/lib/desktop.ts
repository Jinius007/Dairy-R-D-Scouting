'use client';

const DB_NAME = 'dairy-rd';
const STORE = 'prefs';

export type DesktopSettings = {
  department?: string;
  lastNotifyDate?: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadSettings(): Promise<DesktopSettings> {
  try {
    const fromLs = localStorage.getItem('dairy-rd-dept');
    const db = await openDb();
    const stored = await new Promise<DesktopSettings>((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const get = tx.objectStore(STORE).get('settings');
      get.onsuccess = () => resolve((get.result as DesktopSettings) || {});
      get.onerror = () => resolve({});
    });
    if (fromLs && !stored.department) {
      const merged = { ...stored, department: fromLs };
      await saveSettings(merged);
      return merged;
    }
    if (stored.department) localStorage.setItem('dairy-rd-dept', stored.department);
    return stored;
  } catch {
    const department = localStorage.getItem('dairy-rd-dept') || undefined;
    return { department };
  }
}

export async function saveSettings(next: DesktopSettings): Promise<void> {
  if (next.department) localStorage.setItem('dairy-rd-dept', next.department);
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(next, 'settings');
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* localStorage is enough for the UI */
  }
}

export async function registerDesktopWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  await navigator.serviceWorker.ready;

  const periodic = (reg as ServiceWorkerRegistration & {
    periodicSync?: { register: (tag: string, opts: { minInterval: number }) => Promise<void> };
  }).periodicSync;
  if (periodic) {
    try {
      await periodic.register('dairy-rd-daily', { minInterval: 12 * 60 * 60 * 1000 });
    } catch {
      /* permission or browser support */
    }
  }
  return reg;
}

export function todayLocalIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function showDailyNotification(force = false): Promise<void> {
  const settings = await loadSettings();
  if (!settings.department) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const today = todayLocalIso();
  if (!force && settings.lastNotifyDate === today) return;

  const reg = await navigator.serviceWorker.ready;
  const worker = navigator.serviceWorker.controller || reg.active;
  if (worker) {
    worker.postMessage({ type: 'SHOW_DIGEST', force });
    return;
  }

  const res = await fetch(`/api/digest/${settings.department}`, { cache: 'no-store' });
  if (!res.ok) return;
  const data = await res.json();
  await reg.showNotification(data.notification.title, {
    body: data.notification.body,
    icon: '/icons/icon-192.png',
    tag: 'dairy-rd-daily',
    renotify: true,
    data: { url: '/digest' },
  });
  await saveSettings({ ...settings, lastNotifyDate: today });
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
