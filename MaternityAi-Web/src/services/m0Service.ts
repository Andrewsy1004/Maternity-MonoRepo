import api, { USE_MOCKS } from './api';
import { getBirthRecord } from './m4Service';

// ---------------------------------------------------------------------------
// Interfaces — alineadas 1:1 con schemas.py del backend
// ---------------------------------------------------------------------------

// ---- Registro ----

export interface GestanteRegisterRequest {
  fecha_nacimiento: string; // date ISO
  fecha_ultima_menstruacion: string; // date ISO
  fecha_probable_parto?: string | null; // date ISO
  anio_ingreso: number;
  tipo_regimen?: string | null;
  nacionalidad_id?: number | null;
  eapb_id?: number | null;
  pertenencia_etnica_id?: number | null;
  grupo_poblacional_id?: number | null;
  fecha_ingreso_cpn?: string | null; // date ISO
  semanas_eg_ingreso?: number | null;
  pregunta_seguridad: string;
  respuesta_seguridad: string;
}

export interface GestanteRegisterResponse {
  codigo_gmi: string;
  mensaje: string;
}

// ---- Perfil Clínico ----

export interface ClinicalProfile {
  enfermedades_cronicas: string | null;
  alergias: string | null;
  habitos: string | null;
  condiciones_riesgo: string | null;
}

// ---- Fórmula Obstétrica ----

export interface ObstetricFormula {
  gestaciones: number;
  partos: number;
  cesareas: number;
  abortos: number;
  vivos: number;
  mortinatos: number;
}

// ---- Antecedentes Patológicos ----

export interface PathologicalHistory {
  id: string;
  tipo_condicion: string;
  descripcion: string | null;
  fecha_diagnostico: string | null; // date ISO
  controlada: boolean | null;
  tratamiento_actual: string | null;
}

export interface PathologicalHistoryRequest {
  tipo_condicion: string;
  descripcion?: string | null;
  fecha_diagnostico?: string | null; // date ISO
  controlada?: boolean | null;
  tratamiento_actual?: string | null;
}

// ---- Consentimiento Informado ----

export interface ConsentRequest {
  version: string;
  hash_consentimiento: string;
}

export interface ConsentResponse {
  id: string;
  version: string;
  estado: string; // "ACEPTADO" | "REVOCADO"
  fecha_aceptacion: string;
}

// ---- Edad Gestacional ----

export interface GestationalAge {
  semanas: number;
  dias: number;
  descripcion: string;
  fecha_ultima_menstruacion: string; // date ISO
  fecha_probable_parto: string | null; // date ISO
}

// ---- Módulo Activo ----

export interface ActiveModule {
  modulo_id: number;
  codigo: string;
  nombre: string;
  semana_gestacion_actual?: number | null;
}

// ---- Historial de Módulo ----

export interface ModuleHistoryEntry {
  id: string;
  modulo_anterior: string | null;
  modulo_nuevo: string;
  motivo: string | null;
  origen: string | null;
  created_at: string;
}

// ---- Pregunta de Seguridad ----

export interface SecurityQuestionRequest {
  pregunta: string;
  respuesta: string;
}

// ---- Respuesta genérica de detalle ----

