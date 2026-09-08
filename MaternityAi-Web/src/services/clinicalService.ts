import api, { USE_MOCKS } from './api';

// ---------------------------------------------------------------------------
// Interfaces — alineadas 1:1 con schemas.py del módulo clinical
// ---------------------------------------------------------------------------

// ---- Dashboard y Contexto ----

export interface ModuloInfo {
  modulo_id: number;
  codigo: string;
  nombre: string;
  semana_gestacion_actual: number;
  descripcion: string | null;
}

export interface DashboardResponse {
  modulo_activo: ModuloInfo;
  semana_gestacion: number;
  dias_gestacion: number;
  fecha_probable_parto: string | null;   // date ISO
  controles_realizados: number;
  alertas_activas: number;
}

export interface SignoAlarmaResponse {
  pregunta_id: number;
  texto: string;
  tipo_respuesta: string;
  frecuencia: string | null;
}

export interface RecomendacionResponse {
  modulo: string;
  semana_gestacion: number;
  recomendaciones: string[];
}

// ---- Síntomas ----

export interface SintomaCreate {
  descripcion: string;
  severidad?: 'Leve' | 'Moderado' | 'Severo' | 'leve' | 'moderado' | 'severo' | null;
}

export interface SintomaResponse {
  id: string;
  descripcion: string;
  severidad: string | null;
  modulo_origen: string | null;
  fecha_reporte: string;                 // datetime ISO
  created_at: string | null;
}

// ---- Signos Vitales ----

export interface SignosVitalesCreate {
  control_prenatal_id: string;
  peso_kg: number;
  talla_cm?: number | null;
  altura_uterina?: number | null;
  presion_sistolica?: number | null;
  presion_diastolica?: number | null;
  fcf?: number | null;
  estado_nutricional_id?: number | null;
}

export interface SignosVitalesResponse {
  id: string;
  control_prenatal_id: string;
  fecha_control: string | null;          // date ISO
  peso_kg: number;
  talla_cm: number | null;
  imc: number | null;
  estado_nutricional_id: number | null;
  altura_uterina: number | null;
  presion_sistolica: number | null;
  presion_diastolica: number | null;
  fcf: number | null;
  created_at: string | null;
}

// ---- Clasificación de Riesgo ----

export interface ClasificacionRiesgoResponse {
  id: string;
  tipo_riesgo: string;
  nivel: string;                         // "verde" | "amarillo" | "rojo"
  clasificacion_ia: string | null;
  diagnostico_texto: string | null;
  situaciones_biosicosocial: string | null;
  explicacion_ia: string | null;
  fecha_evaluacion: string;             // datetime ISO
  created_at: string | null;
}

// ---- Exámenes de Laboratorio ----

export interface ExamenCreate {
  gestante_id: string;
  tipo_examen_id: number;
  fecha_toma: string;                    // date ISO
  resultado: string;
  resultado_numerico?: number | null;
  unidad?: string | null;
  semana_gestacion?: number | null;
  observaciones?: string | null;
  control_prenatal_id?: string | null;
}

export interface ExamenResponse {
  id: string;
  tipo_examen_id: number;
  tipo_examen_nombre: string | null;
  fecha_toma: string;                    // date ISO
  resultado: string;
  resultado_numerico: number | null;
  unidad: string | null;
  trimestre: number | null;
  semana_gestacion: number | null;
  observaciones: string | null;
  created_at: string | null;
}

// ---- Ecografías ----

export interface EcografiaCreate {
  gestante_id: string;
  tipo_ecografia_id?: number | null;
  fecha: string;                         // date ISO
  semana_gestacion?: number | null;
  resultado?: string | null;
  plan_manejo?: string | null;
}

export interface EcografiaResponse {
  id: string;
  tipo_ecografia_id: number | null;
  tipo_ecografia_nombre: string | null;
  fecha: string;                         // date ISO
  semana_gestacion: number | null;
  resultado: string | null;
  plan_manejo: string | null;
  created_at: string | null;
}

// ---- Vacunación ----

export interface VacunacionCreate {
  gestante_id: string;
  vacuna_id: number;
  dosis: string;
  fecha_aplicacion: string;             // date ISO
}

export interface VacunacionResponse {
  id: string;
  vacuna_id: number;
  vacuna_nombre: string | null;
  dosis: string;
  fecha_aplicacion: string;             // date ISO
  created_at: string | null;
}

