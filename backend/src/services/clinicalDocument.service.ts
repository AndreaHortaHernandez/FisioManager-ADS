import { clinicalDocumentRepository, type DocumentInput } from '../repositories/clinicalDocument.repository';
import { auditService } from './audit.service';
import { AppError } from '../errors/AppError';

const CATEGORIES = ['XRAY', 'LAB', 'CONSENT', 'REPORT', 'OTHER'];

export const clinicalDocumentService = {
  async upload(uploaderId: string, data: Omit<DocumentInput, 'uploaderId'>, ip?: string) {
    const category = CATEGORIES.includes(data.category ?? '') ? data.category : 'OTHER';
    const doc = await clinicalDocumentRepository.create({ ...data, category, uploaderId });
    auditService.log({
      userId: uploaderId,
      action: 'UPLOAD_DOCUMENT',
      entity: 'ClinicalDocument',
      entityId: doc.id,
      metadata: { patientId: data.patientId, fileName: data.fileName },
      ip,
    });
    return doc;
  },

  list(patientId: string, onlyVisible = false) {
    return clinicalDocumentRepository.findByPatient(patientId, onlyVisible);
  },

  async remove(id: string, actorId: string, ip?: string) {
    const doc = await clinicalDocumentRepository.findById(id);
    if (!doc) throw new AppError('Documento no encontrado', 404);
    await clinicalDocumentRepository.delete(id);
    auditService.log({
      userId: actorId,
      action: 'DELETE_DOCUMENT',
      entity: 'ClinicalDocument',
      entityId: id,
      metadata: { patientId: doc.patientId },
      ip,
    });
    return { message: 'Documento eliminado' };
  },
};
