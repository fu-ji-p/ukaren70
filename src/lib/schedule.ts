import type { Session, Venue } from '../types';
import { buildingMoves, conflictingIds, sortByStart, type BuildingMove } from './layout';

export interface DayPlan {
  date: string;
  sessions: Session[];
  conflicts: Set<string>;
  /** building move that happens right before the session with this id */
  moveBefore: Map<string, BuildingMove>;
}

/** Selected sessions grouped per conference day, sorted, with conflict and building-move analysis. */
export function buildDayPlans(
  dates: string[],
  selected: string[],
  sessionById: Map<string, Session>,
  venueById: Map<string, Venue>,
): DayPlan[] {
  const sessions = selected.map((id) => sessionById.get(id)).filter((s): s is Session => !!s);
  return dates.map((date) => {
    const day = sortByStart(sessions.filter((s) => s.date === date));
    const moveBefore = new Map<string, BuildingMove>();
    for (const m of buildingMoves(day, venueById)) moveBefore.set(m.toId, m);
    return { date, sessions: day, conflicts: conflictingIds(day), moveBefore };
  });
}
