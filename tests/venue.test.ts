import { describe, expect, it } from 'vitest';
import { venueFloor, venueLocation } from '../src/lib/venue';
import { program } from '../src/data';
import type { Venue } from '../src/types';

const base: Venue = { id: 'A', name: 'A会場', room: '中ホール', building: 'ライトキューブ宇都宮', floor: 3, grid: true };

describe('venue floor', () => {
  it('returns the floor for an ordinary room', () => {
    expect(venueFloor(base)).toBe(3);
    expect(venueLocation(base)).toBe('A会場 中ホール 3階（ライトキューブ宇都宮）');
  });
  it('hides the floor when the room name already states it', () => {
    const foyer: Venue = { ...base, id: 'F1', name: '1F ホワイエ', room: '1F ホワイエ', floor: 1 };
    expect(venueFloor(foyer)).toBeNull();
    expect(venueLocation(foyer)).toBe('1F ホワイエ（ライトキューブ宇都宮）');
  });
  it('returns null when the floor is unknown', () => {
    const { floor: _f, ...noFloor } = base;
    expect(venueFloor(noFloor)).toBeNull();
    expect(venueFloor(undefined)).toBeNull();
  });
  it('has a floor for every grid venue in the program data', () => {
    const missing = program.venues.filter((v) => v.grid && v.floor === undefined).map((v) => v.id);
    expect(missing).toEqual([]);
  });
  it('matches the official floor guides', () => {
    const floor = (id: string) => program.venues.find((v) => v.id === id)?.floor;
    expect([floor('A'), floor('B'), floor('C'), floor('D'), floor('K'), floor('L'), floor('N')]).toEqual([3, 2, 2, 1, 1, 4, 4]);
    expect([floor('O'), floor('P'), floor('S')]).toEqual([10, 9, 9]);
  });
});
