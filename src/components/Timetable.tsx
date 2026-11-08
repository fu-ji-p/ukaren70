import type { Session, Venue } from '../types';
import {
  HEADER_PX,
  SUB_COUNT,
  SUB_PX,
  TIME_COL_PX,
  VENUE_COL_MIN_PX,
  groupByBuilding,
  timeSlots,
} from '../lib/layout';
import { fromMinutes } from '../lib/time';

interface Props {
  venues: Venue[];
  sessions: Session[];
}

export function Timetable({ venues }: Props) {
  const groups = groupByBuilding(venues);
  const slots = timeSlots();
  const style = {
    gridTemplateColumns: `${TIME_COL_PX}px repeat(${venues.length}, minmax(${VENUE_COL_MIN_PX}px, 1fr))`,
    gridTemplateRows: `${HEADER_PX}px repeat(${SUB_COUNT}, ${SUB_PX}px)`,
  } as const;

  return (
    <div className="tt-scroll">
      <div className="tt-grid" style={style}>
        {/* corner */}
        <div className="tt-corner" style={{ gridRow: 1, gridColumn: 1 }} />
        {/* building row + venue row inside one header cell per venue */}
        {groups.map((g) => {
          const first = venues.indexOf(g.venues[0]) + 2;
          return (
            <div key={g.building} className="tt-building" style={{ gridRow: 1, gridColumn: `${first} / span ${g.venues.length}` }}>
              <span>{g.building}</span>
            </div>
          );
        })}
        {venues.map((v, i) => (
          <div key={v.id} className="tt-venue" style={{ gridRow: 1, gridColumn: i + 2 }} title={v.room}>
            <span className="tt-venue-name">{v.name}</span>
            <span className="tt-venue-room">{v.room}</span>
          </div>
        ))}
        {/* time column: one label per 15-minute row (spans 3 sub rows) */}
        {slots.map((t, i) => (
          <div
            key={t}
            className={'tt-time' + (t % 60 === 0 ? ' is-hour' : '')}
            style={{ gridRow: `${i * 3 + 2} / span 3`, gridColumn: 1 }}
          >
            {t % 60 === 0 ? fromMinutes(t) : ''}
          </div>
        ))}
      </div>
    </div>
  );
}