// ---- Micronutrientes ----

export interface MicronutrienteCreate {
  gestante_id: string;
  micronutriente_id: number;
  suministrado: boolean;
  fecha_inicio?: string | null;         // date ISO
}

export interface MicronutrienteResponse {
  id: string;
  micronutriente_id: number;
  micronutriente_nombre: string | null;
  suministrado: boolean;
  fecha_inicio: string | null;          // date ISO
  created_at: string | null;
}

// ---- Remisiones Interdisciplinarias ----

export interface RemisionCreate {
  gestante_id: string;
  especialidad_id: number;
  fecha_remision: string;               // date ISO
  semana_gestacion?: number | null;
}

export interface RemisionUpdate {
  fecha_atencion: string;               // date ISO
}

export interface RemisionResponse {
  id: string;
  especialidad_id: number;
  especialidad_nombre: string | null;
  fecha_remision: string;               // date ISO
  fecha_atencion: string | null;
  semana_gestacion: number | null;
  created_at: string | null;
}

// ---- Controles Prenatales ----

export interface ControlPrenatalCreate {
  gestante_id: string;
  numero_control: number;
  fecha_control: string;                // date ISO
  semana_gestacion: number;
  ips_id?: number | null;
  tipo_profesional_id?: number | null;
  tipo_consulta?: string | null;
  observaciones?: string | null;
}

export interface ControlPrenatalResponse {
  id: string;
  numero_control: number;
  fecha_control: string;                // date ISO
  semana_gestacion: number;
  trimestre: number | null;
  ips_id: number | null;
  tipo_profesional_id: number | null;
  tipo_consulta: string | null;
  observaciones: string | null;
  created_at: string | null;
}

export interface AdherenciaResponse {
  controles_realizados: number;
  controles_esperados: number;
  porcentaje_adherencia: number;
  semana_gestacion_actual: number;
}

// ---- Preguntas de Seguimiento ----

export interface OpcionPreguntaResponse {
  id: number;
  texto_opcion: string;
  valor_numerico: number | null;
  es_alarma: boolean;
}

export interface PreguntaSegResponse {
  id: number;
  texto_pregunta: string;
  tipo_respuesta: string;
  es_signo_alarma: boolean;
  frecuencia: string | null;
  orden: number | null;
  opciones: OpcionPreguntaResponse[];
}

export interface RespuestaItem {
  pregunta_id: number;
  respuesta_texto?: string | null;
  respuesta_booleana?: boolean | null;
  respuesta_numerica?: number | null;
  opcion_id?: number | null;
}

export interface RespuestasRequest {
  respuestas: RespuestaItem[];
  semana_gestacion?: number | null;
}

export interface RespuestaResponse {
  id: string;
  pregunta_id: number;
  respuesta_texto: string | null;
  respuesta_booleana: boolean | null;
  respuesta_numerica: number | null;
  opcion_id: number | null;
  semana_gestacion: number | null;
  alerta_id: string | null;
  created_at: string | null;
}

// ---- Movimientos Fetales ----

export interface MovimientoFetalCreate {
  conteo: number;
  duracion_minutos?: number | null;
  observaciones?: string | null;
}

export interface MovimientoFetalResponse {
  id: string;
  conteo: number;
  duracion_minutos: number | null;
  observaciones: string | null;
  fecha_reporte: string;                // datetime ISO
}

// ---- Plan de Parto ----

export interface BirthPlanResponse {
  semana_gestacion: number;
  fecha_probable_parto: string | null;  // date ISO
  recomendaciones: string[];
}

// ---- IPS más cercana ----

export interface IpsCercanaResponse {
  id: number;
  nombre: string;
  nivel: number | null;
  mensaje: string;
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDelay = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms));

const MOCK_HISTORY: RespuestaResponse[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    pregunta_id: 1,
    respuesta_texto: 'La paciente reporta náuseas ocasionales.',
    respuesta_booleana: null,
    respuesta_numerica: null,
    opcion_id: null,
    semana_gestacion: 12,
    alerta_id: null,
    created_at: '2026-06-08T10:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    pregunta_id: 2,
    respuesta_texto: null,
    respuesta_booleana: true,
    respuesta_numerica: null,
    opcion_id: null,
    semana_gestacion: 24,
    alerta_id: 'alerta-001',
    created_at: '2026-06-08T10:05:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    pregunta_id: 3,
    respuesta_texto: null,
    respuesta_booleana: null,
    respuesta_numerica: 68,
    opcion_id: 5,
    semana_gestacion: 32,
    alerta_id: null,
    created_at: '2026-06-08T10:10:00Z',
  },
]

