from sqlmodel import SQLModel
from datetime import datetime, date


# ---- Contenidos por Módulo y EG ----

class ContenidoEducativoResponse(SQLModel):
    id: int
    titulo: str
    descripcion: str | None = None
    tipo_contenido: str | None = None
    url_recurso: str | None = None
    url_imagen: str | None = None
    duracion_minutos: int | None = None
    orden: int | None = None

    model_config = {"from_attributes": True}


# ---- Detalle de Contenido ----

class OpcionRespuestaResponse(SQLModel):
    id: int
    texto_opcion: str
    orden: int | None = None

    model_config = {"from_attributes": True}


class PreguntaEducativaResponse(SQLModel):
    id: int
    texto_pregunta: str
    tipo_pregunta: str | None = None
    orden: int | None = None
    opciones: list[OpcionRespuestaResponse] = []

    model_config = {"from_attributes": True}


class ContenidoEducativoDetalleResponse(SQLModel):
    id: int
    titulo: str
    descripcion: str | None = None
    tipo_contenido: str | None = None
    cuerpo_texto: str | None = None
    url_recurso: str | None = None
    url_imagen: str | None = None
    duracion_minutos: int | None = None
    orden: int | None = None
    preguntas: list[PreguntaEducativaResponse] = []

    model_config = {"from_attributes": True}


# ---- Categorías de Contenido ----

class CategoriaResponse(SQLModel):
    id: int
    nombre: str
    descripcion: str | None = None
    icono: str | None = None
    orden: int | None = None

    model_config = {"from_attributes": True}

# ---- Progreso de gestante ----

class ProgresoResponse(SQLModel):
    contenido_id: int
    completado: bool
    fecha_completado: datetime | None = None

    model_config = {"from_attributes": True}

# ---- Checklist gestante ----

class ChecklistItemResponse(SQLModel):
    id: int
    texto: str
    orden: int | None = None
    completado: bool = False
    fecha_completado: datetime | None = None

    model_config = {"from_attributes": True}

class ChecklistResponse(SQLModel):
    modulo_id: int
    total_items: int
    completados: int
    items: list[ChecklistItemResponse]

class CompletadoUpdate(SQLModel):
    completado: bool

# ---- Salud Mental ----

class TamizajeCreate(SQLModel):
    instrumento: str
    puntaje: int

class TamizajeResponse(SQLModel):
    id: str
    instrumento: str
    puntaje: int
    fecha: date
    recomendaciones: str | None = None

    model_config = {"from_attributes": True}

class RecommendationsResponse(SQLModel):
    id: str
    recomendaciones: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}

# ---- Autoevaluaciones ----

class AutoevaluacionCreate(SQLModel):
    pregunta_id: int
    respuesta_texto: str | None = None
    respuesta_booleana: bool | None = None
    respuesta_numerica: int | None = None
    opcion_id: int | None = None

class AutoevaluacionResponse(SQLModel):
    id: str
    pregunta_id: int
    respuesta_texto: str | None = None
    respuesta_booleana: bool | None = None
    respuesta_numerica: int | None = None
    opcion_id: int | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}

class AutoevaluacionDetalleResponse(SQLModel):
    id: str
    pregunta_id: int
    texto_pregunta: str
    tipo_respuesta: str
    respuesta_texto: str | None = None
    respuesta_booleana: bool | None = None
    respuesta_numerica: int | None = None
    opcion_id: int | None = None
    texto_opcion: str | None = None
    created_at: datetime | None = None

