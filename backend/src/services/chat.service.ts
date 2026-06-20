import { conversationRepository } from '../repositories/conversation.repository';
import { messageRepository } from '../repositories/message.repository';
import { userRepository } from '../repositories/user.repository';
import { notificationService } from './notification.service';
import { emitToUser } from '../lib/socket';
import { AppError } from '../errors/AppError';

interface Actor {
  id: string;
  role: string;
}

function otherParticipantId(conv: { patientId: string; therapistId: string }, userId: string) {
  return conv.patientId === userId ? conv.therapistId : conv.patientId;
}

function assertParticipant(conv: { patientId: string; therapistId: string }, userId: string) {
  if (conv.patientId !== userId && conv.therapistId !== userId) {
    throw new AppError('No tienes acceso a esta conversación', 403);
  }
}

async function assertLinked(patientId: string, therapistId: string) {
  const patient = await userRepository.findById(patientId);
  if (!patient || patient.role !== 'PATIENT') throw new AppError('Paciente no encontrado', 404);
  const therapist = await userRepository.findById(therapistId);
  if (!therapist || therapist.role !== 'THERAPIST') throw new AppError('Terapeuta no encontrado', 404);
  if (patient.patientProfile?.therapistId !== therapistId) {
    throw new AppError('El paciente y el terapeuta no están vinculados', 403);
  }
}

export const chatService = {
  async listConversations(actor: Actor) {
    const convs = await conversationRepository.findForUser(actor.id);
    return Promise.all(
      convs.map(async conv => {
        const otherId = otherParticipantId(conv, actor.id);
        const other = await userRepository.findById(otherId);
        const last = await messageRepository.findLast(conv.id);
        const unread = await messageRepository.countUnread(conv.id, actor.id);
        return {
          id: conv.id,
          lastMessageAt: conv.lastMessageAt,
          unread,
          otherParticipant: other
            ? { id: other.id, name: other.name, avatarUrl: other.avatarUrl, role: other.role }
            : null,
          lastMessage: last ? { content: last.content, senderId: last.senderId, createdAt: last.createdAt } : null,
        };
      }),
    );
  },

  async getOrCreateConversation(actor: Actor, otherUserId: string) {
    const patientId = actor.role === 'PATIENT' ? actor.id : otherUserId;
    const therapistId = actor.role === 'THERAPIST' ? actor.id : otherUserId;

    if (actor.role !== 'PATIENT' && actor.role !== 'THERAPIST') {
      throw new AppError('Solo pacientes y terapeutas pueden chatear', 403);
    }
    await assertLinked(patientId, therapistId);

    const existing = await conversationRepository.findByParticipants(patientId, therapistId);
    return existing ?? conversationRepository.create(patientId, therapistId);
  },

  async getMessages(actor: Actor, conversationId: string) {
    const conv = await conversationRepository.findById(conversationId);
    if (!conv) throw new AppError('Conversación no encontrada', 404);
    assertParticipant(conv, actor.id);

    const messages = await messageRepository.findByConversation(conversationId);
    await messageRepository.markRead(conversationId, actor.id);
    return messages;
  },

  async sendMessage(actor: Actor, conversationId: string, content: string) {
    const trimmed = content.trim();
    if (!trimmed) throw new AppError('El mensaje no puede estar vacío', 422);

    const conv = await conversationRepository.findById(conversationId);
    if (!conv) throw new AppError('Conversación no encontrada', 404);
    assertParticipant(conv, actor.id);

    const message = await messageRepository.create(conversationId, actor.id, trimmed);
    await conversationRepository.touch(conversationId);

    const recipientId = otherParticipantId(conv, actor.id);
    const sender = await userRepository.findById(actor.id);

    emitToUser(recipientId, 'message:new', { conversationId, message });

    notificationService.createInApp(
      recipientId,
      'MESSAGE',
      `Nuevo mensaje de ${sender?.name ?? 'tu contacto'}`,
      trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed,
      recipientId === conv.patientId ? '/patient/messages' : '/therapist/messages',
    );

    return message;
  },
};
