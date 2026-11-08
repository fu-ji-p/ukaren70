import { buildingClass } from '../lib/layout';
import type { DayPlan } from '../lib/schedule';
import { KIND_LABEL, venueById } from '../data';
import { formatDateJa } from '../lib/time';

interface Props {
  plans: DayPlan[];
  /** compact print layout: no buttons, talks listed */
  print?: boolean;
  onOpen?: (sessionId: string) => void;
  onRemove?: (id: string) => void;
  onPrint?: () => void;
}

function formatGap(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}時間${m > 0 ? `${m}分` : ''}` : `${m}分`;
}

export function MySchedule({ plans, print = false, onOpen, onRemove, onPrint }: Props) {
  const total = plans.reduce((n, p) => n + p.items.length, 0);
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
      {!print && (
        <p className="notice">
          選択内容はこのブラウザ内にだけ保存されます。当日使う端末（スマホ）で追加するのが確実です。
          パソコンで作った場合は ⚙ 設定の「リンクをコピー」でスマホへ送れます。
        </p>
      )}
      {!print && total === 0 && (
        <p className="sched-empty">
          まだ何も選んでいません。タイムテーブルでセッションをタップして「マイスケジュールに追加」を押してください。
          講演1件だけを追加することもできます。
        </p>
      )}
      {plans.map((p, di) =>
        p.items.length === 0 && print ? null : (
          <section key={p.date} className="sched-day">
            <h2 className="sched-date">
              {di + 1}日目 {formatDateJa(p.date)}
              {p.conflicts.size > 0 && <span className="badge badge-warn">重複あり</span>}
            </h2>
            {p.items.length === 0 ? (
              <p className="sched-none">選択なし</p>
            ) : (
              <ol className="sched-list">
                {p.items.map((it) => {
                  const s = it.session;
                  const v = venueById.get(s.venue);
                  const move = p.moveBefore.get(it.id);
                  return (
                    <li key={it.id} className="sched-item-wrap">
                      {move && (
                        <div className="move-note">
                          🚶 建物移動: {move.fromBuilding} → {move.toBuilding}
                          {move.gapMinutes >= 0 ? `（空き ${formatGap(move.gapMinutes)}）` : '（時間が重なっています）'}
                        </div>
                      )}
                      <article
                        className={'sched-item kind-' + s.kind + (p.conflicts.has(it.id) ? ' is-conflict' : '') + (it.talk ? ' is-talk' : '')}
                        onClick={onOpen ? () => onOpen(s.id) : undefined}
                        role={onOpen ? 'button' : undefined}
                        tabIndex={onOpen ? 0 : undefined}
                        onKeyDown={onOpen ? (e) => e.key === 'Enter' && onOpen(s.id) : undefined}
                      >
                        <div className="sched-time">
                          <span>{it.start}</span>
                          <span className="sched-time-end">{it.end}</span>
                          {it.estimated && <span className="sched-est">目安</span>}
                        </div>
                        <div className="sched-main">
                          <div className="sched-badges">
                            <span className="kind-mini">{it.talk ? `講演 ${it.talk.code ?? ''}` : KIND_LABEL[s.kind]}</span>
                            {p.conflicts.has(it.id) && <span className="badge badge-warn">重複</span>}
                          </div>
                          {it.talk ? (
                            <>
                              <h3 className="sched-title">{it.talk.title}</h3>
                              <div className="sched-chair">{it.talk.authors}</div>
                              <div className="sched-session">{s.title}</div>
                            </>
                          ) : (
                            <h3 className="sched-title">{s.title}</h3>
                          )}
                          <div className="sched-venue">
                            <strong>{v?.name ?? s.venue}</strong> {v?.room}
                            <span className={'bld-tag ' + buildingClass(v?.building)}>{v?.building}</span>
                          </div>
                          {!it.talk && s.chair && <div className="sched-chair">司会: {s.chair}</div>}
                          {print && !it.talk && s.talks.length > 0 && (
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
                              onRemove(it.id);
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
      {print && (
        <p className="print-foot">
          このアプリは個人が作成したもので、宇科連（宇宙科学技術連合講演会）公式のものではありません。講演の時刻は目安です。最新情報は公式サイトをご確認ください。（アプリ v{__APP_VERSION__}）
        </p>
      )}
    </div>
  );
}
