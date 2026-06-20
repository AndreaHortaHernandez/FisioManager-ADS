import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { catchAsync } from '../utils/catchAsync';
import { ok } from '../utils/response';

export const listNotifications = catchAsync(async (req: Request, res: Response) => {
  ok(res, await notificationService.list(req.user!.id));
});

export const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
  ok(res, { count: await notificationService.countUnread(req.user!.id) });
});

export const markRead = catchAsync(async (req: Request, res: Response) => {
  ok(res, await notificationService.markRead(req.params.id, req.user!.id));
});

export const markAllRead = catchAsync(async (req: Request, res: Response) => {
  ok(res, await notificationService.markAllRead(req.user!.id));
});
