import { prisma } from '../lib/prisma';

export interface DocumentInput {
  patientId: string;
  uploaderId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
  category?: string;
  isVisible?: boolean;
}

export const clinicalDocumentRepository = {
  create(data: DocumentInput) {
    return prisma.clinicalDocument.create({ data });
  },

  findByPatient(patientId: string, onlyVisible = false) {
    return prisma.clinicalDocument.findMany({
      where: { patientId, ...(onlyVisible ? { isVisible: true } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  },

  findById(id: string) {
    return prisma.clinicalDocument.findUnique({ where: { id } });
  },

  delete(id: string) {
    return prisma.clinicalDocument.delete({ where: { id } });
  },
};
