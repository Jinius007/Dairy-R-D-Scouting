/**
 * Send daily + weekly department digests via Resend.
 * API key from RESEND_API_KEY env / GitHub secret — never commit the key.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  DEPARTMENTS,
  departmentItems,
  lastDayDevelopments,
  lastWeekDevelopments,
  weekWindow,
  dayWindow,
} from '../src/lib/briefing';
import { Development, DevelopmentsData } from '../src/lib/types';

const DATA_PATH = path.join(process.cwd(), 'data', 'developments.json');
const RECIPIENTS_PATH = path.join(process.cwd(), 'data', 'recipients.json');

type RecipientsFile = {
  fromName: string;
  fromEmail: string;
  testRecipients: string[];
  departments: Record<string, { emails: string[] }>;
};

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function itemList(items: Development[], limit: number): string {
  if (items.length === 0) {
    return `<p style="color:#6b7280;font-size:14px;">No items in this window.</p>`;
  }
  return items
    .slice(0, limit)
    .map((d) => {
      const who = [d.region, d.institution || d.company, d.sourceName].filter(Boolean).join(' · ');
      return `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #eee;">
          <a href="${esc(d.sourceUrl)}" style="color:#111;font-weight:600;text-decoration:none;">${esc(d.title)}</a>
          <div style="color:#6b7280;font-size:12px;margin-top:4px;">${esc(d.date)} · ${esc(who)}</div>
          <div style="color:#374151;font-size:13px;margin-top:6px;line-height:1.45;">${esc(d.summary.slice(0, 280))}</div>
        </td>
      </tr>`;
    })
    .join('');
}

function buildHtml(opts: {
  name: string;
  todayDate: string;
  weekStart: string;
  weekEnd: string;
  today: Development[];
  week: Development[];
}): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;background:#f4f1ea;font-family:Georgia,serif;">
  <div style="max-width:640px;margin:0 auto;padding:24px;">
    <p style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#6b7280;">Dairy R&amp;D Scouting · no login required</p>
    <h1 style="font-size:26px;color:#111;margin:8px 0 4px;">${esc(opts.name)}</h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">Daily summary and this week's roll-up</p>
    <div style="background:#fff;border-radius:16px;padding:20px 24px;margin-bottom:16px;">
      <h2 style="font-size:16px;margin:0 0 8px;">Today · ${esc(opts.todayDate)} · ${opts.today.length} new</h2>
      <table width="100%" cellpadding="0" cellspacing="0">${itemList(opts.today, 12)}</table>
    </div>
    <div style="background:#fff;border-radius:16px;padding:20px 24px;">
      <h2 style="font-size:16px;margin:0 0 8px;">This week · ${esc(opts.weekStart)} – ${esc(opts.weekEnd)} · ${opts.week.length} items</h2>
      <table width="100%" cellpadding="0" cellspacing="0">${itemList(opts.week, 20)}</table>
    </div>
    <p style="color:#9ca3af;font-size:11px;margin-top:20px;">Sent automatically from Dairy R&amp;D Scouting. This is not a personal mailbox.</p>
  </div>
</body>
</html>`;
}

function uniqueEmails(list: string[]): string[] {
  return [...new Set(list.map((e) => e.trim().toLowerCase()).filter((e) => e.includes('@')))];
}

/** Resend rejects unverified domains such as example.com. Use their onboarding sender until a domain is verified. */
const RESEND_ONBOARDING_FROM = 'Dairy R&D Scouting <beth.t@example.com>';

function usableFrom(value: string | undefined): string | null {
  const trimmed = (value || '').trim();
  if (!trimmed || /example\.com/i.test(trimmed)) return null;
  return trimmed;
}

function resolveFrom(recipients: RecipientsFile): string {
  return (
    usableFrom(process.env.RESEND_FROM) ||
    usableFrom(
      recipients.fromEmail ? `${recipients.fromName} <${recipients.fromEmail}>` : '',
    ) ||
    RESEND_ONBOARDING_FROM
  );
}

