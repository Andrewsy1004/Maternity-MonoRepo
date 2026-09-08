import { useState } from 'react';
import styles from './PreguntasFrecuentes.module.css';
import type { ActiveModule } from '../../../../../services/m0Service';

interface Pregunta {
  pregunta: string;
  respuesta: string;
}

// Preguntas curadas según módulo activo (basadas en la EG de la gestante)
const PREGUNTAS_POR_MODULO: Record<string, Pregunta[]> = {
  M0: [
    {
      pregunta: '¿Qué es el código GMI?',
      respuesta: 'El código GMI (Guía Materna Inteligente) es tu identificador único en la plataforma. Lo recibirás al completar tu registro y te permitirá acceder a todos los servicios de seguimiento durante tu embarazo.',
    },
    {
      pregunta: '¿Cuándo debo asistir a mi primera cita prenatal?',
      respuesta: 'La primera consulta prenatal debe realizarse lo antes posible, idealmente antes de la semana 10. En ese control se confirma el embarazo, se calcula la fecha probable de parto y se inician los exámenes de base. ¡No espere más!',
    },
    {
      pregunta: '¿Qué ácido fólico debo tomar?',
      respuesta: 'Se recomienda tomar 400 mcg de ácido fólico diariamente desde antes del embarazo y durante todo el primer trimestre para prevenir defectos del tubo neural en el bebé. Su médico le indicará la dosis específica según su caso.',
    },
    {
      pregunta: '¿Qué síntomas son normales al inicio?',
      respuesta: 'En las primeras semanas es normal sentir náuseas (especialmente en las mañanas), fatiga, sensibilidad en los senos, ganas frecuentes de orinar y leves cambios de humor. Si los vómitos son muy intensos o tiene sangrado, consulte de inmediato.',
    },
  ],
  M1: [
    {
      pregunta: '¿Es normal tener náuseas en el primer trimestre?',
      respuesta: 'Sí, las náuseas son muy comunes durante las semanas 6 a 12. Para aliviarlas: coma porciones pequeñas y frecuentes, evite olores fuertes, tome galletas saladas antes de levantarse y mantenga buena hidratación. Si los vómitos le impiden comer, consulte a su médico.',
    },
    {
      pregunta: '¿Qué exámenes me deben pedir en el primer trimestre?',
      respuesta: 'Los exámenes de primer trimestre incluyen: hemograma completo, grupo sanguíneo y Rh, glicemia en ayunas, VIH, sífilis, hepatitis B, urocultivo, toxoplasmosis y ecografía entre semanas 11-13 (marcadores de síndrome de Down). Pregúntele a su médico si los tiene todos.',
    },
    {
      pregunta: '¿Es seguro hacer ejercicio en el embarazo?',
      respuesta: 'Sí, el ejercicio moderado es muy beneficioso durante el embarazo. Se recomiendan caminatas, natación, yoga prenatal y ejercicios de bajo impacto. Evite deportes de contacto o con riesgo de caídas. Siempre consulte a su médico antes de iniciar una nueva rutina.',
    },
    {
      pregunta: '¿Cuáles son los signos de alarma?',
      respuesta: 'Consulte urgencias si presenta: sangrado vaginal, dolor abdominal intenso, fiebre mayor a 38°C, visión borrosa, dolor de cabeza severo, pérdida de líquido por la vagina o ausencia de movimientos fetales. Ante cualquier duda, es mejor consultar.',
    },
  ],
  M2: [
    {
      pregunta: '¿Cuándo sentiré los movimientos del bebé?',
      respuesta: 'La mayoría de mamás sienten los primeros movimientos entre las semanas 18 y 22. Al principio parecen burbujas o mariposas en el estómago. A medida que avanza el embarazo, serán más notorios. Desde la semana 28 debe registrar al menos 10 movimientos en 2 horas.',
    },
    {
      pregunta: '¿Para qué sirve la ecografía morfológica?',
      respuesta: 'La ecografía morfológica (semana 18-22) es una evaluación detallada del bebé donde se revisan sus órganos, extremidades, placenta, líquido amniótico y cordón umbilical. Es el estudio más completo del segundo trimestre y ayuda a detectar tempranamente posibles alteraciones.',
    },
    {
      pregunta: '¿Qué vacunas necesito en el segundo trimestre?',
      respuesta: 'Durante el segundo trimestre se recomienda la vacuna contra la influenza (puede aplicarse en cualquier momento del embarazo) y la vacuna contra el tétanos-difteria-tosferina (Tdap), idealmente entre las semanas 27 y 36. Consulte a su médico para el esquema actualizado.',
    },
    {
      pregunta: '¿Cómo controlo el aumento de peso?',
      respuesta: 'El aumento de peso recomendado depende de su IMC antes del embarazo. En promedio se recomienda ganar entre 11 y 16 kg en total. En el segundo trimestre es normal ganar entre 300 y 500 g por semana. Mantenga una dieta equilibrada y registre su peso en cada control.',
    },
  ],
  M3: [
    {
      pregunta: '¿Qué es un plan de parto?',
      respuesta: 'El plan de parto es un documento donde usted expresa sus preferencias para el momento del parto: tipo de analgesia, acompañante, posición para el parto, contacto piel a piel, lactancia inmediata, entre otros. Prepárelo con su médico o enfermera entre las semanas 34 y 36.',
    },
    {
      pregunta: '¿Cómo sé que ya voy a dar a luz?',
      respuesta: 'Las señales de trabajo de parto incluyen: contracciones regulares y progresivas cada 5 minutos, pérdida del tapón mucoso (secreción espesa rosada o café), rotura de membranas (líquido amniótico). Si tiene dudas, diríjase a urgencias para que la evalúen.',
    },
    {
      pregunta: '¿Qué debo llevar a la clínica?',
      respuesta: 'Prepare su bolsa con: documentos (cédula, carnet prenatal, historia clínica), ropa cómoda para mamá y bebé, pañales recién nacido, elementos de aseo personal, almohada si lo permite la IPS y objetos de comodidad como música o aromaterapia. Alístela desde la semana 36.',
    },
    {
      pregunta: '¿La cesárea es lo mismo que el parto vaginal?',
      respuesta: 'Son dos vías diferentes para el nacimiento. El parto vaginal es la vía natural y recomendada siempre que sea posible. La cesárea es una cirugía indicada en casos específicos. Su médico le explicará cuál es la más adecuada según su situación clínica. Pregunte sin pena sus dudas.',
    },
  ],
  M4: [
    {
      pregunta: '¿Cómo inicio la lactancia materna?',
      respuesta: 'La lactancia debe iniciarse en la primera hora después del parto. El contacto piel a piel es fundamental. El calostro (primera leche amarillenta) es muy valioso para el bebé. Busque apoyo de una enfermera o consultora de lactancia si tiene dificultades. Recuerde: la demanda frecuente aumenta la producción.',
    },
    {
      pregunta: '¿Qué es el baby blues y en qué se diferencia de la depresión postparto?',
      respuesta: 'El baby blues son cambios de humor, llanto fácil y cansancio que ocurren en los primeros 10 días postparto y son normales. La depresión postparto es más intensa, dura más de 2 semanas y afecta su función diaria. Si se siente muy triste, ansiosa o no puede cuidar a su bebé, consulte a su médico cuanto antes.',
    },
    {
      pregunta: '¿Cuándo debo ir a mi control postparto?',
      respuesta: 'El primer control postparto debe ser en los primeros 7 días, especialmente si tuvo cesárea o complicaciones. El segundo control es alrededor de la semana 6. En esas citas se evalúa su recuperación, la lactancia, el estado emocional y se inicia la planificación familiar si lo desea.',
    },
    {
      pregunta: '¿Qué método anticonceptivo puedo usar durante la lactancia?',
      respuesta: 'Durante la lactancia exclusiva se pueden usar métodos de solo progestágeno (minipíldora, implante, inyección trimestral, DIU hormonal) o el DIU de cobre, ya que no afectan la producción de leche. Los anticonceptivos combinados (estrógeno + progestágeno) no se recomiendan en los primeros 6 meses de lactancia.',
    },
  ],
};

