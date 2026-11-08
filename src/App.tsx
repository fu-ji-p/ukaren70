import { useCallback, useState } from 'react';
import { DATES, gridVenues, program, sessionById, sessionsByDate } from './data';
import { DayTabs } from './components/DayTabs';
import { SessionDetail } from './components/SessionDetail';
import { Timetable } from './components/Timetable';
import { useNow } from './hooks/useNow';
import { useSchedule } from './hooks/useSchedule';
import { initialDate } from './lib/layout';

export default function App() {
  const now = useNow();
  const [date, setDate] = useState(() => initialDate(DATES, now.date));
  const schedule = useSchedule();
  const [openId, setOpenId] = useState<string | null>(null);
  const close = useCallback(() => setOpenId(null), []);
  const open = openId ? sessionById.get(openId) : undefined;

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="topbar-title">{program.conference.name}</h1>
      </header>
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
      {open && (
        <SessionDetail
          session={open}
          selected={schedule.selectedSet.has(open.id)}
          onToggle={schedule.toggle}
          onClose={close}
        />
      )}
    </div>
  );
}
