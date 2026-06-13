import { Request, Response } from 'express';
import { activityTemplateService } from '../services/activityTemplate.service';
import { catchAsync } from '../utils/catchAsync';
import { ok, created } from '../utils/response';

export const getTemplates = catchAsync(async (_req: Request, res: Response) => {
  const templates = await activityTemplateService.getAll();
  ok(res, templates);
});

export const deleteTemplate = catchAsync(async (req: Request, res: Response) => {
  await activityTemplateService.delete(req.params.id);
  ok(res, { message: 'Ejercicio eliminado' });
});

export const createTemplate = catchAsync(async (req: Request, res: Response) => {
  const { title, description, type, bodyPart } = req.body;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const videoFile = files?.video?.[0];
  const imageFile = files?.image?.[0];

  const videoUrl = videoFile ? `/uploads/${videoFile.filename}` : undefined;
  const imageUrl = imageFile ? `/uploads/${imageFile.filename}` : undefined;

  const template = await activityTemplateService.create({
    title,
    description,
    type,
    bodyPart: type === 'PHYSICAL' ? bodyPart : undefined,
    videoUrl,
    imageUrl,
  });

  created(res, template);
});
