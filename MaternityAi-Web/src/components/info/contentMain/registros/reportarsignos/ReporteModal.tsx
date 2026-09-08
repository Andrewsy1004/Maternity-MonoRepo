import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './ReporteModal.module.css';

type Severidad = 'leve' | 'moderado' | 'severo';

interface Props {
  onClose: () => void;
  error: string | null;
  loading: boolean;
  onSubmit: (descripcion: string, severidad: Severidad | null) => Promise<void>;
}

const SEVERIDADES: { value: Severidad; emoji: string; label: string }[] = [
  { value: 'leve',     emoji: '🟡', label: 'Leve' },
  { value: 'moderado', emoji: '🟠', label: 'Moderado' },
  { value: 'severo',   emoji: '🔴', label: 'Severo' },
];

export const ReporteModal = ({ onClose, onSubmit, error, loading }: Props) => {
  const [descripcion, setDescripcion]   = useState('');
  const [severidad, setSeveridad]       = useState<Severidad | null>(null);
  const [submitted, setSubmitted]       = useState(false);
  const textareaRef                     = useRef<HTMLTextAreaElement>(null);

  // Foco automático al abrir
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Bloquear scroll del body mientras el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = async () => {
    if (!descripcion.trim()) {
    //   setDescError('Por favor describe el síntoma antes de continuar.');
      textareaRef.current?.focus();
      return;
    }
    setSubmitted(true);
    await onSubmit(descripcion.trim(), severidad);
  };

  const modal = (
    <div
      className={styles.overlay}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h2 id="modal-title">Reportar síntoma</h2>
            <p>Tu reporte será registrado en tu historial clínico</p>
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>
        {submitted && !error && !loading ? (
          /* Estado de éxito */
          <div className={styles.successState}>
            <div className={styles.successIcon}>✓</div>
            <h3>¡Reporte enviado!</h3>
            <p>Tu síntoma fue registrado correctamente.<br />El equipo médico podrá revisarlo.</p>
          </div>
        ) : (
          <>
            {/* Cuerpo del formulario */}
            <div className={styles.body}>

              {/* Campo descripción */}
              <div className={styles.field}>
                <label htmlFor="sintoma-desc" className={styles.label}>
                  ¿Qué síntoma presentas?
                </label>
                <textarea
                  id="sintoma-desc"
                  ref={textareaRef}
                  className={`${styles.textarea} ${error ? styles.error : ''}`}
                  placeholder="Describe con detalle lo que estás sintiendo, cuándo empezó y con qué frecuencia ocurre…"
                  value={descripcion}
                  onChange={(e) => {
                    setDescripcion(e.target.value);
                  }}
                  rows={4}
                  maxLength={500}
                />
                {error && <p className={styles.errorMsg}>{error}</p>}
              </div>

              {/* Selector de severidad */}
              <div className={styles.field}>
                <span className={styles.label}>Severidad (opcional)</span>
                <div className={styles.severidadGroup}>
                  {SEVERIDADES.map(({ value, emoji, label }) => (
                    <button
                      key={value}
                      type="button"
                      className={`${styles.severidadBtn} ${severidad === value ? styles.selected : ''}`}
                      onClick={() => setSeveridad(prev => prev === value ? null : value)}
                    >
                      <span>{emoji}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.btnSubmit}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <><div className={styles.spinner} /> Enviando…</>
                ) : (
                  'Enviar reporte'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};