from datetime import date
from sqlmodel import SQLModel


# ---- Registro ----

class GestanteRegisterRequest(SQLModel):
    fecha_nacimiento: date
    fecha_ultima_menstruacion: date
    fecha_probable_parto: date | None = None
    anio_ingreso: int
    tipo_regimen: str | None = None
    nacionalidad_id: int | None = None
    eapb_id: int | None = None
    pertenencia_etnica_id: int | None = None
    grupo_poblacional_id: int | None = None
    fecha_ingreso_cpn: date | None = None
    semanas_eg_ingreso: int | None = None
    # Pregunta de seguridad (se crea junto con la gestante)
    pregunta_seguridad: str
    respuesta_seguridad: str


class GestanteRegisterResponse(SQLModel):
    codigo_gmi: str
    mensaje: str = "Gestante registrada exitosamente"


# ---- Perfil Clínico ----

class ClinicalProfileResponse(SQLModel):
    enfermedades_cronicas: str | None = None
    alergias: str | None = None
    habitos: str | None = None
    condiciones_riesgo: str | None = None


class ClinicalProfileUpdate(SQLModel):
    enfermedades_cronicas: str | None = None
    alergias: str | None = None
    habitos: str | None = None
    condiciones_riesgo: str | None = None


# ---- Fórmula Obstétrica ----

class ObstetricFormulaResponse(SQLModel):
    gestaciones: int = 0
    partos: int = 0
    cesareas: int = 0
    abortos: int = 0
    vivos: int = 0
    mortinatos: int = 0


class ObstetricFormulaUpdate(SQLModel):
    gestaciones: int
    partos: int
    cesareas: int
    abortos: int
    vivos: int
    mortinatos: int


# ---- Antecedentes Patológicos ----

class PathologicalHistoryCreate(SQLModel):
    tipo_condicion: str
    descripcion: str | None = None
    fecha_diagnostico: date | None = None
    controlada: bool | None = None
    tratamiento_actual: str | None = None


class PathologicalHistoryUpdate(SQLModel):
    tipo_condicion: str | None = None
    descripcion: str | None = None
    fecha_diagnostico: date | None = None
    controlada: bool | None = None
    tratamiento_actual: str | None = None


class PathologicalHistoryResponse(SQLModel):
    id: str
    tipo_condicion: str
    descripcion: str | None = None
    fecha_diagnostico: date | None = None
    controlada: bool | None = None
    tratamiento_actual: str | None = None


# ---- Consentimiento Informado ----

class ConsentRequest(SQLModel):
    version: str
    hash_consentimiento: str


class ConsentResponse(SQLModel):
    id: str
    version: str
    estado: str
    fecha_aceptacion: str


# ---- Edad Gestacional ----

class GestationalAgeResponse(SQLModel):
    semanas: int
    dias: int
    descripcion: str
    fecha_ultima_menstruacion: date
    fecha_probable_parto: date | None = None


# ---- Módulo Activo ----

class ActiveModuleResponse(SQLModel):
    modulo_id: int
    codigo: str
    nombre: str
    semana_gestacion_actual: int


# ---- Historial de Módulo ----

class ModuleHistoryResponse(SQLModel):
    id: str
    modulo_anterior: str | None = None
    modulo_nuevo: str
    motivo: str | None = None
    origen: str | None = None
    created_at: str


# ---- Pregunta de Seguridad ----

class SecurityQuestionUpdate(SQLModel):
    pregunta: str
    respuesta: str