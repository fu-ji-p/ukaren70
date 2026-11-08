import type { Session } from '../types';

/** NFKC (full-width -> half-width etc.), lower-case, trimmed. */
export function normalize(s: string): string {
  return s.normalize('NFKC').toLowerCase().trim();
}

/** Space-separated terms (all must match). Empty query -> []. */
export function queryTerms(query: string): string[] {
  return normalize(query).split(/[\s　]+/).filter(Boolean);
}

function haystack(s: Session): string {
  const parts = [s.title, s.chair ?? '', s.note ?? ''];
  for (const t of s.talks) parts.push(t.code ?? '', t.title, t.authors);
  return normalize(parts.join('\n'));
}

const cache = new WeakMap<Session, string>();
function text(s: Session): string {
  let h = cache.get(s);
  if (!h) {
    h = haystack(s);
    cache.set(s, h);
  }
  return h;
}

/** IDs of sessions whose title, chair, talk title/author/code match every term. null when the query is empty. */
export function matchSessions(sessions: Session[], query: string): Set<string> | null {
  const terms = queryTerms(query);
  if (terms.length === 0) return null;
  const out = new Set<string>();
  for (const s of sessions) {
    const h = text(s);
    if (terms.every((t) => h.includes(t))) out.add(s.id);
  }
  return out;
}
