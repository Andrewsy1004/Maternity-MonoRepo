import api, { USE_MOCKS } from './api';
import axios from 'axios';

// ---------------------------------------------------------------------------
// Interfaces — alineadas 1:1 con schemas.py del módulo M4
// ---------------------------------------------------------------------------

// ---- Parto ----

export interface BirthRecordCreate {
  tipo_parto: string;
  fecha_parto: string;                  // date ISO
  complicaciones?: string | null;
  uci_materna?: boolean;
  muerte_materna?: boolean;
  causa_muerte?: string | null;
  fecha_muerte?: string | null;         // date ISO
}

export interface BirthRecordUpdate {
  tipo_parto?: string | null;
  fecha_parto?: string | null;          // date ISO
  complicaciones?: string | null;
  uci_materna?: boolean | null;
  muerte_materna?: boolean | null;
  causa_muerte?: string | null;
  fecha_muerte?: string | null;         // date ISO
}

export interface BirthRecordResponse {
  id: string;
  gestante_id: string;
  tipo_parto: string;
  fecha_parto: string;                  // date ISO
  complicaciones: string | null;
  uci_materna: boolean;
  muerte_materna: boolean;
  causa_muerte: string | null;
  fecha_muerte: string | null;          // date ISO
  created_at: string | null;            // datetime ISO
}

// ---- Recién Nacido ----

export interface NewbornCreate {
  vivo: boolean;
  peso_gramos?: number | null;
  talla_cm?: number | null;
  uci_neonatal?: boolean;
  observaciones?: string | null;
}

export interface NewbornResponse {
  id: string;
  parto_id: string;
  vivo: boolean;
  peso_gramos: number | null;
  talla_cm: number | null;
  uci_neonatal: boolean;
  observaciones: string | null;
  created_at: string | null;            // datetime ISO
}

// ---- Puerperio ----

export interface PostpartumCreate {
  dias_posparto: number;
  fecha_evaluacion: string;             // date ISO
  complicaciones?: string | null;
  observaciones?: string | null;
}

export interface PostpartumResponse {
  id: string;
  gestante_id: string;
  dias_posparto: number;
  fecha_evaluacion: string;             // date ISO
  complicaciones: string | null;
  observaciones: string | null;
  created_at: string | null;            // datetime ISO
}

// ---- Salud Mental (usada en evolución posparto) ----

export interface MentalHealthResponse {
  id: string;
  gestante_id: string;
  instrumento: string;
  puntaje: number;
  fecha: string;                        // date ISO
  recomendaciones: string | null;
  created_at: string | null;            // datetime ISO
}

// ---- Evolución Posparto ----

export interface PostpartumEvolutionResponse {
  puerperios: PostpartumResponse[];
  evaluaciones_salud_mental: MentalHealthResponse[];
}

// ---- Anticoncepción Posparto ----

export interface ContraceptionCreate {
  metodo_id?: number | null;
  fecha_aplicacion: string;             // date ISO
}

export interface ContraceptionResponse {
  id: string;
  gestante_id: string;
  metodo_id: number | null;
  fecha_aplicacion: string;             // date ISO
  created_at: string | null;            // datetime ISO
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDelay = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms));

const MOCK_BIRTH_RECORD: BirthRecordResponse = {
  id: "parto-001",
  gestante_id: "gest-001",
  tipo_parto: "Vaginal",
  fecha_parto: "2024-11-20",
  complicaciones: null,
  uci_materna: false,
  muerte_materna: false,
  causa_muerte: null,
  fecha_muerte: null,
  created_at: "2024-11-20T14:30:00",
};

const MOCK_NEWBORNS: NewbornResponse[] = [
  {
    id: "rn-001",
    parto_id: "parto-001",
    vivo: true,
    peso_gramos: 3200,
    talla_cm: 49,
    uci_neonatal: false,
    observaciones: null,
    created_at: "2024-11-20T14:35:00",
  },
];

const MOCK_POSTPARTUM: PostpartumResponse[] = [
  {
    id: "puerp-001",
    gestante_id: "gest-001",
    dias_posparto: 3,
    fecha_evaluacion: "2024-11-23",
    complicaciones: null,
    observaciones: "Evolución satisfactoria, lactancia establecida",
    created_at: "2024-11-23T10:00:00",
  },
  {
    id: "puerp-002",
    gestante_id: "gest-001",
    dias_posparto: 7,
    fecha_evaluacion: "2024-11-27",
    complicaciones: null,
    observaciones: "Sin novedades",
    created_at: "2024-11-27T09:00:00",
  },
];

const MOCK_POSTPARTUM_EVOLUTION: PostpartumEvolutionResponse = {
  puerperios: MOCK_POSTPARTUM,
  evaluaciones_salud_mental: [
    {
      id: "mh-001",
      gestante_id: "gest-001",
      instrumento: "EPDS",
      puntaje: 6,
      fecha: "2024-11-27",
      recomendaciones: "Puntaje dentro del rango normal. Continúe con apoyo familiar.",
      created_at: "2024-11-27T09:30:00",
    },
  ],
};

