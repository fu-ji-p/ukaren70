import { describe, expect, it } from 'vitest';
import {
  GRID_START,
  SLOT_COUNT,
  SUB_COUNT,
  SUB_PX,
  buildingMoves,
  cardRect,
  conflictingIds,
  gridRow,
  groupByBuilding,
  initialDate,
  minutesToOffset,
  orderGridVenues,
  overlaps,
  sortByStart,
  timeSlots,
} from '../src/lib/layout';
import type { Session, Venue } from '../src/types';

const LC = 'ライトキューブ宇都宮';
const TKP = 'TKPガーデンシティ宇都宮';
const venues: Venue[] = [
  { id: 'EXH', name: '企業展示', room: '大ホール', building: LC, grid: false },
  { id: 'F1', name: '1F ホワイエ', room: '1F ホワイエ', building: LC, grid: true },
  { id: 'F3', name: '3F ホワイエ', room: '3F ホワイエ', building: LC, grid: true },
  { id: 'S', name: 'S会場', room: 'TKPマーキュリー', building: TKP, grid: true },
  { id: 'O', name: 'O会場', room: 'TKPロイヤルホール', building: TKP, grid: true },
  { id: 'B', name: 'B会場', room: '大会議室201', building: LC, grid: true },
  { id: 'A', name: 'A会場', room: '中ホール', building: LC, grid: true },
  { id: 'OFF', name: '会場外', room: 'ホテル', building: '学外', grid: false },
];

function s(id: string, venue: string, start: string, end: string): Session {
  return { id, date: '2026-11-10', venue, start, end, title: id, kind: 'general', chair: null, talks: [] };
}

describe('grid geometry', () => {
  it('has 46 visible 15-minute rows and 138 sub rows between 09:00 and 20:30', () => {
    expect(SLOT_COUNT).toBe(46);
    expect(SUB_COUNT).toBe(138);
    expect(timeSlots()).toHaveLength(46);
    expect(timeSlots()[0]).toBe(GRID_START);
    expect(timeSlots().at(-1)).toBe(20 * 60 + 15);
  });

  it('maps times to pixel offsets proportionally and clamps outside the grid', () => {
    expect(minutesToOffset(9 * 60)).toBe(0);
    expect(minutesToOffset(10 * 60)).toBe(12 * SUB_PX);
    expect(minutesToOffset(8 * 60)).toBe(0);
    expect(minutesToOffset(23 * 60)).toBe(SUB_COUNT * SUB_PX);
  });

  it('sizes cards by duration, including non-15-minute sessions', () => {
    expect(cardRect({ start: '09:00', end: '10:00' })).toEqual({ top: 0, height: 12 * SUB_PX });
    const biz = cardRect({ start: '12:40', end: '13:35' });
    expect(biz.top).toBe(44 * SUB_PX);
    expect(biz.height).toBe(11 * SUB_PX);
  });

  it('computes 1-based css grid rows below the header row', () => {
    expect(gridRow(9 * 60)).toBe(2);
    expect(gridRow(9 * 60 + 15)).toBe(5);
    expect(gridRow(20 * 60 + 30)).toBe(SUB_COUNT + 2);
  });
});

describe('venue ordering', () => {
  it('orders A..N, O..S, then foyers and drops non-grid venues', () => {
    expect(orderGridVenues(venues).map((v) => v.id)).toEqual(['A', 'B', 'O', 'S', 'F1', 'F3']);
  });

  it('groups consecutive venues by building', () => {
    const groups = groupByBuilding(orderGridVenues(venues));
    expect(groups.map((g) => [g.building, g.venues.length])).toEqual([
      [LC, 2],
      [TKP, 2],
      [LC, 2],
    ]);
  });
});

describe('schedule analysis', () => {
  it('detects overlapping sessions but not back-to-back ones', () => {
    expect(overlaps({ start: '09:00', end: '10:00' }, { start: '09:30', end: '10:30' })).toBe(true);
    expect(overlaps({ start: '09:00', end: '10:00' }, { start: '10:00', end: '11:00' })).toBe(false);
    expect(overlaps({ start: '12:40', end: '13:35' }, { start: '13:00', end: '13:30' })).toBe(true);
  });

  it('flags every session that conflicts with another', () => {
    const ids = conflictingIds([s('a', 'A', '09:00', '10:00'), s('b', 'B', '09:30', '10:30'), s('c', 'C', '11:00', '12:00')]);
    expect([...ids].sort()).toEqual(['a', 'b']);
  });

  it('sorts by start time, then end, then venue', () => {
    const sorted = sortByStart([s('x', 'B', '10:00', '11:00'), s('y', 'A', '10:00', '11:00'), s('z', 'C', '09:00', '12:00')]);
    expect(sorted.map((v) => v.id)).toEqual(['z', 'y', 'x']);
  });

  it('reports building changes between consecutive sessions with the gap', () => {
    const byId = new Map(venues.map((v) => [v.id, v]));
    const moves = buildingMoves([s('a', 'A', '09:00', '10:00'), s('b', 'O', '10:15', '11:15'), s('c', 'S', '11:15', '12:00'), s('d', 'F1', '12:40', '13:35')], byId);
    expect(moves).toEqual([
      { fromId: 'a', toId: 'b', fromBuilding: LC, toBuilding: TKP, gapMinutes: 15 },
      { fromId: 'c', toId: 'd', fromBuilding: TKP, toBuilding: LC, gapMinutes: 40 },
    ]);
  });

  it('opens today when inside the conference, otherwise the first day', () => {
    const dates = ['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13'];
    expect(initialDate(dates, '2026-11-12')).toBe('2026-11-12');
    expect(initialDate(dates, '2026-11-08')).toBe('2026-11-10');
    expect(initialDate(dates, '2026-11-20')).toBe('2026-11-10');
  });
});
