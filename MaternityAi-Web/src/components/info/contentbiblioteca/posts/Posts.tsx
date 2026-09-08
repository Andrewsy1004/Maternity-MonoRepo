import React from 'react';
import { Articulo } from './Articulos/Articulo';
import { Videos } from './Videos/Videos';
import styles from './Posts.module.css';
import type { ContenidoEducativoResponse } from '../../../../services/m5Service';

interface Props {
  data: ContenidoEducativoResponse[];
  loading: boolean;
  error: string | null;
  completedIds: Set<number>;
  onMarkCompleted: (id: number) => Promise<void>;
}

const CardSkeleton = () => (
  <div className={styles.skeleton}>
    <div className={styles.skeletonBadge} />
    <div className={styles.skeletonTitle} />
    <div className={styles.skeletonLine} />
    <div className={styles.skeletonLine} style={{ width: '60%' }} />
  </div>
);

export const Posts = React.memo(({ data, loading, error, completedIds, onMarkCompleted }: Props) => {
  if (loading) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>⚠️</span>
        <p className={styles.emptyTitle}>No se pudo cargar el contenido</p>
        <p className={styles.emptySubtitle}>Verifica tu conexión o intenta de nuevo más tarde.</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>📚</span>
        <p className={styles.emptyTitle}>Aún no hay contenido disponible</p>
        <p className={styles.emptySubtitle}>El equipo de salud está preparando recursos educativos para tu etapa de gestación. ¡Pronto tendrás materiales aquí!</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {data.map(item => {
        const isCompleted = completedIds.has(item.id);
        return (item.tipo_contenido ?? '').toLowerCase().trim() === 'video'
          ? <Videos key={item.id} post={item} isCompleted={isCompleted} onMarkCompleted={onMarkCompleted} />
          : <Articulo key={item.id} post={item} isCompleted={isCompleted} onMarkCompleted={onMarkCompleted} />;
      })}
    </div>
  );
});
