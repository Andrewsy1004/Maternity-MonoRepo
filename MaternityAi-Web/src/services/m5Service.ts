import api, { USE_MOCKS } from './api';

// ---------------------------------------------------------------------------
// Interfaces — alineadas 1:1 con schemas.py del módulo M5
// ---------------------------------------------------------------------------

// ---- Contenidos Educativos ----

export interface ContenidoEducativoResponse {
  id: number;
  titulo: string;
  descripcion: string | null;
  tipo_contenido: string | null;
  url_recurso: string | null;
  url_imagen: string | null;
  duracion_minutos: number | null;
  orden: number | null;
}

export interface OpcionRespuestaResponse {
  id: number;
  texto_opcion: string;
  orden: number | null;
}

export interface PreguntaEducativaResponse {
  id: number;
  texto_pregunta: string;
  tipo_pregunta: string | null;
  orden: number | null;
  opciones: OpcionRespuestaResponse[];
}

export interface ContenidoEducativoDetalleResponse {
  id: number;
  titulo: string;
  descripcion: string | null;
  tipo_contenido: string | null;
  cuerpo_texto: string | null;
  url_recurso: string | null;
  url_imagen: string | null;
  duracion_minutos: number | null;
  orden: number | null;
  preguntas: PreguntaEducativaResponse[];
}

// ---- Categorías ----

export interface CategoriaResponse {
  id: number;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  orden: number | null;
}

// ---- Progreso ----

export interface ProgresoResponse {
  contenido_id: number;
  completado: boolean;
  fecha_completado: string | null;      // datetime ISO
}

// ---- Checklist ----

export interface ChecklistItemResponse {
  id: number;
  texto: string;
  orden: number | null;
  completado: boolean;
  fecha_completado: string | null;      // datetime ISO
  semana_eg?: number | null;
}

export interface ChecklistResponse {
  modulo_id: number;
  total_items: number;
  completados: number;
  items: ChecklistItemResponse[];
}

export interface CompletadoUpdate {
  completado: boolean;
}

// ---- Salud Mental ----

export interface TamizajeCreate {
  instrumento: string;
  puntaje: number;
}

export interface TamizajeResponse {
  id: string;
  instrumento: string;
  puntaje: number;
  fecha: string;                        // date ISO
  recomendaciones: string | null;
}

export interface RecommendationsResponse {
  id: string;
  recomendaciones: string | null;
  created_at: string | null;            // datetime ISO
}

// ---- Autoevaluaciones ----

export interface AutoevaluacionCreate {
  pregunta_id: number;
  respuesta_texto?: string | null;
  respuesta_booleana?: boolean | null;
  respuesta_numerica?: number | null;
  opcion_id?: number | null;
}

export interface AutoevaluacionResponse {
  id: string;
  pregunta_id: number;
  respuesta_texto: string | null;
  respuesta_booleana: boolean | null;
  respuesta_numerica: number | null;
  opcion_id: number | null;
  created_at: string | null;            // datetime ISO
}

export interface AutoevaluacionDetalleResponse {
  id: string;
  pregunta_id: number;
  texto_pregunta: string;
  tipo_respuesta: string;
  respuesta_texto: string | null;
  respuesta_booleana: boolean | null;
  respuesta_numerica: number | null;
  opcion_id: number | null;
  texto_opcion: string | null;
  created_at: string | null;            // datetime ISO
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDelay = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms));

const MOCK_CONTENIDOS: ContenidoEducativoResponse[] = [
  {
    id: 1,
    titulo: "Nutrición durante el embarazo",
    descripcion: "Guía de alimentación saludable para gestantes",
    tipo_contenido: "articulo",
    url_recurso: null,
    url_imagen: null,
    duracion_minutos: 10,
    orden: 1,
  },
  {
    id: 2,
    titulo: "Ejercicios seguros en el embarazo",
    descripcion: "Rutina de actividad física adaptada",
    tipo_contenido: "video",
    url_recurso: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&start_radio=1",
    url_imagen: null,
    duracion_minutos: 15,
    orden: 2,
  },
];

