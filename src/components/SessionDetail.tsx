import { useEffect } from 'react';
import type { Session } from '../types';
import { KIND_LABEL, venueById } from '../data';
import { talkKey, talkTime, type SessionSelection } from '../lib/selection';
import { formatDateJa } from '../lib/time';

interface Props {
  session: Session;
  selection: SessionSelection | undefined;
  /** lower-cased search query, used to highlight matching talks */
  query?: string;
  onToggleSession: (id: string) => void;
  onToggleTalk: (session: Session, index: number) => void;
  onClose: () => void;
}

export function SessionDetail({ session, selection, query, onToggleSession, onToggleTalk, onClose }: Props) {
  const venue = venueById.get(session.venue);
  const whole = selection?.whole ?? false;
  const talkCount = selection?.talks.size ?? 0;
  const canPickTalks = session.talks.length > 1;

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
            <>
              {canPickTalks && (
                <p className="talks-hint">
                  講演ごとに追加することもできます（時刻はセッション時間を講演数で等分した目安）。
                  {talkCount > 0 && !whole && ` ${talkCount}件を個別に選択中。`}
                </p>
              )}
              <ol className="talks">
                {session.talks.map((t, i) => {
                  const picked = whole || (selection?.talks.has(talkKey(t, i)) ?? false);
                  const tt = talkTime(session, i);
                  return (
                    <li key={i} className={'talk' + (hit(t) ? ' is-hit' : '') + (picked ? ' is-picked' : '')}>
                      {canPickTalks ? (
                        <button
                          type="button"
                          className={'talk-pick' + (picked ? ' is-on' : '')}
                          aria-pressed={picked}
                          aria-label={picked ? 'この講演をマイスケジュールから外す' : 'この講演をマイスケジュールに追加'}
                          onClick={() => onToggleTalk(session, i)}
                        >
                          {picked ? '✓' : '＋'}
                        </button>
                      ) : (
                        <span />
                      )}
                      <span className="talk-head">
                        {t.code && <span className="talk-code">{t.code}</span>}
                        {tt.split && (
                          <span className="talk-time">
                            {tt.start}–{tt.end}
                          </span>
                        )}
                      </span>
                      <span className="talk-title">{t.title}</span>
                      <span className="talk-authors">{t.authors}</span>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </div>
        <footer className="sheet-foot">
          <button type="button" className={'btn btn-primary' + (whole ? ' is-remove' : '')} onClick={() => onToggleSession(session.id)}>
            {whole
              ? '✓ セッション全体をマイスケジュールから削除'
              : talkCount > 0
                ? `＋ セッション全体を追加（個別の${talkCount}件を含める）`
                : canPickTalks
                  ? '＋ セッション全体をマイスケジュールに追加'
                  : '＋ マイスケジュールに追加'}
          </button>
        </footer>
      </aside>
    </>
  );
}
