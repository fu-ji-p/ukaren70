import { describe, expect, it } from 'vitest';
import { buildIcs, foldLine, icsEscape, jstToUtcStamp } from '../src/lib/ics';
import { resolveItem } from '../src/lib/selection';
import type { Session, Venue } from '../src/types';

const venue: Venue = { id: 'A', name: 'A会場', room: '中ホール', building: 'ライトキューブ宇都宮', floor: 3, grid: true };
const session: Session = {
  id: '10A0900',
  date: '2026-11-10',
  venue: 'A',
  start: '09:00',
  end: '10:00',
  title: '【OS】月面探査, 第1回; 導入',
  kind: 'os',
  chair: '山田 太郎',
  talks: [
    { code: '1A01', title: '講演その1', authors: '佐藤 花子 (JAXA)' },
    { code: '1A02', title: '講演その2', authors: '鈴木 一郎 (東大)' },
  ],
  note: '途中入退室可',
};
const sessionById = new Map([[session.id, session]]);
const venueById = new Map([[venue.id, venue]]);
const opts = { calendarName: '宇科連70 マイスケジュール', appUrl: 'https://example.test/', now: new Date('2026-11-08T03:00:00Z') };

describe('ics primitives', () => {
  it('escapes backslash, semicolon, comma and newlines', () => {
    expect(icsEscape('a\\b;c,d\ne')).toBe('a\\\\b\;c\\,d\\ne');
  });
  it('converts JST wall time to a UTC stamp', () => {
    expect(jstToUtcStamp('2026-11-10', '09:00')).toBe('20261110T000000Z');
    expect(jstToUtcStamp('2026-11-10', '08:30')).toBe('20261109T233000Z');
  });
  it('folds long lines at 75 octets without splitting multi-byte characters', () => {
    const folded = foldLine('SUMMARY:' + 'あ'.repeat(60));
    const parts = folded.split('\r\n');
    expect(parts.length).toBeGreaterThan(1);
    for (const p of parts) expect(new TextEncoder().encode(p).length).toBeLessThanOrEqual(75);
    expect(parts.slice(1).every((p) => p.startsWith(' '))).toBe(true);
    expect(folded.replace(/\r\n /g, '')).toBe('SUMMARY:' + 'あ'.repeat(60));
  });
  it('never splits an escape pair across a fold', () => {
    const line = 'DESCRIPTION:' + 'ab\\,'.repeat(80);
    const parts = foldLine(line).split('\r\n');
    for (const p of parts) expect(p.endsWith('\\')).toBe(false);
    for (const p of parts) expect(new TextEncoder().encode(p).length).toBeLessThanOrEqual(75);
  });
});

describe('buildIcs', () => {
  it('writes one VEVENT per item with UTC times, location and escaped summary', () => {
    const whole = resolveItem('10A0900', sessionById)!;
    const talk = resolveItem('10A0900/1A02', sessionById)!;
    const ics = buildIcs([whole, talk], venueById, opts);
    const unfolded = ics.replace(/\r\n /g, '');
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect((unfolded.match(/BEGIN:VEVENT/g) ?? []).length).toBe(2);
    expect(unfolded).toContain('UID:10A0900@ukaren70');
    expect(unfolded).toContain('UID:10A0900-1A02@ukaren70');
    expect(unfolded).toContain('DTSTART:20261110T000000Z');
    expect(unfolded).toContain('DTEND:20261110T010000Z');
    // talk 2 of 2 in a 60-minute session → 09:30–10:00 JST
    expect(unfolded).toContain('DTSTART:20261110T003000Z');
    expect(unfolded).toContain('SUMMARY:【OS】月面探査\\, 第1回\; 導入');
    expect(unfolded).toContain('SUMMARY:講演その2');
    expect(unfolded).toContain('LOCATION:A会場 中ホール 3階（ライトキューブ宇都宮）');
    expect(unfolded).toContain('司会: 山田 太郎');
    expect(unfolded).toContain('1A01 講演その1 / 佐藤 花子 (JAXA)');
    expect(unfolded).toContain('目安');
    expect(unfolded).toContain('DTSTAMP:20261108T030000Z');
    expect(unfolded).toContain('https://example.test/');
  });
  it('produces an empty calendar for no items', () => {
    const ics = buildIcs([], venueById, opts);
    expect(ics).not.toContain('VEVENT');
  });
});