const MOCK_DASHBOARD: DashboardResponse = {
  modulo_activo: {
    modulo_id: 2,
    codigo: "M1",
    nombre: "Primer Trimestre",
    semana_gestacion_actual: 12,
    descripcion: "Módulo de seguimiento del primer trimestre",
  },
  semana_gestacion: 12,
  dias_gestacion: 3,
  fecha_probable_parto: "2024-11-22",
  controles_realizados: 2,
  alertas_activas: 0,
};

const MOCK_ALARM_SIGNS: SignoAlarmaResponse[] = [
  { pregunta_id: 1, texto: "¿Tiene sangrado vaginal?", tipo_respuesta: "booleana", frecuencia: "diaria" },
  { pregunta_id: 2, texto: "¿Tiene dolor de cabeza intenso?", tipo_respuesta: "booleana", frecuencia: "diaria" },
  { pregunta_id: 3, texto: "¿Presenta visión borrosa o puntos negros?", tipo_respuesta: "booleana", frecuencia: "diaria" },
];

const MOCK_RECOMMENDATIONS: RecomendacionResponse = {
  modulo: "M1",
  semana_gestacion: 12,
  recomendaciones: [
    "Tome ácido fólico diariamente",
    "Asista a su próximo control prenatal",
    "Evite el consumo de alcohol y tabaco",
    "Realice actividad física moderada",
  ],
};

const MOCK_SYMPTOMS: SintomaResponse[] = [
  {
    id: "sint-001",
    descripcion: "Náuseas matutinas",
    severidad: "leve",
    modulo_origen: "M1",
    fecha_reporte: "2024-03-10T08:00:00",
    created_at: "2024-03-10T08:00:00",
  },
];

const MOCK_VITALS: SignosVitalesResponse[] = [
  {
    id: "vit-001",
    control_prenatal_id: "cp-001",
    fecha_control: "2024-03-01",
    peso_kg: 62.5,
    talla_cm: 160,
    imc: 24.4,
    estado_nutricional_id: 1,
    altura_uterina: 12,
    presion_sistolica: 110,
    presion_diastolica: 70,
    fcf: 148,
    created_at: "2024-03-01T09:00:00",
  },
];

const MOCK_RISK_ASSESSMENT: ClasificacionRiesgoResponse = {
  id: "riesgo-001",
  tipo_riesgo: "Obstétrico",
  nivel: "verde",
  clasificacion_ia: "BAJO",
  diagnostico_texto: "Sin factores de riesgo significativos",
  situaciones_biosicosocial: null,
  explicacion_ia: "La gestante no presenta factores de riesgo identificados en esta evaluación.",
  fecha_evaluacion: "2024-03-01T09:00:00",
  created_at: "2024-03-01T09:00:00",
};

const MOCK_EXAMS: ExamenResponse[] = [
  {
    id: "exam-001",
    tipo_examen_id: 1,
    tipo_examen_nombre: "Hemograma",
    fecha_toma: "2024-03-01",
    resultado: "Normal",
    resultado_numerico: null,
    unidad: null,
    trimestre: 1,
    semana_gestacion: 10,
    observaciones: null,
    created_at: "2024-03-01T10:00:00",
  },
];

const MOCK_ECOGRAFIAS: EcografiaResponse[] = [
  {
    id: "eco-001",
    tipo_ecografia_id: 1,
    tipo_ecografia_nombre: "Obstétrica primer trimestre",
    fecha: "2024-03-05",
    semana_gestacion: 11,
    resultado: "Feto único, actividad cardiaca presente, NT 1.2mm",
    plan_manejo: null,
    created_at: "2024-03-05T11:00:00",
  },
];

const MOCK_VACUNACION: VacunacionResponse[] = [
  {
    id: "vac-001",
    vacuna_id: 1,
    vacuna_nombre: "Toxoide tetánico",
    dosis: "Primera dosis",
    fecha_aplicacion: "2024-03-01",
    created_at: "2024-03-01T09:30:00",
  },
];

