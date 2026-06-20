import { Request, Response } from 'express';
import path from 'path';
import { clinicalDocumentService } from '../services/clinicalDocument.service';
import { storage } from '../lib/storage';
import { catchAsync } from '../utils/catchAsync';
import { ok, created } from '../utils/response';
import { AppError } from '../errors/AppError';

export const uploadDocument = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No se recibió ningún archivo', 400);
  const filename = `doc-${Date.now()}${path.extname(req.file.originalname)}`;
  const fileUrl = await storage.save(req.file.buffer, filename, req.file.mimetype);
  const doc = await clinicalDocumentService.upload(
    req.user!.id,
    {
      patientId: req.params.id,
      fileName: req.file.originalname,
      fileUrl,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      category: req.body.category,
      isVisible: req.body.isVisible === 'true' || req.body.isVisible === true,
    },
    req.ip,
  );
  created(res, doc);
});

export const listDocuments = catchAsync(async (req: Request, res: Response) => {
  ok(res, await clinicalDocumentService.list(req.params.id));
});

export const deleteDocument = catchAsync(async (req: Request, res: Response) => {
  ok(res, await clinicalDocumentService.remove(req.params.id, req.user!.id, req.ip));
});
