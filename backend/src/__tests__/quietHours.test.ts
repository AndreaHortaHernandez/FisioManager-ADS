import { isWithinQuietHours } from '../services/notificationPreference.service';

describe('isWithinQuietHours', () => {
  it('detecta una hora dentro de un rango normal (no cruza medianoche)', () => {
    expect(isWithinQuietHours('09:00', '17:00', '12:00')).toBe(true);
    expect(isWithinQuietHours('09:00', '17:00', '08:59')).toBe(false);
    expect(isWithinQuietHours('09:00', '17:00', '17:00')).toBe(false);
  });

  it('soporta rangos que cruzan la medianoche', () => {
    expect(isWithinQuietHours('22:00', '07:00', '23:30')).toBe(true);
    expect(isWithinQuietHours('22:00', '07:00', '03:00')).toBe(true);
    expect(isWithinQuietHours('22:00', '07:00', '12:00')).toBe(false);
    expect(isWithinQuietHours('22:00', '07:00', '07:00')).toBe(false);
  });

  it('un rango vacío (inicio == fin) nunca silencia', () => {
    expect(isWithinQuietHours('09:00', '09:00', '09:00')).toBe(false);
  });
});