const MOCK_MICRONUTRIENTES: MicronutrienteResponse[] = [
  {
    id: "micro-001",
    micronutriente_id: 1,
    micronutriente_nombre: "Ácido fólico",
    suministrado: true,
    fecha_inicio: "2024-03-01",
    created_at: "2024-03-01T09:30:00",
  },
  {
    id: "micro-002",
    micronutriente_id: 2,
    micronutriente_nombre: "Hierro",
    suministrado: true,
    fecha_inicio: "2024-03-01",
    created_at: "2024-03-01T09:30:00",
  },
];

const MOCK_REMISIONES: RemisionResponse[] = [
  {
    id: "rem-001",
    especialidad_id: 3,
    especialidad_nombre: "Nutrición",
    fecha_remision: "2024-03-01",
    fecha_atencion: null,
    semana_gestacion: 10,
    created_at: "2024-03-01T10:00:00",
  },
];

const MOCK_CONTROLES: ControlPrenatalResponse[] = [
  {
    id: "cp-001",
    numero_control: 1,
    fecha_control: "2024-03-01",
    semana_gestacion: 10,
    trimestre: 1,
    ips_id: 1,
    tipo_profesional_id: 1,
    tipo_consulta: "Primera vez",
    observaciones: "Control inicial sin novedades",
    created_at: "2024-03-01T09:00:00",
  },
];

const MOCK_ADHERENCIA: AdherenciaResponse = {
  controles_realizados: 2,
  controles_esperados: 5,
  porcentaje_adherencia: 40,
  semana_gestacion_actual: 12,
};

const MOCK_DAILY_QUESTIONS: PreguntaSegResponse[] = [
  {
    id: 1,
    texto_pregunta: "¿Cómo se siente hoy en general?",
    tipo_respuesta: "opcion_multiple",
    es_signo_alarma: false,
    frecuencia: "diaria",
    orden: 1,
    opciones: [
      { id: 1, texto_opcion: "Muy bien", valor_numerico: 4, es_alarma: false },
      { id: 2, texto_opcion: "Bien", valor_numerico: 3, es_alarma: false },
      { id: 3, texto_opcion: "Regular", valor_numerico: 2, es_alarma: false },
      { id: 4, texto_opcion: "Mal", valor_numerico: 1, es_alarma: true },
    ],
  },
  {
    id: 2,
    texto_pregunta: "¿Ha presentado sangrado vaginal?",
    tipo_respuesta: "booleana",
    es_signo_alarma: true,
    frecuencia: "diaria",
    orden: 2,
    opciones: [],
  },
];

const MOCK_MOVIMIENTOS: MovimientoFetalResponse[] = [
  {
    id: "mov-001",
    conteo: 12,
    duracion_minutos: 60,
    observaciones: null,
    fecha_reporte: "2024-03-10T20:00:00",
  },
];

const MOCK_BIRTH_PLAN: BirthPlanResponse = {
  semana_gestacion: 12,
  fecha_probable_parto: "2024-11-22",
  recomendaciones: [
    "Identifique la IPS más cercana para su atención del parto",
    "Tenga a mano los documentos de identidad y carné de controles",
    "Prepare un plan de transporte para la fecha probable de parto",
  ],
};

const MOCK_IPS: IpsCercanaResponse = {
  id: 1,
  nombre: "Hospital Local de Soledad",
  nivel: 2,
  mensaje: "IPS disponible para su atención",
};

// ---------------------------------------------------------------------------
// Service Methods
// ---------------------------------------------------------------------------

// ---- 4.1 Dashboard y Contexto ----

// GET /dashboard?module_id={id}
export const getDashboard = async (module_id?: number): Promise<DashboardResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_DASHBOARD;
  }
  const params = module_id !== undefined ? { module_id } : {};
  const response = await api.get('/api/v1/clinical/dashboard', { params });
  return response.data;
};

// GET /alarm-signs?module_id={id}
export const getAlarmSigns = async (module_id?: number): Promise<SignoAlarmaResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_ALARM_SIGNS;
  }
  const params = module_id !== undefined ? { module_id } : {};
  const response = await api.get('/api/v1/clinical/alarm-signs', { params });
  return response.data;
};

// GET /recommendations
export const getRecommendations = async (): Promise<RecomendacionResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_RECOMMENDATIONS;
  }
  const response = await api.get('/api/v1/clinical/recommendations');
  return response.data;
};

// ---- 4.2 Síntomas ----

