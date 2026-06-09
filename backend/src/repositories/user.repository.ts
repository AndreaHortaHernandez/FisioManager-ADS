import { prisma } from '../lib/prisma';

const include = { patientProfile: true } as const;

export const userRepository = {
  findById(id: string) {
    return prisma.user.findUnique({ where: { id }, include });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email }, include });
  },

  findAllByRole(role: string) {
    return prisma.user.findMany({
      where: { role },
      include,
      orderBy: { name: 'asc' },
    });
  },

  updatePatientProfile(patientId: string, therapistId: string) {
    return prisma.patientProfile.update({
      where: { userId: patientId },
      data: { therapistId },
    });
  },

  create(data: {
    name: string;
    email: string;
    password: string;
    role: string;
    avatarUrl?: string;
    phone?: string;
    patientProfile?: {
      age: number;
      condition: string;
      therapistId: string;
    };
  }) {
    const { patientProfile, ...userData } = data;
    return prisma.user.create({
      data: {
        ...userData,
        ...(patientProfile
          ? { patientProfile: { create: patientProfile } }
          : {}),
      },
      include,
    });
  },
};
