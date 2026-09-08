import React, { useEffect, useState } from 'react';
import styles from './recomendaciones.module.css';
import { getIaRecommendations, type RecommendationResponse } from '../../../../../services/iaService';
import type { ActiveModule } from '../../../../../services/m0Service';

// Recomendaciones de respaldo curadas por módulo (para cuando la IA no está disponible)
const FALLBACK_POR_MODULO: Record<string, string[]> = {
  M0: [
    'Asista a su primera cita prenatal antes de la semana 10.',
    'Inicie ácido fólico 400 mcg diarios de inmediato.',
    'Evite automedicarse durante el primer mes del embarazo.',
  ],
  M1: [
    'Realice todos los exámenes de primer trimestre indicados.',
    'Consuma alimentos ricos en hierro: espinacas, lentejas, carnes.',
    'Duerma de lado izquierdo para mejorar la circulación.',
  ],
  M2: [
    'Registre los movimientos fetales a partir de la semana 20.',
    'Aplique la vacuna de influenza si aún no lo ha hecho.',
    'Realice ejercicios de bajo impacto como caminatas o natación.',
  ],
  M3: [
    'Prepare su bolsa para la clínica desde la semana 36.',
    'Elabore su plan de parto con su médico o enfermera.',
    'Cuente mínimo 10 movimientos fetales en 2 horas cada día.',
  ],
  M4: [
    'Inicie la lactancia materna en la primera hora postparto.',
    'Asista al control postparto en los primeros 7 días.',
    'Descanse cuando el bebé duerma y acepte ayuda de su red.',
  ],
};

const FALLBACK_DEFAULT = [
  'Aprenda a identificar los signos de alarma.',
  'Mantenga su carnet prenatal siempre a la mano.',
  'Descanse al menos 8 horas diarias y tome pausas activas.',
];

interface Props {
  activeModule: ActiveModule | null;
}

export const Recomendaciones = React.memo(({ activeModule }: Props) => {
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Solo llama a la IA cuando hay módulo activo
    if (!activeModule) return;

    let cancelled = false;
    setLoading(true);

    getIaRecommendations()
      .then(res => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        // Si falla la IA, dejamos data en null → se usa fallback
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [activeModule]);

  // Determina qué mostrar: IA → fallback por módulo → fallback genérico
  const codigo = activeModule?.codigo ?? '';
  const lista: string[] = data?.recomendaciones?.slice(0, 3)
    ?? FALLBACK_POR_MODULO[codigo]
    ?? FALLBACK_DEFAULT;

  const mensajeMotivacional = data?.mensaje_motivacional ?? null;

  return (
    <section className={styles.recomendaciones}>
      <p className={styles.sideLabel}>RECOMENDACIÓN DEL DÍA</p>
      {activeModule && (
        <p className={styles.moduleHint}>
          {activeModule.nombre}
          {activeModule.semana_gestacion_actual !== undefined && activeModule.semana_gestacion_actual !== null
            ? ` · Semana ${activeModule.semana_gestacion_actual}`
            : ''}
        </p>
      )}

      {loading ? (
        <>
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} style={{ width: '80%' }} />
          <div className={styles.skeletonLine} style={{ width: '90%' }} />
        </>
      ) : (
        <>
          {lista.map((rec, i) => (
            <div key={i} className={styles.rec}>
              <span className={styles.recDot} />
              {rec}
            </div>
          ))}
          {mensajeMotivacional && (
            <p className={styles.motivacional}>💗 {mensajeMotivacional}</p>
          )}
        </>
      )}
    </section>
  );
});
