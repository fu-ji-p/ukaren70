import type { Session } from '../types';
import { cardRect } from '../lib/layout';

interface Props {
  session: Session;
  column: number; // 1-based css grid column
  selected: boolean;
  dimmed: boolean; // search active and this card does not match
  matched: boolean; // search active and this card matches
  onOpen: (id: string) => void;
}

export function SessionCard({ session, column, selected, dimmed, matched, onOpen }: Props) {
  const rect = cardRect(session);
  const cls =
    'card kind-' +
    session.kind +
    (selected ? ' is-selected' : '') +
    (dimmed ? ' is-dimmed' : '') +
    (matched ? ' is-matched' : '');
  return (
    <button
      type="button"
      className={cls}
      style={{ gridRow: 2, gridColumn: column, top: rect.top, height: rect.height }}
      onClick={() => onOpen(session.id)}
      aria-pressed={selected}
      title={`${session.start}-${session.end} ${session.title}`}
    >
      <span className="card-time">
        {session.start}–{session.end}
      </span>
      <span className="card-title">{session.title.replace(/^【OS】/, '')}</span>
      {session.chair && <span className="card-chair">{session.chair}</span>}
      {selected && <span className="card-check" aria-hidden="true">✓</span>}
    </button>
  );
}
