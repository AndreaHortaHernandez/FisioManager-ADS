import { describe, it, expect } from 'vitest';
import { toLocalDateString } from '../date';

describe('toLocalDateString', () => {
  it('formatea como YYYY-MM-DD con ceros a la izquierda', () => {
    expect(toLocalDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('no usa la representación UTC (a diferencia de toISOString)', () => {

    const d = new Date(2026, 11, 31, 23, 0, 0);
    expect(toLocalDateString(d)).toBe('2026-12-31');
  });
});
