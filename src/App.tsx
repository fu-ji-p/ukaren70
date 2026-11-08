import { useCallback, useMemo, useState } from 'react';
import { DATES, gridVenues, program, sessionById, sessionsByDate, venueById } from './data';
import { DayTabs } from './components/DayTabs';
import { MySchedule } from './components/MySchedule';
import { SessionDetail } from './components/SessionDetail';
import { SettingsMenu } from './components/SettingsMenu';
import { Timetable } from './components/Timetable';
import { useNow } from './hooks/useNow';
import { useSchedule } from './hooks/useSchedule';
import { initialDate } from './lib/layout';
import { buildDayPlans } from './lib/schedule';

type View = 'timetable' | 'schedule';

const isKnownSession = (id: string) => sessionById.has(id);

export default function App() {
  const now = useNow();
  const [date, setDate] = useState(() => initialDate(DATES, now.date));
  const [view, setView] = useState<View>('timetable');
  const schedule = useSchedule(isKnownSession);
  const [openId, setOpenId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const close = useCallback(() => setOpenId(null), []);
  const open = openId ? sessionById.get(openId) : undefined;

  const plans = useMemo(() => buildDayPlans(DATES, schedule.selected, sessionById, venueById), [schedule.selected]);

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
            {schedule.selected.length > 0 && <span className="count">{schedule.selected.length}</span>}
          </button>
        </nav>
        <button type="button" className="iconbtn" aria-label="設定" onClick={() => setSettingsOpen(true)}>
          ⚙
        </button>
      </header>
      {view === 'timetable' ? (
        <>
          <DayTabs dates={DATES} value={date} today={now.date} onChange={setDate} />
          <main className="main">
            <Timetable
              venues={gridVenues}
              sessions={sessionsByDate.get(date) ?? []}
              selectedSet={schedule.selectedSet}
              matchSet={null}
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
          selected={schedule.selectedSet.has(open.id)}
          onToggle={schedule.toggle}
          onClose={close}
        />
      )}
      {settingsOpen && (
        <SettingsMenu
          selected={schedule.selected}
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
          {window.location.href.split('?')[0]} ・ 印刷: {new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
        </p>
      </header>
      <MySchedule plans={plans} print />
    </div>
    </>
  );
}
