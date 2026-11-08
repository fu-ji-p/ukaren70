import type { Session, Venue } from '../types';
import { buildingMoves, conflictingIds, sortByStart, type BuildingMove } from './layout';
import { resolveItem, type PlanItem } from './selection';

export interface DayPlan {
  date: string;
  items: PlanItem[];
  conflicts: Set<string>;
  /** building move that happens right before the item with this id */
  moveBefore: Map<string, BuildingMove>;
}

/** Selected sessions/talks grouped per conference day, sorted, with conflict and building-move analysis. */
export function buildDayPlans(
  dates: string[],
  selected: string[],
  sessionById: Map<string, Session>,
  venueById: Map<string, Venue>,
): DayPlan[] {
  const items = selected.map((id) => resolveItem(id, sessionById)).filter((x): x is PlanItem => !!x);
  return dates.map((date) => {
    const day = sortByStart(items.filter((s) => s.date === date));
    const moveBefore = new Map<string, BuildingMove>();
    for (const m of buildingMoves(day, venueById)) moveBefore.set(m.toId, m);
    return { date, items: day, conflicts: conflictingIds(day), moveBefore };
  });
}
