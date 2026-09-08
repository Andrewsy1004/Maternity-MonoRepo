import React, { useEffect, useState } from 'react';
import { getPathologicalHistory } from '../../services/m0Service';
import type { PathologicalHistory as IPathologicalHistory } from '../../services/m0Service';
import styles from './Profile.module.css';

export const PathologicalHistory: React.FC = () => {
  const [history, setHistory] = useState<IPathologicalHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getPathologicalHistory();
        setHistory(data);
      } catch (error) {
        console.error("Error fetching pathological history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return <div className={styles.loader}>Cargando historial patológico...</div>;
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3>Historial Patológico</h3>
      </div>

      <div className={styles.content}>
        {history.length === 0 ? (
          <div className={styles.noData}>
            No se encontraron antecedentes patológicos registrados.
          </div>
        ) : (
          <div className={styles.pathologicalList}>
            {history.map((item) => (
              <div key={item.id} className={styles.pathologicalItem}>
                <div className={styles.pathologicalHeader}>
                  <h4 className={styles.pathologicalTitle}>{item.descripcion || 'Sin descripción'}</h4>
                  <div className={styles.badgesContainer}>
                    <span className={`${styles.badge} ${styles.badgeCondition}`}>
                      {item.tipo_condicion}
                    </span>
                    {item.controlada !== null && (
                      <span
                        className={`${styles.badge} ${
                          item.controlada ? styles.badgeControlada : styles.badgeNoControlada
                        }`}
                      >
                        {item.controlada ? 'Controlada' : 'No controlada'}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.pathologicalDetails}>
                  {item.fecha_diagnostico && (
                    <div className={styles.detailRow}>
                      <label>Fecha de Diagnóstico</label>
                      <p>{item.fecha_diagnostico}</p>
                    </div>
                  )}
                  {item.tratamiento_actual && (
                    <div className={styles.detailRow}>
                      <label>Tratamiento Actual</label>
                      <p>{item.tratamiento_actual}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
