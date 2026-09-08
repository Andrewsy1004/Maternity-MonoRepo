import api from './api';

// ─── Catálogos ───────────────────────────────────────────────────────────────

export interface CatalogoItem {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  semana_eg_inicio?: number | null;
  semana_eg_fin?: number | null;
}

export interface Catalogos {
  nacionalidades: CatalogoItem[];
  eapbs: CatalogoItem[];
  pertenencias_etnicas: CatalogoItem[];
  grupos_poblacionales: CatalogoItem[];
}

export const getCatalogos = async (): Promise<Catalogos> => {
  const [nac, eapb, etnica, grupo] = await Promise.all([
    api.get<CatalogoItem[]>('/api/v1/admin/catalogs/nacionalidad', { params: { size: 100 } }),
    api.get<CatalogoItem[]>('/api/v1/admin/catalogs/eapb', { params: { size: 100 } }),
    api.get<CatalogoItem[]>('/api/v1/admin/catalogs/pertenencia-etnica', { params: { size: 100 } }),
    api.get<CatalogoItem[]>('/api/v1/admin/catalogs/grupo-poblacional', { params: { size: 100 } }),
  ]);
  return {
    nacionalidades:       nac.data,
    eapbs:                eapb.data,
    pertenencias_etnicas: etnica.data,
    grupos_poblacionales: grupo.data,
  };
};

// Obtener módulos clínicos con sus IDs REALES de la BD (para el formulario del OVA)
export const getModulosClinicos = async (): Promise<CatalogoItem[]> => {
  const response = await api.get<CatalogoItem[]>('/api/v1/admin/catalogs/modulo-clinico', {
    params: { size: 20 },
  });
  return response.data;
};


export interface CargaDetalleResponse {
  fila_numero: number;
  hoja: string;
  estado: string;
  mensaje_error: string | null;
}

export interface CargaExcelResponse {
  id: string;
  archivo_nombre: string;
  estado: string;
  total_gestantes: number | null;
  nuevas: number | null;
  actualizadas: number | null;
  errores: number | null;
  created_at: string | null;
}

export interface CargaExcelDetalleResponse extends CargaExcelResponse {
  detalles: CargaDetalleResponse[];
}

// ─── Staff User ──────────────────────────────────────────────────────────────

export interface StaffUserCreate {
  email: string;
  nombre: string;
  rol_id: number;
  password: string;
}

export interface StaffUserUpdate {
  nombre: string;
  rol_id: number;
}

export interface StaffUserResponse {
  id: string;
  email: string;
  nombre: string;
  rol_id: string;
  activo: boolean;
  created_at: string | null;
}

export interface StaffListParams {
  page?: number;
  size?: number;
  sort?: string;
}

export interface RoleOption {
  id: number;
  nombre: string;
}

export const getRoles = async (): Promise<RoleOption[]> => {
  const response = await api.get<RoleOption[]>('/api/v1/admin/roles');
  return response.data;
};

export const getStaffUsers = async (
  params: StaffListParams = {}
): Promise<StaffUserResponse[]> => {
  const response = await api.get<StaffUserResponse[]>('/api/v1/admin/users', {
    params: { page: 1, size: 20, sort: 'fecha_desc', ...params },
  });
  return response.data;
};

export const createStaffUser = async (
  data: StaffUserCreate
): Promise<StaffUserResponse> => {
  const response = await api.post<StaffUserResponse>('/api/v1/admin/users', data);
  return response.data;
};

export const updateStaffUser = async (
  userId: string,
  data: StaffUserUpdate
): Promise<StaffUserResponse> => {
  const response = await api.put<StaffUserResponse>(
    `/api/v1/admin/users/${userId}`,
    data
  );
  return response.data;
};

export const updateStaffStatus = async (
  userId: string,
  activo: boolean
): Promise<StaffUserResponse> => {
  const response = await api.patch<StaffUserResponse>(
    `/api/v1/admin/users/${userId}/status`,
    { activo }
  );
  return response.data;
};

// ─── Gestantes ───────────────────────────────────────────────────────────────

export interface GestanteResponse {
  id: string;
  codigo_gmi: string;
  fecha_nacimiento?: string | null;
  fecha_ultima_menstruacion?: string | null;
  fecha_probable_parto?: string | null;
  semanas_eg_ingreso?: number | null;
  modulo_activo_id?: number | null;
  activa: boolean;
  anio_ingreso?: number | null;
  created_at: string | null;
  ultimo_acceso?: string | null;
  ultima_pregunta_respondida?: string | null;
  ultima_respuesta_fecha?: string | null;
  ultimo_estado_alerta?: string | null;
  ultima_prioridad_alerta_id?: number | null;
  nivel_riesgo?: string | null;
  clasificacion_ia?: string | null;
  // Campos adicionales retornados por el backend
  ips_atencion?: string | null;
  diagnostico_ingreso?: string | null;
}

