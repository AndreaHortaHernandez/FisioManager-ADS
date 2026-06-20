import multer from 'multer';
import { AppError } from '../errors/AppError';

const memory = multer.memoryStorage();

export const avatarUpload = multer({
  storage: memory,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new AppError('Solo se permiten archivos de imagen', 400));
      return;
    }
    cb(null, true);
  },
});

export const documentUpload = multer({
  storage: memory,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
      return;
    }
    cb(new AppError('Solo se permiten imágenes o PDFs', 400));
  },
});