const MOCK_CONTRACEPTION: ContraceptionResponse[] = [
  {
    id: "anticon-001",
    gestante_id: "gest-001",
    metodo_id: 3,
    fecha_aplicacion: "2024-11-27",
    created_at: "2024-11-27T10:00:00",
  },
];

// ---------------------------------------------------------------------------
// Service Methods
// ---------------------------------------------------------------------------

// ---- Parto ----

// POST /birth-record  — status 201
// Nota: relación 1:1 con gestante; el backend lanza 409 si ya existe
export const createBirthRecord = async (data: BirthRecordCreate): Promise<BirthRecordResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    sessionStorage.setItem('has_birth_record', 'true');
    return {
      id: `parto-${Date.now()}`,
      gestante_id: "gest-001",
      tipo_parto: data.tipo_parto,
      fecha_parto: data.fecha_parto,
      complicaciones: data.complicaciones ?? null,
      uci_materna: data.uci_materna ?? false,
      muerte_materna: data.muerte_materna ?? false,
      causa_muerte: data.causa_muerte ?? null,
      fecha_muerte: data.fecha_muerte ?? null,
      created_at: new Date().toISOString(),
    };
  }
  const response = await api.post('/api/v1/m4/birth-record', data);
  sessionStorage.setItem('has_birth_record', 'true');
  return response.data;
};

// GET /birth-record
export const getBirthRecord = async (): Promise<BirthRecordResponse | null> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_BIRTH_RECORD;
  }
  try {
    const response = await api.get('/api/v1/m4/birth-record');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

// PUT /birth-record
export const updateBirthRecord = async (data: BirthRecordUpdate): Promise<BirthRecordResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      ...MOCK_BIRTH_RECORD,
      ...data,
      tipo_parto: data.tipo_parto ?? MOCK_BIRTH_RECORD.tipo_parto,
      fecha_parto: data.fecha_parto ?? MOCK_BIRTH_RECORD.fecha_parto,
      uci_materna: data.uci_materna ?? MOCK_BIRTH_RECORD.uci_materna,
      muerte_materna: data.muerte_materna ?? MOCK_BIRTH_RECORD.muerte_materna,
    };
  }
  const response = await api.put('/api/v1/m4/birth-record', data);
  return response.data;
};

// ---- Recién Nacido ----

// POST /newborn  — status 201
// Nota: el backend exige que el parto ya esté registrado (404 si no existe)
export const createNewborn = async (data: NewbornCreate): Promise<NewbornResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      id: `rn-${Date.now()}`,
      parto_id: MOCK_BIRTH_RECORD.id,
      vivo: data.vivo,
      peso_gramos: data.peso_gramos ?? null,
      talla_cm: data.talla_cm ?? null,
      uci_neonatal: data.uci_neonatal ?? false,
      observaciones: data.observaciones ?? null,
      created_at: new Date().toISOString(),
    };
  }
  const response = await api.post('/api/v1/m4/newborn', data);
  return response.data;
};

// GET /newborn
export const getNewborns = async (): Promise<NewbornResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_NEWBORNS;
  }
  try {
    const response = await api.get('/api/v1/m4/newborn');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

// ---- Puerperio ----

// POST /postpartum  — status 201
export const createPostpartum = async (data: PostpartumCreate): Promise<PostpartumResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      id: `puerp-${Date.now()}`,
      gestante_id: "gest-001",
      dias_posparto: data.dias_posparto,
      fecha_evaluacion: data.fecha_evaluacion,
      complicaciones: data.complicaciones ?? null,
      observaciones: data.observaciones ?? null,
      created_at: new Date().toISOString(),
    };
  }
  const response = await api.post('/api/v1/m4/postpartum', data);
  return response.data;
};

// GET /postpartum
export const getPostpartum = async (): Promise<PostpartumResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_POSTPARTUM;
  }
  try {
    const response = await api.get('/api/v1/m4/postpartum');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

// GET /postpartum-evolution
export const getPostpartumEvolution = async (): Promise<PostpartumEvolutionResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_POSTPARTUM_EVOLUTION;
  }
  const response = await api.get('/api/v1/m4/postpartum-evolution');
  return response.data;
};

// ---- Anticoncepción Posparto ----

// POST /contraception  — status 201
export const createContraception = async (data: ContraceptionCreate): Promise<ContraceptionResponse> => {
  if (USE_MOCKS) {
    await mockDelay();
    return {
      id: `anticon-${Date.now()}`,
      gestante_id: "gest-001",
      metodo_id: data.metodo_id ?? null,
      fecha_aplicacion: data.fecha_aplicacion,
      created_at: new Date().toISOString(),
    };
  }
  const response = await api.post('/api/v1/m4/contraception', data);
  return response.data;
};

// GET /contraception
export const getContraception = async (): Promise<ContraceptionResponse[]> => {
  if (USE_MOCKS) {
    await mockDelay();
    return MOCK_CONTRACEPTION;
  }
  try {
    const response = await api.get('/api/v1/m4/contraception');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};