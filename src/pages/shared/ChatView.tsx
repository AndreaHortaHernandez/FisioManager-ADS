import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Send, Plus, ArrowLeft, ChevronDown } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';
import { resolveUploadUrl } from '../../utils/url';
import { useStore } from '../../store/useStore';
import { patientsApi } from '../../services/patients.api';
import { getSocket } from '../../services/socket';
import {
  chatApi, type ChatMessage, type ConversationSummary,
} from '../../services/chat.api';
import type { Patient } from '../../types';

export function ChatView() {
  const { t } = useTranslation();
  const authUser = useStore(s => s.authUser);
  const currentUserId = useStore(s => s.currentUser);
  const role = useStore(s => s.role);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  function loadConversations() {
    chatApi.listConversations().then(setConversations).catch(e => setError((e as Error).message));
  }

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    if (!activeId) return;
    chatApi.getMessages(activeId)
      .then(setMessages)
      .catch(e => setError((e as Error).message));
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (payload: { conversationId: string; message: ChatMessage }) => {
      if (payload.conversationId === activeId) {
        setMessages(prev => (prev.some(m => m.id === payload.message.id) ? prev : [...prev, payload.message]));
      }
      loadConversations();
    };
    socket.on('message:new', handler);
    return () => { socket.off('message:new', handler); };
  }, [activeId]);

  async function openWith(userId: string) {
    setError('');
    try {
      const conv = await chatApi.openConversation(userId);
      setPicking(false);
      setListOpen(false);
      loadConversations();
      setActiveId(conv.id);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function startNew() {
    setError('');
    if (role === 'PATIENT') {
      const therapistId = authUser?.patientProfile?.therapistId;
      if (!therapistId) { setError(t('shared.chat.noTherapistAssigned')); return; }
      await openWith(therapistId);
    } else {
      if (patients.length === 0) {
        const list = await patientsApi.getAll().catch(() => []);
        setPatients(list);
      }
      setPicking(true);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !activeId) return;
    setDraft('');
    try {
      const msg = await chatApi.sendMessage(activeId, content);
      setMessages(prev => [...prev, msg]);
      loadConversations();
    } catch (err) {
      setError((err as Error).message);
      setDraft(content);
    }
  }

  const active = conversations.find(c => c.id === activeId);

  function renderRow(c: ConversationSummary, onClick: () => void) {
    return (
      <button
        key={c.id}
        onClick={onClick}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-3 text-left transition-colors',
          activeId === c.id ? 'bg-surface-container' : 'hover:bg-surface-container-low'
        )}
      >
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center overflow-hidden shrink-0">
          {c.otherParticipant?.avatarUrl
            ? <img src={resolveUploadUrl(c.otherParticipant.avatarUrl)} alt="" className="w-full h-full object-cover" />
            : <span className="text-sm font-bold text-on-primary-container">{c.otherParticipant?.name?.[0] ?? '?'}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{c.otherParticipant?.name ?? t('shared.chat.conversation')}</p>
          <p className="text-xs text-on-surface-variant truncate">{c.lastMessage?.content ?? t('shared.chat.noMessages')}</p>
        </div>
        {c.unread > 0 && (
          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">{c.unread}</span>
        )}
      </button>
    );
  }

  function renderThread(showHeader: boolean) {
    if (!activeId) {
      return (
        <div className="flex-1 flex items-center justify-center text-on-surface-variant text-sm p-6 text-center">
          {t('shared.chat.selectConversation')}
        </div>
      );
    }
    return (
      <>
        {showHeader && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-container-high shrink-0">
            <button onClick={() => setActiveId(null)} className="md:hidden p-1" aria-label={t('shared.chat.back')}><ArrowLeft size={18} /></button>
            <span className="font-bold text-sm">{active?.otherParticipant?.name ?? t('shared.chat.conversation')}</span>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {messages.map(m => {
            const mine = m.senderId === currentUserId;
            return (
              <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[80%] px-4 py-2 rounded-2xl text-sm',
                  mine ? 'bg-primary text-on-primary rounded-br-sm' : 'bg-surface-container rounded-bl-sm'
                )}>
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p className={cn('text-[10px] mt-1', mine ? 'text-on-primary/70' : 'text-on-surface-variant')}>
                    {new Date(m.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="flex gap-2 p-3 border-t border-surface-container-high shrink-0">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={t('shared.chat.messagePlaceholder')}
            className="flex-1 bg-surface-container rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button type="submit" variant="primary" disabled={!draft.trim()} aria-label={t('shared.chat.send')}>
            <Send size={18} />
          </Button>
        </form>
      </>
    );
  }

  if (role === 'PATIENT') {
    return (
      <div className="flex flex-col gap-3 h-[calc(100dvh-13rem)]">
        <h1 className="text-2xl font-display font-bold flex items-center gap-3 shrink-0">
          <MessageSquare className="text-primary" /> {t('shared.chat.title')}
        </h1>
        {error && <p className="text-sm text-error shrink-0">{error}</p>}

        <Card level={2} className="p-0 overflow-hidden shrink-0">
          <div className="flex items-center">
            <button
              onClick={() => setListOpen(o => !o)}
              className="flex-1 flex items-center gap-2 px-4 py-3 text-left min-w-0"
            >
              <ChevronDown size={18} className={cn('shrink-0 transition-transform text-on-surface-variant', listOpen && 'rotate-180')} />
              <span className="font-bold text-sm truncate">
                {active?.otherParticipant?.name ?? t('shared.chat.conversations')}
              </span>
            </button>
            <button
              onClick={startNew}
              aria-label={t('shared.chat.newConversation')}
              className="p-3 text-primary hover:bg-surface-container transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>

          {listOpen && (
            <div className="max-h-[40vh] overflow-y-auto border-t border-surface-container-high divide-y divide-surface-container">
              {conversations.length === 0
                ? <p className="px-4 py-6 text-sm text-on-surface-variant text-center">{t('shared.chat.noConversationsYet')}</p>
                : conversations.map(c => renderRow(c, () => { setActiveId(c.id); setListOpen(false); }))}
            </div>
          )}
        </Card>

        <Card level={1} className="flex-1 flex flex-col p-0 min-h-0">
          {renderThread(false)}
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 animate-fade-in">
      <h1 className="text-2xl font-display font-bold flex items-center gap-3 shrink-0">
        <MessageSquare className="text-primary" /> {t('shared.chat.title')}
      </h1>
      {error && <p className="text-sm text-error shrink-0">{error}</p>}

      <div className="grid grid-rows-1 md:grid-cols-3 gap-4 min-h-0 h-[calc(100vh-9rem)]">
        <Card level={2} className={cn('p-2 overflow-y-auto md:col-span-1', activeId && 'hidden md:block')}>
          <div className="flex items-center justify-between px-2 py-2">
            <span className="font-bold text-sm">{t('shared.chat.conversations')}</span>
            <button onClick={startNew} className="p-1.5 rounded-full hover:bg-surface-container text-primary" aria-label={t('shared.chat.newConversation')}>
              <Plus size={18} />
            </button>
          </div>

          {picking && (
            <div className="px-2 pb-2 space-y-1">
              <p className="text-xs text-on-surface-variant px-1">{t('shared.chat.choosePatient')}</p>
              {patients.map(p => (
                <button key={p.id} onClick={() => openWith(p.id)} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-container">
                  {p.name}
                </button>
              ))}
              {patients.length === 0 && <p className="text-xs text-on-surface-variant px-1">{t('shared.chat.noPatients')}</p>}
            </div>
          )}

          {conversations.length === 0 && !picking && (
            <p className="px-3 py-6 text-sm text-on-surface-variant text-center">{t('shared.chat.noConversationsYet')}</p>
          )}
          {conversations.map(c => renderRow(c, () => setActiveId(c.id)))}
        </Card>

        <Card level={1} className={cn('md:col-span-2 flex flex-col p-0', !activeId && 'hidden md:flex')}>
          {renderThread(true)}
        </Card>
      </div>
    </div>
  );
}
