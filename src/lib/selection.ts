import type { Session, Talk } from '../types';
import { fromMinutes, toMinutes } from './time';

/**
 * A selection entry is either a whole session ("10A0900") or one talk of a session
 * ("10A0900/2A05"; talks without a code use "10A0900/i3" with the 0-based index).
 */
export const TALK_SEP = '/';

export function talkKey(talk: Talk, index: number): string {
  return talk.code ?? `i${index}`;
}

export function talkSelectionId(sessionId: string, talk: Talk, index: number): string {
  return `${sessionId}${TALK_SEP}${talkKey(talk, index)}`;
}

export function parseSelectionId(id: string): { sessionId: string; talkKey: string | null } {
  const i = id.indexOf(TALK_SEP);
  return i < 0 ? { sessionId: id, talkKey: null } : { sessionId: id.slice(0, i), talkKey: id.slice(i + 1) };
}

export function isTalkSelection(id: string): boolean {
  return id.includes(TALK_SEP);
}

/** Minimum per-talk slot for which we split the session time between talks. */
const MIN_TALK_MINUTES = 10;

export interface TalkTime {
  start: string;
  end: string;
  /** false when the session is too short per talk (e.g. student sessions): whole session time is used */
  split: boolean;
}

/** Estimated time of the index-th talk, splitting the session evenly (talks are 15 minutes each in practice). */
export function talkTime(session: Pick<Session, 'start' | 'end' | 'talks'>, index: number): TalkTime {
  const s = toMinutes(session.start);
  const e = toMinutes(session.end);
  const n = session.talks.length;
  const per = n > 0 ? (e - s) / n : 0;
  if (n === 0 || per < MIN_TALK_MINUTES) return { start: session.start, end: session.end, split: false };
  return {
    start: fromMinutes(s + Math.round(index * per), true),
    end: fromMinutes(s + Math.round((index + 1) * per), true),
    split: true,
  };
}

/** One row of My Schedule: a whole session or a single talk. */
export interface PlanItem {
  /** the selection entry (unique) */
  id: string;
  session: Session;
  talk: Talk | null;
  talkIndex: number;
  start: string;
  end: string;
  venue: string;
  date: string;
  /** talk time is an estimate (evenly split) */
  estimated: boolean;
}

/** Resolve a selection entry against the program; null when the session/talk no longer exists. */
export function resolveItem(id: string, sessionById: Map<string, Session>): PlanItem | null {
  const { sessionId, talkKey: key } = parseSelectionId(id);
  const session = sessionById.get(sessionId);
  if (!session) return null;
  if (key === null) {
    return { id, session, talk: null, talkIndex: -1, start: session.start, end: session.end, venue: session.venue, date: session.date, estimated: false };
  }
  const idx = session.talks.findIndex((t, i) => talkKey(t, i) === key);
  if (idx < 0) return null;
  const tt = talkTime(session, idx);
  return { id, session, talk: session.talks[idx], talkIndex: idx, start: tt.start, end: tt.end, venue: session.venue, date: session.date, estimated: tt.split };
}

export interface SessionSelection {
  /** the whole session is selected */
  whole: boolean;
  /** talk keys selected individually (empty when whole) */
  talks: Set<string>;
}

/** Per-session view of the flat selection list. */
export function summarizeSelection(selected: string[]): Map<string, SessionSelection> {
  const out = new Map<string, SessionSelection>();
  for (const id of selected) {
    const { sessionId, talkKey: key } = parseSelectionId(id);
    let e = out.get(sessionId);
    if (!e) {
      e = { whole: false, talks: new Set() };
      out.set(sessionId, e);
    }
    if (key === null) e.whole = true;
    else e.talks.add(key);
  }
  return out;
}

export interface SelectionChange {
  add: string[];
  remove: string[];
}

/** Toggle the whole session. Selecting it absorbs any individually selected talks. */
export function toggleSessionChange(selected: string[], sessionId: string): SelectionChange {
  const talkIds = selected.filter((id) => parseSelectionId(id).sessionId === sessionId && isTalkSelection(id));
  if (selected.includes(sessionId)) return { add: [], remove: [sessionId] };
  return { add: [sessionId], remove: talkIds };
}

/**
 * Toggle one talk. If the whole session was selected, it is replaced by all of its other talks
 * (so un-ticking one talk from a selected session keeps the rest).
 */
export function toggleTalkChange(selected: string[], session: Session, index: number): SelectionChange {
  const tid = talkSelectionId(session.id, session.talks[index], index);
  if (selected.includes(session.id)) {
    const others = session.talks.map((t, i) => talkSelectionId(session.id, t, i)).filter((x) => x !== tid);
    return { add: others, remove: [session.id] };
  }
  if (selected.includes(tid)) return { add: [], remove: [tid] };
  // selecting the last missing talk promotes to the whole session
  const existing = selected.filter((id) => parseSelectionId(id).sessionId === session.id);
  const have = new Set([...existing, tid]);
  if (session.talks.length > 1 && session.talks.every((t, i) => have.has(talkSelectionId(session.id, t, i)))) {
    return { add: [session.id], remove: existing };
  }
  return { add: [tid], remove: [] };
}
