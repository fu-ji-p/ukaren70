import programJson from '../data/program.json';
import type { Program, Session, Venue } from './types';
import { orderGridVenues } from './lib/layout';

export const program = programJson as Program;
export const DATES = program.conference.dates;
export const venueById = new Map<string, Venue>(program.venues.map((v) => [v.id, v]));
export const gridVenues = orderGridVenues(program.venues);
export const sessionById = new Map<string, Session>(program.sessions.map((s) => [s.id, s]));

export const sessionsByDate = new Map<string, Session[]>(DATES.map((d) => [d, []]));
for (const s of program.sessions) sessionsByDate.get(s.date)?.push(s);

export const KIND_LABEL: Record<Session['kind'], string> = {
  os: 'オーガナイズドセッション',
  general: '一般セッション',
  special: '特別講演',
  social: 'ソーシャルイベント',
  business: 'ビジネスセッション',
  lunch: 'ランチョンセミナー',
  student: '学生セッション',
  event: 'イベント',
  party: '懇親会',
  exhibition: '企業展示',
};
