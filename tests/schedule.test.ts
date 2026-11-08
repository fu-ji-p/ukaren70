import { describe, expect, it } from 'vitest';
import { buildDayPlans } from '../src/lib/schedule';
import type { Session, Venue } from '../src/types';

const LC = 'ライトキューブ宇都宮';
const TKP = 'TKPガーデンシティ宇都宮';
const venues = new Map<string, Venue>([
  ['A', { id: 'A', name: 'A会場', room: '中ホール', building: LC, grid: true }],
  ['O', { id: 'O', name: 'O会場', room: 'TKPロイヤルホール', building: TKP, grid: true }],
]);
function s(id: string, date: string, venue: string, start: string, end: string): Session {
  return { id, date, venue, start, end, title: id, kind: 'general', chair: null, talks: [] };
}
const sessions = new Map(
  [
    s('10A0900', '2026-11-10', 'A', '09:00', '10:00'),
    s('10O0930', '2026-11-10', 'O', '09:30', '10:30'),
    s('10A1045', '2026-11-10', 'A', '10:45', '11:45'),
    s('11A0900', '2026-11-11', 'A', '09:00', '10:00'),
  ].map((x) => [x.id, x]),
);
const dates = ['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13'];

describe('buildDayPlans', () => {
  it('groups selected sessions per day in time order, ignoring unknown ids', () => {
    const plans = buildDayPlans(dates, ['10A1045', 'nope', '10A0900', '11A0900'], sessions, venues);
    expect(plans.map((p) => p.items.map((x) => x.id))).toEqual([['10A0900', '10A1045'], ['11A0900'], [], []]);
  });

  it('marks overlapping selections and building moves', () => {
    const [day1] = buildDayPlans(dates, ['10A0900', '10O0930', '10A1045'], sessions, venues);
    expect([...day1.conflicts].sort()).toEqual(['10A0900', '10O0930']);
    expect(day1.moveBefore.get('10O0930')).toMatchObject({ fromBuilding: LC, toBuilding: TKP, gapMinutes: -30 });
    expect(day1.moveBefore.get('10A1045')).toMatchObject({ fromBuilding: TKP, toBuilding: LC, gapMinutes: 15 });
    expect(day1.moveBefore.has('10A0900')).toBe(false);
  });

  it('places a single talk at its estimated slot and detects overlaps with it', () => {
    const withTalks = new Map(sessions);
    withTalks.set('10A0900', {
      ...sessions.get('10A0900')!,
      talks: [
        { code: '2A01', title: 't1', authors: 'a' },
        { code: '2A02', title: 't2', authors: 'b' },
        { code: '2A03', title: 't3', authors: 'c' },
        { code: '2A04', title: 't4', authors: 'd' },
      ],
    });
    const [day1] = buildDayPlans(dates, ['10A0900/2A03', '10O0930'], withTalks, venues);
    expect(day1.items.map((x) => [x.id, x.start, x.end, x.estimated])).toEqual([
      ['10A0900/2A03', '09:30', '09:45', true],
      ['10O0930', '09:30', '10:30', false],
    ]);
    expect([...day1.conflicts].sort()).toEqual(['10A0900/2A03', '10O0930']);
    const [again] = buildDayPlans(dates, ['10A0900/2A01', '10O0930'], withTalks, venues);
    expect(again.conflicts.size).toBe(0);
  });
});
