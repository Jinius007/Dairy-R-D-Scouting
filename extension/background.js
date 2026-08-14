import {
  getSettings,
  isAtOrAfterFourPmIst,
  loadDailyPop,
  nextFourPmIstMs,
  todayLocalIso,
} from './lib.js';

const ALARM_4PM = 'dairy-rd-4pm-ist';
const ALARM_CATCHUP = 'dairy-rd-catchup';

async function setupAlarms() {
  await chrome.alarms.clear(ALARM_4PM);
  await chrome.alarms.clear(ALARM_CATCHUP);
  await chrome.alarms.create(ALARM_4PM, {
    when: nextFourPmIstMs(),
    periodInMinutes: 24 * 60,
  });
  await chrome.alarms.create(ALARM_CATCHUP, { periodInMinutes: 20 });
}

async function showDailyNotification(force = false) {
  const settings = await getSettings();
  if (!settings.department) return { skipped: 'no-department' };

  const todayIst = todayLocalIso();
  if (!force && !isAtOrAfterFourPmIst()) return { skipped: 'before-4pm-ist' };
  if (!force && settings.lastNotifyDate === todayIst) return { skipped: 'already-today' };

  const pop = await loadDailyPop(settings.department);
  await chrome.notifications.create('dairy-rd-daily', {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: pop.notification.title,
    message: pop.notification.body,
    contextMessage: pop.notification.context,
    priority: 2,
    requireInteraction: false,
  });
  await chrome.storage.local.set({
    lastNotifyDate: todayIst,
    timeline: 'week',
  });
  return { ok: true, focus: pop.focus, title: pop.notification.title };
}

chrome.runtime.onInstalled.addListener(async () => {
  await setupAlarms();
  try {
    await showDailyNotification(false);
  } catch (err) {
    console.warn('Daily pop on install skipped', err);
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await setupAlarms();
  try {
    await showDailyNotification(false);
  } catch (err) {
    console.warn('Daily pop on startup skipped', err);
  }
});

chrome.runtime.onUpdateAvailable.addListener(() => {
  chrome.runtime.reload();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_4PM && alarm.name !== ALARM_CATCHUP) return;
  try {
    await showDailyNotification(false);
  } catch (err) {
    console.warn('Daily pop alarm skipped', err);
  }
});

chrome.notifications.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL('popup.html?view=full');
  await chrome.tabs.create({ url });
  await chrome.notifications.clear('dairy-rd-daily');
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'NOTIFY_NOW') {
    showDailyNotification(true)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message || String(err) }));
    return true;
  }
  return false;
});
