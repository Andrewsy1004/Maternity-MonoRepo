import api, { USE_MOCKS } from './api';

// ---------------------------------------------------------------------------
// Interfaces — alineadas 1:1 con schemas.py del módulo M6
// ---------------------------------------------------------------------------

// ---- Alertas ----

export interface AlertaResponse {
  id: string;
  tipo_alerta_id: number;
  prioridad_id: number;
  estado: string;                       // "activa" | "leida" | etc.
  modulo_origen: string | null;
  descripcion: string | null;
  created_at: string | null;            // datetime ISO
}

export interface AlertaDetalleResponse {
  id: string;
  tipo_alerta_id: number;
  prioridad_id: number;
  estado: string;
  modulo_origen: string | null;
  descripcion: string | null;
  resuelta_por: string | null;
  fecha_resolucion: string | null;      // datetime ISO
  created_at: string | null;            // datetime ISO
}

// ---- Citas Médicas ----

export interface CitaMedicaCreate {
  ips_id?: number | null;
  fecha_hora: string;                   // datetime ISO
  tipo_cita?: string | null;
}

export interface CitaMedicaUpdate {
  fecha_hora: string;                   // datetime ISO
}

export interface CitaMedicaResponse {
  id: string;
  ips_id: number | null;
  fecha_hora: string;                   // datetime ISO
  tipo_cita: string | null;
  estado: string;                       // "programada" | "confirmada" | "cancelada"
  created_at: string | null;            // datetime ISO
}

// ---- Recordatorios ----

export interface RecordatorioResponse {
  id: string;
  fecha_hora: string;                   // datetime ISO
  tipo_cita: string | null;
  estado: string;
}

// ---- Notificaciones ----

export interface NotificacionResponse {
  id: string;
  canal: string;
  contenido: string | null;
  estado_entrega: string | null;        // "pendiente" | "enviada" | "leida"
  created_at: string | null;            // datetime ISO
}

// ---- Llamadas de Emergencia ----

export interface LlamadaEmergenciaCreate {
  motivo?: string | null;
  destino?: string | null;
  resultado?: string | null;
}

export interface LlamadaEmergenciaResponse {
  id: string;
  motivo: string | null;
  destino: string | null;
  duracion_seg: number | null;
  resultado: string | null;
  created_at: string | null;            // datetime ISO
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDelay = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms));

const MOCK_ALERTAS: AlertaResponse[] = [
  {
    id: "alert-001",
    tipo_alerta_id: 1,
    prioridad_id: 2,
    estado: "activa",
    modulo_origen: "M1",
    descripcion: "Presión arterial elevada reportada en último control",
    created_at: "2024-03-10T08:00:00",
  },
  {
    id: "alert-002",
    tipo_alerta_id: 3,
    prioridad_id: 1,
    estado: "leida",
    modulo_origen: "M0",
    descripcion: "Recuerde asistir a su próximo control prenatal",
    created_at: "2024-03-08T10:00:00",
  },
];

const MOCK_ALERTA_DETALLE: AlertaDetalleResponse = {
  id: "alert-001",
  tipo_alerta_id: 1,
  prioridad_id: 2,
  estado: "activa",
  modulo_origen: "M1",
  descripcion: "Presión arterial elevada reportada en último control",
  resuelta_por: null,
  fecha_resolucion: null,
  created_at: "2024-03-10T08:00:00",
};

const MOCK_CITAS: CitaMedicaResponse[] = [
  {
    id: "cita-001",
    ips_id: 1,
    fecha_hora: "2024-04-15T09:00:00",
    tipo_cita: "Control prenatal",
    estado: "programada",
    created_at: "2024-03-01T10:00:00",
  },
  {
    id: "cita-002",
    ips_id: 1,
    fecha_hora: "2024-03-20T10:30:00",
    tipo_cita: "Ecografía",
    estado: "confirmada",
    created_at: "2024-03-01T10:00:00",
  },
];

const MOCK_RECORDATORIOS: RecordatorioResponse[] = [
  {
    id: "cita-002",
    fecha_hora: "2024-03-20T10:30:00",
    tipo_cita: "Ecografía",
    estado: "confirmada",
  },
];

const MOCK_NOTIFICACIONES: NotificacionResponse[] = [
  {
    id: "notif-001",
    canal: "push",
    contenido: "Su cita de ecografía es mañana a las 10:30 AM",
    estado_entrega: "enviada",
    created_at: "2024-03-19T08:00:00",
  },
  {
    id: "notif-002",
    canal: "sms",
    contenido: "Recuerde tomar su suplemento de hierro hoy",
    estado_entrega: "leida",
    created_at: "2024-03-18T07:00:00",
  },
];

