import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PreguntaSegResponse, RespuestaItem } from '../../../../../services/clinicalService';
import styles from './CuestionarioModal.module.css';

interface Props {
  questions: PreguntaSegResponse[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (respuestas: RespuestaItem[], semana_gestacion?: number) => Promise<void>;
}

// Valor de respuesta local por paso
type StepAnswer =
  | { type: 'opcion';   opcion_id: number; texto_opcion: string }
  | { type: 'booleana'; value: boolean }
  | { type: 'numerica'; value: string }
  | { type: 'texto';    value: string };

export const CuestionarioModal = ({ questions, loading, onClose, onSubmit }: Props) => {
  const [step, setStep]           = useState(0);
  const [answers, setAnswers]     = useState<Map<number, StepAnswer>>(new Map());
  const [stepKey, setStepKey]     = useState(0);   // fuerza re-render para animación
  const [fieldError, setFieldError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]     = useState(false);
  const containerRef              = useRef<HTMLDivElement>(null);

  const currentQ = questions[step];
  const total    = questions.length;
  const progress = total > 0 ? ((step) / total) * 100 : 0;

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ---- helpers ----

  const goNext = () => {
    // Validar que la pregunta tenga respuesta antes de avanzar
    if (!answers.has(currentQ.id)) {
      setFieldError('Por favor responde esta pregunta antes de continuar.');
      return;
    }
    setFieldError('');
    setStep(s => s + 1);
    setStepKey(k => k + 1);
  };

  const goBack = () => {
    setFieldError('');
    setStep(s => s - 1);
    setStepKey(k => k + 1);
  };

  const setAnswer = (questionId: number, answer: StepAnswer) => {
    setAnswers(prev => new Map(prev).set(questionId, answer));
    setFieldError('');
  };

  // ---- convertir las respuestas locales al formato que espera el service ----
  const buildRespuestasPayload = (): RespuestaItem[] => {
    return questions.map(q => {
      const ans = answers.get(q.id);
      const base: RespuestaItem = { pregunta_id: q.id };

      if (!ans) return base;

      if (ans.type === 'opcion')   return { ...base, opcion_id: ans.opcion_id };
      if (ans.type === 'booleana') return { ...base, respuesta_booleana: ans.value };
      if (ans.type === 'numerica') return { ...base, respuesta_numerica: ans.value !== '' ? Number(ans.value) : undefined };
      if (ans.type === 'texto')    return { ...base, respuesta_texto: ans.value };

      return base;
    });
  };

  const handleSubmit = async () => {
    // Validar última pregunta
    if (!answers.has(currentQ.id)) {
      setFieldError('Por favor responde esta pregunta antes de enviar.');
      return;
    }

    setSubmitting(true);
    setFieldError('');

    try {
      await onSubmit(buildRespuestasPayload());
      setSuccess(true);
      setTimeout(onClose, 2200);
    } catch {
      setFieldError('Ocurrió un error al enviar el cuestionario. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- render por tipo de pregunta ----

  const renderInput = (q: PreguntaSegResponse) => {
    const current = answers.get(q.id);

    if (q.tipo_respuesta === 'opcion_multiple' && q.opciones.length > 0) {
      return (
        <div className={styles.optionsGrid}>
          {q.opciones.map(op => (
            <button
              key={op.id}
              type="button"
              className={`${styles.optionBtn} ${
                current?.type === 'opcion' && current.opcion_id === op.id ? styles.selected : ''
              }`}
              onClick={() => setAnswer(q.id, { type: 'opcion', opcion_id: op.id, texto_opcion: op.texto_opcion })}
            >
              {op.texto_opcion}
            </button>
          ))}
        </div>
      );
    }

    if (q.tipo_respuesta === 'booleana' || q.tipo_respuesta === 'si_no') {
      return (
        <div className={styles.boolGroup}>
          {([
            { value: true,  emoji: '✅', label: 'Sí' },
            { value: false, emoji: '❌', label: 'No' },
          ] as const).map(({ value, emoji, label }) => (
            <button
              key={String(value)}
              type="button"
              className={`${styles.boolBtn} ${
                current?.type === 'booleana' && current.value === value ? styles.selected : ''
              }`}
              onClick={() => setAnswer(q.id, { type: 'booleana', value })}
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      );
    }

    if (q.tipo_respuesta === 'numerica' || q.tipo_respuesta === 'escala_numerica' || q.tipo_respuesta === 'escala_1_5') {
      return (
        <div className={styles.numericField}>
          <input
            type="number"
            className={styles.numericInput}
            placeholder="Ingresa un número"
            value={current?.type === 'numerica' ? current.value : ''}
            onChange={e => setAnswer(q.id, { type: 'numerica', value: e.target.value })}
            min={0}
            autoFocus
          />
        </div>
      );
    }

    // Texto libre como fallback
    return (
      <textarea
        className={styles.textareaField}
        placeholder="Escribe tu respuesta aquí…"
        rows={3}
        value={current?.type === 'texto' ? current.value : ''}
        onChange={e => setAnswer(q.id, { type: 'texto', value: e.target.value })}
        autoFocus
      />
    );
  };

  // ---- contenido principal ----

  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          Cargando preguntas…
        </div>
      );
    }

    if (total === 0) {
      return (
        <div className={styles.emptyState}>
          <span>🌸</span>
          <p>No hay preguntas disponibles para hoy.<br />¡Vuelve mañana!</p>
        </div>
      );
    }

    if (success) {
      return (
        <div className={styles.successState}>
          <div className={styles.successIcon}>🌸</div>
          <h3>¡Cuestionario completado!</h3>
          <p>Tus respuestas fueron registradas.<br />El equipo de salud las revisará.</p>
        </div>
      );
    }

    return (
      <>
        <div className={styles.body}>
          <div key={stepKey} className={`${styles.stepEnter}`}>
            <p className={styles.stepIndicator}>
              Pregunta {step + 1} de {total}
            </p>
            <p className={styles.question}>{currentQ.texto_pregunta}</p>
            {renderInput(currentQ)}
            {fieldError && <p className={styles.errorMsg}>{fieldError}</p>}
          </div>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.btnBack}
            onClick={goBack}
            disabled={step === 0 || submitting}
          >
            ← Atrás
          </button>

          {step < total - 1 ? (
            <button
              type="button"
              className={styles.btnNext}
              onClick={goNext}
              disabled={submitting}
            >
              Siguiente →
            </button>
          ) : (
            <button
              type="button"
              className={styles.btnNext}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? <><div className={styles.spinner} /> Enviando…</>
                : 'Enviar cuestionario ✓'
              }
            </button>
          )}
        </div>
      </>
    );
  };

  const modal = (
    <div
      className={styles.overlay}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cuestionario-title"
      ref={containerRef}
    >
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h2 id="cuestionario-title">Cuestionario diario</h2>
            <p>Comportamientos del bebé y bienestar</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        {/* Barra de progreso */}
        {!loading && total > 0 && !success && (
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress + (100 / total)}%` }}
            />
          </div>
        )}

        {renderContent()}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};
