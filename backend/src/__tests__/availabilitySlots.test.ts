import { availabilityService } from '../services/availability.service';
import { availabilityRepository } from '../repositories/availability.repository';
import { appointmentRepository } from '../repositories/appointment.repository';
import { userRepository } from '../repositories/user.repository';

jest.mock('../repositories/availability.repository');
jest.mock('../repositories/appointment.repository');
jest.mock('../repositories/user.repository');

const mockedAvail = availabilityRepository as jest.Mocked<typeof availabilityRepository>;
const mockedAppt = appointmentRepository as jest.Mocked<typeof appointmentRepository>;
const mockedUser = userRepository as jest.Mocked<typeof userRepository>;

const DATE = '2030-06-03';
const DOW = new Date(`${DATE}T00:00:00`).getDay();

beforeEach(() => {
  mockedUser.findById.mockResolvedValue({ id: 't1', role: 'THERAPIST' } as never);
  mockedAvail.findByTherapist.mockResolvedValue([
    { id: 's1', therapistId: 't1', dayOfWeek: DOW, startTime: '09:00', endTime: '11:00' },
  ] as never);
});

describe('availabilityService.getAvailableSlots', () => {
  it('trocea la disponibilidad en bloques de 60 min cuando no hay conflictos', async () => {
    mockedAppt.findConflict.mockResolvedValue(null as never);
    const slots = await availabilityService.getAvailableSlots('t1', DATE, DATE);
    expect(slots).toHaveLength(2);
  });

  it('excluye las franjas que chocan con citas existentes', async () => {
    mockedAppt.findConflict.mockResolvedValue({ id: 'a1' } as never);
    const slots = await availabilityService.getAvailableSlots('t1', DATE, DATE);
    expect(slots).toHaveLength(0);
  });

  it('rechaza rangos mayores al máximo permitido', async () => {
    await expect(availabilityService.getAvailableSlots('t1', '2030-01-01', '2030-12-31')).rejects.toThrow();
  });
});
