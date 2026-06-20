import { api } from './api';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  lastMessageAt: string;
  unread: number;
  otherParticipant: { id: string; name: string; avatarUrl?: string | null; role: string } | null;
  lastMessage: { content: string; senderId: string; createdAt: string } | null;
}

export interface Conversation {
  id: string;
  patientId: string;
  therapistId: string;
  lastMessageAt: string;
  createdAt: string;
}

export const chatApi = {
  listConversations: () => api.get<ConversationSummary[]>('/conversations'),
  openConversation: (userId: string) => api.post<Conversation>('/conversations', { userId }),
  getMessages: (conversationId: string) => api.get<ChatMessage[]>(`/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, content: string) =>
    api.post<ChatMessage>(`/conversations/${conversationId}/messages`, { content }),
};
