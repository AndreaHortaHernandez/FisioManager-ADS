import { prisma } from '../lib/prisma';

const noteAuthorSelect = { select: { id: true, name: true, role: true } };

const historyInclude = {
  diagnoses: { orderBy: { createdAt: 'desc' as const } },
  notes: {
    orderBy: { createdAt: 'desc' as const },
    include: { author: noteAuthorSelect },
  },
};

export const clinicalHistoryRepository = {
  findByPatientId(patientId: string) {
    return prisma.clinicalHistory.findUnique({
      where: { patientId },
      include: historyInclude,
    });
  },

  findById(id: string) {
    return prisma.clinicalHistory.findUnique({ where: { id } });
  },

  upsert(patientId: string, data: { bloodType?: string; allergies?: string; background?: string }) {
    return prisma.clinicalHistory.upsert({
      where: { patientId },
      update: data,
      create: { patientId, ...data },
      include: historyInclude,
    });
  },

  createDiagnosis(historyId: string, data: { cie10Code: string; description: string; status?: string }) {
    return prisma.diagnosis.create({ data: { historyId, ...data } });
  },

  findDiagnosisById(id: string) {
    return prisma.diagnosis.findUnique({ where: { id } });
  },

  updateDiagnosis(id: string, data: { cie10Code?: string; description?: string; status?: string }) {
    return prisma.diagnosis.update({ where: { id }, data });
  },

  createNote(historyId: string, authorId: string, content: string, isVisible = false) {
    return prisma.clinicalNote.create({
      data: { historyId, authorId, content, isVisible },
      include: { author: noteAuthorSelect },
    });
  },

  findNoteById(id: string) {
    return prisma.clinicalNote.findUnique({ where: { id } });
  },

  updateNoteVisibility(id: string, isVisible: boolean) {
    return prisma.clinicalNote.update({
      where: { id },
      data: { isVisible },
      include: { author: noteAuthorSelect },
    });
  },

  findByPatientIdForPatient(patientId: string) {
    return prisma.clinicalHistory.findUnique({
      where: { patientId },
      include: {
        diagnoses: { orderBy: { createdAt: 'desc' as const } },
        notes: {
          where: { isVisible: true },
          orderBy: { createdAt: 'desc' as const },
          include: { author: noteAuthorSelect },
        },
      },
    });
  },
};
