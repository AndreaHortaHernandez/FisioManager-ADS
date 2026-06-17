import { Router } from 'express';
import {
  getHistory, upsertHistory, addDiagnosis, updateDiagnosis, addNote, getPatientProgress,
} from '../controllers/clinicalHistory.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  upsertHistorySchema, createDiagnosisSchema, updateDiagnosisSchema, createNoteSchema,
} from '../schemas/clinicalHistory.schema';

// ── /pacientes/:id/historial ──────────────────────────────────────────────
const pacientesRouter = Router();
pacientesRouter.use(authMiddleware, requireRole('THERAPIST', 'ADMIN'));
pacientesRouter.get('/:id/historial', getHistory);
pacientesRouter.post('/:id/historial', validate(upsertHistorySchema), upsertHistory);
pacientesRouter.get('/:id/progreso', getPatientProgress);

// ── /historial/:id/diagnosticos · /historial/:id/notas ────────────────────
const historialRouter = Router();
historialRouter.use(authMiddleware, requireRole('THERAPIST', 'ADMIN'));
historialRouter.post('/:id/diagnosticos', validate(createDiagnosisSchema), addDiagnosis);
historialRouter.post('/:id/notas', validate(createNoteSchema), addNote);

// ── /diagnosticos/:id ─────────────────────────────────────────────────────
const diagnosticosRouter = Router();
diagnosticosRouter.use(authMiddleware, requireRole('THERAPIST', 'ADMIN'));
diagnosticosRouter.patch('/:id', validate(updateDiagnosisSchema), updateDiagnosis);

export { pacientesRouter, historialRouter, diagnosticosRouter };
