import { prisma } from '../lib/prisma';

const include = { patientProfile: true } as const;

export const patientRepository = {
  findAll(therapistId?: string) {
    return prisma.user.findMany({
      where: {
        role: 'PATIENT',
        ...(therapistId
          ? { patientProfile: { therapistId } }
          : {}),
      },
      include,
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id, role: 'PATIENT' },
      include,
    });
  },
};
