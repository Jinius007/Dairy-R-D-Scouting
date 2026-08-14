import {
  DEPARTMENTS,
  TIMELINES,
  defaultTimeline,
  departmentBySlug,
  getSettings,
  loadFeed,
  saveDepartment,
  saveTimeline,
} from './lib.js';

const app = document.getElementById('app');

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderPicker(selected = '') {
  app.innerHTML = `
    <p class="kicker">One-time setup · this Chrome only</p>
    <h1>Which department?</h1>
    <p class="lede">Choose once. At 4:00 PM IST, Chrome pops today’s briefing if anything new landed — otherwise yesterday’s.</p>
    <div class="depts">
      ${DEPARTMENTS.map(
        (d) =>
          `<button type="button" data-slug="${esc(d.slug)}" class="${d.slug === selected ? 'active' : ''}">${esc(d.name)}</button>`,
      ).join('')}
    </div>
  `;
  app.querySelectorAll('[data-slug]').forEach((btn) => {
    btn.addEventListener('click', () => chooseDepartment(btn.getAttribute('data-slug')));
  });
}

function itemHtml(item) {
  const who = [item.region, item.institution || item.company, item.sourceName].filter(Boolean).join(' · ');
  return `<article class="item">
    <a href="${esc(item.sourceUrl)}" target="_blank" rel="noreferrer">${esc(item.title)}</a>
    <div class="meta">${esc(item.date)} · ${esc(who)}</div>
    <div class="summary">${esc((item.summary || '').slice(0, 180))}</div>
  </article>`;
}

function renderFeed(feed, errorText = '') {
  const list =
    feed.view.items.length > 0
      ? feed.view.items.slice(0, 25).map(itemHtml).join('')
      : `<p class="empty">Nothing in this window. Try Yesterday or Week.</p>`;

  app.innerHTML = `
    <p class="kicker">Pops daily at 4:00 PM IST</p>
    <h1>${esc(feed.name)}</h1>
    <p class="lede">${esc(feed.view.heading)}${feed.view.startIso === feed.view.endIso ? ` · ${esc(feed.view.startIso)}` : ` · ${esc(feed.view.startIso)} – ${esc(feed.view.endIso)}`}</p>
    <div class="toggles" role="tablist">
      ${TIMELINES.map(
        (t) =>
          `<button type="button" class="${t.id === feed.timeline ? 'on' : ''}" data-range="${t.id}">${esc(t.label)}</button>`,
      ).join('')}
    </div>
    <div class="counts">
      <div class="pill"><b>${feed.todayCount}</b><span>today</span></div>
      <div class="pill"><b>${feed.yesterdayCount}</b><span>yesterday</span></div>
      <div class="pill"><b>${feed.view.count}</b><span>in view</span></div>
    </div>
    ${list}
    ${errorText ? `<p class="hint error">${esc(errorText)}</p>` : ''}
    <div class="actions">
      <button type="button" class="primary" id="notify">Pop notification now</button>
      <button type="button" class="ghost" id="change">Change department</button>
    </div>
  `;
  app.querySelectorAll('[data-range]').forEach((btn) => {
    btn.addEventListener('click', () => switchTimeline(feed.slug, btn.getAttribute('data-range')));
  });
  document.getElementById('notify').addEventListener('click', () => notifyNow(feed.slug));
  document.getElementById('change').addEventListener('click', () => renderPicker(feed.slug));
}

async function switchTimeline(slug, timeline) {
  await saveTimeline(timeline);
  const feed = await loadFeed(slug, timeline);
  renderFeed(feed);
}

async function chooseDepartment(slug) {
  await saveDepartment(slug);
  const probe = await loadFeed(slug, 'today');
  const timeline = defaultTimeline(probe.todayCount);
  await saveTimeline(timeline);
  renderFeed(await loadFeed(slug, timeline));
  chrome.runtime.sendMessage({ type: 'NOTIFY_NOW' });
}

async function notifyNow(slug) {
  const result = await chrome.runtime.sendMessage({ type: 'NOTIFY_NOW' });
  const settings = await getSettings();
  const timeline = settings.timeline || 'yesterday';
  const feed = await loadFeed(slug || settings.department, timeline);
  if (result?.error) {
    renderFeed(feed, result.error);
    return;
  }
  renderFeed(feed);
  const status = document.querySelector('.kicker');
  if (status) status.textContent = 'Notification sent · look at the bottom-right of Windows';
}

async function boot() {
  try {
    const settings = await getSettings();
    if (!settings.department || !departmentBySlug(settings.department)) {
      renderPicker();
      return;
    }
    const probe = await loadFeed(settings.department, 'today');
    const timeline = settings.timeline || defaultTimeline(probe.todayCount);
    renderFeed(await loadFeed(settings.department, timeline));
  } catch (err) {
    app.innerHTML = `<p class="kicker">Dairy R&amp;D Scouting</p><h1>Could not load</h1><p class="lede error">${esc(err.message || err)}</p>`;
  }
}

boot();
