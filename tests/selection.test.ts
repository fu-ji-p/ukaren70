import { describe, expect, it } from 'vitest';
import {
  parseSelectionId,
  resolveItem,
  summarizeSelection,
  talkSelectionId,
  talkTime,
  toggleSessionChange,
  toggleTalkChange,
} from '../src/lib/selection';
import { parseShareHash, shareUrl } from '../src/lib/share';
import type { Session } from '../src/types';

const os: Session = {
  id: '10A0900', date: '2026-11-10', venue: 'A', start: '09:00', end: '10:00', title: 'OS', kind: 'os', chair: null,
  talks: [
    { code: '2A01', title: 't1', authors: 'a' },
    { code: '2A02', title: 't2', authors: 'b' },
    { code: null, title: 't3', authors: 'c' },
    { code: '2A04', title: 't4', authors: 'd' },
  ],
};
const student: Session = {
  ...os, id: '11F11515', start: '15:15', end: '16:15', kind: 'student',
  talks: Array.from({ length: 20 }, (_, i) => ({ code: `S${i}`, title: `s${i}`, authors: 'x' })),
};
const byId = new Map([[os.id, os], [student.id, student]]);

describe('selection ids', () => {
  it('builds and parses talk ids, using the index when a talk has no code', () => {
    expect(talkSelectionId(os.id, os.talks[0], 0)).toBe('10A0900/2A01');
    expect(talkSelectionId(os.id, os.talks[2], 2)).toBe('10A0900/i2');
    expect(parseSelectionId('10A0900')).toEqual({ sessionId: '10A0900', talkKey: null });
    expect(parseSelectionId('10A0900/2A02')).toEqual({ sessionId: '10A0900', talkKey: '2A02' });
  });

  it('splits the session evenly for talk times, except when slots would be too short', () => {
    expect(talkTime(os, 0)).toEqual({ start: '09:00', end: '09:15', split: true });
    expect(talkTime(os, 3)).toEqual({ start: '09:45', end: '10:00', split: true });
    expect(talkTime({ start: '12:00', end: '12:45', talks: os.talks.slice(0, 2) }, 1)).toEqual({ start: '12:23', end: '12:45', split: true });
    expect(talkTime(student, 5)).toEqual({ start: '15:15', end: '16:15', split: false });
  });

  it('resolves items and rejects unknown sessions or talks', () => {
    expect(resolveItem('10A0900', byId)).toMatchObject({ talk: null, start: '09:00', end: '10:00', estimated: false });
    expect(resolveItem('10A0900/i2', byId)).toMatchObject({ talk: os.talks[2], start: '09:30', end: '09:45', estimated: true });
    expect(resolveItem('10A0900/2A99', byId)).toBeNull();
    expect(resolveItem('99Z0000', byId)).toBeNull();
  });

  it('summarizes per session', () => {
    const m = summarizeSelection(['10A0900/2A01', '10A0900/2A02', '11F11515']);
    expect(m.get('10A0900')).toEqual({ whole: false, talks: new Set(['2A01', '2A02']) });
    expect(m.get('11F11515')).toEqual({ whole: true, talks: new Set() });
  });
});

describe('toggling', () => {
  it('selecting the whole session absorbs its individually selected talks', () => {
    expect(toggleSessionChange(['10A0900/2A01', '11F11515'], '10A0900')).toEqual({ add: ['10A0900'], remove: ['10A0900/2A01'] });
    expect(toggleSessionChange(['10A0900'], '10A0900')).toEqual({ add: [], remove: ['10A0900'] });
  });

  it('un-ticking one talk of a selected session keeps the other talks', () => {
    expect(toggleTalkChange(['10A0900'], os, 1)).toEqual({
      add: ['10A0900/2A01', '10A0900/i2', '10A0900/2A04'],
      remove: ['10A0900'],
    });
  });

  it('ticking talks one by one, the last one promotes to the whole session', () => {
    expect(toggleTalkChange([], os, 0)).toEqual({ add: ['10A0900/2A01'], remove: [] });
    expect(toggleTalkChange(['10A0900/2A01'], os, 0)).toEqual({ add: [], remove: ['10A0900/2A01'] });
    const r = toggleTalkChange(['10A0900/2A01', '10A0900/2A02', '10A0900/i2'], os, 3);
    expect(r.add).toEqual(['10A0900']);
    expect(r.remove.sort()).toEqual(['10A0900/2A01', '10A0900/2A02', '10A0900/i2']);
  });
});

describe('share link', () => {
  it('round-trips the selection through the URL hash', () => {
    const url = shareUrl(['10A0900', '10A0900/2A01'], 'https://fu-ji-p.github.io/ukaren70/?now=2026-11-10T10:00');
    expect(url).toBe('https://fu-ji-p.github.io/ukaren70/#s=10A0900%2C10A0900%2F2A01');
    expect(parseShareHash(new URL(url).hash)).toEqual(['10A0900', '10A0900/2A01']);
    expect(parseShareHash('')).toBeNull();
    expect(parseShareHash('#s=')).toEqual([]);
  });
});
