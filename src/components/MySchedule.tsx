import type { DayPlan } from '../lib/schedule';
import { KIND_LABEL, venueById } from '../data';
import { formatDateJa } from '../lib/time';

interface Props {
  plans: DayPlan[];
  /** compact print layout: no buttons, talks listed */
  print?: boolean;
  onOpen?: (id: string) => void;
  onRemove?: (id: string) => void;
  onPrint?: () => void;
}

function formatGap(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}時間${m > 0 ? `${m}分` : ''}` : `${m}分`;
}

export function MySchedule({ plans, print = false, onOpen, onRemove, onPrint }: Props) {
  const total = plans.reduce((n, p) => n + p.sessions.length, 0);
  return (
    <div className={'sched' + (print ? ' sched-print' : '')}>
      {!print && (
        <div className="sched-toolbar">
          <span className="sched-count">{total}件を選択中</span>
          <button type="button" className="btn" onClick={onPrint} disabled={total === 0}>
            🖨 印刷
          </button>
        </div>
      )}
      {!print && total === 0 && (
        <p className="sched-empty">
          まだ何も選んでいません。タイムテーブルでセッションをタップして「マイスケジュールに追加」を押してください。
        </p>
      )}
      {plans.map((p, di) =>
        p.sessions.length === 0 && print ? null : (
          <section key={p.date} className="sched-day">
            <h2 className="sched-date">
              {di + 1}日目 {formatDateJa(p.date)}
              {p.conflicts.size > 0 && <span className="badge badge-warn">重複あり</span>}
            </h2>
            {p.sessions.length === 0 ? (
              <p className="sched-none">選択なし</p>
            ) : (
              <ol className="sched-list">
                {p.sessions.map((s) => {
                  const v = venueById.get(s.venue);
                  const move = p.moveBefore.get(s.id);
                  return (
                    <li key={s.id} className="sched-item-wrap">
                      {move && (
                        <div className="move-note">
                          🚶 建物移動: {move.fromBuilding} → {move.toBuilding}
                          {move.gapMinutes >= 0 ? `（空き ${formatGap(move.gapMinutes)}）` : '（時間が重なっています）'}
                        </div>
                      )}
                      <article
                        className={'sched-item kind-' + s.kind + (p.conflicts.has(s.id) ? ' is-conflict' : '')}
                        onClick={onOpen ? () => onOpen(s.id) : undefined}
                        role={onOpen ? 'button' : undefined}
                        tabIndex={onOpen ? 0 : undefined}
                        onKeyDown={onOpen ? (e) => e.key === 'Enter' && onOpen(s.id) : undefined}
                      >
                        <div className="sched-time">
                          <span>{s.start}</span>
                          <span className="sched-time-end">{s.end}</span>
                        </div>
                        <div className="sched-main">
                          <div className="sched-badges">
                            <span className="kind-mini">{KIND_LABEL[s.kind]}</span>
                            {p.conflicts.has(s.id) && <span className="badge badge-warn">重複</span>}
                          </div>
                          <h3 className="sched-title">{s.title}</h3>
                          <div className="sched-venue">
                            <strong>{v?.name ?? s.venue}</strong> {v?.room}
                            <span className="sched-building">{v?.building}</span>
                          </div>
                          {s.chair && <div className="sched-chair">司会: {s.chair}</div>}
                          {print && s.talks.length > 0 && (
                            <ul className="sched-talks">
                              {s.talks.map((t, i) => (
                                <li key={i}>
                                  {t.code && <span className="talk-code">{t.code}</span>} {t.title}
                                  <span className="sched-talk-authors"> {t.authors}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          {print && s.note && <div className="sched-chair">{s.note}</div>}
                        </div>
                        {onRemove && (
                          <button
                            type="button"
                            className="sched-remove"
                            aria-label="削除"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemove(s.id);
                            }}
                          >
                            ×
                          </button>
                        )}
                      </article>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        ),
      )}
    </div>
  );
}
