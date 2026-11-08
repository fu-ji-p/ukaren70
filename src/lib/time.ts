/** "09:05" -> 545 (minutes since midnight) */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** 545 -> "9:05" ; pad=true -> "09:05" */
export function fromMinutes(min: number, pad = false): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${pad ? String(h).padStart(2, '0') : h}:${String(m).padStart(2, '0')}`;
}

export const WEEKDAY_JA = ['日', '月', '火', '水', '木', '金', '土'];

/** "2026-11-10" -> "11/10(火)" */
export function formatDateJa(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const wd = WEEKDAY_JA[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${m}/${d}(${wd})`;
}

export interface JstNow {
  date: string; // YYYY-MM-DD in JST
  minutes: number; // minutes since midnight in JST
}

/** Current date/time in Japan Standard Time regardless of the device time zone. */
export function jstNow(now: Date = new Date()): JstNow {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}
