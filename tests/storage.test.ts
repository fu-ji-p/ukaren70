import { describe, expect, it } from 'vitest';
import { STORAGE_KEY, loadSchedule, parseScheduleJson, saveSchedule, serializeSchedule, type StorageLike } from '../src/lib/storage';

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

describe('storage key and format', () => {
  it('uses the agreed key and JSON shape', () => {
    expect(STORAGE_KEY).toBe('ukaren70.schedule.v1');
    const json = JSON.parse(serializeSchedule(['10A0900', '11B1245'], new Date('2026-11-08T03:00:00Z')));
    expect(json).toEqual({ selected: ['10A0900', '11B1245'], updatedAt: '2026-11-08T03:00:00.000Z' });
  });

  it('round-trips through storage', () => {
    const st = memoryStorage();
    expect(saveSchedule(st, ['10A0900', '10A0900', '12O1300'])).toBe(true);
    expect(loadSchedule(st)).toEqual(['10A0900', '12O1300']);
  });
});

describe('loading', () => {
  it('starts empty when nothing is saved', () => {
    expect(loadSchedule(memoryStorage())).toEqual([]);
    expect(loadSchedule(null)).toEqual([]);
  });

  it('starts empty on broken or foreign JSON', () => {
    expect(loadSchedule(memoryStorage({ [STORAGE_KEY]: '{not json' }))).toEqual([]);
    expect(loadSchedule(memoryStorage({ [STORAGE_KEY]: '{"foo":1}' }))).toEqual([]);
    expect(loadSchedule(memoryStorage({ [STORAGE_KEY]: '[]' }))).toEqual([]);
  });

  it('keeps only string IDs that look like session IDs', () => {
    const st = memoryStorage({ [STORAGE_KEY]: JSON.stringify({ selected: ['10A0900', 42, null, 'x'.repeat(50), '10PARTY1830'] }) });
    expect(loadSchedule(st)).toEqual(['10A0900', '10PARTY1830']);
  });

  it('survives a storage that throws', () => {
    const throwing: StorageLike = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {},
    };
    expect(loadSchedule(throwing)).toEqual([]);
    expect(saveSchedule(throwing, ['10A0900'])).toBe(false);
  });
});

describe('import/export file', () => {
  it('accepts an exported file and fills a missing updatedAt', () => {
    expect(parseScheduleJson('{"selected":["10A0900"]}')).toEqual({ selected: ['10A0900'], updatedAt: '1970-01-01T00:00:00.000Z' });
  });
  it('rejects garbage', () => {
    expect(parseScheduleJson('')).toBeNull();
    expect(parseScheduleJson(undefined)).toBeNull();
    expect(parseScheduleJson('"string"')).toBeNull();
  });
});
