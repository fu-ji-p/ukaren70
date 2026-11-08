import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { loadSchedule, saveSchedule } from '../lib/storage';

type Action =
  | { type: 'toggle'; id: string }
  | { type: 'remove'; id: string }
  | { type: 'replace'; ids: string[] }
  | { type: 'apply'; add: string[]; remove: string[] }
  | { type: 'clear' };

function reducer(state: string[], action: Action): string[] {
  switch (action.type) {
    case 'toggle':
      return state.includes(action.id) ? state.filter((x) => x !== action.id) : [...state, action.id];
    case 'remove':
      return state.filter((x) => x !== action.id);
    case 'replace':
      return Array.from(new Set(action.ids));
    case 'apply': {
      const rm = new Set(action.remove);
      return Array.from(new Set([...state.filter((x) => !rm.has(x)), ...action.add]));
    }
    case 'clear':
      return [];
  }
}

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Selected session IDs, persisted to localStorage under ukaren70.schedule.v1 .
 * `isKnown` drops IDs that are not in the current program (old data, typos in imported files).
 */
export function useSchedule(isKnown: (id: string) => boolean = () => true) {
  const [selected, dispatch] = useReducer(reducer, undefined, () => loadSchedule(storage()).filter(isKnown));

  useEffect(() => {
    saveSchedule(storage(), selected);
  }, [selected]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const toggle = useCallback((id: string) => dispatch({ type: 'toggle', id }), []);
  const remove = useCallback((id: string) => dispatch({ type: 'remove', id }), []);
  const replace = useCallback((ids: string[]) => dispatch({ type: 'replace', ids: ids.filter(isKnown) }), [isKnown]);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);
  const apply = useCallback(
    (change: { add: string[]; remove: string[] }) => dispatch({ type: 'apply', add: change.add.filter(isKnown), remove: change.remove }),
    [isKnown],
  );

  return { selected, selectedSet, toggle, remove, replace, clear, apply };
}
