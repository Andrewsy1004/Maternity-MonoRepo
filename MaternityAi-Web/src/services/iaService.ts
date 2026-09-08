import api, { USE_MOCKS } from './api';



export interface ChatMessageRequest {
  mensaje: string;
}

export interface ChatMessage {
  id: string;
  rol: 'user' | 'assistant';
  contenido: string;
  created_at: string;  // datetime ISO
}

export interface ChatHistoryResponse {
  mensajes: ChatMessage[];
  total: number;
}

// ---- Risk Summary ----

export interface RiskSummaryResponse {
  assessment_id: string | null;
  nivel_riesgo: 'verde' | 'amarillo' | 'rojo';
  resumen: string;
  factores_riesgo: string[];
  recomendaciones: string[];
  explicacion_ia: string;
  semana_gestacion: number;
}

// ---- Triage ----

export interface TriageRequest {
  sintomas: string[];
  respuestas_recientes?: string[];
}

export interface TriageResponse {
  nivel_urgencia: 'inmediata' | 'urgente' | 'no_urgente';
  descripcion: string;
  acciones_recomendadas: string[];
  requiere_llamada_emergencia: boolean;
}

// ---- Explainability ----

export interface ExplainabilityResponse {
  assessment_id: string;
  nivel_riesgo: 'verde' | 'amarillo' | 'rojo';
  explicacion: string;
  factores_determinantes: string[];
  datos_utilizados: string[];
}

// ---- Recommendations ----

export interface RecommendationResponse {
  semana_gestacion: number;
  modulo: string;
  recomendaciones: string[];
  mensaje_motivacional: string;
}

// ---- Respuesta genérica ----

export interface DetailResponse {
  detail: string;
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDelay = (ms = 800) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_CHAT_HISTORY: ChatMessage[] = [
  {
    id: 'msg-001',
    rol: 'user',
    contenido: '¿Qué alimentos debo evitar en mi trimestre actual?',
    created_at: '2026-06-15T08:00:00Z',
  },
  {
    id: 'msg-002',
    rol: 'assistant',
    contenido: 'Durante tu semana 28 de gestación, es importante evitar carnes crudas o poco cocidas, huevos crudos, lácteos no pasteurizados y pescados con alto contenido de mercurio. Prioriza frutas bien lavadas, verduras cocidas y fuentes de hierro y calcio. 🩺✨',
    created_at: '2026-06-15T08:00:05Z',
  },
];

const MOCK_RISK_SUMMARY: RiskSummaryResponse = {
  assessment_id: 'risk-001',
  nivel_riesgo: 'verde',
  resumen: 'La gestante presenta un embarazo de evolución favorable sin factores de riesgo significativos.',
  factores_riesgo: ['Ninguno identificado en los controles recientes'],
  recomendaciones: [
    'Continuar con controles prenatales programados',
    'Mantener suplementación diaria de hierro y calcio',
    'Realizar actividad física moderada (caminar 30 min diarios)',
    'Estar atenta a signos de alarma (sangrado, dolor de cabeza intenso)',
  ],
  explicacion_ia: 'Evaluación basada en signos vitales normales (tensión arterial 110/70 mmHg), ganancia de peso adecuada para la edad gestacional y ausencia de antecedentes de hipertensión o diabetes gestacional.',
  semana_gestacion: 28,
};

const MOCK_TRIAGE_RESPONSE: TriageResponse = {
  nivel_urgencia: 'urgente',
  descripcion: 'Los síntomas reportados sugieren una situación que debe ser evaluada por tu equipo médico en las próximas horas.',
  acciones_recomendadas: [
    'Comunícate con tu equipo médico hoy mismo',
    'Registra la intensidad y frecuencia del síntoma',
    'Evita esfuerzos físicos hasta ser evaluada',
  ],
  requiere_llamada_emergencia: false,
};

const MOCK_EXPLAINABILITY: ExplainabilityResponse = {
  assessment_id: 'risk-001',
  nivel_riesgo: 'verde',
  explicacion: 'La clasificación se basó en signos vitales dentro de rangos normales, ausencia de antecedentes de riesgo y ganancia de peso adecuada para la semana de gestación.',
  factores_determinantes: [
    'Tensión arterial estable (110/70 mmHg)',
    'Sin antecedentes de hipertensión o diabetes gestacional',
    'Ganancia de peso acorde a la semana de gestación',
  ],
  datos_utilizados: [
    'Últimos signos vitales registrados',
    'Antecedentes patológicos',
    'Controles prenatales recientes',
  ],
};

// ---------------------------------------------------------------------------
// Service Methods
// ---------------------------------------------------------------------------

// POST /api/v1/ia/chat
export const sendChatMessage = async (
  mensaje: string
): Promise<ChatMessage> => {
  if (USE_MOCKS) {
    await mockDelay(2000); // simular latencia de OpenAI
    return {
      id: `msg-${Date.now()}`,
      rol: 'assistant',
      contenido: 'Esta es una respuesta simulada del asistente de IA. Recuerda que la información brindada es educativa y no reemplaza el criterio médico profesional. 🌷',
      created_at: new Date().toISOString(),
    };
  }
  const response = await api.post('/api/v1/ia/chat', { mensaje });
  return response.data;
};

// GET /api/v1/ia/chat/history
export const getChatHistory = async (): Promise<ChatHistoryResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return { mensajes: [...MOCK_CHAT_HISTORY], total: MOCK_CHAT_HISTORY.length };
  }
  const response = await api.get('/api/v1/ia/chat/history');
  return response.data;
};

