import { describe, expect, it } from 'vitest';
import { matchSessions, normalize, queryTerms } from '../src/lib/search';
import type { Session } from '../src/types';

const sessions: Session[] = [
  {
    id: '10A0900', date: '2026-11-10', venue: 'A', start: '09:00', end: '10:00', kind: 'os', chair: '佐藤 祐希 (三菱総合研究所)',
    title: '【OS】シスルナ・月面領域での活動領域拡大に向けた取組(1)',
    talks: [{ code: '2A01', title: '日本の国際宇宙探査シナリオ案2025', authors: '〇成田 伸一郎, 藤平 耕一 (JAXA)' }],
  },
  {
    id: '10H0900', date: '2026-11-10', venue: 'H', start: '09:00', end: '10:00', kind: 'general', chair: '永田 晴紀 (北大)',
    title: '宇宙推進 (1)',
    talks: [{ code: '2H01', title: 'ハイブリッドロケットの燃焼', authors: '〇山田 太郎 (北大)' }],
  },
];

describe('search', () => {
  it('normalizes width and case', () => {
    expect(normalize('ＪＡＸＡ Ｒocket')).toBe('jaxa rocket');
    expect(queryTerms('  月面　JAXA ')).toEqual(['月面', 'jaxa']);
  });

  it('returns null for an empty query', () => {
    expect(matchSessions(sessions, '')).toBeNull();
    expect(matchSessions(sessions, '   ')).toBeNull();
  });

  it('matches session title, talk title, author and chair', () => {
    expect([...matchSessions(sessions, '月面')!]).toEqual(['10A0900']);
    expect([...matchSessions(sessions, '探査シナリオ')!]).toEqual(['10A0900']);
    expect([...matchSessions(sessions, '藤平')!]).toEqual(['10A0900']);
    expect([...matchSessions(sessions, '永田')!]).toEqual(['10H0900']);
    expect([...matchSessions(sessions, 'jaxa')!]).toEqual(['10A0900']);
  });

  it('requires every term (AND) and matches talk codes', () => {
    expect([...matchSessions(sessions, '北大 燃焼')!]).toEqual(['10H0900']);
    expect([...matchSessions(sessions, '北大 月面')!]).toEqual([]);
    expect([...matchSessions(sessions, '2h01')!]).toEqual(['10H0900']);
  });
});
