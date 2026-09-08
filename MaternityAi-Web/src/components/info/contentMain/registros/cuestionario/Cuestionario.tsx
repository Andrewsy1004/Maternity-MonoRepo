import { useState } from 'react';
import { useDailyQuestions } from '../../../../../hooks/clinical/useClinical';
import { CuestionarioModal } from './Cuestionariomodal';
import type { RespuestaItem } from '../../../../../services/clinicalService';
import { SvgClipboard } from '../../../../Icons/IconsSystem';
import styles from './Cuestionario.module.css';

interface Props {
  activeModule?: { modulo_id: number; codigo: string; nombre: string } | null;
}

export const Cuestionario = ({ activeModule }: Props) => {
  const { questions, history, loading, submit, refresh } = useDailyQuestions(activeModule?.modulo_id);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSubmit = async (respuestas: RespuestaItem[]) => {
    await submit({ respuestas });
    refresh();
  };

  const isCompletedToday = history.some(item => {
    if (!item.created_at) return false;
    const itemDate = new Date(item.created_at);
    const today = new Date();
    return itemDate.getDate() === today.getDate() &&
           itemDate.getMonth() === today.getMonth() &&
           itemDate.getFullYear() === today.getFullYear();
  });

  return (
    <>
      <section className={styles.cuestionario}>
        <div className={styles.header}>
          <div className={styles.iconBadge}>
            <SvgClipboard width={18} height={18} stroke="#ca436e" />
          </div>
          <h4>Cuestionario diario</h4>
          <span className={styles.infoIcon} title="Información sobre el cuestionario diario">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A08090" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </span>
        </div>
        {isCompletedToday ? (
          <>
            <p style={{ color: '#2e7d32', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', margin: '12px 0 8px 0' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              ¡Cuestionario completado hoy!
            </p>
            <p style={{ margin: '0 0 15px 0' }}>
              Gracias por compartir cómo te sientes. Tu equipo de salud está al tanto de tu bienestar. ¡Vuelve mañana para tu siguiente reporte!
            </p>
            <button className={styles.boton} disabled style={{ backgroundColor: '#f0f0f0', color: '#999', cursor: 'not-allowed', boxShadow: 'none', border: '1px solid #ddd' }}>
              Completado
            </button>
          </>
        ) : (
          <>
            <p>
              Queremos estar contigo en cada etapa de tu embarazo y posparto.
              Comparte cómo te sientes y así podremos acompañarte mejor y cuidar de
              tu bienestar.
            </p>
            <button className={styles.boton} onClick={() => setModalOpen(true)} disabled={loading}>
              {loading ? 'Cargando...' : 'Realizar cuestionario'}
            </button>
          </>
        )}
      </section>

      {modalOpen && (
        <CuestionarioModal
          questions={questions}
          loading={loading}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
};
