import { Request, Response } from 'express';
import { chatService } from '../services/chat.service';
import { catchAsync } from '../utils/catchAsync';
import { ok, created } from '../utils/response';

function actor(req: Request) {
  return { id: req.user!.id, role: req.user!.role };
}

export const listConversations = catchAsync(async (req: Request, res: Response) => {
  ok(res, await chatService.listConversations(actor(req)));
});

export const openConversation = catchAsync(async (req: Request, res: Response) => {
  const conv = await chatService.getOrCreateConversation(actor(req), req.body.userId);
  created(res, conv);
});

export const getMessages = catchAsync(async (req: Request, res: Response) => {
  ok(res, await chatService.getMessages(actor(req), req.params.id));
});

export const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const message = await chatService.sendMessage(actor(req), req.params.id, req.body.content);
  created(res, message);
});
