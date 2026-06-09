import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { getTemplates, createTemplate } from '../controllers/activityTemplate.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

const router = Router();

router.use(authMiddleware);

router.get('/', getTemplates);
router.post('/', requireRole('THERAPIST'), upload.fields([{ name: 'video', maxCount: 1 }, { name: 'image', maxCount: 1 }]), createTemplate);

export { router as activityTemplateRouter };