export interface DetailResponse {
  detail: string;
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDelay = (ms = 800) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_CLINICAL_PROFILE: ClinicalProfile = {
  enfermedades_cronicas: 'Ninguna conocida',
  alergias: 'Penicilina',
  habitos: 'No fuma, no bebe alcohol',
  condiciones_riesgo: 'Ninguna',
};

const MOCK_OBSTETRIC_FORMULA: ObstetricFormula = {
  gestaciones: 2,
  partos: 1,
  cesareas: 0,
  abortos: 0,
  vivos: 1,
  mortinatos: 0,
};

const MOCK_PATHOLOGICAL_HISTORY: PathologicalHistory[] = [
  {
    id: 'ant-001',
    tipo_condicion: 'Diabetes Gestacional',
    descripcion: 'Detectada en embarazo anterior',
    fecha_diagnostico: '2022-05-10',
    controlada: true,
    tratamiento_actual: 'Dieta controlada',
  },
  {
    id: 'ant-002',
    tipo_condicion: 'Hipertensión',
    descripcion: null,
    fecha_diagnostico: '2023-01-20',
    controlada: false,
    tratamiento_actual: 'Losartán 50mg',
  },
];

const MOCK_CONSENT: ConsentResponse = {
  id: 'cons-001',
  version: 'v1.0',
  estado: 'ACEPTADO',
  fecha_aceptacion: '2024-03-01T10:00:00',
};

const MOCK_GESTATIONAL_AGE: GestationalAge = {
  semanas: 12,
  dias: 3,
  descripcion: '12 semanas y 3 días de gestación',
  fecha_ultima_menstruacion: '2024-02-15',
  fecha_probable_parto: '2024-11-22',
};

const MOCK_ACTIVE_MODULE: ActiveModule = {
  modulo_id: 1,
  codigo: 'M0',
  nombre: 'Registro y Perfil',
  semana_gestacion_actual: 12,
};

const MOCK_MODULE_HISTORY: ModuleHistoryEntry[] = [
  {
    id: 'hist-001',
    modulo_anterior: null,
    modulo_nuevo: 'M0',
    motivo: 'Registro inicial',
    origen: 'sistema',
    created_at: '2024-03-01T08:00:00',
  },
  {
    id: 'hist-002',
    modulo_anterior: 'M0',
    modulo_nuevo: 'M1',
    motivo: 'Avance de edad gestacional',
    origen: 'sistema',
    created_at: '2024-05-10T08:00:00',
  },
];

// ---------------------------------------------------------------------------
// Service Methods
// ---------------------------------------------------------------------------

// POST /api/v1/m0/register
export const registerGestante = async (
  data: GestanteRegisterRequest
): Promise<GestanteRegisterResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      codigo_gmi: 'GMI-2024-0001',
      mensaje: 'Gestante registrada exitosamente',
    };
  }
  const response = await api.post('/api/v1/m0/register', data);
  return response.data;
};

// GET /api/v1/m0/profile/clinical
export const getClinicalProfile = async (): Promise<ClinicalProfile> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_CLINICAL_PROFILE;
  }
  try {
    const response = await api.get('/api/v1/m0/profile/clinical');
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return {
        enfermedades_cronicas: '',
        alergias: '',
        habitos: '',
        condiciones_riesgo: '',
      };
    }
    throw error;
  }
};

// PUT /api/v1/m0/profile/clinical
export const updateClinicalProfile = async (
  data: Partial<ClinicalProfile>
): Promise<ClinicalProfile> => {
  if (USE_MOCKS) {
    await mockDelay();
    return { ...MOCK_CLINICAL_PROFILE, ...data };
  }
  const response = await api.put('/api/v1/m0/profile/clinical', data);
  return response.data;
};

// GET /api/v1/m0/profile/obstetric-formula
export const getObstetricFormula = async (): Promise<ObstetricFormula> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_OBSTETRIC_FORMULA;
  }
  const response = await api.get('/api/v1/m0/profile/obstetric-formula');
  return response.data;
};

// PUT /api/v1/m0/profile/obstetric-formula
// Nota: el backend recibe todos los campos como requeridos (ObstetricFormulaUpdate),
// y valida que gestaciones >= partos + cesareas + abortos
export const updateObstetricFormula = async (
  data: ObstetricFormula
): Promise<ObstetricFormula> => {
  if (USE_MOCKS) {
    await mockDelay();
    return { ...MOCK_OBSTETRIC_FORMULA, ...data };
  }
  const response = await api.put('/api/v1/m0/profile/obstetric-formula', data);
  return response.data;
};

// GET /api/v1/m0/profile/pathological-history
export const getPathologicalHistory = async (): Promise<
  PathologicalHistory[]
> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_PATHOLOGICAL_HISTORY;
  }
  const response = await api.get('/api/v1/m0/profile/pathological-history');
  return response.data;
};

// POST /api/v1/m0/profile/pathological-history  — status 201
export const createPathologicalHistory = async (
  data: PathologicalHistoryRequest
): Promise<PathologicalHistory> => {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      id: `ant-${Date.now()}`,
      tipo_condicion: data.tipo_condicion,
      descripcion: data.descripcion ?? null,
      fecha_diagnostico: data.fecha_diagnostico ?? null,
      controlada: data.controlada ?? null,
      tratamiento_actual: data.tratamiento_actual ?? null,
    };
  }
  const response = await api.post(
    '/api/v1/m0/profile/pathological-history',
    data
  );
  return response.data;
};

// PUT /api/v1/m0/profile/pathological-history/{antecedente_id}
export const updatePathologicalHistory = async (
  antecedente_id: string,
  data: Partial<PathologicalHistoryRequest>
): Promise<PathologicalHistory> => {
  if (USE_MOCKS) {
    await mockDelay();
    const existing =
      MOCK_PATHOLOGICAL_HISTORY.find((a) => a.id === antecedente_id) ??
      MOCK_PATHOLOGICAL_HISTORY[0];
    return { ...existing, ...data, id: antecedente_id };
  }
  const response = await api.put(
    `/api/v1/m0/profile/pathological-history/${antecedente_id}`,
    data
  );
  return response.data;
};

// DELETE /api/v1/m0/profile/pathological-history/{antecedente_id}  — status 204
export const deletePathologicalHistory = async (
  antecedente_id: string
): Promise<void> => {
  if (USE_MOCKS) {
    await mockDelay();
    return;
  }
  await api.delete(`/api/v1/m0/profile/pathological-history/${antecedente_id}`);
};

// GET /api/v1/m0/consent
export const getConsent = async (): Promise<ConsentResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_CONSENT;
  }
  const response = await api.get('/api/v1/m0/consent');
  return response.data;
};

// POST /api/v1/m0/consent  — status 201
export const registerConsent = async (
  data: ConsentRequest
): Promise<ConsentResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      id: `cons-${Date.now()}`,
      version: data.version,
      estado: 'ACEPTADO',
      fecha_aceptacion: new Date().toISOString(),
    };
  }
  const response = await api.post('/api/v1/m0/consent', data);
  return response.data;
};

// POST /api/v1/m0/consent/revoke
export const revokeConsent = async (): Promise<DetailResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return { detail: 'Consentimiento informado revocado exitosamente' };
  }
  const response = await api.post('/api/v1/m0/consent/revoke');
  return response.data;
};

// GET /api/v1/m0/consent/document
// El router actual retorna { detail: "Endpoint pendiente de implementación" }
// Cuando esté listo será un Blob (PDF). Por ahora tipado como unknown.
export const getConsentDocument = async (): Promise<unknown> => {
  if (USE_MOCKS) {
    await mockDelay();
    return { detail: 'Endpoint pendiente de implementación' };
  }
  const response = await api.get('/api/v1/m0/consent/document', {
    responseType: 'blob',
  });
  return response.data;
};

// GET /api/v1/m0/gestational-age
export const getGestationalAge = async (): Promise<GestationalAge> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_GESTATIONAL_AGE;
  }
  const response = await api.get('/api/v1/m0/gestational-age');
  return response.data;
};

