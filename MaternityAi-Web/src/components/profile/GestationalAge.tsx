import React, { useEffect, useState } from 'react';
import {
  getGestationalAge,
  type GestationalAge as GestationalAgeState,
} from '../../services/m0Service';
import styles from './Profile.module.css';

export const GestationalAge: React.FC = () => {
  const [data, setData] = useState<GestationalAgeState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const responseData = await getGestationalAge();
        setData(responseData);
      } catch (error) {
        console.error('Error fetching gestational age:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return <div className={styles.loader}>Calculando edad gestacional...</div>;
  }

  if (!data) {
    return (
      <div className={styles.card}>
        <h3>Edad Gestacional</h3>
        <p className={styles.noData}>
          No se pudo calcular la edad gestacional.
        </p>
      </div>
    );
  }

  // standard pregnancy duration is 40 weeks
  const progressPercent = Math.min(Math.round((data.semanas / 40) * 100), 100);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3>Edad Gestacional</h3>
      </div>

      <div className={styles.content}>
        <div className={styles.gestationalMain}>
          <div className={styles.ageCircle}>
            <span className={styles.weeksCount}>{data.semanas}</span>
            <span className={styles.daysCount}>
              {data.semanas === 1 ? 'Semana' : 'Semanas'} y {data.dias}{' '}
              {data.dias === 1 ? 'Día' : 'Días'}
            </span>
          </div>

          <div className={styles.progressContainer}>
            <div className={styles.progressLabel}>
              <span>Progreso de gestación</span>
              <span>
                {progressPercent}% (Semana {data.semanas}/40)
              </span>
            </div>
            <div className={styles.progressBarBg}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          <div className={styles.datesGrid}>
            <div className={styles.dateItem}>
              <label>FUR / FUM</label>
              <span className={styles.dateValue}>
                {data.fecha_ultima_menstruacion || 'No especificada'}
              </span>
            </div>
            <div className={styles.dateItem}>
              <label>FPP (Probable)</label>
              <span className={styles.dateValue}>
                {data.fecha_probable_parto || 'No especificada'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
