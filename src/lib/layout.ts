import type { Session, Venue } from '../types';
import { toMinutes } from './time';

/** Grid geometry. Times are minutes since midnight. */
export const GRID_START = 9 * 60; // 09:00
export const GRID_END = 20 * 60 + 30; // 20:30
export const SLOT_MIN = 15; // one visible row = 15 minutes
export const SUB_MIN = 5; // internal resolution (sessions like 12:40-13:35 exist)
export const SLOT_PX = 27; // pixel height of a 15-minute row
export const SUB_PX = SLOT_PX / (SLOT_MIN / SUB_MIN); // 9px per 5 minutes
export const VENUE_COL_MIN_PX = 90;
export const TIME_COL_PX = 44;
export const HEADER_PX = 48;

export const SLOT_COUNT = (GRID_END - GRID_START) / SLOT_MIN; // 46
export const SUB_COUNT = (GRID_END - GRID_START) / SUB_MIN; // 138

/** Labels for the time column: one per 15-minute row. */
export function timeSlots(): number[] {
  const out: number[] = [];
  for (let t = GRID_START; t < GRID_END; t += SLOT_MIN) out.push(t);
  return out;
}

/** Vertical pixel offset (from the top of the grid body) for a time. Clamped to the grid. */
export function minutesToOffset(min: number): number {
  const clamped = Math.min(Math.max(min, GRID_START), GRID_END);
  return ((clamped - GRID_START) / SUB_MIN) * SUB_PX;
}

export interface CardRect {
  top: number;
  height: number;
}

/** Card position inside the grid body, proportional to the session duration. */
export function cardRect(session: Pick<Session, 'start' | 'end'>): CardRect {
  const top = minutesToOffset(toMinutes(session.start));
  const bottom = minutesToOffset(toMinutes(session.end));
  return { top, height: Math.max(bottom - top, SUB_PX) };
}

/** 1-based CSS grid row index for a time (rows are SUB_MIN wide, row 1 = header). */
export function gridRow(min: number): number {
  return Math.round((min - GRID_START) / SUB_MIN) + 2;
}

const BUILDING_ORDER = ['ライトキューブ宇都宮', 'TKPガーデンシティ宇都宮'];

/**
 * Venue columns in display order: A..N (Light Cube), O..S (TKP), then the foyers.
 * Non-grid venues (exhibition, off-site party) are excluded.
 */
export function orderGridVenues(venues: Venue[]): Venue[] {
  const rank = (v: Venue): [number, number, string] => {
    const isLetter = /^[A-Z]$/.test(v.id);
    const b = BUILDING_ORDER.indexOf(v.building);
    return [isLetter ? 0 : 1, b < 0 ? 99 : b, v.id];
  };
  return venues
    .filter((v) => v.grid)
    .slice()
    .sort((a, b) => {
      const [a0, a1, a2] = rank(a);
      const [b0, b1, b2] = rank(b);
      return a0 - b0 || a1 - b1 || a2.localeCompare(b2);
    });
}

export interface BuildingGroup {
  building: string;
  venues: Venue[];
}

/** Consecutive venues grouped by building (for the two-row header). */
export function groupByBuilding(venues: Venue[]): BuildingGroup[] {
  const groups: BuildingGroup[] = [];
  for (const v of venues) {
    const last = groups[groups.length - 1];
    if (last && last.building === v.building) last.venues.push(v);
    else groups.push({ building: v.building, venues: [v] });
  }
  return groups;
}

/** Two sessions overlap when their time ranges intersect (touching ends do not count). */
export function overlaps(a: Pick<Session, 'start' | 'end'>, b: Pick<Session, 'start' | 'end'>): boolean {
  return toMinutes(a.start) < toMinutes(b.end) && toMinutes(b.start) < toMinutes(a.end);
}

export interface TimeItem {
  id: string;
  start: string;
  end: string;
  venue: string;
}

/** IDs of items (same day assumed) that overlap with at least one other item in the list. */
export function conflictingIds(sessions: TimeItem[]): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      if (overlaps(sessions[i], sessions[j])) {
        out.add(sessions[i].id);
        out.add(sessions[j].id);
      }
    }
  }
  return out;
}

export function sortByStart<T extends Pick<Session, 'start' | 'end' | 'venue'>>(sessions: T[]): T[] {
  return sessions
    .slice()
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start) || toMinutes(a.end) - toMinutes(b.end) || a.venue.localeCompare(b.venue));
}

export interface BuildingMove {
  fromId: string;
  toId: string;
  fromBuilding: string;
  toBuilding: string;
  /** minutes between the end of the previous session and the start of the next (may be negative) */
  gapMinutes: number;
}

/**
 * Building changes between consecutive selected sessions of one day
 * (e.g. Light Cube -> TKP). Input must be sorted by start time.
 */
export function buildingMoves(sessions: TimeItem[], venueById: Map<string, Venue>): BuildingMove[] {
  const moves: BuildingMove[] = [];
  for (let i = 1; i < sessions.length; i++) {
    const prev = sessions[i - 1];
    const next = sessions[i];
    const fb = venueById.get(prev.venue)?.building;
    const tb = venueById.get(next.venue)?.building;
    if (fb && tb && fb !== tb) {
      moves.push({
        fromId: prev.id,
        toId: next.id,
        fromBuilding: fb,
        toBuilding: tb,
        gapMinutes: toMinutes(next.start) - toMinutes(prev.end),
      });
    }
  }
  return moves;
}

/** Which conference day to open first: today if within the conference, otherwise the first day. */
export function initialDate(dates: string[], todayIso: string): string {
  return dates.includes(todayIso) ? todayIso : dates[0];
}
