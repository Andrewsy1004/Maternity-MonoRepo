import React, { useState } from 'react';
import styles from './Videos.module.css';
import type { ContenidoEducativoResponse } from '../../../../../services/m5Service';

interface VideosProps {
  post: ContenidoEducativoResponse;
  isCompleted: boolean;
  onMarkCompleted: (id: number) => Promise<void>;
}

export const Videos = React.memo(({ post, isCompleted, onMarkCompleted }: VideosProps) => {
  const { id, titulo, descripcion, url_recurso, duracion_minutos } = post;
  const [marking, setMarking] = useState(false);

  const handleToggleCompleted = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleted || marking) return;
    setMarking(true);
    try {
      await onMarkCompleted(id);
    } catch (err) {
      console.error("Failed to mark content as completed:", err);
    } finally {
      setMarking(false);
    }
  };

  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.badge}>▶ Video</span>
        <div className={styles.topRightActions}>
          {duracion_minutos && (
            <span className={styles.meta}>{duracion_minutos} min</span>
          )}
          <button
            className={`${styles.checkBtn} ${isCompleted ? styles.checkBtnCompleted : ''}`}
            onClick={handleToggleCompleted}
            disabled={marking || isCompleted}
            title={isCompleted ? "Video completado" : "Marcar como completado"}
            aria-label={isCompleted ? "Video completado" : "Marcar como completado"}
          >
            {isCompleted ? '✓' : ''}
          </button>
        </div>
      </div>

      {url_recurso && (
        <div className={styles.videoThumb}>
          <span className={styles.playIcon}>▶</span>
        </div>
      )}

      <h3 className={styles.title}>{titulo}</h3>

      {descripcion && (
        <p className={styles.desc}>{descripcion}</p>
      )}

      <div className={styles.footer}>
        {url_recurso ? (
          <button
            className={styles.btnVer}
            onClick={() => window.open(url_recurso, '_blank')}
          >
            Ver video →
          </button>
        ) : (
          <span className={styles.noLink}>Sin enlace disponible</span>
        )}
      </div>
    </article>
  );
});
