import { useState } from 'react';
import styles from './RiskSummaryCard.module.css';
import { useRiskSummary } from '../../../../hooks/ia/useRiskSummary';
import { Modal } from '../../../Modal';
import { getExplainability, type ExplainabilityResponse } from '../../../../services/iaService';

interface RiskDetails {
  class: string;
  label: string;
  icon: string;
  prefix: string;
}

export const RiskSummaryCard = () => {
  const { summary, isLoading, error, updateEvaluation } = useRiskSummary();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [explainData, setExplainData] = useState<ExplainabilityResponse | null>(null);
  const [isExplainLoading, setIsExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  const handleOpenExplain = async (assessmentId: string) => {
    setIsExplainOpen(true);
    if (explainData?.assessment_id === assessmentId) return;

    setIsExplainLoading(true);
    setExplainError(null);
    try {
      const response = await getExplainability(assessmentId);
      setExplainData(response);
    } catch (err: any) {
      console.error('Error fetching explainability:', err);
      setExplainError(
        err.response?.data?.detail || 'No se pudo obtener la explicación de esta evaluación.'
      );
    } finally {
      setIsExplainLoading(false);
    }
  };

  if (isLoading && !summary) {
    return (
      <div className={`${styles.card} ${styles.loadingCard}`}>
        <div className={styles.loadingPulse}></div>
        <p>Analizando datos clínicos con IA...</p>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className={`${styles.card} ${styles.errorCard}`}>
        <h4>⚠️ Error de Evaluación</h4>
        <p>{error}</p>
        <button onClick={updateEvaluation} className={styles.retryBtn}>
          Intentar de nuevo
        </button>
      </div>
    );
  }

  if (!summary) return null;

  const {
    assessment_id,
    nivel_riesgo,
    resumen,
    factores_riesgo,
    recomendaciones,
    explicacion_ia,
    semana_gestacion,
  } = summary;

  // Mapear el nivel de riesgo a clases de estilo y etiquetas con mejoras de accesibilidad
  const riskConfig: Record<'verde' | 'amarillo' | 'rojo', RiskDetails> = {
    verde: {
      class: styles.riskGreen,
      label: 'Riesgo Bajo',
      icon: '✅',
      prefix: 'Estado:',
    },
    amarillo: {
      class: styles.riskYellow,
      label: 'Riesgo Medio',
      icon: '⚠️',
      prefix: 'Precaución:',
    },
    rojo: {
      class: styles.riskRed,
      label: 'Riesgo Alto',
      icon: '🚨',
      prefix: 'Alerta:',
    },
  };

  const currentRisk = riskConfig[nivel_riesgo] || {
    class: styles.riskYellow,
    label: 'Desconocido',
    icon: '❓',
    prefix: 'Estado:',
  };

  return (
    <div className={`${styles.card} ${currentRisk.class}`}>
      {/* Encabezado */}
      <div className={styles.header}>
        <div className={styles.riskBadge}>
          <span className={styles.riskIcon} style={{ marginRight: '6px', fontSize: '18px' }}>{currentRisk.icon}</span>
          <span className={styles.riskLabel}>
            <span className={styles.accessibilityPrefix} style={{ fontSize: '13px', fontWeight: 500, opacity: 0.8, marginRight: '4px' }}>{currentRisk.prefix}</span>
            {currentRisk.label}
          </span>
        </div>
        <span className={styles.weekBadge}>Semana {semana_gestacion}</span>
      </div>

      {/* Semáforo visual prominente */}
      <div className={styles.semaforoRow}>
        <div className={styles.semaforoDots} aria-label={`Semáforo de riesgo: ${currentRisk.label}`}>
          <div 
            className={`${styles.semaforoDot} ${nivel_riesgo === 'rojo' ? styles.dotRojo : styles.dotOff}`} 
            title="Posición superior: Alerta de Riesgo Alto"
          />
          <div 
            className={`${styles.semaforoDot} ${nivel_riesgo === 'amarillo' ? styles.dotAmarillo : styles.dotOff}`} 
            title="Posición media: Precaución de Riesgo Medio"
          />
          <div 
            className={`${styles.semaforoDot} ${nivel_riesgo === 'verde' ? styles.dotVerde : styles.dotOff}`} 
            title="Posición inferior: Estado de Riesgo Bajo"
          />
        </div>
        <div className={styles.semaforoInfo}>
          <span className={`${styles.semaforoLevel} ${styles[`level${nivel_riesgo.charAt(0).toUpperCase() + nivel_riesgo.slice(1)}`]}`}>
            {currentRisk.icon} {currentRisk.label}
          </span>
          <span className={styles.semaforoDesc}>
            {nivel_riesgo === 'verde' && 'Embarazo sin factores de riesgo críticos detectados. Continúa con tus controles.'}
            {nivel_riesgo === 'amarillo' && 'Se detectaron factores a vigilar. Consulta a tu equipo médico pronto.'}
            {nivel_riesgo === 'rojo' && '⚠️ Situación urgente. Contacta a tu equipo médico de inmediato.'}
          </span>
        </div>
      </div>

      {/* Resumen principal */}
      <p className={styles.resumenText}>{resumen}</p>

      {/* Factores de riesgo */}
      {factores_riesgo && factores_riesgo.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.titleIcon}>
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Factores de riesgo identificados
          </h4>
          <ul className={styles.list}>
            {factores_riesgo.map((factor: string, idx: number) => (
              <li key={idx} className={styles.listItem}>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recomendaciones */}
      {recomendaciones && recomendaciones.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.titleIcon}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Recomendaciones personalizadas
          </h4>
          <ul className={styles.list}>
            {recomendaciones.map((rec: string, idx: number) => (
              <li key={idx} className={styles.listItem}>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Explicación IA Colapsable */}
      {explicacion_ia && (
        <div className={styles.collapsibleSection}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={styles.toggleBtn}
          >
            <span className={styles.toggleBtnLabel}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.titleIcon}>
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                <path d="M9 18h6" />
                <path d="M10 22h4" />
              </svg>
              Explicación detallada de la IA
            </span>
            <span className={styles.arrow}>{isExpanded ? '▲' : '▼'}</span>
          </button>
          {isExpanded && (
            <div className={styles.explanationBox}>
              <p>{explicacion_ia}</p>
            </div>
          )}
        </div>
      )}

      {/* Acciones */}
      <div className={styles.actions}>
        {assessment_id && (
          <button
            onClick={() => handleOpenExplain(assessment_id)}
            disabled={isLoading}
            className={styles.refreshBtn}
          >
            <span className={styles.refreshBtnLabel}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.titleIcon} style={{ marginRight: '6px' }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 1 1 5.83 1c0 2-3 2-3 4" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Ver explicación
            </span>
          </button>
        )}
        <button
          onClick={updateEvaluation}
          disabled={isLoading}
          className={styles.refreshBtn}
        >
          {isLoading ? (
            'Evaluando...'
          ) : (
            <span className={styles.refreshBtnLabel}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.titleIcon} style={{ marginRight: '6px' }}>
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <polyline points="21 3 21 8 16 8" />
              </svg>
              Actualizar evaluación
            </span>
          )}
        </button>
      </div>

      {/* Modal de explicabilidad */}
      <Modal
        isOpen={isExplainOpen}
        onClose={() => setIsExplainOpen(false)}
        title="Explicación de la evaluación de riesgo"
      >
        {isExplainLoading ? (
          <p className={styles.resumenText}>Cargando explicación...</p>
        ) : explainError ? (
          <p className={styles.resumenText}>{explainError}</p>
        ) : explainData ? (
          <>
            <p className={styles.resumenText}>{explainData.explicacion}</p>

            {explainData.factores_determinantes.length > 0 && (
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}>Factores determinantes</h4>
                <ul className={styles.list}>
                  {explainData.factores_determinantes.map((factor, idx) => (
                    <li key={idx} className={styles.listItem}>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {explainData.datos_utilizados.length > 0 && (
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}>Datos utilizados</h4>
                <ul className={styles.list}>
                  {explainData.datos_utilizados.map((dato, idx) => (
                    <li key={idx} className={styles.listItem}>
                      {dato}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : null}
      </Modal>
    </div>
  );
};
export default RiskSummaryCard;
