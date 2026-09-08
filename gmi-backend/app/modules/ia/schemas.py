from datetime import datetime
from sqlmodel import SQLModel


# ---- Alerta generada por IA ----

class AlertaGeneradaInfo(SQLModel):
    alerta_id: str
    nivel_urgencia: str
    descripcion: str


# ---- Chat ----

class ChatMessageRequest(SQLModel):
    mensaje: str


class ChatMessageResponse(SQLModel):
    id: str
    rol: str
    contenido: str
    created_at: datetime
    alerta_generada: AlertaGeneradaInfo | None = None


class ChatHistoryResponse(SQLModel):
    mensajes: list[ChatMessageResponse]
    total: int


# ---- Risk Summary ----

class RiskSummaryResponse(SQLModel):
    assessment_id: str
    nivel_riesgo: str
    resumen: str
    factores_riesgo: list[str]
    recomendaciones: list[str]
    explicacion_ia: str
    semana_gestacion: int
    alerta_generada: AlertaGeneradaInfo | None = None


# ---- Recommendations ----

class RecommendationResponse(SQLModel):
    semana_gestacion: int
    modulo: str
    recomendaciones: list[str]
    mensaje_motivacional: str


# ---- Triage ----

class TriageRequest(SQLModel):
    sintomas: list[str]
    respuestas_recientes: list[str] | None = None


class TriageResponse(SQLModel):
    nivel_urgencia: str
    descripcion: str
    acciones_recomendadas: list[str]
    requiere_llamada_emergencia: bool
    alerta_generada: AlertaGeneradaInfo | None = None


# ---- Clinical Summary (para staff) ----

class ClinicalSummaryResponse(SQLModel):
    codigo_gmi: str
    semana_gestacion: int
    modulo_activo: str
    resumen_clinico: str
    alertas_activas: int
    puntos_clave: list[str]
    sugerencias_clinico: list[str]


# ---- Explainability ----

class ExplainabilityResponse(SQLModel):
    assessment_id: str
    nivel_riesgo: str
    explicacion: str
    factores_determinantes: list[str]
    datos_utilizados: list[str]


# ---- Staff: resolución de alertas ----

class AlertaResolverRequest(SQLModel):
    observaciones: str | None = None


class AlertaStaffResponse(SQLModel):
    id: str
    gestante_id: str
    tipo_alerta_id: int
    tipo_alerta_nombre: str | None = None
    prioridad_id: int
    prioridad_codigo: str | None = None
    estado: str
    modulo_origen: str | None = None
    descripcion: str | None = None
    clasificacion_riesgo_id: str | None = None
    resuelta_por: str | None = None
    fecha_resolucion: datetime | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


# ---- Staff: historial de chat de una gestante ----

class ChatMensajeStaffResponse(SQLModel):
    id: str
    rol: str
    contenido: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatHistorialStaffResponse(SQLModel):
    codigo_gmi: str
    mensajes: list[ChatMensajeStaffResponse]
    total: int