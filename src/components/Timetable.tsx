import { useEffect, useRef } from 'react';
import { useElementWidth } from '../hooks/useElementWidth';
import type { Session, Venue } from '../types';
import {
  GRID_END,
  GRID_START,
  HEADER_PX,
  SUB_COUNT,
  SUB_PX,
  TIME_COL_PX,
  VENUE_COL_MIN_PX,
  buildingClass,
  groupByBuilding,
  minutesToOffset,
  timeSlots,
} from '../lib/layout';
import { fromMinutes } from '../lib/time';
import { venueFloor } from '../lib/venue';
import { SessionCard } from './SessionCard';
import type { SessionSelection } from '../lib/selection';

interface Props {
  venues: Venue[];
  sessions: Session[];
  selection: Map<string, SessionSelection>;
  /** null = no search active */
  matchSet: Set<string> | null;
  /** minutes since midnight in JST when the displayed day is today, else null */
  nowMinutes: number | null;
  onOpen: (id: string) => void;
}

export function Timetable({ venues, sessions, selection, matchSet, nowMinutes, onOpen }: Props) {
  const groups = groupByBuilding(venues);
  const slots = timeSlots();
  const colIndex = new Map(venues.map((v, i) => [v.id, i + 2]));
  // First venue of every building group after the first one gets a thick divider on its left.
  const groupStart = new Set(groups.slice(1).map((g) => g.venues[0].id));
  const venueClass = (v: Venue) => ' ' + buildingClass(v.building) + (groupStart.has(v.id) ? ' is-group-start' : '');
  const gridSessions = sessions.filter((s) => colIndex.has(s.venue));
  const offGrid = sessions.filter((s) => !colIndex.has(s.venue));
  const scrollRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(scrollRef);
  // Columns are at least 90px (phones scroll horizontally); on wide screens they grow to fill the width.
  const colPx = Math.max(VENUE_COL_MIN_PX, Math.floor((width - TIME_COL_PX) / venues.length));
  const style = {
    gridTemplateColumns: `${TIME_COL_PX}px repeat(${venues.length}, ${colPx}px)`,
    gridTemplateRows: `${HEADER_PX}px ${SUB_COUNT * SUB_PX}px`,
  } as const;
  const showNow = nowMinutes !== null && nowMinutes >= GRID_START && nowMinutes <= GRID_END;

  // Scroll so the current time is visible when opening today's tab.
  useEffect(() => {
    if (!showNow || !scrollRef.current || nowMinutes === null) return;
    const y = HEADER_PX + minutesToOffset(nowMinutes) - 120;
    scrollRef.current.scrollTo({ top: Math.max(0, y) });
    // only on mount / day change, not every minute
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNow, venues]);

  // When a search is active, bring the first matching card of this day into view.
  useEffect(() => {
    if (!matchSet || !scrollRef.current) return;
    const first = scrollRef.current.querySelector<HTMLElement>('.card.is-matched');
    first?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [matchSet, venues]);

  return (
    <div className="tt-wrap">
      {offGrid.length > 0 && (
        <div className="offgrid">
          {offGrid.map((s) => (
            <button
              key={s.id}
              type="button"
              className={
                'chip kind-' +
                s.kind +
                (selection.get(s.id)?.whole ? ' is-selected' : '') +
                (matchSet && !matchSet.has(s.id) ? ' is-dimmed' : '')
              }
              onClick={() => onOpen(s.id)}
            >
              <span className="chip-time">
                {s.start}–{s.end}
              </span>
              {s.title}
              {selection.get(s.id)?.whole && ' ✓'}
            </button>
          ))}
        </div>
      )}
      <div className="tt-scroll" ref={scrollRef}>
        <div className="tt-grid" style={style}>
          <div className="tt-corner" style={{ gridRow: 1, gridColumn: 1 }} />
          {groups.map((g, gi) => {
            const first = venues.indexOf(g.venues[0]) + 2;
            return (
              <div
                key={gi}
                className={'tt-building ' + buildingClass(g.building) + (gi > 0 ? ' is-group-start' : '')}
                style={{ gridRow: 1, gridColumn: `${first} / span ${g.venues.length}` }}
              >
                <span>{g.building}</span>
              </div>
            );
          })}
          {venues.map((v, i) => (
            <div
              key={v.id}
              className={'tt-venue' + venueClass(v)}
              style={{ gridRow: 1, gridColumn: i + 2 }}
              title={`${v.room}${v.floor !== undefined ? ` ${v.floor}階` : ''}（${v.building}）`}
            >
              <span className="tt-venue-name">
                {v.name}
                {venueFloor(v) !== null && <span className="tt-floor">{venueFloor(v)}F</span>}
              </span>
              <span className="tt-venue-room">{v.room}</span>
            </div>
          ))}
          {/* time column: one label per 15-minute row, absolutely positioned inside the body row */}
          <div className="tt-timecol" style={{ gridRow: 2, gridColumn: 1 }}>
            {slots.map((t) => (
              <div
                key={t}
                className={'tt-time' + (t % 60 === 0 ? ' is-hour' : '')}
                style={{ top: minutesToOffset(t) }}
              >
                {t % 60 === 0 ? fromMinutes(t) : ''}
              </div>
            ))}
          </div>
          {/* column separators */}
          {venues.map((v, i) => (
            <div key={v.id} className={'tt-col' + venueClass(v)} style={{ gridRow: 2, gridColumn: i + 2 }} />
          ))}
          {gridSessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              column={colIndex.get(s.venue)!}
              selection={selection.get(s.id)}
              dimmed={matchSet !== null && !matchSet.has(s.id)}
              matched={matchSet !== null && matchSet.has(s.id)}
              onOpen={onOpen}
            />
          ))}
          {showNow && nowMinutes !== null && (
            <div
              className="tt-now"
              style={{ gridRow: 2, gridColumn: `1 / span ${venues.length + 1}`, top: minutesToOffset(nowMinutes) }}
              aria-label={`現在時刻 ${fromMinutes(nowMinutes)}`}
            >
              <span className="tt-now-label">{fromMinutes(nowMinutes)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
