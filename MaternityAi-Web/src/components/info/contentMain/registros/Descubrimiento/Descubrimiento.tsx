import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useRecommendations } from '../../../../../hooks/clinical/useClinical';
import styles from './Descubrimiento.module.css';

const RECOMENDACIONES_DIARIAS: string[][] = [
  ["Duerma al menos 8 horas para mantener su energía.", "Tome pausas activas y descanse con pies elevados.", "Evite cafeína en exceso, prefiera infusiones permitidas.", "Planifique la semana con su red de apoyo."],
  ["Asista puntualmente a sus controles prenatales.", "Planifique un menú saludable para la semana.", "Realice una caminata ligera de 20 a 30 minutos.", "Registre su peso y verifique el rango recomendado."],
  ["Evite levantar objetos pesados o esfuerzos bruscos.", "Realice ejercicios de respiración para la ansiedad.", "Consuma alimentos ricos en hierro: espinacas, lentejas.", "Mantenga postura adecuada al sentarse y trabajar."],
  ["Asegure consumo adecuado de calcio diario.", "Coma porciones pequeñas 5 o 6 veces al día.", "Use ropa holgada y calzado cómodo.", "Beba al menos 2 litros de agua al día."],
  ["Evite la automedicación; consulte a su médico.", "Realice ejercicios de suelo pélvico (Kegel).", "Consuma fibra: frutas, verduras, cereales integrales.", "Evite permanecer de pie por períodos prolongados."],
  ["Aprenda a identificar los signos de alarma.", "Prepare los documentos médicos en bolso accesible.", "Desconéctese de pantallas antes de dormir.", "Consuma pescados ricos en Omega-3."],
  ["Háblele o cántele a su bebé para conectar.", "Evite comidas grasas o muy condimentadas.", "Tome un baño de agua tibia para relajar músculos.", "Disfrute actividades de bajo impacto en familia."],
];

export const Descubrimiento = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { data, loading } = useRecommendations();

  const dia = new Date().getDay();
  const lista: string[] = (data?.recomendaciones && data.recomendaciones.length > 0)
    ? data.recomendaciones
    : RECOMENDACIONES_DIARIAS[dia] ?? [];

  // Cerrar modal al presionar Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Bloquear scroll de la página de fondo
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleConsultAi = () => {
    localStorage.setItem(
      'pending_ai_question',
      'Por favor, bríndame recomendaciones personalizadas de IA para el día de hoy con respecto a mi embarazo.'
    );
    navigate('/ai');
  };

  const modalContent = isOpen ? (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerTitleContainer}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.headerIconSvg}
            >
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5.5 5.5 0 0 0 7 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5" />
              <line x1="9" y1="18" x2="15" y2="18" />
              <line x1="10" y1="22" x2="14" y2="22" />
            </svg>
            <h3>Recomendaciones del Día</h3>
          </div>
          <button
            className={styles.closeIconBtn}
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <div className={styles.body}>
          {loading && lista.length === 0 ? (
            <div className={styles.loader}>
              <div className={styles.spinner} />
              <p>Cargando recomendaciones...</p>
            </div>
          ) : (
            <ul className={styles.list}>
              {lista.map((item, idx) => (
                <li key={idx} className={styles.listItem}>
                  <span className={styles.bulletDot} />
                  <span className={styles.itemText}>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.aiBtn}
            onClick={handleConsultAi}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.btnIconSvg}
            >
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
            <span>Consultar más en el Chatbot con IA</span>
          </button>
          <button
            className={styles.closeBtn}
            onClick={() => setIsOpen(false)}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <section onClick={() => setIsOpen(true)} className={styles.card}>
        <h3>Descubrimiento</h3>
        <p>Conoce las mejores recomendaciones generadas por IA.</p>
      </section>
      {isOpen && createPortal(modalContent, document.body)}
    </>
  );
};

