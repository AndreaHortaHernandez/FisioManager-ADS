import { Router } from 'express';
import {
  listTherapists, registerTherapist,
  listPatients, registerPatient, assignPatient,
  toggleUserActive, deleteUserPermanently, updateUser, uploadUserAvatar,
} from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { avatarUpload } from '../middlewares/upload.middleware';
import {
  registerTherapistSchema, registerPatientSchema, assignPatientSchema, updateUserSchema,
} from '../schemas/admin.schema';

const router = Router();
router.use(authMiddleware, requireRole('ADMIN'));

router.get('/therapists', listTherapists);
router.post('/therapists', validate(registerTherapistSchema), registerTherapist);

router.get('/patients', listPatients);
router.post('/patients', validate(registerPatientSchema), registerPatient);
router.patch('/patients/:id/assign', validate(assignPatientSchema), assignPatient);
router.patch('/users/:id/toggle-active', toggleUserActive);
router.patch('/users/:id', validate(updateUserSchema), updateUser);
router.post('/users/:id/avatar', avatarUpload.single('avatar'), uploadUserAvatar);
router.delete('/users/:id', deleteUserPermanently);

export { router as adminRouter };