export const MOCK_CONTENIDOS_POR_MODULO: Record<number, ContenidoEducativoResponse[]> = {
  1: [
    {
      id: 101,
      titulo: "1er Trimestre: Alimentación e Hidratación",
      descripcion: "Aprende qué comer y cómo manejar las náuseas matutinas en tus primeras semanas.",
      tipo_contenido: "articulo",
      url_recurso: null,
      url_imagen: null,
      duracion_minutos: 8,
      orden: 1
    },
    {
      id: 102,
      titulo: "Importancia del Ácido Fólico",
      descripcion: "Por qué debes tomar suplementos de ácido fólico durante el primer trimestre.",
      tipo_contenido: "articulo",
      url_recurso: null,
      url_imagen: null,
      duracion_minutos: 5,
      orden: 2
    },
    {
      id: 103,
      titulo: "Ejercicios de respiración iniciales",
      descripcion: "Video sobre técnicas de respiración relajante para el inicio del embarazo.",
      tipo_contenido: "video",
      url_recurso: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      url_imagen: null,
      duracion_minutos: 10,
      orden: 3
    }
  ],
  2: [
    {
      id: 201,
      titulo: "2do Trimestre: Cambios en tu cuerpo",
      descripcion: "Qué esperar durante los meses 4, 5 y 6 de gestación.",
      tipo_contenido: "articulo",
      url_recurso: null,
      url_imagen: null,
      duracion_minutos: 12,
      orden: 1
    },
    {
      id: 202,
      titulo: "Ejercicios de estiramiento y yoga prenatal",
      descripcion: "Rutina guiada en video para mantener la flexibilidad y evitar dolores de espalda.",
      tipo_contenido: "video",
      url_recurso: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      url_imagen: null,
      duracion_minutos: 15,
      orden: 2
    }
  ],
  3: [
    {
      id: 301,
      titulo: "3er Trimestre: Preparándote para el parto",
      descripcion: "Signos de alarma, contracciones y cuándo acudir al centro de salud.",
      tipo_contenido: "articulo",
      url_recurso: null,
      url_imagen: null,
      duracion_minutos: 15,
      orden: 1
    },
    {
      id: 302,
      titulo: "Plan de Parto: Qué es y cómo redactarlo",
      descripcion: "Una guía completa para definir tus preferencias de parto y comunicarlas al hospital.",
      tipo_contenido: "articulo",
      url_recurso: null,
      url_imagen: null,
      duracion_minutos: 10,
      orden: 2
    },
    {
      id: 303,
      titulo: "Signos de alarma en el tercer trimestre",
      descripcion: "Video explicativo sobre sangrados, dolores de cabeza intensos y pérdida de líquido.",
      tipo_contenido: "video",
      url_recurso: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      url_imagen: null,
      duracion_minutos: 8,
      orden: 3
    }
  ],
  4: [
    {
      id: 401,
      titulo: "Postparto: Cuidados de la madre en casa",
      descripcion: "Recuperación física, higiene y manejo de las emociones en el puerperio.",
      tipo_contenido: "articulo",
      url_recurso: null,
      url_imagen: null,
      duracion_minutos: 10,
      orden: 1
    },
    {
      id: 402,
      titulo: "Lactancia Materna Eficaz",
      descripcion: "Técnicas de agarre correcto, posiciones para amamantar y prevención de grietas.",
      tipo_contenido: "articulo",
      url_recurso: null,
      url_imagen: null,
      duracion_minutos: 15,
      orden: 2
    },
    {
      id: 403,
      titulo: "Primeros cuidados del recién nacido",
      descripcion: "Video instructivo sobre el baño, el cordón umbilical y patrones de sueño del bebé.",
      tipo_contenido: "video",
      url_recurso: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      url_imagen: null,
      duracion_minutos: 12,
      orden: 3
    }
  ]
};

const MOCK_CONTENIDO_DETALLE: ContenidoEducativoDetalleResponse = {
  id: 1,
  titulo: "Nutrición durante el embarazo",
  descripcion: "Guía de alimentación saludable para gestantes",
  tipo_contenido: "articulo",
  cuerpo_texto: "Una alimentación equilibrada es fundamental durante el embarazo...",
  url_recurso: null,
  url_imagen: null,
  duracion_minutos: 10,
  orden: 1,
  preguntas: [
    {
      id: 1,
      texto_pregunta: "¿Cuántas porciones de frutas se recomiendan al día?",
      tipo_pregunta: "opcion_multiple",
      orden: 1,
      opciones: [
        { id: 1, texto_opcion: "1 porción", orden: 1 },
        { id: 2, texto_opcion: "2-3 porciones", orden: 2 },
        { id: 3, texto_opcion: "5 o más porciones", orden: 3 },
      ],
    },
  ],
};

