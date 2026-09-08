import { useState, useEffect } from 'react';
import { ChatIA } from './ChatIA/ChatIA';
import styles from './ContentAi.module.css';
import { Historial } from './Historial/Historial';
import { useChat } from '../../../hooks/ia/useChat';
import { getMessagesByTopic, TOPIC_TAGS } from '../../../utils/iaHelpers';

export interface ChatSession {
  id: string;
  topic: string;
  title: string;
  startTimestamp: string;
  createdAt: number;
}

// Helper para parsear fechas naive del backend como UTC
const parseDateAsUtc = (dateStr: string | undefined | null): Date => {
  if (!dateStr) return new Date();
  const normalized = (dateStr.endsWith('Z') || dateStr.includes('+') || (dateStr.lastIndexOf('-') > 10))
    ? dateStr
    : `${dateStr}Z`;
  const parsed = new Date(normalized);
  return isNaN(parsed.getTime()) ? new Date(dateStr) : parsed;
};

export const ContentAi = () => {
  const userKey = localStorage.getItem('codigo_gmi') || localStorage.getItem('user_name') || 'default';
  const SESSIONS_KEY = `maternity_chat_sessions_${userKey}`;
  const DELETED_KEY = `maternity_deleted_session_ids_${userKey}`;

  const [activeTopic, setActiveTopic] = useState(0);
  const {
    messages,
    isLoading,
    isSending,
    error,
    sendMessage,
    clearHistory,
    escalatedAlert,
    clearEscalatedAlert,
  } = useChat();

  const activeTopicTag = TOPIC_TAGS[activeTopic] || 'General';

  // Sesiones de chat
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [deletedSessionIds, setDeletedSessionIds] = useState<string[]>([]);

  // 1. Cargar datos iniciales de localStorage al montar
  useEffect(() => {
    const savedSessions = localStorage.getItem(SESSIONS_KEY);
    const savedDeleted = localStorage.getItem(DELETED_KEY);
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    } else {
      setSessions([]);
    }
    if (savedDeleted) {
      setDeletedSessionIds(JSON.parse(savedDeleted));
    } else {
      setDeletedSessionIds([]);
    }
  }, [SESSIONS_KEY, DELETED_KEY]);

  // 2. Auto-inicializar sesiones pasadas si existen mensajes en la BD pero no sesiones locales
  useEffect(() => {
    if (isLoading || messages.length === 0) return;

    const savedSessionsStr = localStorage.getItem(SESSIONS_KEY);
    let currentSessions: ChatSession[] = savedSessionsStr ? JSON.parse(savedSessionsStr) : [];
    let updated = false;

    TOPIC_TAGS.forEach((tag) => {
      const topicMsgs = getMessagesByTopic(messages, tag);
      const hasSessionsForTag = currentSessions.some((s) => s.topic === tag);

      if (topicMsgs.length > 0 && !hasSessionsForTag) {
        const historicalSession: ChatSession = {
          id: `session-default-${tag}`,
          topic: tag,
          title: `Conversación Histórica`,
          startTimestamp: '1970-01-01T00:00:00.000Z',
          createdAt: parseDateAsUtc(topicMsgs[0].created_at).getTime(),
        };
        currentSessions.push(historicalSession);
        updated = true;
      }
    });

    if (updated) {
      setSessions(currentSessions);
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(currentSessions));
    }
  }, [messages, isLoading, SESSIONS_KEY]);

  // 3. Crear sesión inicial para temas sin sesiones activas, y auto-seleccionar la última sesión activa
  useEffect(() => {
    const topicSessions = sessions.filter(
      (s) => s.topic === activeTopicTag && !deletedSessionIds.includes(s.id)
    );

    if (topicSessions.length === 0 && !isLoading) {
      const newSessionId = `session-${activeTopicTag}-${Date.now()}`;
      const newSession: ChatSession = {
        id: newSessionId,
        topic: activeTopicTag,
        title: `Nueva conversación`,
        startTimestamp: new Date().toISOString(),
        createdAt: Date.now(),
      };
      const updated = [...sessions, newSession];
      setSessions(updated);
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
      setActiveSessionId(newSessionId);
    } else if (
      topicSessions.length > 0 &&
      (!activeSessionId ||
        !sessions.some((s) => s.id === activeSessionId && s.topic === activeTopicTag))
    ) {
      setActiveSessionId(topicSessions[topicSessions.length - 1].id);
    }
  }, [activeTopic, sessions, activeSessionId, isLoading, deletedSessionIds, activeTopicTag, SESSIONS_KEY]);

  // Obtener la sesión activa para el tema actual
  const activeSession =
    sessions.find(
      (s) =>
        s.id === activeSessionId &&
        s.topic === activeTopicTag &&
        !deletedSessionIds.includes(s.id)
    ) || null;

  // Filtrar los mensajes de la sesión activa
  const getSessionMessages = (): any[] => {
    if (!activeSession) return [];

    const topicMessages = getMessagesByTopic(messages, activeTopicTag);
    const nonDeletedSessions = sessions.filter(
      (s) => s.topic === activeTopicTag && !deletedSessionIds.includes(s.id)
    );

    // Ordenar cronológicamente
    const sorted = [...nonDeletedSessions].sort(
      (a, b) => parseDateAsUtc(a.startTimestamp).getTime() - parseDateAsUtc(b.startTimestamp).getTime()
    );

    const activeIndex = sorted.findIndex((s) => s.id === activeSession.id);
    if (activeIndex === -1) return [];

    return topicMessages.filter((m) => {
      const mTime = parseDateAsUtc(m.created_at).getTime();
      // Partition the timeline to assign messages to sessions, shifting boundaries by 30 seconds to account for clock drift
      const CLOCK_MARGIN = 30 * 1000;
      
      let messageSession = sorted[sorted.length - 1]; // Default to oldest session if before everything
      for (let i = 0; i < sorted.length; i++) {
        const sessionStartTime = parseDateAsUtc(sorted[i].startTimestamp).getTime() - CLOCK_MARGIN;
        if (mTime >= sessionStartTime) {
          messageSession = sorted[i]; // Since sorted is newest-first, this finds the most recent valid session
          break;
        }
      }

      return messageSession && messageSession.id === activeSession.id;
    });
  };

  const sessionMessages = getSessionMessages();

  // Enviar mensaje y renombrar automáticamente si es el primero de la sesión
  const handleSendMessage = async (text: string) => {
    await sendMessage(text);

    // Auto-renombrar si está en el valor por defecto
    if (
      activeSession &&
      (activeSession.title === 'Nueva conversación' ||
        activeSession.title === 'Nueva Conversación' ||
        activeSession.title === 'Conversación Histórica')
    ) {
      // Remove topic tag and any system directive in parentheses
      const cleanText = text.replace(/^\[Tema:\s*[^\]]+\]\s*(?:\(.*?\)\s*)?/, '');
      const words = cleanText.split(/\s+/).filter(Boolean);
      const titleCandidate = words.slice(0, 4).join(' ');
      const newTitle =
        titleCandidate.length > 25
          ? titleCandidate.slice(0, 25) + '...'
          : titleCandidate || 'Consulta';

      const updatedSessions = sessions.map((s) => {
        if (s.id === activeSession.id) {
          return { ...s, title: newTitle };
        }
        return s;
      });
      setSessions(updatedSessions);
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions));
    }
  };

  const handleCreateSession = () => {
    const newSessionId = `session-${activeTopicTag}-${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      topic: activeTopicTag,
      title: `Nueva conversación`,
      startTimestamp: new Date().toISOString(),
      createdAt: Date.now(),
    };
    const updated = [...sessions, newSession];
    setSessions(updated);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
    setActiveSessionId(newSessionId);
  };

  const handleDeleteSession = (sessionId: string) => {
    const updatedDeleted = [...deletedSessionIds, sessionId];
    setDeletedSessionIds(updatedDeleted);
    localStorage.setItem(DELETED_KEY, JSON.stringify(updatedDeleted));

    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
  };

  const handleClearAllHistory = async () => {
    const success = await clearHistory();
    if (success) {
      const updated = sessions.filter((s) => s.topic !== activeTopicTag);
      setSessions(updated);
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
      setActiveSessionId(null);
    }
    return success;
  };

  useEffect(() => {
    const pending = localStorage.getItem('pending_ai_question');
    if (pending) {
      localStorage.removeItem('pending_ai_question');
      handleSendMessage(pending);
    }
  }, [sendMessage]);

  return (
    <section className={styles.container}>
      <div className={styles.historial}>
        <Historial
          activeTopic={activeTopic}
          setActiveTopic={setActiveTopic}
          clearHistory={handleClearAllHistory}
          hasMessages={sessionMessages.length > 0}
          sessions={sessions.filter((s) => !deletedSessionIds.includes(s.id))}
          activeSessionId={activeSessionId}
          setActiveSessionId={setActiveSessionId}
          onCreateSession={handleCreateSession}
          onDeleteSession={handleDeleteSession}
        />
      </div>
      <div className={styles.chat}>
        <ChatIA
          messages={sessionMessages}
          isLoading={isLoading}
          isSending={isSending}
          error={error}
          sendMessage={handleSendMessage}
          clearHistory={handleClearAllHistory}
          activeTopicTag={activeTopicTag}
          escalatedAlert={escalatedAlert}
          clearEscalatedAlert={clearEscalatedAlert}
          activeTopic={activeTopic}
          setActiveTopic={setActiveTopic}
          sessions={sessions.filter((s) => !deletedSessionIds.includes(s.id))}
          activeSessionId={activeSessionId}
          setActiveSessionId={setActiveSessionId}
          onCreateSession={handleCreateSession}
          onDeleteSession={handleDeleteSession}
        />
      </div>
    </section>
  );
};
export default ContentAi;
