import { parseScheduleJson } from './storage';

const PARAM = 's';

/** URL that carries the selection in its hash (nothing is sent to a server; Pages logs never see it). */
export function shareUrl(selected: string[], base: string = window.location.href): string {
  const u = new URL(base);
  u.search = '';
  u.hash = selected.length > 0 ? `${PARAM}=${encodeURIComponent(selected.join(','))}` : '';
  return u.toString();
}

/** Selection carried by a share link, or null when the hash has none. */
export function parseShareHash(hash: string): string[] | null {
  const m = /^#?s=(.*)$/.exec(hash);
  if (!m) return null;
  const ids = decodeURIComponent(m[1]).split(',').filter(Boolean);
  return parseScheduleJson(JSON.stringify({ selected: ids }))?.selected ?? [];
}
