import { formatDateJa } from '../lib/time';

interface Props {
  dates: string[];
  value: string;
  today?: string;
  onChange: (d: string) => void;
}

export function DayTabs({ dates, value, today, onChange }: Props) {
  return (
    <div className="daytabs" role="tablist">
      {dates.map((d, i) => (
        <button
          key={d}
          role="tab"
          aria-selected={d === value}
          className={'daytab' + (d === value ? ' is-active' : '') + (d === today ? ' is-today' : '')}
          onClick={() => onChange(d)}
        >
          <span className="daytab-n">{i + 1}日目</span>
          <span className="daytab-d">{formatDateJa(d)}</span>
        </button>
      ))}
    </div>
  );
}
