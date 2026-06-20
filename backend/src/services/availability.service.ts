import { availabilityRepository } from '../repositories/availability.repository';
import { appointmentRepository } from '../repositories/appointment.repository';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../errors/AppError';

const CLINIC_TZ = process.env.CLINIC_TZ ?? 'America/Mexico_City';
const SLOT_MINUTES = 60;
const MAX_RANGE_DAYS = 31;

interface Slot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

async function ensureTherapist(therapistId: string) {
  const t = await userRepository.findById(therapistId);
  if (!t || t.role !== 'THERAPIST') throw new AppError('Terapeuta no encontrado', 404);
  return t;
}

function zonedTimeToUtc(y: number, mo: number, d: number, hh: number, mm: number): Date {
  const utcGuess = Date.UTC(y, mo, d, hh, mm, 0);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(new Date(utcGuess));
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const asTzMs = Date.UTC(
    +map.year, +map.month - 1, +map.day,
    map.hour === '24' ? 0 : +map.hour, +map.minute, +map.second,
  );
  const offset = asTzMs - utcGuess;
  return new Date(utcGuess - offset);
}

function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export const availabilityService = {
  async getForTherapist(therapistId: string) {
    await ensureTherapist(therapistId);
    return availabilityRepository.findByTherapist(therapistId);
  },

  async setForTherapist(therapistId: string, slots: Slot[]) {
    await ensureTherapist(therapistId);
    const days = slots.map(s => s.dayOfWeek);
    if (new Set(days).size !== days.length) {
      throw new AppError('No puede haber días repetidos en el horario', 422);
    }
    return availabilityRepository.replaceForTherapist(therapistId, slots);
  },

  async getAvailableSlots(therapistId: string, from: string, to: string) {
    await ensureTherapist(therapistId);

    const availability = await availabilityRepository.findByTherapist(therapistId);
    if (availability.length === 0) return [];

    const byDay = new Map(availability.map(s => [s.dayOfWeek, s]));
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T00:00:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      throw new AppError('Rango de fechas inválido', 422);
    }
    const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    if (days > MAX_RANGE_DAYS) throw new AppError(`El rango no puede exceder ${MAX_RANGE_DAYS} días`, 422);

    const now = new Date();
    const result: { dateTime: string }[] = [];

    for (let i = 0; i <= days; i++) {
      const day = new Date(start.getTime() + i * 86_400_000);
      const y = day.getFullYear();
      const mo = day.getMonth();
      const d = day.getDate();
      const dow = day.getDay();

      const slot = byDay.get(dow);
      if (!slot) continue;

      const startMin = hhmmToMinutes(slot.startTime);
      const endMin = hhmmToMinutes(slot.endTime);

      for (let min = startMin; min + SLOT_MINUTES <= endMin; min += SLOT_MINUTES) {
        const candidate = zonedTimeToUtc(y, mo, d, Math.floor(min / 60), min % 60);
        if (candidate <= now) continue;
        const conflict = await appointmentRepository.findConflict(therapistId, candidate);
        if (!conflict) result.push({ dateTime: candidate.toISOString() });
      }
    }

    return result;
  },
};
