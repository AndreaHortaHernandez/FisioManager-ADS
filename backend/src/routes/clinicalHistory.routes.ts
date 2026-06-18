import { Router } from 'express';
import {
  getHistory, upsertHistory, addDiagnosis, updateDiagnosis, addNote, getPatientProgress,
  updateNoteVisibility, getOwnHistory,
} from '../controllers/clinicalHistory.controller';
import { getProgressReportPdf } from '../controllers/report.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  upsertHistorySchema, createDiagnosisSchema, updateDiagnosisSchema, createNoteSchema,
  updateNoteVisibilitySchema,
} from '../schemas/clinicalHistory.schema';

const pacientesRouter = Router();
pacientesRouter.use(authMiddleware, requireRole('THERAPIST', 'ADMIN'));
pacientesRouter.get('/:id/historial', getHistory);
pacientesRouter.post('/:id/historial', validate(upsertHistorySchema), upsertHistory);
pacientesRouter.get('/:id/progreso', getPatientProgress);
pacientesRouter.get('/:id/reporte', getProgressReportPdf);

const historialRouter = Router();
historialRouter.use(authMiddleware, requireRole('THERAPIST', 'ADMIN'));
historialRouter.post('/:id/diagnosticos', validate(createDiagnosisSchema), addDiagnosis);
historialRouter.post('/:id/notas', validate(createNoteSchema), addNote);

const diagnosticosRouter = Router();
diagnosticosRouter.use(authMiddleware, requireRole('THERAPIST', 'ADMIN'));
diagnosticosRouter.patch('/:id', validate(updateDiagnosisSchema), updateDiagnosis);

const notasRouter = Router();
notasRouter.use(authMiddleware, requireRole('THERAPIST', 'ADMIN'));
notasRouter.patch('/:id/visibilidad', validate(updateNoteVisibilitySchema), updateNoteVisibility);

const ownHistoryRouter = Router();
ownHistoryRouter.use(authMiddleware, requireRole('PATIENT'));
ownHistoryRouter.get('/', getOwnHistory);

export { pacientesRouter, historialRouter, diagnosticosRouter, notasRouter, ownHistoryRouter };
