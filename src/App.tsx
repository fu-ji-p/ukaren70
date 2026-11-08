import { useState } from 'react';
import { DATES, gridVenues, program, sessionsByDate } from './data';
import { DayTabs } from './components/DayTabs';
import { Timetable } from './components/Timetable';
import { useNow } from './hooks/useNow';
import { useSchedule } from './hooks/useSchedule';
import { initialDate } from './lib/layout';

export default function App() {
  const now = useNow();
  const [date, setDate] = useState(() => initialDate(DATES, now.date));
  const schedule = useSchedule();
  const [openId, setOpenId] = useState<string | null>(null);

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
          onOpen={(id) => {
            setOpenId(id);
            schedule.toggle(id);
          }}
        />
      </main>
      {openId && <span hidden>{openId}</span>}
    </div>
  );
}