export const getGestantes = async (
  params: { page?: number; size?: number; sort?: string } = {}
): Promise<GestanteResponse[]> => {
  const response = await api.get<GestanteResponse[]>('/api/v1/admin/gestantes', {
    params: { page: 1, size: 100, sort: 'fecha_desc', ...params },
  });
  return response.data;
};

// ─── Cargas ──────────────────────────────────────────────────────────────────

export const uploadExcel = async (file: File): Promise<CargaExcelResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<CargaExcelResponse>(
    '/api/v1/admin/upload/gestantes',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

export const getHistorialCargas = async (): Promise<CargaExcelResponse[]> => {
  const response = await api.get('/api/v1/admin/upload/gestantes/history');
  return response.data;
};

export const getDetalleCarga = async (
  cargaId: string
): Promise<CargaExcelDetalleResponse> => {
  const response = await api.get<CargaExcelDetalleResponse>(
    `/api/v1/admin/upload/gestantes/${cargaId}/detail`
  );
  return response.data;
};

// ─── Catálogos CRUD ───────────────────────────────────────────────────────────

export interface CatalogItemCreate {
  codigo?: string;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
}

export interface CatalogItemUpdate {
  codigo?: string;
  nombre?: string;
  descripcion?: string | null;
}

export const getCatalogItems = async (
  catalogName: string,
  params: { page?: number; size?: number } = {}
): Promise<CatalogoItem[]> => {
  const response = await api.get<CatalogoItem[]>(
    `/api/v1/admin/catalogs/${catalogName}`,
    { params: { page: 1, size: 100, ...params } }
  );
  return response.data;
};

export const createCatalogItem = async (
  catalogName: string,
  data: CatalogItemCreate
): Promise<CatalogoItem> => {
  const response = await api.post<CatalogoItem>(
    `/api/v1/admin/catalogs/${catalogName}`,
    data
  );
  return response.data;
};

export const updateCatalogItem = async (
  catalogName: string,
  id: string | number,
  data: CatalogItemUpdate
): Promise<CatalogoItem> => {
  const response = await api.put<CatalogoItem>(
    `/api/v1/admin/catalogs/${catalogName}/${id}`,
    data
  );
  return response.data;
};

export const updateCatalogStatus = async (
  catalogName: string,
  id: string | number,
  activo: boolean
): Promise<CatalogoItem> => {
  const response = await api.patch<CatalogoItem>(
    `/api/v1/admin/catalogs/${catalogName}/${id}/status`,
    { activo }
  );
  return response.data;
};

// ─── Contenido Educativo y Categorías ────────────────────────────────────────

export interface EducationalCategoryCreate {
  nombre: string;
  descripcion?: string | null;
  icono?: string | null;
  orden?: number | null;
}

export interface EducationalCategoryUpdate {
  nombre?: string;
  descripcion?: string | null;
  icono?: string | null;
  orden?: number | null;
}

export interface EducationalCategoryResponse {
  id: number;
  nombre: string;
  descripcion?: string | null;
  icono?: string | null;
  orden?: number | null;
  activo: boolean;
}

export interface EducationalContentCreate {
  categoria_id?: number | null;
  titulo: string;
  descripcion?: string | null;
  tipo_contenido?: string | null; // e.g. 'VIDEO' o 'ARTICULO' or 'ARTÍCULO'
  cuerpo_texto?: string | null;
  url_recurso?: string | null;
  url_imagen?: string | null;
  modulo_id?: number | null;
  semana_eg_inicio?: number | null;
  semana_eg_fin?: number | null;
  duracion_minutos?: number | null;
  orden?: number | null;
}

export interface EducationalContentUpdate {
  categoria_id?: number | null;
  titulo?: string;
  descripcion?: string | null;
  tipo_contenido?: string | null;
  cuerpo_texto?: string | null;
  url_recurso?: string | null;
  url_imagen?: string | null;
  modulo_id?: number | null;
  semana_eg_inicio?: number | null;
  semana_eg_fin?: number | null;
  duracion_minutos?: number | null;
  orden?: number | null;
}

export interface EducationalContentResponse {
  id: number;
  categoria_id?: number | null;
  titulo: string;
  descripcion?: string | null;
  tipo_contenido?: string | null;
  cuerpo_texto?: string | null;
  url_recurso?: string | null;
  url_imagen?: string | null;
  modulo_id?: number | null;
  semana_eg_inicio?: number | null;
  semana_eg_fin?: number | null;
  duracion_minutos?: number | null;
  orden?: number | null;
  activo: boolean;
}

export const getEducationalCategories = async (
  params: { page?: number; size?: number; sort?: string } = {}
): Promise<EducationalCategoryResponse[]> => {
  const response = await api.get<EducationalCategoryResponse[]>('/api/v1/admin/educational-categories', {
    params: { page: 1, size: 100, sort: 'orden_asc', ...params },
  });
  return response.data;
};

export const createEducationalCategory = async (
  data: EducationalCategoryCreate
): Promise<EducationalCategoryResponse> => {
  const response = await api.post<EducationalCategoryResponse>('/api/v1/admin/educational-categories', data);
  return response.data;
};

export const updateEducationalCategory = async (
  id: number,
  data: EducationalCategoryUpdate
): Promise<EducationalCategoryResponse> => {
  const response = await api.put<EducationalCategoryResponse>(`/api/v1/admin/educational-categories/${id}`, data);
  return response.data;
};

export const getEducationalContents = async (
  params: { page?: number; size?: number; sort?: string } = {}
): Promise<EducationalContentResponse[]> => {
  const response = await api.get<EducationalContentResponse[]>('/api/v1/admin/educational-content', {
    params: { page: 1, size: 100, sort: 'orden_asc', ...params },
  });
  return response.data;
};

export const createEducationalContent = async (
  data: EducationalContentCreate
): Promise<EducationalContentResponse> => {
  const response = await api.post<EducationalContentResponse>('/api/v1/admin/educational-content', data);
  return response.data;
};

export const updateEducationalContent = async (
  id: number,
  data: EducationalContentUpdate
): Promise<EducationalContentResponse> => {
  const response = await api.put<EducationalContentResponse>(`/api/v1/admin/educational-content/${id}`, data);
  return response.data;
};

export const updateEducationalContentStatus = async (
  id: number,
  activo: boolean
): Promise<EducationalContentResponse> => {
  const response = await api.patch<EducationalContentResponse>(
    `/api/v1/admin/educational-content/${id}/status`,
    { activo }
  );
  return response.data;
};

// ─── Preguntas de Seguimiento ────────────────────────────────────────────────

export interface FollowUpQuestionCreate {
  texto_pregunta: string;
  tipo_respuesta: string;
  modulo_id?: number | null;
  frecuencia?: string | null;
  es_signo_alarma?: boolean;
  prioridad_alerta_default_id?: number | null;
  orden?: number | null;
}

export interface FollowUpQuestionUpdate {
  texto_pregunta?: string;
  tipo_respuesta?: string;
  modulo_id?: number | null;
  frecuencia?: string | null;
  es_signo_alarma?: boolean;
  prioridad_alerta_default_id?: number | null;
  orden?: number | null;
}

export interface FollowUpQuestionResponse {
  id: number;
  texto_pregunta: string;
  tipo_respuesta: string;
  modulo_id?: number | null;
  frecuencia?: string | null;
  es_signo_alarma: boolean;
  prioridad_alerta_default_id?: number | null;
  orden?: number | null;
  activo: boolean;
}

export const getFollowUpQuestions = async (
  params: { page?: number; size?: number; sort?: string } = {}
): Promise<FollowUpQuestionResponse[]> => {
  const response = await api.get<FollowUpQuestionResponse[]>('/api/v1/admin/follow-up-questions', {
    params: { page: 1, size: 100, sort: 'fecha_desc', ...params },
  });
  return response.data;
};

export const createFollowUpQuestion = async (
  data: FollowUpQuestionCreate
): Promise<FollowUpQuestionResponse> => {
  const response = await api.post<FollowUpQuestionResponse>('/api/v1/admin/follow-up-questions', data);
  return response.data;
};

export const updateFollowUpQuestion = async (
  id: number,
  data: FollowUpQuestionUpdate
): Promise<FollowUpQuestionResponse> => {
  const response = await api.put<FollowUpQuestionResponse>(`/api/v1/admin/follow-up-questions/${id}`, data);
  return response.data;
};

export const updateFollowUpQuestionStatus = async (
  id: number,
  activo: boolean
): Promise<FollowUpQuestionResponse> => {
  const response = await api.patch<FollowUpQuestionResponse>(
    `/api/v1/admin/follow-up-questions/${id}/status`,
    { activo }
  );
  return response.data;
};

// ─── Citas Médicas (Agendamiento) ─────────────────────────────────────────────

export interface CitaAdminResponse {
  id: string;
  gestante_id: string;
  codigo_gmi: string;
  ips_id?: number | null;
  ips_nombre?: string | null;
  fecha_hora: string;
  tipo_cita?: string | null;
  estado: string;
  created_at?: string | null;
}

export interface CitaAdminCreate {
  gestante_id: string;
  ips_id?: number | null;
  fecha_hora: string;
  tipo_cita?: string | null;
}

export interface CitaAdminUpdate {
  fecha_hora: string;
}

export const getAppointments = async (
  params: { from?: string; to?: string; gestante_id?: string } = {}
): Promise<CitaAdminResponse[]> => {
  const response = await api.get<CitaAdminResponse[]>('/api/v1/admin/appointments', { params });
  return response.data;
};

export const createAppointment = async (
  data: CitaAdminCreate
): Promise<CitaAdminResponse> => {
  const response = await api.post<CitaAdminResponse>('/api/v1/admin/appointments', data);
  return response.data;
};

export const reprogramarAppointment = async (
  id: string,
  data: CitaAdminUpdate
): Promise<CitaAdminResponse> => {
  const response = await api.patch<CitaAdminResponse>(`/api/v1/admin/appointments/${id}`, data);
  return response.data;
};

export const confirmarAppointment = async (id: string): Promise<CitaAdminResponse> => {
  const response = await api.post<CitaAdminResponse>(`/api/v1/admin/appointments/${id}/confirm`);
  return response.data;
};

export const cancelarAppointment = async (id: string): Promise<CitaAdminResponse> => {
  const response = await api.post<CitaAdminResponse>(`/api/v1/admin/appointments/${id}/cancel`);
  return response.data;
};

// ─── Panel Médico (detalle de gestante) ───────────────────────────────────────

export interface SignosVitalesResponse {
  id: string;
  control_prenatal_id: string;
  fecha_control: string;
  peso_kg: number;
  talla_cm?: number | null;
  imc?: number | null;
  estado_nutricional_id?: number | null;
  altura_uterina?: number | null;
  presion_sistolica?: number | null;
  presion_diastolica?: number | null;
  fcf?: number | null;
  created_at?: string | null;
}

export interface ExamenResponse {
  id: string;
  tipo_examen_id: number;
  tipo_examen_nombre?: string | null;
  fecha_toma: string;
  resultado: string;
  resultado_numerico?: number | null;
  unidad?: string | null;
  trimestre?: number | null;
  semana_gestacion?: number | null;
  observaciones?: string | null;
  created_at?: string | null;
}

export interface AlertaAdminResponse {
  id: string;
  descripcion?: string | null;
  estado: string;
  modulo_origen?: string | null;
  tipo_alerta?: string | null;
  prioridad?: string | null;
  created_at?: string | null;
}

export interface RespuestaConPreguntaResponse {
  id: string;
  pregunta_id: number;
  pregunta_texto: string;
  tipo_respuesta: string;
  respuesta_texto?: string | null;
  respuesta_booleana?: boolean | null;
  respuesta_numerica?: number | null;
  opcion_id?: number | null;
  semana_gestacion?: number | null;
  alerta_id?: string | null;
  created_at?: string | null;
}

export interface LlamadaEmergenciaResponse {
  id: string;
  motivo?: string | null;
  destino?: string | null;
  duracion_seg?: number | null;
  resultado?: string | null;
  created_at?: string | null;
}

export interface LlamadaEmergenciaCreate {
  motivo?: string | null;
  destino?: string | null;
  resultado?: string | null;
}

export const getGestanteExams = async (gestanteId: string): Promise<ExamenResponse[]> => {
  const response = await api.get<ExamenResponse[]>(`/api/v1/admin/gestantes/${gestanteId}/exams`);
  return response.data;
};

export const getGestanteVitals = async (gestanteId: string): Promise<SignosVitalesResponse[]> => {
  const response = await api.get<SignosVitalesResponse[]>(`/api/v1/admin/gestantes/${gestanteId}/vitals`);
  return response.data;
};

export const getGestanteExamById = async (
  gestanteId: string,
  examId: string
): Promise<ExamenResponse> => {
  const response = await api.get<ExamenResponse>(
    `/api/v1/admin/gestantes/${gestanteId}/exams/${examId}`
  );
  return response.data;
};

export const createGestanteExam = async (
  gestanteId: string,
  data: any
): Promise<ExamenResponse> => {
  const response = await api.post<ExamenResponse>(
    `/api/v1/admin/gestantes/${gestanteId}/exams`,
    data
  );
  return response.data;
};

export const getGestanteAlarmSigns = async (gestanteId: string): Promise<AlertaAdminResponse[]> => {
  const response = await api.get<AlertaAdminResponse[]>(`/api/v1/admin/gestantes/${gestanteId}/alarm-signs`);
  return response.data;
};

export const getGestanteDailyQuestionsHistory = async (
  gestanteId: string
): Promise<RespuestaConPreguntaResponse[]> => {
  const response = await api.get<RespuestaConPreguntaResponse[]>(
    `/api/v1/admin/gestantes/${gestanteId}/daily-questions/history`
  );
  return response.data;
};

export const getGestanteEmergencyCallHistory = async (
  gestanteId: string
): Promise<LlamadaEmergenciaResponse[]> => {
  const response = await api.get<LlamadaEmergenciaResponse[]>(
    `/api/v1/admin/gestantes/${gestanteId}/emergency-call/history`
  );
  return response.data;
};

export const createGestanteEmergencyCall = async (
  gestanteId: string,
  data: LlamadaEmergenciaCreate
): Promise<LlamadaEmergenciaResponse> => {
  const response = await api.post<LlamadaEmergenciaResponse>(
    `/api/v1/admin/gestantes/${gestanteId}/emergency-call`,
    data
  );
  return response.data;
};

export const getGestanteAppointments = async (
  gestanteId: string
): Promise<CitaAdminResponse[]> => {
  const response = await api.get<CitaAdminResponse[]>(
    `/api/v1/admin/gestantes/${gestanteId}/appointments`
  );
  return response.data;
};

// ─── Exportación ─────────────────────────────────────────────────────────────

export const exportGestantes = async (format: 'xlsx' | 'csv' = 'xlsx'): Promise<Blob> => {
  const response = await api.get('/api/v1/admin/export/gestantes', {
    params: { format },
    responseType: 'blob',
  });
  return response.data;
};

export const exportIndicators = async (format: 'xlsx' | 'csv' = 'xlsx'): Promise<Blob> => {
  const response = await api.get('/api/v1/admin/export/indicators', {
    params: { format },
    responseType: 'blob',
  });
  return response.data;
};


// ─── IA (asistente clínico) ────────────────────────────────────────────────

export interface ClinicalSummaryResponse {
  codigo_gmi: string;
  semana_gestacion: number;
  modulo_activo: string;
  resumen_clinico: string;
  alertas_activas: number;
  puntos_clave: string[];
  sugerencias_clinico: string[];
}

export interface RiskSummaryResponse {
  assessment_id: string;
  nivel_riesgo: string;
  resumen: string;
  factores_riesgo: string[];
  recomendaciones: string[];
  explicacion_ia: string;
  semana_gestacion: number;
}

export interface IARecommendationResponse {
  semana_gestacion: number;
  modulo: string;
  recomendaciones: string[];
  mensaje_motivacional: string;
}

export const getClinicalSummary = async (codigoGmi: string): Promise<ClinicalSummaryResponse> => {
  const response = await api.get<ClinicalSummaryResponse>(`/api/v1/ia/clinical-summary/${codigoGmi}`);
  return response.data;
};

export const getRiskSummary = async (codigoGmi: string): Promise<RiskSummaryResponse> => {
  const response = await api.get<RiskSummaryResponse>('/api/v1/ia/risk-summary', {
    params: { codigo_gmi: codigoGmi },
  });
  return response.data;
};

export const getIARecommendations = async (codigoGmi: string): Promise<IARecommendationResponse> => {
  const response = await api.get<IARecommendationResponse>('/api/v1/ia/recommendations', {
    params: { codigo_gmi: codigoGmi },
  });
  return response.data;
};

// ─── Checklist Items (Gestión administrativa) ───────────────────────────────

export interface ChecklistItemResponse {
  id: number;
  texto: string;
  modulo_id: number | null;
  semana_eg: number | null;
  orden: number | null;
  activo: boolean;
}

export interface ChecklistItemCreate {
  texto: string;
  modulo_id?: number | null;
  semana_eg?: number | null;
  orden?: number | null;
}

export interface ChecklistItemUpdate {
  texto?: string;
  modulo_id?: number | null;
  semana_eg?: number | null;
  orden?: number | null;
}

export const getChecklistItems = async (): Promise<ChecklistItemResponse[]> => {
  const response = await api.get<ChecklistItemResponse[]>('/api/v1/admin/checklist-items', {
    params: { size: 100 },
  });
  return response.data;
};

export const createChecklistItem = async (
  data: ChecklistItemCreate
): Promise<ChecklistItemResponse> => {
  const response = await api.post<ChecklistItemResponse>('/api/v1/admin/checklist-items', data);
  return response.data;
};

export const updateChecklistItem = async (
  id: number,
  data: ChecklistItemUpdate
): Promise<ChecklistItemResponse> => {
  const response = await api.put<ChecklistItemResponse>(`/api/v1/admin/checklist-items/${id}`, data);
  return response.data;
};

export const updateChecklistItemStatus = async (
  id: number,
  activo: boolean
): Promise<ChecklistItemResponse> => {
  const response = await api.patch<ChecklistItemResponse>(`/api/v1/admin/checklist-items/${id}/status`, {
    activo,
  });
  return response.data;
};

export interface GestanteChecklistItem {
  id: number;
  texto: string;
  modulo_id: number | null;
  semana_eg: number | null;
  orden: number | null;
  completado: boolean;
  fecha_completado?: string | null;
}

export const getGestanteChecklist = async (
  gestanteId: string
): Promise<GestanteChecklistItem[]> => {
  const response = await api.get<GestanteChecklistItem[]>(
    `/api/v1/clinical/checklist-items/${gestanteId}`
  );
  return response.data;
};

// ─── Inteligencia Artificial (Staff) ─────────────────────────────────────────

export interface ChatMensajeStaffResponse {
  id: string;
  rol: string;
  contenido: string;
  created_at: string;
}

export interface ChatHistorialStaffResponse {
  codigo_gmi: string;
  mensajes: ChatMensajeStaffResponse[];
  total: number;
}

export interface AlertaStaffResponse {
  id: string;
  gestante_id: string;
  tipo_alerta_id: number;
  tipo_alerta_nombre: string | null;
  prioridad_id: number;
  prioridad_codigo: string | null;
  estado: string;
  modulo_origen: string | null;
  descripcion: string | null;
  clasificacion_riesgo_id: string | null;
  resuelta_por: string | null;
  fecha_resolucion: string | null;
  created_at: string | null;
}

export interface ExplainabilityResponse {
  assessment_id: string;
  nivel_riesgo: 'verde' | 'amarillo' | 'rojo';
  explicacion: string;
  factores_determinantes: string[];
  datos_utilizados: string[];
}

export const getGestanteExplainabilityStaff = async (
  gestanteId: string,
  assessmentId: string
): Promise<ExplainabilityResponse> => {
  const response = await api.get<ExplainabilityResponse>(
    `/api/v1/ia/gestantes/${gestanteId}/explainability/${assessmentId}`
  );
  return response.data;
};

export const getGestanteChatHistoryStaff = async (
  gestanteId: string
): Promise<ChatHistorialStaffResponse> => {
  const response = await api.get<ChatHistorialStaffResponse>(
    `/api/v1/ia/gestantes/${gestanteId}/chat/history`
  );
  return response.data;
};

export const getGestanteAlertsStaff = async (
  gestanteId: string
): Promise<AlertaStaffResponse[]> => {
  const response = await api.get<AlertaStaffResponse[]>(
    `/api/v1/ia/gestantes/${gestanteId}/alerts`
  );
  return response.data;
};

// ─── Solicitudes de Activación de Login ──────────────────────────────────────

export interface SolicitudActivacionResponse {
  id: string;
  codigo_gmi: string;
  pregunta: string;
  estado: string;
  created_at: string;
}

export interface DetailResponse {
  detail: string;
}

export const getPendingActivations = async (): Promise<SolicitudActivacionResponse[]> => {
  const response = await api.get<SolicitudActivacionResponse[]>('/api/v1/admin/solicitudes-activacion');
  return response.data;
};

export const resolveActivationRequest = async (
  id: string,
  aprobar: boolean
): Promise<DetailResponse> => {
  const response = await api.post<DetailResponse>(
    `/api/v1/admin/solicitudes-activacion/${id}/resolver`,
    null,
    { params: { aprobar } }
  );
  return response.data;
};