// POST /symptoms  — status 201
export const reportSymptom = async (data: SintomaCreate): Promise<SintomaResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      id: `sint-${Date.now()}`,
      descripcion: data.descripcion,
      severidad: data.severidad ?? null,
      modulo_origen: MOCK_DASHBOARD.modulo_activo.codigo,
      fecha_reporte: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
  }
  const response = await api.post('/api/v1/clinical/symptoms', data);
  return response.data;
};

// GET /symptoms
export const getSymptoms = async (): Promise<SintomaResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_SYMPTOMS;
  }
  const response = await api.get('/api/v1/clinical/symptoms');
  return response.data;
};

// ---- 4.3 Signos Vitales ----

// POST /vitals  — status 201 (solo staff)
export const registerVitals = async (data: SignosVitalesCreate): Promise<SignosVitalesResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      id: `vit-${Date.now()}`,
      control_prenatal_id: data.control_prenatal_id,
      fecha_control: new Date().toISOString().split('T')[0],
      peso_kg: data.peso_kg,
      talla_cm: data.talla_cm ?? null,
      imc: data.talla_cm ? parseFloat((data.peso_kg / Math.pow(data.talla_cm / 100, 2)).toFixed(1)) : null,
      estado_nutricional_id: data.estado_nutricional_id ?? null,
      altura_uterina: data.altura_uterina ?? null,
      presion_sistolica: data.presion_sistolica ?? null,
      presion_diastolica: data.presion_diastolica ?? null,
      fcf: data.fcf ?? null,
      created_at: new Date().toISOString(),
    };
  }
  const response = await api.post('/api/v1/clinical/vitals', data);
  return response.data;
};

// GET /vitals
export const getVitals = async (): Promise<SignosVitalesResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_VITALS;
  }
  const response = await api.get('/api/v1/clinical/vitals');
  return response.data;
};

// ---- 4.4 Clasificación de Riesgo ----

// GET /risk-assessment
export const getRiskAssessment = async (): Promise<ClasificacionRiesgoResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_RISK_ASSESSMENT;
  }
  const response = await api.get('/api/v1/clinical/risk-assessment');
  return response.data;
};

// GET /risk-assessment/history
export const getRiskHistory = async (): Promise<ClasificacionRiesgoResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return [MOCK_RISK_ASSESSMENT];
  }
  const response = await api.get('/api/v1/clinical/risk-assessment/history');
  return response.data;
};

// ---- 4.5 Exámenes de Laboratorio ----

// POST /exams  — status 201 (solo staff)
export const registerExam = async (data: ExamenCreate): Promise<ExamenResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      id: `exam-${Date.now()}`,
      tipo_examen_id: data.tipo_examen_id,
      tipo_examen_nombre: null,
      fecha_toma: data.fecha_toma,
      resultado: data.resultado,
      resultado_numerico: data.resultado_numerico ?? null,
      unidad: data.unidad ?? null,
      trimestre: null,
      semana_gestacion: data.semana_gestacion ?? null,
      observaciones: data.observaciones ?? null,
      created_at: new Date().toISOString(),
    };
  }
  const response = await api.post('/api/v1/clinical/exams', data);
  return response.data;
};

// GET /exams
export const getExams = async (): Promise<ExamenResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_EXAMS;
  }
  const response = await api.get('/api/v1/clinical/exams');
  return response.data;
};

// GET /exams/{exam_id}
export const getExamById = async (exam_id: string): Promise<ExamenResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_EXAMS[0];
  }
  const response = await api.get(`/api/v1/clinical/exams/${exam_id}`);
  return response.data;
};

// ---- 4.6 Ecografías ----

// POST /ecography  — status 201 (solo staff)
export const registerEcography = async (data: EcografiaCreate): Promise<EcografiaResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      id: `eco-${Date.now()}`,
      tipo_ecografia_id: data.tipo_ecografia_id ?? null,
      tipo_ecografia_nombre: null,
      fecha: data.fecha,
      semana_gestacion: data.semana_gestacion ?? null,
      resultado: data.resultado ?? null,
      plan_manejo: data.plan_manejo ?? null,
      created_at: new Date().toISOString(),
    };
  }
  const response = await api.post('/api/v1/clinical/ecography', data);
  return response.data;
};

