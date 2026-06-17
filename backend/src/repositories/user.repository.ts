import { prisma } from '../lib/prisma';

const include = { patientProfile: true, therapistProfile: true } as const;

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

  findAll() {
    return prisma.user.findMany({
      include,
      orderBy: { name: 'asc' },
    });
  },

  toggleActive(id: string, isActive: boolean) {
    return prisma.user.update({ where: { id }, data: { isActive }, include });
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
    patientProfile?: { age: number; condition: string; therapistId: string };
    therapistProfile?: { cedula?: string; especialidad?: string };
  }) {
    const { patientProfile, therapistProfile, ...userData } = data;
    return prisma.user.create({
      data: {
        ...userData,
        ...(patientProfile   ? { patientProfile:   { create: patientProfile   } } : {}),
        ...(therapistProfile ? { therapistProfile: { create: therapistProfile } } : {}),
      },
      include,
    });
  },
};