async function sendResend(opts: {
  apiKey: string;
  from: string;
  to: string[];
  subject: string;
  html: string;
}): Promise<void> {
  if (opts.to.length === 0) return;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: opts.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend ${res.status}: ${text}`);
  }
}

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is missing. Set it as a GitHub secret or in .env.local.');
  }

  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8')) as DevelopmentsData;
  const recipients = JSON.parse(fs.readFileSync(RECIPIENTS_PATH, 'utf-8')) as RecipientsFile;
  const fromEmail = resolveFrom(recipients);
  console.log(`Sending from ${fromEmail}`);
  const extraTest = (process.env.DIGEST_TEST_TO || '')
    .split(/[,\s]+/)
    .map((e) => e.trim())
    .filter(Boolean);
  const testRecipients = uniqueEmails([...(recipients.testRecipients || []), ...extraTest]);

  const day = dayWindow();
  const week = weekWindow();
  let sent = 0;

  for (const dept of DEPARTMENTS) {
    const emails = uniqueEmails(recipients.departments[dept.slug]?.emails ?? []);
    if (emails.length === 0) continue;
    const scoped = departmentItems(data.developments, dept.slug);
    const today = lastDayDevelopments(scoped);
    const weekItems = lastWeekDevelopments(scoped);
    await sendResend({
      apiKey,
      from: fromEmail,
      to: emails,
      subject: `Dairy R&D · ${dept.name} · ${day.startIso} · today ${today.length} · week ${weekItems.length}`,
      html: buildHtml({
        name: dept.name,
        todayDate: day.startIso,
        weekStart: week.startIso,
        weekEnd: week.endIso,
        today,
        week: weekItems,
      }),
    });
    sent += emails.length;
    console.log(`Sent ${dept.name} to ${emails.length} recipient(s)`);
  }

  if (testRecipients.length > 0) {
    const rows = DEPARTMENTS.map((dept) => {
      const scoped = departmentItems(data.developments, dept.slug);
      const today = lastDayDevelopments(scoped);
      const weekItems = lastWeekDevelopments(scoped);
      const top = (today[0] ?? weekItems[0])?.title ?? '—';
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600;">${esc(dept.name)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">${today.length} today</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">${weekItems.length} this week</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;color:#374151;font-size:13px;">${esc(top)}</td>
      </tr>`;
    }).join('');

    const firstBusy = DEPARTMENTS.map((dept) => {
      const scoped = departmentItems(data.developments, dept.slug);
      return { dept, today: lastDayDevelopments(scoped), week: lastWeekDevelopments(scoped) };
    }).find((d) => d.today.length + d.week.length > 0);

    const sample = firstBusy
      ? buildHtml({
          name: firstBusy.dept.name,
          todayDate: day.startIso,
          weekStart: week.startIso,
          weekEnd: week.endIso,
          today: firstBusy.today,
          week: firstBusy.week,
        })
      : '<p>No items this week.</p>';

    await sendResend({
      apiKey,
      from: fromEmail,
      to: testRecipients,
      subject: `Dairy R&D · all departments · ${day.startIso} (test)`,
      html: `<!DOCTYPE html><html><body style="margin:0;background:#f4f1ea;font-family:Georgia,serif;">
        <div style="max-width:720px;margin:0 auto;padding:24px;">
          <h1 style="font-size:22px;">All-department snapshot</h1>
          <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
          <p style="margin-top:28px;color:#6b7280;font-size:13px;">Sample full briefing (first department with items):</p>
        </div>
        ${sample}
      </body></html>`,
    });
    sent += testRecipients.length;
    console.log(`Sent combined test briefing to ${testRecipients.length} recipient(s)`);
  }

  if (sent === 0) {
    console.log('No recipients configured. Add emails in data/recipients.json or pass DIGEST_TEST_TO.');
    return;
  }
  console.log(`Done. ${sent} recipient-sends.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