const MOCK_LLAMADAS: LlamadaEmergenciaResponse[] = [
  {
    id: "llamada-001",
    motivo: "Dolor abdominal intenso",
    destino: "Línea de emergencias médicas",
    duracion_seg: 180,
    resultado: "Atendida — se indicó acudir a urgencias",
    created_at: "2024-02-28T22:15:00",
  },
];

// ---------------------------------------------------------------------------
// Service Methods
// ---------------------------------------------------------------------------

// ---- Alertas ----

// GET /alerts
export const getAlertas = async (): Promise<AlertaResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_ALERTAS;
  }
  const response = await api.get('/api/v1/m6/alerts');
  return response.data;
};

// GET /alerts/{alert_id}
export const getAlertaById = async (alert_id: string): Promise<AlertaDetalleResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_ALERTA_DETALLE;
  }
  const response = await api.get(`/api/v1/m6/alerts/${alert_id}`);
  return response.data;
};

// PATCH /alerts/{alert_id}/acknowledge
export const acknowledgeAlerta = async (alert_id: string): Promise<AlertaResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    const existing = MOCK_ALERTAS.find(a => a.id === alert_id) ?? MOCK_ALERTAS[0];
    return { ...existing, estado: "leida" };
  }
  const response = await api.patch(`/api/v1/m6/alerts/${alert_id}/acknowledge`);
  return response.data;
};

// ---- Citas Médicas ----

// GET /appointments
export const getCitas = async (): Promise<CitaMedicaResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_CITAS;
  }
  const response = await api.get('/api/v1/m6/appointments');
  return response.data;
};

// POST /appointments  — status 201
export const createCita = async (data: CitaMedicaCreate): Promise<CitaMedicaResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      id: `cita-${Date.now()}`,
      ips_id: data.ips_id ?? null,
      fecha_hora: data.fecha_hora,
      tipo_cita: data.tipo_cita ?? null,
      estado: "programada",
      created_at: new Date().toISOString(),
    };
  }
  const response = await api.post('/api/v1/m6/appointments', data);
  return response.data;
};

// PATCH /appointments/{appointment_id}  — reprogramar
export const reprogramarCita = async (
  appointment_id: string,
  data: CitaMedicaUpdate
): Promise<CitaMedicaResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    const existing = MOCK_CITAS.find(c => c.id === appointment_id) ?? MOCK_CITAS[0];
    return { ...existing, fecha_hora: data.fecha_hora, id: appointment_id };
  }
  const response = await api.patch(`/api/v1/m6/appointments/${appointment_id}`, data);
  return response.data;
};

// POST /appointments/{appointment_id}/confirm
export const confirmarCita = async (appointment_id: string): Promise<CitaMedicaResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    const existing = MOCK_CITAS.find(c => c.id === appointment_id) ?? MOCK_CITAS[0];
    return { ...existing, estado: "confirmada", id: appointment_id };
  }
  const response = await api.post(`/api/v1/m6/appointments/${appointment_id}/confirm`);
  return response.data;
};

// DELETE /appointments/{appointment_id}  — status 204
export const cancelarCita = async (appointment_id: string): Promise<void> => {
  if (USE_MOCKS) {
    await mockDelay();
    return;
  }
  await api.delete(`/api/v1/m6/appointments/${appointment_id}`);
};

// ---- Recordatorios ----

// GET /reminders
export const getRecordatorios = async (): Promise<RecordatorioResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_RECORDATORIOS;
  }
  const response = await api.get('/api/v1/m6/reminders');
  return response.data;
};

// ---- Notificaciones ----

// GET /notifications
export const getNotificaciones = async (): Promise<NotificacionResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_NOTIFICACIONES;
  }
  const response = await api.get('/api/v1/m6/notifications');
  return response.data;
};

// PATCH /notifications/{notification_id}/read
export const markNotificacionRead = async (notification_id: string): Promise<NotificacionResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    const existing = MOCK_NOTIFICACIONES.find(n => n.id === notification_id) ?? MOCK_NOTIFICACIONES[0];
    return { ...existing, estado_entrega: "leida" };
  }
  const response = await api.patch(`/api/v1/m6/notifications/${notification_id}/read`);
  return response.data;
};

// ---- Llamadas de Emergencia ----

// POST /emergency-call  — status 201
export const createLlamadaEmergencia = async (
  data: LlamadaEmergenciaCreate
): Promise<LlamadaEmergenciaResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      id: `llamada-${Date.now()}`,
      motivo: data.motivo ?? null,
      destino: data.destino ?? null,
      duracion_seg: null,
      resultado: data.resultado ?? null,
      created_at: new Date().toISOString(),
    };
  }
  const response = await api.post('/api/v1/m6/emergency-call', data);
  return response.data;
};

// GET /emergency-call/history
export const getHistorialLlamadas = async (): Promise<LlamadaEmergenciaResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_LLAMADAS;
  }
  const response = await api.get('/api/v1/m6/emergency-call/history');
  return response.data;
};