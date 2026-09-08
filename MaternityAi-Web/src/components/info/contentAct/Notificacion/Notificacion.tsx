import React from 'react';
import type { RespuestaResponse } from '../../../../services/clinicalService';
import styles from './Notificacion.module.css';

const formatFecha = (dateStr: string | null) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const getTituloSemana = (semana: number | null) => {
  if (!semana) return 'Encuesta de Seguimiento';
  if (semana <= 13) return 'Encuesta Semanal - 1er Trimestre';
  if (semana <= 26) return 'Encuesta Semanal - 2do Trimestre';
  return 'Encuesta Semanal - 3er Trimestre';
};

const getTagSemana = (semana: number | null) => {
  if (!semana) return 'Seguimiento';
  if (semana <= 13) return 'Prevención';
  if (semana <= 26) return 'Control';
  return 'Preparación';
};

const getRespuestaResumen = (item: RespuestaResponse) => {
  if (item.respuesta_booleana !== null)
    return item.respuesta_booleana ? 'Respondió: Sí' : 'Respondió: No';
  if (item.respuesta_texto)
    return item.respuesta_texto;
  if (item.respuesta_numerica !== null)
    return `Valor registrado: ${item.respuesta_numerica}`;
  return 'Encuesta completada';
};

// Imagen ilustrativa por trimestre
const getImagen = (semana: number | null) => {
  if (!semana || semana <= 13) return './image/notificaciones.png';
  if (semana <= 26)            return './image/notificaciones.png';
  return './image/notificaciones.png';
};

interface Props {
  item: RespuestaResponse;
}

export const Notificacion = React.memo(({ item }: Props) => {
  const titulo  = getTituloSemana(item.semana_gestacion);
  const tag     = getTagSemana(item.semana_gestacion);
  const resumen = getRespuestaResumen(item);
  const hasAlert = !!item.alerta_id;

  return (
    <section className={styles.container}>
      <div className={styles.conten_card}>
        {/* Tag: alerta o categoría normal */}
        {hasAlert ? (
          <p className={styles.alert_badge}>Generó una alerta</p>
        ) : (
          <p className={styles.nombre_notificacion}>{tag}</p>
        )}

        <h2 className={styles.title}>{titulo}</h2>

        <p className={styles.desc}>{resumen}</p>

        <div className={styles.fecha}>
          {item.semana_gestacion && (
            <span className={styles.semana}>Sem. {item.semana_gestacion}</span>
          )}
          <p>{formatFecha(item.created_at)}</p>
        </div>
      </div>

      <img
        src={getImagen(item.semana_gestacion)}
        alt={titulo}
        loading="lazy"
        decoding="async"
      />
    </section>
  );
});

// ---- Skeleton con el mismo layout ----
export const NotificacionSkeleton = () => (
  <section className={styles.container} style={{ opacity: 0.5 }}>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ height: 28, width: '30%', borderRadius: 20, background: '#ffe8ee' }} />
      <div style={{ height: 22, width: '80%', borderRadius: 6,  background: '#f5e0e8' }} />
      <div style={{ height: 18, width: '65%', borderRadius: 6,  background: '#f5e0e8' }} />
      <div style={{ height: 16, width: '45%', borderRadius: 6,  background: '#f5e0e8' }} />
    </div>
    <div style={{ width: 170, height: 160, background: '#f5e0e8', borderRadius: 8 }} />
  </section>
);