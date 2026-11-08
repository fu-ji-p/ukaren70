import { useEffect, useState } from 'react';
import { jstNow, type JstNow } from '../lib/time';

/**
 * For testing the "today" behaviour before the conference:
 * open the app with ?now=2026-11-10T10:30 (interpreted as JST wall-clock time).
 */
function debugNow(): JstNow | null {
  try {
    const v = new URLSearchParams(window.location.search).get('now');
    const m = v && /^(\d{4}-\d{2}-\d{2})T(\d{1,2}):(\d{2})$/.exec(v);
    return m ? { date: m[1], minutes: Number(m[2]) * 60 + Number(m[3]) } : null;
  } catch {
    return null;
  }
}

/** JST clock that updates once a minute (and when the tab becomes visible again). */
export function useNow(): JstNow {
  const [now, setNow] = useState<JstNow>(() => debugNow() ?? jstNow());
  useEffect(() => {
    if (debugNow()) return;
    const tick = () => setNow(jstNow());
    const id = window.setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);
  return now;
}
