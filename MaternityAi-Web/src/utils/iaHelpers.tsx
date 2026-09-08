import React from 'react';
import { type ChatMessage } from '../services/iaService';

export const TOPICS = [
  'Consulta General IA',
  'Guía de Alimentación',
  'Signos de Alarma y Alertas',
  'Preparación para el Parto',
];

export const TOPIC_TAGS = ['General', 'Alimentación', 'Alertas', 'Parto'];

/**
 * Parser liviano para procesar negritas (**texto**), listas con viñetas,
 * listas ordenadas y saltos de línea sin dependencias externas.
 */
export const parseMarkdown = (text: string): React.ReactNode => {
  if (!text) return null;

  // Reemplazar saltos de línea múltiples para estandarizar bloques de párrafos
  const paragraphs = text.split(/\n\n+/);

  return paragraphs.map((paragraph, pIdx) => {
    const lines = paragraph.split('\n');

    // Comprobar si el párrafo entero es una lista con viñetas (ej: - o *)
    const isBulletList = lines.length > 0 && lines.every(line => {
      const trimmed = line.trim();
      return trimmed === '' || trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•');
    });

    if (isBulletList && lines.some(line => line.trim() !== '')) {
      return (
        <ul key={pIdx} style={{ margin: '10px 0', paddingLeft: '20px', listStyleType: 'disc' }}>
          {lines
            .filter(line => line.trim() !== '')
            .map((line, lIdx) => {
              const cleanText = line.trim().replace(/^[-*•]\s+/, '');
              return (
                <li key={lIdx} style={{ marginBottom: '6px', lineHeight: '1.4' }}>
                  {parseInline(cleanText)}
                </li>
              );
            })}
        </ul>
      );
    }

    // Comprobar si es una lista numerada (ej: 1., 2.)
    const isNumberedList = lines.length > 0 && lines.every(line => {
      const trimmed = line.trim();
      return trimmed === '' || /^\d+\.\s+/.test(trimmed);
    });

    if (isNumberedList && lines.some(line => line.trim() !== '')) {
      return (
        <ol key={pIdx} style={{ margin: '10px 0', paddingLeft: '20px' }}>
          {lines
            .filter(line => line.trim() !== '')
            .map((line, lIdx) => {
              const cleanText = line.trim().replace(/^\d+\.\s+/, '');
              return (
                <li key={lIdx} style={{ marginBottom: '6px', lineHeight: '1.4' }}>
                  {parseInline(cleanText)}
                </li>
              );
            })}
        </ol>
      );
    }

    // Párrafo de texto ordinario con saltos de línea simples
    return (
      <p key={pIdx} style={{ margin: '8px 0', lineHeight: '1.5' }}>
        {lines.map((line, lIdx) => (
          <React.Fragment key={lIdx}>
            {lIdx > 0 && <br />}
            {parseInline(line)}
          </React.Fragment>
        ))}
      </p>
    );
  });
};

/**
 * Procesa estilos inline básicos (negritas)
 */
const parseInline = (text: string): React.ReactNode[] => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} style={{ fontWeight: '600', color: 'inherit' }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

/**
 * Filtra los mensajes del historial correspondientes al tema activo.
 * Limpia los tags e instrucciones del sistema inyectados del contenido del usuario.
 */
export const getMessagesByTopic = (messages: ChatMessage[], topicTag: string): ChatMessage[] => {
  const filtered: ChatMessage[] = [];
  let currentTopic: string | null = null;

  for (const msg of messages) {
    if (msg.rol === 'user') {
      const match = msg.contenido.match(/^\[Tema:\s*([^\]]+)\]/);
      if (match) {
        currentTopic = match[1].trim();
      } else {
        currentTopic = 'General';
      }

      if (currentTopic === topicTag) {
        const cleanContent = msg.contenido.replace(/^\[Tema:\s*[^\]]+\]\s*(?:\(.*?\)\s*)?/, '');
        filtered.push({
          ...msg,
          contenido: cleanContent,
        });
      }
    } else {
      if (currentTopic === topicTag) {
        filtered.push(msg);
      }
    }
  }

  return filtered;
};

/**
 * Formatea el mensaje del usuario agregando el tag del tema y directivas de prompt
 * específicas para que la respuesta de la IA sea adaptada.
 */
export const formatOutgoingMessage = (text: string, topicTag: string): string => {
  const promptDirectives: Record<string, string> = {
    'General': 'Actúa como un asistente obstétrico y de embarazo MaternityAI general. Responde con calidez, empatía y precisión médica.',
    'Alimentación': 'Actúa como un nutricionista materno-fetal experto. Enfócate exclusivamente en alimentación saludable, alimentos prohibidos, control de peso, hidratación y suplementos vitamínicos durante el embarazo y lactancia.',
    'Alertas': 'Actúa como un obstetra de emergencias y triaje. Evalúa detalladamente si el síntoma del usuario representa una señal de peligro (ej. sangrado, preeclampsia, contracciones prematuras) y aconseja con claridad cuándo acudir a urgencias.',
    'Parto': 'Actúa como una educadora prenatal y doula. Explica la preparación física/mental para el parto, plan de parto, ejercicios de respiración y alivio del dolor.',
  };

  const directive = promptDirectives[topicTag] || promptDirectives['General'];
  return `[Tema: ${topicTag}] (${directive}) ${text}`;
};

/**
 * Provee preguntas sugeridas dinámicas acordes al tema activo
 */
export const getQuickSuggestions = (topicTag: string): string[] => {
  const suggestions: Record<string, string[]> = {
    'General': [
      '¿Cuáles son los síntomas normales y comunes en este trimestre?',
      '¿Qué ejercicio físico puedo hacer de manera segura?',
      '¿Con qué frecuencia debo asistir a mis controles prenatales?',
    ],
    'Alimentación': [
      '¿Qué alimentos ricos en hierro y calcio debo priorizar?',
      '¿Cuáles alimentos están estrictamente prohibidos en el embarazo?',
      '¿Puedo consumir café o infusiones de hierbas?',
    ],
    'Alertas': [
      '¿Cuáles son los principales signos de alarma por los que debo ir a urgencias?',
      'Tengo un dolor de cabeza persistente e hinchazón, ¿es peligroso?',
      '¿Cómo diferencio las contracciones de Braxton Hicks de las de parto?',
    ],
    'Parto': [
      '¿Qué debe incluir el bolso para el hospital de la madre y el bebé?',
      '¿Qué es un plan de parto y cómo puedo redactarlo?',
      '¿Qué técnicas de respiración ayudan en el trabajo de parto?',
    ],
  };

  return suggestions[topicTag] || suggestions['General'];
};
