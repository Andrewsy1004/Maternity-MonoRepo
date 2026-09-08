import { useChecklist } from '../../../../hooks/m5/usM5';
import styles from './Consejos.module.css';

interface Props {
  className?: string;
  activeModule?: { codigo: string; nombre: string } | null;
  birthData?: any;
  weeks?: number | null;
  onRegisterBirth?: () => void;
}

export const Consejos = ({
  className,
  activeModule,
  birthData,
  weeks,
  onRegisterBirth,
}: Props) => {
  const { data, loading, updateItem } = useChecklist();

  if (activeModule?.codigo === 'M4') return null;

  const completados = data?.items.filter((i) => i.completado).length ?? 0;
  const total = data?.items.length ?? 0;
  const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

  const handleToggle = (itemId: number, currentState: boolean) => {
    updateItem(itemId, { completado: !currentState });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <section className={`${styles.container} ${className ?? ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <h3>Recomendaciones</h3>
        {!loading && total > 0 && (
          <div className={styles.progressPill}>
            <span>
              {completados}/{total}
            </span>
          </div>
        )}
      </div>

      {/* Barra de progreso */}
      {!loading && total > 0 && (
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      )}

      {/* Lista de items */}
      {loading ? (
        <div className={styles.loading}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className={styles.skeleton} />
          ))}
        </div>
      ) : total === 0 ? (
        <div className={styles.empty}>
          <span>🌸</span>
          <p>No hay items en el checklist por ahora.</p>
        </div>
      ) : (
        data?.items.map((item) => (
          <article
            key={item.id}
            className={`${styles.item} ${item.completado ? styles.completed : ''}`}
            onClick={() => handleToggle(item.id, item.completado)}
            role="checkbox"
            aria-checked={item.completado}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ')
                handleToggle(item.id, item.completado);
            }}
          >
            {/* Check circle */}
            <div className={styles.checkCircle}>
              <span className={styles.checkIcon}>✓</span>
            </div>

            {/* Texto */}
            <div className={styles.itemContent}>
              <h4>{item.texto}</h4>
              {item.completado && item.fecha_completado && (
                <p>Completado el {formatDate(item.fecha_completado)}</p>
              )}
            </div>

            {/* Fecha de completado como badge */}
            {item.completado && item.fecha_completado && (
              <span className={styles.dateBadge}>
                {formatDate(item.fecha_completado)}
              </span>
            )}
          </article>
        ))
      )}

      {/* Banner de parto */}
      {!!(
        activeModule?.codigo !== 'M4' &&
        !birthData &&
        (activeModule?.codigo === 'M3' ||
          (weeks !== null && weeks !== undefined && weeks >= 28))
      ) && (
        <div
          style={{
            background: 'linear-gradient(135deg, #fff0f5 0%, #ffe4e1 100%)',
            border: '1px solid #ffd1dc',
            borderRadius: '20px',
            padding: '15px',
            marginTop: '20px',
            boxShadow: '0 4px 10px rgba(202, 67, 110, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <h4
            style={{
              margin: 0,
              color: '#ca436e',
              fontSize: '15px',
              fontWeight: 'bold',
            }}
          >
            ¿Ya nació tu bebé?
          </h4>
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              color: '#555',
              lineHeight: '1.4',
            }}
          >
            Registra los detalles del nacimiento para activar tu control
            posparto y puerperio.
          </p>
          <button
            onClick={onRegisterBirth}
            style={{
              alignSelf: 'flex-start',
              background: '#ca436e',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            Registrar Parto
          </button>
        </div>
      )}
    </section>
  );
};
