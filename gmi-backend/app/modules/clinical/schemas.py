from datetime import date, datetime
from decimal import Decimal
from sqlmodel import SQLModel


# ---- Dashboard ----

class ModuloInfo(SQLModel):
    modulo_id: int
    codigo: str
    nombre: str
    semana_gestacion_actual: int
    descripcion: str | None = None


class DashboardResponse(SQLModel):
    modulo_activo: ModuloInfo
    semana_gestacion: int
    dias_gestacion: int
    fecha_probable_parto: date | None = None
    controles_realizados: int
    alertas_activas: int


# ---- Signos de Alarma ----

class SignoAlarmaResponse(SQLModel):
    pregunta_id: int
    texto: str
    tipo_respuesta: str
    frecuencia: str | None = None

    model_config = {"from_attributes": True}


# ---- Recomendaciones ----

class RecomendacionResponse(SQLModel):
    modulo: str
    semana_gestacion: int
    recomendaciones: list[str]


# ---- Síntomas ----

class SintomaCreate(SQLModel):
    descripcion: str
    severidad: str | None = None  # 'leve', 'moderado', 'severo'


class SintomaResponse(SQLModel):
    id: str
    descripcion: str
    severidad: str | None = None
    modulo_origen: str | None = None
    fecha_reporte: datetime
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


# ---- Signos Vitales ----

class SignosVitalesCreate(SQLModel):
    control_prenatal_id: str
    peso_kg: float
    talla_cm: float | None = None
    altura_uterina: float | None = None
    presion_sistolica: int | None = None
    presion_diastolica: int | None = None
    fcf: int | None = None
    estado_nutricional_id: int | None = None


class SignosVitalesResponse(SQLModel):
    id: str
    control_prenatal_id: str
    fecha_control: date | None = None
    peso_kg: float
    talla_cm: float | None = None
    imc: float | None = None
    estado_nutricional_id: int | None = None
    altura_uterina: float | None = None
    presion_sistolica: int | None = None
    presion_diastolica: int | None = None
    fcf: int | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


# ---- Clasificación de Riesgo ----

class ClasificacionRiesgoResponse(SQLModel):
    id: str
    tipo_riesgo: str
    nivel: str
    clasificacion_ia: str | None = None
    diagnostico_texto: str | None = None
    situaciones_biosicosocial: str | None = None
    explicacion_ia: str | None = None
    fecha_evaluacion: datetime
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


# ---- Exámenes de Laboratorio ----

class ExamenCreate(SQLModel):
    gestante_id: str
    tipo_examen_id: int
    fecha_toma: date
    resultado: str
    resultado_numerico: Decimal | None = None
    unidad: str | None = None
    semana_gestacion: int | None = None
    observaciones: str | None = None
    control_prenatal_id: str | None = None


class ExamenResponse(SQLModel):
    id: str
    tipo_examen_id: int
    tipo_examen_nombre: str | None = None
    fecha_toma: date
    resultado: str
    resultado_numerico: Decimal | None = None
    unidad: str | None = None
    trimestre: int | None = None
    semana_gestacion: int | None = None
    observaciones: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


# ---- Ecografías ----

class EcografiaCreate(SQLModel):
    gestante_id: str
    tipo_ecografia_id: int | None = None
    fecha: date
    semana_gestacion: int | None = None
    resultado: str | None = None
    plan_manejo: str | None = None


class EcografiaResponse(SQLModel):
    id: str
    tipo_ecografia_id: int | None = None
    tipo_ecografia_nombre: str | None = None
    fecha: date
    semana_gestacion: int | None = None
    resultado: str | None = None
    plan_manejo: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


# ---- Vacunación ----

class VacunacionCreate(SQLModel):
    gestante_id: str
    vacuna_id: int
    dosis: str
    fecha_aplicacion: date


