import { z } from 'zod';

export const createRoomSchema = z.object({
  name:      z.string().min(1),
  location:  z.string().optional(),
  capacity:  z.number().int().min(1).optional(),
  equipment: z.string().optional(),
});

export const updateRoomSchema = z
  .object({
    name:      z.string().min(1).optional(),
    location:  z.string().optional(),
    capacity:  z.number().int().min(1).optional(),
    equipment: z.string().optional(),
  })
  .refine(d => Object.keys(d).length > 0, { message: 'No hay campos para actualizar' });
