import { Request, Response } from 'express';
import path from 'path';
import { feedbackService } from '../services/feedback.service';
import { transcribeAudio, generateClinicalSummary } from '../services/ai.service';
import { catchAsync } from '../utils/catchAsync';
import { ok, created } from '../utils/response';
import { AppError } from '../errors/AppError';

export const getAnalisis = catchAsync(async (req: Request, res: Response) => {
  const result = await feedbackService.getAnalisis(
    req.params.feedbackId,
    req.user!.id,
    req.user!.role,
  );
  ok(res, result);
});

export const getFeedbacks = catchAsync(async (req: Request, res: Response) => {
  const feedbacks = await feedbackService.getForUser(req.user!.id, req.user!.role);
  ok(res, feedbacks);
});

export const createFeedback = catchAsync(async (req: Request, res: Response) => {
  const feedback = await feedbackService.create({
    ...req.body,
    patientId: req.user!.id,
  });
  created(res, feedback);
});

export const uploadAudio = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No se recibió ningún archivo de audio', 400);

  const audioUrl   = `/uploads/${req.file.filename}`;
  const audioPath  = path.join(__dirname, '../../uploads', req.file.filename);

  // Transcripción con Whisper + resumen con Ollama en paralelo-secuencial
  const transcript = await transcribeAudio(audioPath);
  const aiSummary  = await generateClinicalSummary(transcript);

  ok(res, { audioUrl, transcript, aiSummary });
});