// GET /api/v1/m0/active-module
export const getActiveModule = async (): Promise<ActiveModule> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_ACTIVE_MODULE;
  }

  let baseModule: ActiveModule;
  try {
    const response = await api.get('/api/v1/m0/active-module');
    baseModule = response.data;
  } catch (error) {
    // Fallback dinámico si el backend no puede determinar el módulo (ej. error 404 por superar las 42 semanas o NULL)
    try {
      const gestationalAge = await getGestationalAge();
      const weeks = gestationalAge.semanas;
      let modulo_id = 1;
      let codigo = 'M1';
      let nombre = 'Primer Trimestre';

      if (weeks >= 14 && weeks <= 27) {
        modulo_id = 2;
        codigo = 'M2';
        nombre = 'Segundo Trimestre';
      } else if (weeks >= 28 && weeks <= 42) {
        modulo_id = 3;
        codigo = 'M3';
        nombre = 'Tercer Trimestre - Crítico';
      } else if (weeks > 42) {
        modulo_id = 4;
        codigo = 'M4';
        nombre = 'Parto y Puerperio';
      }

      baseModule = {
        modulo_id,
        codigo,
        nombre,
        semana_gestacion_actual: weeks,
      };
    } catch {
      throw error;
    }
  }

  // Si es M1 o M2, no hay posibilidad de parto registrado
  if (baseModule && (baseModule.codigo === 'M1' || baseModule.codigo === 'M2')) {
    sessionStorage.setItem('has_birth_record', 'false');
    return baseModule;
  }

  // Si es M3 o M4, verificamos de forma inteligente la existencia del parto
  const cached = sessionStorage.getItem('has_birth_record');
  if (cached === 'true') {
    return {
      modulo_id: 4,
      codigo: 'M4',
      nombre: 'Parto y Puerperio',
      semana_gestacion_actual: undefined
    };
  } else if (cached === 'false') {
    return baseModule;
  }

  // Si no está en caché, consultamos el endpoint
  try {
    const birth = await getBirthRecord();
    if (birth && birth.id) {
      sessionStorage.setItem('has_birth_record', 'true');
      return {
        modulo_id: 4,
        codigo: 'M4',
        nombre: 'Parto y Puerperio',
        semana_gestacion_actual: undefined
      };
    } else {
      sessionStorage.setItem('has_birth_record', 'false');
    }
  } catch (err) {
    // Si hay error, continuamos sin almacenar caché 'false' permanentemente
  }

  return baseModule;
};

// GET /api/v1/m0/module-history
export const getModuleHistory = async (): Promise<ModuleHistoryEntry[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_MODULE_HISTORY;
  }
  const response = await api.get('/api/v1/m0/module-history');
  return response.data;
};

// PUT /api/v1/m0/security-question
// Nota: el backend usa { pregunta, respuesta } — no pregunta_seguridad/respuesta_seguridad
export const updateSecurityQuestion = async (
  data: SecurityQuestionRequest
): Promise<DetailResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return { detail: 'Pregunta de seguridad actualizada exitosamente' };
  }
  const response = await api.put('/api/v1/m0/security-question', data);
  return response.data;
};

// DELETE /api/v1/m0/account
export const deleteAccount = async (): Promise<DetailResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      detail:
        'Cuenta desactivada exitosamente. Los datos serán eliminados según la política de retención.',
    };
  }
  const response = await api.delete('/api/v1/m0/account');
  return response.data;
};

// ---------------------------------------------------------------------------
// Checklist de Progreso Clínico (Gestante)
// ---------------------------------------------------------------------------

export interface ChecklistItem {
  id: number;
  texto: string;
  modulo_id: number | null;
  semana_eg: number | null;
  orden: number | null;
  activo?: boolean; // deprecated, use completado
  completado?: boolean;
}

