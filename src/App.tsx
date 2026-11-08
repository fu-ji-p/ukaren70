import { useCallback, useEffect, useMemo, useState } from 'react';
import { DATES, gridVenues, program, sessionById, sessionsByDate, venueById } from './data';
import { DayTabs } from './components/DayTabs';
import { MySchedule } from './components/MySchedule';
import { SearchBar } from './components/SearchBar';
import { SessionDetail } from './components/SessionDetail';
import { SettingsMenu } from './components/SettingsMenu';
import { Timetable } from './components/Timetable';
import { useNow } from './hooks/useNow';
import { useSchedule } from './hooks/useSchedule';
import { initialDate } from './lib/layout';
import { buildDayPlans } from './lib/schedule';
import { matchSessions } from './lib/search';
import { resolveItem, summarizeSelection, toggleSessionChange, toggleTalkChange } from './lib/selection';
import { parseShareHash } from './lib/share';
import type { Session } from './types';

type View = 'timetable' | 'schedule';

const isKnownSelection = (id: string) => resolveItem(id, sessionById) !== null;

export default function App() {
  const now = useNow();
  const [date, setDate] = useState(() => initialDate(DATES, now.date));
  const [view, setView] = useState<View>('timetable');
  const schedule = useSchedule(isKnownSelection);
  const [openId, setOpenId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const close = useCallback(() => setOpenId(null), []);
  const open = openId ? sessionById.get(openId) : undefined;

  const [query, setQuery] = useState('');
  const matchSet = useMemo(() => matchSessions(program.sessions, query), [query]);
  const hitCounts = useMemo(
    () =>
      matchSet
        ? DATES.map((d) => ({ date: d, count: (sessionsByDate.get(d) ?? []).filter((s) => matchSet.has(s.id)).length }))
        : null,
    [matchSet],
  );

  const selection = useMemo(() => summarizeSelection(schedule.selected), [schedule.selected]);
  const plans = useMemo(() => buildDayPlans(DATES, schedule.selected, sessionById, venueById), [schedule.selected]);
  // entries that resolve against the current program (stale ids stay stored but are not counted)
  const visibleCount = useMemo(() => plans.reduce((n, p) => n + p.items.length, 0), [plans]);

  const toggleSession = useCallback(
    (id: string) => schedule.apply(toggleSessionChange(schedule.selected, id)),
    [schedule.apply, schedule.selected],
  );
  const toggleTalk = useCallback(
    (s: Session, i: number) => schedule.apply(toggleTalkChange(schedule.selected, s, i)),
    [schedule.apply, schedule.selected],
  );

  // A share link (#s=...) opened on another device: offer to import it (banner), then drop the hash.
  const [pendingImport, setPendingImport] = useState<string[] | null>(null);
  useEffect(() => {
    const check = () => {
      const ids = parseShareHash(window.location.hash);
      if (!ids) return;
      history.replaceState(null, '', window.location.pathname + window.location.search);
      if (ids.length > 0) setPendingImport(ids);
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, []);
  const acceptImport = () => {
    if (pendingImport) schedule.replace(pendingImport);
    setPendingImport(null);
    setView('schedule');
  };

  return (
    <>
    <div className="app screen-only">
      <header className="topbar">
        <h1 className="topbar-title">
          <span className="title-long">{program.conference.name}</span>
          <span className="title-short">宇科連70</span>
        </h1>
        <nav className="viewtabs" aria-label="画面切替">
          <button
            type="button"
            className={'viewtab' + (view === 'timetable' ? ' is-active' : '')}
            onClick={() => setView('timetable')}
          >
            タイムテーブル
          </button>
          <button
            type="button"
            className={'viewtab' + (view === 'schedule' ? ' is-active' : '')}
            onClick={() => setView('schedule')}
          >
            マイスケジュール
            {visibleCount > 0 && <span className="count">{visibleCount}</span>}
          </button>
        </nav>
        <button type="button" className="iconbtn" aria-label="設定" onClick={() => setSettingsOpen(true)}>
          ⚙
        </button>
      </header>
      {pendingImport && (
        <div className="import-banner" role="alert">
          <span>
            リンクに{pendingImport.length}件の選択が含まれています。読み込みますか？
            {visibleCount > 0 && `（この端末の${visibleCount}件は置き換えられます）`}
          </span>
          <span className="row">
            <button type="button" className="btn btn-sm btn-primary" onClick={acceptImport}>
              読み込む
            </button>
            <button type="button" className="btn btn-sm" onClick={() => setPendingImport(null)}>
              無視
            </button>
          </span>
        </div>
      )}
      {view === 'timetable' ? (
        <>
          <DayTabs dates={DATES} value={date} today={now.date} onChange={setDate} />
          <SearchBar value={query} onChange={setQuery} counts={hitCounts} onJump={setDate} />
          <main className="main">
            <Timetable
              venues={gridVenues}
              sessions={sessionsByDate.get(date) ?? []}
              selection={selection}
              matchSet={matchSet}
              nowMinutes={now.date === date ? now.minutes : null}
              onOpen={setOpenId}
            />
          </main>
        </>
      ) : (
        <main className="main main-scroll">
          <MySchedule plans={plans} onOpen={setOpenId} onRemove={schedule.remove} onPrint={() => window.print()} />
        </main>
      )}
      {open && (
        <SessionDetail
          session={open}
          selection={selection.get(open.id)}
          query={query}
          onToggleSession={toggleSession}
          onToggleTalk={toggleTalk}
          onClose={close}
        />
      )}
      {settingsOpen && (
        <SettingsMenu
          selected={schedule.selected}
          visibleCount={visibleCount}
          onReplace={schedule.replace}
          onClear={schedule.clear}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
    {/* Print layout (A4 portrait, one page per day). Hidden on screen; Cmd/Ctrl+P works from any view. */}
    <div className="print-root print-only">
      <header className="print-head">
        <h1>{program.conference.name} マイスケジュール</h1>
        <p>
          {window.location.href.split(/[?#]/)[0]} ・ 印刷: {new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
        </p>
      </header>
      <MySchedule plans={plans} print />
    </div>
    </>
  );
}
