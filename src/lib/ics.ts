import type { PlanItem } from './selection';
import type { Venue } from '../types';
import { KIND_LABEL } from '../data';
import { venueLocation } from './venue';

/**
 * iCalendar (RFC 5545) export of the selected sessions/talks.
 * Times are written in UTC (JST − 9h) so every calendar app places them correctly without a VTIMEZONE block.
 */

const CRLF = '\r\n';

/** Escape text for an iCalendar property value. */
export function icsEscape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/**
 * Fold a content line at 75 octets (continuation lines start with a space).
 * Multi-byte safe, and an escape pair such as "\," is never split across lines.
 */
export function foldLine(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = '';
  let bytes = 0;
  const units: string[] = [];
  const chars = Array.from(line);
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === '\\' && i + 1 < chars.length) units.push(chars[i] + chars[++i]);
    else units.push(chars[i]);
  }
  for (const ch of units) {
    const n = enc.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74; // continuation lines carry a leading space
    if (bytes + n > limit) {
      out.push(cur);
      cur = '';
      bytes = 0;
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.map((l, i) => (i === 0 ? l : ' ' + l)).join(CRLF);
}

/** "2026-11-10" + "09:00" (JST) → "20261110T000000Z" */
export function jstToUtcStamp(date: string, time: string): string {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const ms = Date.UTC(y, mo - 1, d, h - 9, mi, 0);
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function nowStamp(now: Date): string {
  return now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export interface IcsOptions {
  /** calendar/product name shown by some apps */
  calendarName: string;
  /** app URL put into each event's description */
  appUrl?: string;
  /** fixed DTSTAMP for deterministic output (tests); defaults to now */
  now?: Date;
}

/** Build one VEVENT for a plan item (whole session or single talk). */
export function eventLines(item: PlanItem, venueById: Map<string, Venue>, opts: IcsOptions): string[] {
  const s = item.session;
  const v = venueById.get(s.venue);
  const location = v ? venueLocation(v) : s.venue;
  const summary = item.talk ? item.talk.title : s.title;
  const desc: string[] = [];
  if (item.talk) {
    if (item.talk.code) desc.push(`講演番号: ${item.talk.code}`);
    if (item.talk.authors) desc.push(`著者: ${item.talk.authors}`);
    desc.push(`セッション: ${s.title}（${s.start}–${s.end}）`);
    if (item.estimated) desc.push('※ 講演時刻はセッション時間を等分した目安です');
  } else {
    desc.push(`種別: ${KIND_LABEL[s.kind] ?? s.kind}`);
    if (s.chair) desc.push(`司会: ${s.chair}`);
    if (s.talks.length > 0) {
      desc.push('');
      for (const t of s.talks) desc.push(`${t.code ? t.code + ' ' : ''}${t.title}${t.authors ? ` / ${t.authors}` : ''}`);
    }
  }
  if (s.note) desc.push('', s.note);
  if (opts.appUrl) desc.push('', `宇科連70 タイムテーブル: ${opts.appUrl}`);
  const lines = [
    'BEGIN:VEVENT',
    `UID:${item.id.replace('/', '-')}@ukaren70`,
    `DTSTAMP:${nowStamp(opts.now ?? new Date())}`,
    `DTSTART:${jstToUtcStamp(item.date, item.start)}`,
    `DTEND:${jstToUtcStamp(item.date, item.end)}`,
    `SUMMARY:${icsEscape(summary)}`,
    `LOCATION:${icsEscape(location)}`,
    `DESCRIPTION:${icsEscape(desc.join('\n'))}`,
  ];
  if (s.url) lines.push(`URL:${s.url}`);
  lines.push('END:VEVENT');
  return lines;
}

/** Whole calendar file as text (CRLF line endings, folded). */
export function buildIcs(items: PlanItem[], venueById: Map<string, Venue>, opts: IcsOptions): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ukaren70 timetable//JA',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsEscape(opts.calendarName)}`,
    'X-WR-TIMEZONE:Asia/Tokyo',
  ];
  for (const it of items) lines.push(...eventLines(it, venueById, opts));
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join(CRLF) + CRLF;
}