// DELETE /api/v1/ia/chat/history
export const deleteChatHistory = async (): Promise<DetailResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return { detail: 'Historial de conversación eliminado exitosamente' };
  }
  const response = await api.delete('/api/v1/ia/chat/history');
  return response.data;
};

// GET /api/v1/ia/risk-summary
export const getRiskSummary = async (): Promise<RiskSummaryResponse> => {
  if (USE_MOCKS) {
    await mockDelay(3000); // simular latencia alta de IA
    return MOCK_RISK_SUMMARY;
  }
  const response = await api.get('/api/v1/ia/risk-summary');
  return response.data;
};

// POST /api/v1/ia/triage
export const getTriage = async (
  sintomas: string[],
  respuestasRecientes: string[] = []
): Promise<TriageResponse> => {
  if (USE_MOCKS) {
    await mockDelay(1500);
    return MOCK_TRIAGE_RESPONSE;
  }
  const response = await api.post('/api/v1/ia/triage', {
    sintomas,
    respuestas_recientes: respuestasRecientes,
  });
  return response.data;
};

// GET /api/v1/ia/explainability/{assessment_id}
export const getExplainability = async (
  assessmentId: string
): Promise<ExplainabilityResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return { ...MOCK_EXPLAINABILITY, assessment_id: assessmentId };
  }
  const response = await api.get(`/api/v1/ia/explainability/${assessmentId}`);
  return response.data;
};

// PATCH /api/v1/ia/alerts/{alerta_id}/resolve
export const resolveAlerta = async (
  alertaId: string,
  observaciones: string
): Promise<any> => {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      id: alertaId,
      estado: 'resuelta',
      resuelta_por: 'staff-mock-id',
      fecha_resolucion: new Date().toISOString(),
      descripcion: `Alerta resuelta | Resolución: ${observaciones}`,
    };
  }
  const response = await api.patch(`/api/v1/ia/alerts/${alertaId}/resolve`, {
    observaciones,
  });
  return response.data;
};

// GET /api/v1/ia/recommendations
export const getIaRecommendations = async (): Promise<RecommendationResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      semana_gestacion: 28,
      modulo: 'M2',
      recomendaciones: [
        'Mantén una hidratación constante consumiendo al menos 2.5 litros de agua al día.',
        'Realiza estiramientos suaves por las mañanas para aliviar la tensión lumbar.',
        'No olvides tomar tus suplementos de calcio e hierro de acuerdo a las indicaciones médicas.'
      ],
      mensaje_motivacional: '¡Estás haciendo un trabajo increíble cuidando de ti y de tu bebé! Cada semana es un paso más hacia tu meta.'
    };
  }
  const response = await api.get('/api/v1/ia/recommendations');
  return response.data;
};
