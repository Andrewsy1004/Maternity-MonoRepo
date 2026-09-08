import { useState } from 'react';
import styles from './Historial.module.css';
import { SvgSparkle } from '../../../Icons/IconsSystem';
import { TOPICS, TOPIC_TAGS } from '../../../../utils/iaHelpers';
import { type ChatSession } from '../ContentAi';

interface HistorialProps {
  activeTopic: number;
  setActiveTopic: (idx: number) => void;
  clearHistory: () => Promise<boolean>;
  hasMessages: boolean;
  sessions: ChatSession[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
}

export const Historial = ({
  activeTopic,
  setActiveTopic,
  clearHistory,
  hasMessages,
  sessions,
  activeSessionId,
  setActiveSessionId,
  onCreateSession,
  onDeleteSession,
}: HistorialProps) => {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const success = await clearHistory();
      if (success) {
        setConfirmingDelete(false);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.historial}>
      <div className={styles.headerRow}>
        <h1>Chats</h1>
        <div className={styles.sparkleBadge}>
          <SvgSparkle width={14} height={14} fill="white" />
        </div>
      </div>

      <div className={styles.contenedorChats}>
        {TOPICS.map((topic, index) => {
          const isActive = index === activeTopic;
          return (
            <div key={index} className={styles.topicGroup}>
              <div
                className={`${styles.chatItem} ${isActive ? styles.activeItem : ''}`}
                onClick={() => setActiveTopic(index)}
              >
                <p className={styles.chatName}>{topic}</p>
                {index === 0 && (
                  <p className={styles.chatStatus}>
                    <span className={styles.statusDot}></span> En línea
                  </p>
                )}
              </div>

              {isActive && (
                <div className={styles.sessionsContainer}>
                  <button
                    type="button"
                    className={styles.newSessionBtn}
                    onClick={onCreateSession}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Nuevo chat</span>
                  </button>

                  {sessions
                    .filter((s) => s.topic === TOPIC_TAGS[index])
                    .map((s) => (
                      <div
                        key={s.id}
                        className={`${styles.sessionItem} ${s.id === activeSessionId ? styles.activeSessionItem : ''}`}
                        onClick={() => setActiveSessionId(s.id)}
                      >
                        <div className={styles.sessionTitleWrapper}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          <span className={styles.sessionTitle}>{s.title}</span>
                        </div>
                        <button
                          type="button"
                          className={styles.deleteSessionBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(s.id);
                          }}
                          title="Eliminar conversación"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hasMessages && (
        <div className={styles.deleteWrapper}>
          {!confirmingDelete ? (
            <button
              className={styles.deleteBtn}
              onClick={() => setConfirmingDelete(true)}
              title="Borrar todo el historial de chat de forma permanente"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Borrar Historial
            </button>
          ) : (
            <div className={styles.confirmBox}>
              <p>¿Segura de borrar todo el historial?</p>
              <div className={styles.confirmActions}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => setConfirmingDelete(false)}
                  disabled={isDeleting}
                >
                  Cancelar
                </button>
                <button
                  className={styles.confirmBtn}
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Borrando...' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default Historial;