// GET /ecography
export const getEcography = async (): Promise<EcografiaResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_ECOGRAFIAS;
  }
  const response = await api.get('/api/v1/clinical/ecography');
  return response.data;
};

// GET /ecography/{ecography_id}
export const getEcographyById = async (ecography_id: string): Promise<EcografiaResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_ECOGRAFIAS[0];
  }
  const response = await api.get(`/api/v1/clinical/ecography/${ecography_id}`);
  return response.data;
};

// ---- 4.7 Vacunación ----

// POST /vaccination  — status 201 (solo staff)
export const registerVaccination = async (data: VacunacionCreate): Promise<VacunacionResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      id: `vac-${Date.now()}`,
      vacuna_id: data.vacuna_id,
      vacuna_nombre: null,
      dosis: data.dosis,
      fecha_aplicacion: data.fecha_aplicacion,
      created_at: new Date().toISOString(),
    };
  }
  const response = await api.post('/api/v1/clinical/vaccination', data);
  return response.data;
};

// GET /vaccination
export const getVaccination = async (): Promise<VacunacionResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_VACUNACION;
  }
  const response = await api.get('/api/v1/clinical/vaccination');
  return response.data;
};

// ---- 4.8 Micronutrientes ----

// POST /micronutrients  — status 201 (solo staff)
export const registerMicronutrient = async (data: MicronutrienteCreate): Promise<MicronutrienteResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      id: `micro-${Date.now()}`,
      micronutriente_id: data.micronutriente_id,
      micronutriente_nombre: null,
      suministrado: data.suministrado,
      fecha_inicio: data.fecha_inicio ?? null,
      created_at: new Date().toISOString(),
    };
  }
  const response = await api.post('/api/v1/clinical/micronutrients', data);
  return response.data;
};

// GET /micronutrients
export const getMicronutrients = async (): Promise<MicronutrienteResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_MICRONUTRIENTES;
  }
  const response = await api.get('/api/v1/clinical/micronutrients');
  return response.data;
};

// ---- 4.9 Remisiones Interdisciplinarias ----

// POST /referral-interdisciplinary  — status 201 (solo staff)
export const registerReferral = async (data: RemisionCreate): Promise<RemisionResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      id: `rem-${Date.now()}`,
      especialidad_id: data.especialidad_id,
      especialidad_nombre: null,
      fecha_remision: data.fecha_remision,
      fecha_atencion: null,
      semana_gestacion: data.semana_gestacion ?? null,
      created_at: new Date().toISOString(),
    };
  }
  const response = await api.post('/api/v1/clinical/referral-interdisciplinary', data);
  return response.data;
};

// GET /referral-interdisciplinary
export const getReferrals = async (): Promise<RemisionResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_REMISIONES;
  }
  const response = await api.get('/api/v1/clinical/referral-interdisciplinary');
  return response.data;
};

// PATCH /referral-interdisciplinary/{referral_id}  (solo staff)
export const updateReferral = async (
  referral_id: string,
  data: RemisionUpdate
): Promise<RemisionResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return { ...MOCK_REMISIONES[0], fecha_atencion: data.fecha_atencion, id: referral_id };
  }
  const response = await api.patch(`/api/v1/clinical/referral-interdisciplinary/${referral_id}`, data);
  return response.data;
};

// ---- 4.10 Controles Prenatales ----

// POST /prenatal-control  — status 201 (solo staff)
export const registerPrenatalControl = async (data: ControlPrenatalCreate): Promise<ControlPrenatalResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      id: `cp-${Date.now()}`,
      numero_control: data.numero_control,
      fecha_control: data.fecha_control,
      semana_gestacion: data.semana_gestacion,
      trimestre: Math.ceil(data.semana_gestacion / 13),
      ips_id: data.ips_id ?? null,
      tipo_profesional_id: data.tipo_profesional_id ?? null,
      tipo_consulta: data.tipo_consulta ?? null,
      observaciones: data.observaciones ?? null,
      created_at: new Date().toISOString(),
    };
  }
  const response = await api.post('/api/v1/clinical/prenatal-control', data);
  return response.data;
};

// GET /prenatal-control
export const getPrenatalControls = async (): Promise<ControlPrenatalResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_CONTROLES;
  }
  const response = await api.get('/api/v1/clinical/prenatal-control');
  return response.data;
};