const MOCK_CHECKLIST: Record<string, ChecklistItem[]> = {
  M0: [
    {
      id: 1,
      texto: 'Registro inicial completado',
      modulo_id: 0,
      semana_eg: null,
      orden: 1,
      activo: true,
    },
    {
      id: 2,
      texto: 'Perfil clínico diligenciado',
      modulo_id: 0,
      semana_eg: null,
      orden: 2,
      activo: false,
    },
    {
      id: 3,
      texto: 'Consentimiento informado firmado',
      modulo_id: 0,
      semana_eg: null,
      orden: 3,
      activo: false,
    },
  ],
  M1: [
    {
      id: 4,
      texto: 'Primer control prenatal realizado',
      modulo_id: 1,
      semana_eg: null,
      orden: 1,
      activo: true,
    },
    {
      id: 5,
      texto: 'Ácido fólico iniciado',
      modulo_id: 1,
      semana_eg: null,
      orden: 2,
      activo: true,
    },
    {
      id: 6,
      texto: 'Exámenes de laboratorio iniciales',
      modulo_id: 1,
      semana_eg: null,
      orden: 3,
      activo: false,
    },
    {
      id: 7,
      texto: 'Ecografía del primer trimestre',
      modulo_id: 1,
      semana_eg: 12,
      orden: 4,
      activo: false,
    },
  ],
  M2: [
    {
      id: 8,
      texto: 'Control prenatal semana 16-20',
      modulo_id: 2,
      semana_eg: null,
      orden: 1,
      activo: true,
    },
    {
      id: 9,
      texto: 'Vacuna influenza aplicada',
      modulo_id: 2,
      semana_eg: null,
      orden: 2,
      activo: false,
    },
    {
      id: 10,
      texto: 'Vacuna tosferina aplicada',
      modulo_id: 2,
      semana_eg: null,
      orden: 3,
      activo: false,
    },
    {
      id: 11,
      texto: 'Ecografía morfológica',
      modulo_id: 2,
      semana_eg: 20,
      orden: 4,
      activo: true,
    },
    {
      id: 12,
      texto: 'Hierro y calcio suministrados',
      modulo_id: 2,
      semana_eg: null,
      orden: 5,
      activo: false,
    },
  ],
  M3: [
    {
      id: 13,
      texto: 'Plan de parto elaborado',
      modulo_id: 3,
      semana_eg: null,
      orden: 1,
      activo: false,
    },
    {
      id: 14,
      texto: 'Control semana 28-32',
      modulo_id: 3,
      semana_eg: null,
      orden: 2,
      activo: true,
    },
    {
      id: 15,
      texto: 'Bolsa de maternidad lista',
      modulo_id: 3,
      semana_eg: 36,
      orden: 3,
      activo: false,
    },
    {
      id: 16,
      texto: 'Conteo de movimientos fetales iniciado',
      modulo_id: 3,
      semana_eg: null,
      orden: 4,
      activo: true,
    },
    {
      id: 17,
      texto: 'IPS de atención identificada',
      modulo_id: 3,
      semana_eg: null,
      orden: 5,
      activo: false,
    },
  ],
  M4: [
    {
      id: 18,
      texto: 'Control posparto semana 1',
      modulo_id: 4,
      semana_eg: null,
      orden: 1,
      activo: true,
    },
    {
      id: 19,
      texto: 'Orientación lactancia materna',
      modulo_id: 4,
      semana_eg: null,
      orden: 2,
      activo: true,
    },
    {
      id: 20,
      texto: 'Método anticonceptivo definido',
      modulo_id: 4,
      semana_eg: null,
      orden: 3,
      activo: false,
    },
    {
      id: 21,
      texto: 'Control posparto semana 6',
      modulo_id: 4,
      semana_eg: null,
      orden: 4,
      activo: false,
    },
  ],
};

export const getChecklistForGestante = async (
  moduloId: number,
  moduloCodigo: string
): Promise<ChecklistItem[]> => {
  if (USE_MOCKS) {
    await mockDelay(600);
    return MOCK_CHECKLIST[moduloCodigo] ?? [];
  }
  try {
    const response = await api.get<ChecklistItem[]>(
      '/api/v1/clinical/checklist-items',
      {
        params: { modulo_id: moduloId },
      }
    );
    return response.data;
  } catch {
    // Endpoint aún no implementado — fallback a mocks
    return MOCK_CHECKLIST[moduloCodigo] ?? [];
  }
};
