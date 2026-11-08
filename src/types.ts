export type Kind =
  | 'os'
  | 'general'
  | 'special'
  | 'social'
  | 'business'
  | 'lunch'
  | 'student'
  | 'event'
  | 'party'
  | 'exhibition';

export interface Venue {
  id: string;
  name: string;
  room: string;
  building: string;
  /** true = shown as a column on the timetable grid */
  grid: boolean;
}

export interface Talk {
  code: string | null;
  title: string;
  authors: string;
}

export interface Session {
  id: string;
  date: string; // YYYY-MM-DD
  venue: string; // Venue.id
  start: string; // HH:MM
  end: string; // HH:MM
  title: string;
  kind: Kind;
  chair: string | null;
  talks: Talk[];
  note?: string;
  url?: string;
}

export interface Program {
  conference: {
    name: string;
    dates: string[];
    site: string;
    generatedFrom: string[];
    generatedAt: string;
  };
  venues: Venue[];
  sessions: Session[];
}
