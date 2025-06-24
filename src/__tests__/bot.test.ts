import { formatRace, convertToTZ } from '../bot';

describe('convertToTZ', () => {
  it('converts UTC time to Asia/Jerusalem', () => {
    const result = convertToTZ('2023-05-07', '13:00:00Z', 'Asia/Jerusalem');
    expect(result).toBe('2023-05-07 16:00 IDT');
  });
});

describe('formatRace', () => {
  it('formats race information', () => {
    const race = {
      raceName: 'Test GP',
      Circuit: { circuitName: 'Test Circuit' },
      date: '2023-05-07',
      time: '13:00:00Z',
      Qualifying: { date: '2023-05-06', time: '13:00:00Z' },
      Sprint: { date: '2023-05-06', time: '09:00:00Z' },
    } as any;
    const msg = formatRace(race);
    expect(msg).toContain('*Test GP*');
    expect(msg).toContain('Circuit: Test Circuit');
    expect(msg).toContain('Race: 2023-05-07 16:00 IDT');
    expect(msg).toContain('Qualifying: 2023-05-06 16:00 IDT');
    expect(msg).toContain('Sprint: 2023-05-06 12:00 IDT');
  });
});
