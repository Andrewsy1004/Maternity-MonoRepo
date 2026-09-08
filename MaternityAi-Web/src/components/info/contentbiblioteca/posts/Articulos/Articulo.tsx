import React, { useState } from 'react';
import styles from './Articulo.module.css';
import type { ContenidoEducativoResponse } from '../../../../../services/m5Service';

interface ArticuloProps {
  post: ContenidoEducativoResponse;
  isCompleted: boolean;
  onMarkCompleted: (id: number) => Promise<void>;
}

export const Articulo = React.memo(({ post, isCompleted, onMarkCompleted }: ArticuloProps) => {
  const { id, titulo, descripcion, url_recurso, duracion_minutos, url_imagen } = post;
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
        <span className={styles.badge}>📄 Artículo</span>
        <div className={styles.topRightActions}>
          {duracion_minutos && (
            <span className={styles.meta}>{duracion_minutos} min lectura</span>
          )}
          <button
            className={`${styles.checkBtn} ${isCompleted ? styles.checkBtnCompleted : ''}`}
            onClick={handleToggleCompleted}
            disabled={marking || isCompleted}
            title={isCompleted ? "Artículo completado" : "Marcar como completado"}
            aria-label={isCompleted ? "Artículo completado" : "Marcar como completado"}
          >
            {isCompleted ? '✓' : ''}
          </button>
        </div>
      </div>

      {url_imagen && (
        <img className={styles.thumbnail} src={url_imagen} alt={titulo} loading="lazy" decoding="async" />
      )}

      <h3 className={styles.title}>{titulo}</h3>

      {descripcion && (
        <p className={styles.desc}>{descripcion}</p>
      )}

      <div className={styles.footer}>
        {url_recurso ? (
          <button
            className={styles.btnLeer}
            onClick={() => window.open(url_recurso!, '_blank')}
          >
            Leer artículo <span>→</span>
          </button>
        ) : (
          <span className={styles.noLink}>Sin enlace disponible</span>
        )}
      </div>
    </article>
  );
});