// Preguntas genéricas como fallback si no hay módulo activo
const PREGUNTAS_DEFAULT: Pregunta[] = [
  { pregunta: '¿Es normal tener dolor de espalda?', respuesta: 'Sí, el dolor de espalda es muy común durante el embarazo. Ocurre porque el centro de gravedad del cuerpo cambia a medida que el útero crece. Para aliviarlo se recomienda mantener buena postura, calzado cómodo, calor local y estiramientos suaves. Si el dolor es intenso o persiste, consulte a su médico.' },
  { pregunta: '¿Cómo controlo la acidez estomacal?', respuesta: 'La acidez es frecuente en el embarazo. Para controlarla: coma porciones pequeñas varias veces al día, evite alimentos grasos y picantes, no se acueste inmediatamente después de comer y eleve la cabecera al dormir. Consulte a su médico antes de tomar antiácidos.' },
  { pregunta: '¿Qué alimentos debo evitar?', respuesta: 'Evite: carnes y mariscos crudos, pescados con alto mercurio, quesos blandos no pasteurizados, huevos crudos, alcohol, cafeína en exceso y bebidas energizantes. Prefiera alimentos bien cocidos y de origen seguro.' },
  { pregunta: '¿Cuáles son los signos de alarma?', respuesta: 'Consulte urgencias si presenta: sangrado vaginal, dolor abdominal intenso, fiebre mayor a 38°C, visión borrosa, dolor de cabeza severo, hinchazón súbita de manos y cara, o ausencia de movimientos fetales. Ante la duda, consulte.' },
];

interface Props {
  activeModule: ActiveModule | null;
}

const FAQ_MODAL_ID = 'faq-modal';

export const PreguntasFrecuentes = ({ activeModule }: Props) => {
  const [selected, setSelected] = useState<Pregunta | null>(null);

  const codigo = activeModule?.codigo ?? '';
  const preguntas = PREGUNTAS_POR_MODULO[codigo] ?? PREGUNTAS_DEFAULT;

  return (
    <section className={styles.container}>
      <p className={styles.sideLabel}>PREGUNTAS FRECUENTES</p>
      {activeModule && (
        <p className={styles.moduleHint}>{activeModule.nombre}</p>
      )}

      {preguntas.map((item, index) => (
        <button
          key={index}
          className={styles.questionBtn}
          onClick={() => setSelected(item)}
          aria-haspopup="dialog"
        >
          <span className={styles.questionIcon}>?</span>
          {item.pregunta}
        </button>
      ))}

      {selected && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby={FAQ_MODAL_ID}
          onClick={() => setSelected(null)}
        >
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalIcon}>💬</span>
              <h3 id={FAQ_MODAL_ID} className={styles.modalQuestion}>
                {selected.pregunta}
              </h3>
            </div>
            <p className={styles.modalAnswer}>{selected.respuesta}</p>
            <button className={styles.modalClose} onClick={() => setSelected(null)}>
              Entendido
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
