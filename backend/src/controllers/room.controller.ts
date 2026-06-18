import { Request, Response } from 'express';
import { roomRepository } from '../repositories/room.repository';
import { catchAsync } from '../utils/catchAsync';
import { ok, created } from '../utils/response';
import { AppError } from '../errors/AppError';

export const listRooms = catchAsync(async (_req: Request, res: Response) => {
  ok(res, await roomRepository.findAll());
});

export const createRoom = catchAsync(async (req: Request, res: Response) => {
  created(res, await roomRepository.create(req.body));
});

export const updateRoom = catchAsync(async (req: Request, res: Response) => {
  const room = await roomRepository.findById(req.params.id);
  if (!room) throw new AppError('Sala no encontrada', 404);
  ok(res, await roomRepository.update(req.params.id, req.body));
});

export const deleteRoom = catchAsync(async (req: Request, res: Response) => {
  const room = await roomRepository.findById(req.params.id);
  if (!room) throw new AppError('Sala no encontrada', 404);
  await roomRepository.delete(req.params.id);
  ok(res, { message: 'Sala eliminada' });
});
