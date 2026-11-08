import { useState } from 'react';
import { DATES, gridVenues, program, sessionsByDate } from './data';
import { DayTabs } from './components/DayTabs';
import { Timetable } from './components/Timetable';
import { useNow } from './hooks/useNow';
import { initialDate } from './lib/layout';

export default function App() {
  const now = useNow();
  const [date, setDate] = useState(() => initialDate(DATES, now.date));

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="topbar-title">{program.conference.name}</h1>
      </header>
      <DayTabs dates={DATES} value={date} today={now.date} onChange={setDate} />
      <main className="main">
        <Timetable venues={gridVenues} sessions={sessionsByDate.get(date) ?? []} />
      </main>
    </div>
  );
}
