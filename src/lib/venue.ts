import type { Venue } from '../types';

/**
 * Floor shown next to a venue. Returns null when the floor is unknown, or when the room
 * name already states it (e.g. "1F ホワイエ"), so it is never shown twice.
 */
export function venueFloor(v: Venue | undefined): number | null {
  if (!v || v.floor === undefined) return null;
  if (v.room.startsWith(`${v.floor}F`) || v.name.startsWith(`${v.floor}F`)) return null;
  return v.floor;
}

/** "A会場 中ホール 3階（ライトキューブ宇都宮）" — one-line location for calendars and plain text. */
export function venueLocation(v: Venue): string {
  const f = venueFloor(v);
  const head = v.name === v.room ? v.name : `${v.name} ${v.room}`;
  return `${head}${f !== null ? ` ${f}階` : ''}（${v.building}）`;
}
