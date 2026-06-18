import { changePasswordSchema, loginSchema } from '../schemas/auth.schema';
import { createPlanSchema, updatePlanSchema, createPhaseSchema } from '../schemas/treatmentPlan.schema';
import { createRoomSchema, updateRoomSchema } from '../schemas/room.schema';
import { updateNotificationPreferenceSchema } from '../schemas/notificationPreference.schema';
import { createAppointmentSchema, updateAppointmentSchema } from '../schemas/appointment.schema';
import { setAvailabilitySchema } from '../schemas/availability.schema';

describe('auth.schema', () => {
  it('acepta credenciales válidas', () => {
    expect(loginSchema.safeParse({ email: 'a@a.com', password: '123456' }).success).toBe(true);
  });

  it('rechaza un email inválido', () => {
    expect(loginSchema.safeParse({ email: 'no-es-email', password: '123456' }).success).toBe(false);
  });

  it('changePasswordSchema requiere ambas contraseñas', () => {
    expect(changePasswordSchema.safeParse({ currentPassword: 'a', newPassword: '123456' }).success).toBe(true);
    expect(changePasswordSchema.safeParse({ currentPassword: 'a' }).success).toBe(false);
  });

  it('changePasswordSchema rechaza una nueva contraseña muy corta', () => {
    expect(changePasswordSchema.safeParse({ currentPassword: 'a', newPassword: '123' }).success).toBe(false);
  });
});

describe('treatmentPlan.schema', () => {
  it('createPlanSchema acepta un plan mínimo válido', () => {
    const result = createPlanSchema.safeParse({ name: 'Plan de rodilla', startDate: '2026-01-01' });
    expect(result.success).toBe(true);
  });

  it('createPlanSchema rechaza un nombre demasiado corto', () => {
    expect(createPlanSchema.safeParse({ name: 'A', startDate: '2026-01-01' }).success).toBe(false);
  });

  it('updatePlanSchema rechaza un objeto vacío', () => {
    expect(updatePlanSchema.safeParse({}).success).toBe(false);
  });

  it('updatePlanSchema acepta un cambio de estado únicamente', () => {
    expect(updatePlanSchema.safeParse({ status: 'COMPLETED' }).success).toBe(true);
  });

  it('createPhaseSchema requiere duración y orden positivos', () => {
    expect(createPhaseSchema.safeParse({ name: 'Fase 1', order: 1, durationWeeks: 2 }).success).toBe(true);
    expect(createPhaseSchema.safeParse({ name: 'Fase 1', order: 0, durationWeeks: 2 }).success).toBe(false);
  });
});

describe('room.schema', () => {
  it('createRoomSchema solo requiere el nombre', () => {
    expect(createRoomSchema.safeParse({ name: 'Sala 1' }).success).toBe(true);
    expect(createRoomSchema.safeParse({}).success).toBe(false);
  });

  it('updateRoomSchema rechaza un objeto vacío', () => {
    expect(updateRoomSchema.safeParse({}).success).toBe(false);
  });
});

describe('notificationPreference.schema', () => {
  it('acepta horarios con formato HH:MM', () => {
    expect(updateNotificationPreferenceSchema.safeParse({ quietHoursStart: '22:00' }).success).toBe(true);
  });

  it('rechaza un horario con formato inválido', () => {
    expect(updateNotificationPreferenceSchema.safeParse({ quietHoursStart: '25:99' }).success).toBe(false);
  });

  it('permite null para borrar el horario configurado', () => {
    expect(updateNotificationPreferenceSchema.safeParse({ quietHoursStart: null }).success).toBe(true);
  });
});

describe('appointment.schema', () => {
  it('createAppointmentSchema requiere paciente, terapeuta y fecha', () => {
    const ok = createAppointmentSchema.safeParse({
      patientId: 'p1', therapistId: 't1', dateTime: '2026-01-01T10:00:00.000Z',
    });
    expect(ok.success).toBe(true);
  });

  it('createAppointmentSchema rechaza sin therapistId', () => {
    expect(createAppointmentSchema.safeParse({ patientId: 'p1', dateTime: '2026-01-01T10:00:00.000Z' }).success).toBe(false);
  });

  it('updateAppointmentSchema acepta roomId nulo para desvincular sala', () => {
    expect(updateAppointmentSchema.safeParse({ roomId: null }).success).toBe(true);
  });

  it('updateAppointmentSchema acepta el estado CONFIRMED', () => {
    expect(updateAppointmentSchema.safeParse({ status: 'CONFIRMED' }).success).toBe(true);
  });
});

describe('availability.schema', () => {
  it('rechaza un horario donde el inicio es posterior al fin', () => {
    const result = setAvailabilitySchema.safeParse({
      slots: [{ dayOfWeek: 1, startTime: '18:00', endTime: '09:00' }],
    });
    expect(result.success).toBe(false);
  });

  it('acepta una lista de horarios válida', () => {
    const result = setAvailabilitySchema.safeParse({
      slots: [{ dayOfWeek: 1, startTime: '09:00', endTime: '18:00' }],
    });
    expect(result.success).toBe(true);
  });
});
