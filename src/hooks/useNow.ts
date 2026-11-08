import { useEffect, useState } from 'react';
import { jstNow, type JstNow } from '../lib/time';

/** JST clock that updates once a minute (and when the tab becomes visible again). */
export function useNow(): JstNow {
  const [now, setNow] = useState<JstNow>(() => jstNow());
  useEffect(() => {
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