const MOCK_CATEGORIAS: CategoriaResponse[] = [
  { id: 1, nombre: "Nutrición", descripcion: "Alimentación y dieta", icono: "🥗", orden: 1 },
  { id: 2, nombre: "Ejercicio", descripcion: "Actividad física segura", icono: "🤸", orden: 2 },
  { id: 3, nombre: "Salud Mental", descripcion: "Bienestar emocional", icono: "🧠", orden: 3 },
];

const MOCK_PROGRESO: ProgresoResponse[] = [
  { contenido_id: 1, completado: true, fecha_completado: "2024-03-05T10:00:00" },
  { contenido_id: 2, completado: false, fecha_completado: null },
];

const MOCK_CHECKLIST: ChecklistResponse = {
  modulo_id: 5,
  total_items: 4,
  completados: 2,
  items: [
    { id: 1, texto: "Tomar ácido fólico diariamente", orden: 1, completado: true, fecha_completado: "2024-03-01T08:00:00" },
    { id: 2, texto: "Asistir al control prenatal del mes", orden: 2, completado: true, fecha_completado: "2024-03-05T09:00:00" },
    { id: 3, texto: "Leer contenido sobre nutrición", orden: 3, completado: false, fecha_completado: null },
    { id: 4, texto: "Completar tamizaje de salud mental", orden: 4, completado: false, fecha_completado: null },
  ],
};

const MOCK_TAMIZAJES: TamizajeResponse[] = [
  {
    id: "tam-001",
    instrumento: "PHQ-9",
    puntaje: 4,
    fecha: "2024-03-01",
    recomendaciones: "Puntaje dentro del rango normal. Continúe con actividades de bienestar.",
  },
];

const MOCK_RECOMMENDATIONS: RecommendationsResponse[] = [
  {
    id: "rec-001",
    recomendaciones: "Puntaje dentro del rango normal. Continúe con actividades de bienestar.",
    created_at: "2024-03-01T10:00:00",
  },
];

const MOCK_AUTOEVALUACIONES: AutoevaluacionDetalleResponse[] = [
  {
    id: "auto-001",
    pregunta_id: 10,
    texto_pregunta: "¿Con qué frecuencia se ha sentido triste o sin esperanza?",
    tipo_respuesta: "opcion_multiple",
    respuesta_texto: null,
    respuesta_booleana: null,
    respuesta_numerica: null,
    opcion_id: 2,
    texto_opcion: "Varios días",
    created_at: "2024-03-01T10:00:00",
  },
];

// ---------------------------------------------------------------------------
// Service Methods
// ---------------------------------------------------------------------------

// ---- Contenidos y Categorías ----

// GET /content?modulo_id={modulo_id}
export const getContentByModule = async (modulo_id?: number): Promise<ContenidoEducativoResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_CONTENIDOS;
  }
  const params = modulo_id !== undefined ? { modulo_id } : {};
  const response = await api.get('/api/v1/m5/content', { params });
  return response.data ?? [];
};

// GET /content/categories
export const getCategories = async (): Promise<CategoriaResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_CATEGORIAS;
  }
  try {
    const response = await api.get('/api/v1/m5/content/categories');
    return response.data ?? [];
  } catch (err) {
    console.warn("getCategories failed, falling back to mock:", err);
    return MOCK_CATEGORIAS;
  }
};

// GET /content/category/{category_id}
// Nota: debe ir antes de /content/{content_id} para evitar conflictos de ruta
export const getContentsByCategory = async (category_id: number): Promise<ContenidoEducativoResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_CONTENIDOS;
  }
  try {
    const response = await api.get(`/api/v1/m5/content/category/${category_id}`);
    return response.data ?? [];
  } catch (err) {
    console.warn("getContentsByCategory failed, falling back to mock:", err);
    return MOCK_CONTENIDOS;
  }
};

