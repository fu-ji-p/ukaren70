import { formatDateJa } from '../lib/time';

interface Props {
  value: string;
  onChange: (q: string) => void;
  /** per-day hit counts (only when a query is active) */
  counts: { date: string; count: number }[] | null;
  onJump: (date: string) => void;
}

export function SearchBar({ value, onChange, counts, onJump }: Props) {
  const total = counts?.reduce((n, c) => n + c.count, 0) ?? 0;
  return (
    <div className="searchbar">
      <div className="search-row">
        <input
          type="search"
          className="search-input"
          placeholder="検索: セッション名・講演題目・著者"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          enterKeyHint="search"
          aria-label="検索"
        />
        {value && (
          <button type="button" className="search-clear" onClick={() => onChange('')} aria-label="検索をクリア">
            ×
          </button>
        )}
      </div>
      {counts && (
        <div className="search-hits">
          <span className="search-total">{total}件</span>
          {counts.map((c) => (
            <button
              key={c.date}
              type="button"
              className={'search-hit' + (c.count === 0 ? ' is-zero' : '')}
              onClick={() => onJump(c.date)}
              disabled={c.count === 0}
            >
              {formatDateJa(c.date)} {c.count}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
