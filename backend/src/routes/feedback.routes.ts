import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { getFeedbacks, createFeedback, uploadAudio, getAnalisis } from '../controllers/feedback.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createFeedbackSchema } from '../schemas/feedback.schema';

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (_req, file, cb) => {
    cb(null, `audio-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

const router = Router();

router.use(authMiddleware);

router.get('/', getFeedbacks);
router.get('/:feedbackId/analisis', getAnalisis);
router.post('/', requireRole('PATIENT'), validate(createFeedbackSchema), createFeedback);
router.post('/audio', requireRole('PATIENT'), upload.single('audio'), uploadAudio);

export { router as feedbackRouter };