// GET /content/{content_id}
export const getContentById = async (content_id: number): Promise<ContenidoEducativoDetalleResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_CONTENIDO_DETALLE;
  }
  try {
    const response = await api.get(`/api/v1/m5/content/${content_id}`);
    return response.data;
  } catch (err) {
    console.warn("getContentById failed, falling back to mock:", err);
    return MOCK_CONTENIDO_DETALLE;
  }
};

// ---- Progreso ----

// GET /progress
export const getProgress = async (): Promise<ProgresoResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_PROGRESO;
  }
  try {
    const response = await api.get('/api/v1/m5/progress');
    return response.data;
  } catch (err) {
    console.warn("getProgress failed, falling back to mock:", err);
    return MOCK_PROGRESO;
  }
};

// POST /content/{content_id}/complete  — status 201
export const markContentCompleted = async (content_id: number): Promise<ProgresoResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      contenido_id: content_id,
      completado: true,
      fecha_completado: new Date().toISOString(),
    };
  }
  const response = await api.post(`/api/v1/m5/content/${content_id}/complete`);
  return response.data;
};

// GET /checklist
export const getChecklist = async (): Promise<ChecklistResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_CHECKLIST;
  }
  try {
    const response = await api.get('/api/v1/m5/checklist');
    return response.data;
  } catch (err) {
    console.warn("getChecklist failed, falling back to mock data:", err);
    return MOCK_CHECKLIST;
  }
};

// PATCH /checklist/{item_id}
export const updateChecklistItem = async (
  item_id: number,
  data: CompletadoUpdate
): Promise<ChecklistItemResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    const existing = MOCK_CHECKLIST.items.find(i => i.id === item_id)
      ?? MOCK_CHECKLIST.items[0];
    return {
      ...existing,
      completado: data.completado,
      fecha_completado: data.completado ? new Date().toISOString() : null,
    };
  }
  try {
    const response = await api.patch(`/api/v1/m5/checklist/${item_id}`, data);
    return response.data;
  } catch (err) {
    console.warn("updateChecklistItem failed, falling back to mock update:", err);
    const existing = MOCK_CHECKLIST.items.find(i => i.id === item_id)
      ?? MOCK_CHECKLIST.items[0];
    return {
      ...existing,
      completado: data.completado,
      fecha_completado: data.completado ? new Date().toISOString() : null,
    };
  }
};

// ---- Salud Mental ----

// POST /mental-health/screening  — status 201
export const createTamizaje = async (data: TamizajeCreate): Promise<TamizajeResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      id: `tam-${Date.now()}`,
      instrumento: data.instrumento,
      puntaje: data.puntaje,
      fecha: new Date().toISOString().split('T')[0],
      recomendaciones: null,
    };
  }
  const response = await api.post('/api/v1/m5/mental-health/screening', data);
  return response.data;
};

// GET /mental-health/screening
export const getTamizajesHistory = async (): Promise<TamizajeResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_TAMIZAJES;
  }
  const response = await api.get('/api/v1/m5/mental-health/screening');
  return response.data;
};

// GET /mental-health/recommendations
export const getMentalHealthRecommendations = async (): Promise<RecommendationsResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_RECOMMENDATIONS;
  }
  const response = await api.get('/api/v1/m5/mental-health/recommendations');
  return response.data;
};

// ---- Autoevaluaciones ----

// GET /self-assessment
export const getAutoevaluaciones = async (): Promise<AutoevaluacionDetalleResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_AUTOEVALUACIONES;
  }
  const response = await api.get('/api/v1/m5/self-assessment');
  return response.data;
};

// POST /self-assessment  — status 201
export const createAutoevaluacion = async (
  data: AutoevaluacionCreate
): Promise<AutoevaluacionResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      id: `auto-${Date.now()}`,
      pregunta_id: data.pregunta_id,
      respuesta_texto: data.respuesta_texto ?? null,
      respuesta_booleana: data.respuesta_booleana ?? null,
      respuesta_numerica: data.respuesta_numerica ?? null,
      opcion_id: data.opcion_id ?? null,
      created_at: new Date().toISOString(),
    };
  }
  const response = await api.post('/api/v1/m5/self-assessment', data);
  return response.data;
};