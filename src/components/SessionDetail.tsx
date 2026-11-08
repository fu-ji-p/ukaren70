import { useEffect } from 'react';
import type { Session } from '../types';
import { KIND_LABEL, venueById } from '../data';
import { formatDateJa } from '../lib/time';

interface Props {
  session: Session;
  selected: boolean;
  /** lower-cased search query, used to highlight matching talks */
  query?: string;
  onToggle: (id: string) => void;
  onClose: () => void;
}

export function SessionDetail({ session, selected, query, onToggle, onClose }: Props) {
  const venue = venueById.get(session.venue);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const q = query?.trim().toLowerCase() ?? '';
  const hit = (t: { title: string; authors: string }) =>
    q !== '' && (t.title.toLowerCase().includes(q) || t.authors.toLowerCase().includes(q));

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div className="sheet-handle" aria-hidden="true" />
        <header className="sheet-head">
          <span className={'kind-badge kind-' + session.kind}>{KIND_LABEL[session.kind]}</span>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </header>
        <div className="sheet-body">
          <h2 id="sheet-title" className="sheet-title">
            {session.title}
          </h2>
          <dl className="sheet-meta">
            <dt>日時</dt>
            <dd>
              {formatDateJa(session.date)} {session.start}–{session.end}
            </dd>
            <dt>会場</dt>
            <dd>
              {venue ? (
                <>
                  <strong>{venue.name}</strong> {venue.room}
                  <span className="sheet-building">{venue.building}</span>
                </>
              ) : (
                session.venue
              )}
            </dd>
            {session.chair && (
              <>
                <dt>司会</dt>
                <dd>{session.chair}</dd>
              </>
            )}
            {session.note && (
              <>
                <dt>備考</dt>
                <dd>{session.note}</dd>
              </>
            )}
            {session.url && (
              <>
                <dt>リンク</dt>
                <dd>
                  <a href={session.url} target="_blank" rel="noreferrer">
                    公式サイトの案内
                  </a>
                </dd>
              </>
            )}
          </dl>
          {session.talks.length > 0 && (
            <ol className="talks">
              {session.talks.map((t, i) => (
                <li key={i} className={'talk' + (hit(t) ? ' is-hit' : '')}>
                  {t.code && <span className="talk-code">{t.code}</span>}
                  <span className="talk-title">{t.title}</span>
                  <span className="talk-authors">{t.authors}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
        <footer className="sheet-foot">
          <button
            type="button"
            className={'btn btn-primary' + (selected ? ' is-remove' : '')}
            onClick={() => onToggle(session.id)}
          >
            {selected ? '✓ マイスケジュールから削除' : '＋ マイスケジュールに追加'}
          </button>
        </footer>
      </aside>
    </>
  );
}