// GET /prenatal-control/{control_id}
export const getPrenatalControlById = async (control_id: string): Promise<ControlPrenatalResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_CONTROLES[0];
  }
  const response = await api.get(`/api/v1/clinical/prenatal-control/${control_id}`);
  return response.data;
};

// GET /prenatal-adherence
export const getPrenatalAdherence = async (): Promise<AdherenciaResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_ADHERENCIA;
  }
  const response = await api.get('/api/v1/clinical/prenatal-adherence');
  return response.data;
};

// ---- 4.11 Preguntas de Seguimiento ----

// GET /daily-questions?module_id={id}
export const getDailyQuestions = async (module_id?: number): Promise<PreguntaSegResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_DAILY_QUESTIONS;
  }
  const params = module_id !== undefined ? { module_id } : {};
  const response = await api.get('/api/v1/clinical/daily-questions', { params });
  return response.data;
};

// POST /daily-questions/respond  — status 201
export const submitDailyAnswers = async (data: RespuestasRequest): Promise<RespuestaResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return data.respuestas.map(r => ({
      id: `resp-${Date.now()}-${r.pregunta_id}`,
      pregunta_id: r.pregunta_id,
      respuesta_texto: r.respuesta_texto ?? null,
      respuesta_booleana: r.respuesta_booleana ?? null,
      respuesta_numerica: r.respuesta_numerica ?? null,
      opcion_id: r.opcion_id ?? null,
      semana_gestacion: data.semana_gestacion ?? null,
      alerta_id: null,
      created_at: new Date().toISOString(),
    }));
  }
  const response = await api.post('/api/v1/clinical/daily-questions/respond', data);
  return response.data;
};

// GET /daily-questions/history
export const getDailyQuestionsHistory = async (): Promise<RespuestaResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_HISTORY;
  }
  const response = await api.get('/api/v1/clinical/daily-questions/history');
  return response.data;
};

// ---- 4.12 Movimientos Fetales ----

// POST /fetal-movement  — status 201
export const registerFetalMovement = async (data: MovimientoFetalCreate): Promise<MovimientoFetalResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      id: `mov-${Date.now()}`,
      conteo: data.conteo,
      duracion_minutos: data.duracion_minutos ?? null,
      observaciones: data.observaciones ?? null,
      fecha_reporte: new Date().toISOString(),
    };
  }
  const response = await api.post('/api/v1/clinical/fetal-movement', data);
  return response.data;
};

// GET /fetal-movement
export const getFetalMovements = async (): Promise<MovimientoFetalResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_MOVIMIENTOS;
  }
  const response = await api.get('/api/v1/clinical/fetal-movement');
  return response.data;
};

// ---- 4.13 Plan de Parto y Geolocalización ----

// GET /birth-plan
export const getBirthPlan = async (): Promise<BirthPlanResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_BIRTH_PLAN;
  }
  const response = await api.get('/api/v1/clinical/birth-plan');
  return response.data;
};

// GET /nearest-ips
export const getNearestIps = async (): Promise<IpsCercanaResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_IPS;
  }
  const response = await api.get('/api/v1/clinical/nearest-ips');
  return response.data;
};

// ---- 4.14 Vistas Longitudinales ----
// Nota: estos endpoints son espejados del router — apuntan a rutas distintas
// pero comparten el mismo tipo de respuesta que sus contrapartes normales.

// GET /history/exams
export const getExamsHistory = async (): Promise<ExamenResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_EXAMS;
  }
  const response = await api.get('/api/v1/clinical/history/exams');
  return response.data;
};

// GET /history/vitals
export const getVitalsHistory = async (): Promise<SignosVitalesResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_VITALS;
  }
  const response = await api.get('/api/v1/clinical/history/vitals');
  return response.data;
};

// GET /history/risks
export const getRisksHistory = async (): Promise<ClasificacionRiesgoResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return [MOCK_RISK_ASSESSMENT];
  }
  const response = await api.get('/api/v1/clinical/history/risks');
  return response.data;
};

// GET /history/controls
export const getControlsHistory = async (): Promise<ControlPrenatalResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_CONTROLES;
  }
  const response = await api.get('/api/v1/clinical/history/controls');
  return response.data;
};

// GET /history/daily-questions
export const getDailyQuestionsHistoryLongitudinal = async (): Promise<RespuestaResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return [];
  }
  const response = await api.get('/api/v1/clinical/history/daily-questions');
  return response.data;
};