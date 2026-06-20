import { chatService } from '../services/chat.service';
import { conversationRepository } from '../repositories/conversation.repository';
import { userRepository } from '../repositories/user.repository';

jest.mock('../repositories/conversation.repository');
jest.mock('../repositories/message.repository');
jest.mock('../repositories/user.repository');
jest.mock('../services/notification.service');
jest.mock('../lib/socket');

const mockedConvRepo = conversationRepository as jest.Mocked<typeof conversationRepository>;
const mockedUserRepo = userRepository as jest.Mocked<typeof userRepository>;

describe('chatService', () => {
  it('rechaza crear una conversación entre paciente y terapeuta no vinculados', async () => {
    (mockedUserRepo.findById as jest.Mock).mockImplementation((id: string) => {
      if (id === 'p1') return Promise.resolve({ id: 'p1', role: 'PATIENT', patientProfile: { therapistId: 't-real' } });
      return Promise.resolve({ id: 't-otro', role: 'THERAPIST' });
    });

    await expect(
      chatService.getOrCreateConversation({ id: 'p1', role: 'PATIENT' }, 't-otro'),
    ).rejects.toThrow('no están vinculados');
  });

  it('rechaza leer mensajes de una conversación de la que no eres participante', async () => {
    mockedConvRepo.findById.mockResolvedValue({ id: 'c1', patientId: 'p1', therapistId: 't1' } as never);

    await expect(
      chatService.getMessages({ id: 'intruso', role: 'PATIENT' }, 'c1'),
    ).rejects.toThrow('No tienes acceso a esta conversación');
  });
});
