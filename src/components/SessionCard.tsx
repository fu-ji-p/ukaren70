import type { Session } from '../types';
import { cardRect } from '../lib/layout';
import type { SessionSelection } from '../lib/selection';

interface Props {
  session: Session;
  column: number; // 1-based css grid column
  selection: SessionSelection | undefined;
  dimmed: boolean; // search active and this card does not match
  matched: boolean; // search active and this card matches
  onOpen: (id: string) => void;
}

export function SessionCard({ session, column, selection, dimmed, matched, onOpen }: Props) {
  const rect = cardRect(session);
  const whole = selection?.whole ?? false;
  const partial = !whole && (selection?.talks.size ?? 0) > 0;
  const cls =
    'card kind-' +
    session.kind +
    (whole ? ' is-selected' : '') +
    (partial ? ' is-partial' : '') +
    (dimmed ? ' is-dimmed' : '') +
    (matched ? ' is-matched' : '');
  return (
    <button
      type="button"
      className={cls}
      style={{ gridRow: 2, gridColumn: column, top: rect.top, height: rect.height }}
      onClick={() => onOpen(session.id)}
      aria-pressed={whole || partial}
      title={`${session.start}-${session.end} ${session.title}`}
    >
      <span className="card-time">
        {session.start}–{session.end}
      </span>
      <span className="card-title">{session.title.replace(/^【OS】/, '')}</span>
      {session.chair && <span className="card-chair">{session.chair}</span>}
      {whole && (
        <span className="card-check" aria-hidden="true">
          ✓
        </span>
      )}
      {partial && (
        <span className="card-check is-partial" aria-hidden="true">
          {selection!.talks.size}/{session.talks.length}
        </span>
      )}
    </button>
  );
}
