const DB_NAME = 'dairy-rd';
const STORE = 'prefs';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'dairy-rd-daily') {
    event.waitUntil(pushDailyDigest());
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_DIGEST') {
    event.waitUntil(pushDailyDigest(Boolean(event.data.force)));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/digest';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

function openPrefs() {
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

async function getSettings() {
  const db = await openPrefs();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readonly');
    const get = tx.objectStore(STORE).get('settings');
    get.onsuccess = () => resolve(get.result || {});
    get.onerror = () => resolve({});
  });
}

async function saveSettings(next) {
  const db = await openPrefs();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(next, 'settings');
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

async function pushDailyDigest(force) {
  const settings = await getSettings();
  const slug = settings.department;
  if (!slug) return;

  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  if (!force && settings.lastNotifyDate === todayIso) return;

  try {
    const res = await fetch(`/api/digest/${slug}`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    await self.registration.showNotification(data.notification.title, {
      body: data.notification.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'dairy-rd-daily',
      renotify: true,
      data: { url: '/digest' },
    });
    await saveSettings({ ...settings, lastNotifyDate: todayIso });
  } catch (err) {
    console.error('digest notify failed', err);
  }
}