class VacunacionResponse(SQLModel):
    id: str
    vacuna_id: int
    vacuna_nombre: str | None = None
    dosis: str
    fecha_aplicacion: date
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


# ---- Micronutrientes ----

class MicronutrienteCreate(SQLModel):
    gestante_id: str
    micronutriente_id: int
    suministrado: bool
    fecha_inicio: date | None = None


class MicronutrienteResponse(SQLModel):
    id: str
    micronutriente_id: int
    micronutriente_nombre: str | None = None
    suministrado: bool
    fecha_inicio: date | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


# ---- Remisiones Interdisciplinarias ----

class RemisionCreate(SQLModel):
    gestante_id: str
    especialidad_id: int
    fecha_remision: date
    semana_gestacion: int | None = None


class RemisionUpdate(SQLModel):
    fecha_atencion: date


class RemisionResponse(SQLModel):
    id: str
    especialidad_id: int
    especialidad_nombre: str | None = None
    fecha_remision: date
    fecha_atencion: date | None = None
    semana_gestacion: int | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


# ---- Controles Prenatales ----

class ControlPrenatalCreate(SQLModel):
    gestante_id: str
    numero_control: int
    fecha_control: date
    semana_gestacion: int
    ips_id: int | None = None
    tipo_profesional_id: int | None = None
    tipo_consulta: str | None = None
    observaciones: str | None = None


class ControlPrenatalResponse(SQLModel):
    id: str
    numero_control: int
    fecha_control: date
    semana_gestacion: int
    trimestre: int | None = None
    ips_id: int | None = None
    tipo_profesional_id: int | None = None
    tipo_consulta: str | None = None
    observaciones: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class AdherenciaResponse(SQLModel):
    controles_realizados: int
    controles_esperados: int
    porcentaje_adherencia: float
    semana_gestacion_actual: int


# ---- Preguntas de Seguimiento ----

class OpcionPreguntaResponse(SQLModel):
    id: int
    texto_opcion: str
    valor_numerico: int | None = None
    es_alarma: bool

    model_config = {"from_attributes": True}


class PreguntaSegResponse(SQLModel):
    id: int
    texto_pregunta: str
    tipo_respuesta: str
    es_signo_alarma: bool
    frecuencia: str | None = None
    orden: int | None = None
    opciones: list[OpcionPreguntaResponse] = []

    model_config = {"from_attributes": True}


class RespuestaItem(SQLModel):
    pregunta_id: int
    respuesta_texto: str | None = None
    respuesta_booleana: bool | None = None
    respuesta_numerica: int | None = None
    opcion_id: int | None = None


class RespuestasRequest(SQLModel):
    respuestas: list[RespuestaItem]
    semana_gestacion: int | None = None


class RespuestaResponse(SQLModel):
    id: str
    pregunta_id: int
    respuesta_texto: str | None = None
    respuesta_booleana: bool | None = None
    respuesta_numerica: int | None = None
    opcion_id: int | None = None
    semana_gestacion: int | None = None
    alerta_id: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


# ---- Movimientos Fetales ----

class MovimientoFetalCreate(SQLModel):
    conteo: int
    duracion_minutos: int | None = None
    observaciones: str | None = None


class MovimientoFetalResponse(SQLModel):
    id: str
    conteo: int
    duracion_minutos: int | None = None
    observaciones: str | None = None
    fecha_reporte: datetime


# ---- Plan de Parto ----

class BirthPlanResponse(SQLModel):
    semana_gestacion: int
    fecha_probable_parto: date | None = None
    recomendaciones: list[str]


# ---- IPS más cercana ----

class IpsCercanaResponse(SQLModel):
    id: int
    nombre: str
    nivel: int | None = None
    mensaje: str


# ---- Checklist items ----

class ChecklistItemResponse(SQLModel):
    id: int
    texto: str
    modulo_id: int | None = None
    semana_eg: int | None = None
    orden: int | None = None
    completado: bool
    fecha_completado: datetime | None = None
