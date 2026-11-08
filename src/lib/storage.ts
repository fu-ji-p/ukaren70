export const STORAGE_KEY = 'ukaren70.schedule.v1';

export interface ScheduleFile {
  selected: string[];
  updatedAt: string; // ISO 8601
}

/** Minimal subset of the Web Storage API so the functions can be tested without a DOM. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

// session id, optionally followed by '/' + talk code (see lib/selection.ts)
const ID_RE = /^\d{2}[A-Z0-9]{1,6}\d{0,4}(\/[A-Za-z0-9]{1,8})?$/;

/** Validate arbitrary JSON (from localStorage or an imported file). Returns null when unusable. */
export function parseScheduleJson(text: string | null | undefined): ScheduleFile | null {
  if (!text) return null;
  try {
    const obj: unknown = JSON.parse(text);
    if (!obj || typeof obj !== 'object' || !Array.isArray((obj as ScheduleFile).selected)) return null;
    const selected = (obj as ScheduleFile).selected.filter((x): x is string => typeof x === 'string' && ID_RE.test(x));
    const updatedAt =
      typeof (obj as ScheduleFile).updatedAt === 'string' ? (obj as ScheduleFile).updatedAt : new Date(0).toISOString();
    return { selected: Array.from(new Set(selected)), updatedAt };
  } catch {
    return null;
  }
}

/** Selected session IDs from storage; empty when missing or broken. */
export function loadSchedule(storage: StorageLike | null | undefined): string[] {
  try {
    return parseScheduleJson(storage?.getItem(STORAGE_KEY))?.selected ?? [];
  } catch {
    return [];
  }
}

export function serializeSchedule(selected: string[], now: Date = new Date()): string {
  const file: ScheduleFile = { selected: Array.from(new Set(selected)), updatedAt: now.toISOString() };
  return JSON.stringify(file, null, 2);
}

export function saveSchedule(storage: StorageLike | null | undefined, selected: string[], now: Date = new Date()): boolean {
  try {
    storage?.setItem(STORAGE_KEY, serializeSchedule(selected, now));
    return true;
  } catch {
    return false; // e.g. private mode / quota exceeded: keep working in memory
  }
}
