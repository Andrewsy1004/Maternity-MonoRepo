from datetime import datetime, date
from typing import Optional, Any
from pydantic import BaseModel, model_validator


# ---- 11.2 Carga Masiva Excel ----
class CargaDetalleResponse(BaseModel):
    fila_numero: int
    hoja: str
    estado: str
    mensaje_error: Optional[str]

    class Config:
        from_attributes = True


class CargaExcelResponse(BaseModel):
    id: str
    archivo_nombre: str
    estado: str
    total_gestantes: Optional[int]
    nuevas: Optional[int]
    actualizadas: Optional[int]
    errores: Optional[int]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class CargaExcelDetalleResponse(CargaExcelResponse):
    detalles: list[CargaDetalleResponse] = []


# ---- 11.1 Usuarios y Roles ----

class RoleResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: str
    nombre: str
    rol_id: int
    password: str


class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    rol_id: Optional[int] = None


class UserStatusUpdate(BaseModel):
    activo: bool


class UserResponse(BaseModel):
    id: str
    email: str
    nombre: str
    rol_id: int
    activo: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- 11.3 Catálogos ----

class CatalogItemCreate(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    grupo: Optional[str] = None
    descripcion: Optional[str] = None
    # CatTipoExamen
    unidad: Optional[str] = None
    # CatVacuna
    dosis_esperadas: Optional[int] = None
    # CatModuloClinico
    semana_eg_inicio: Optional[int] = None
    semana_eg_fin: Optional[int] = None
    # CatPrioridadAlerta
    color_hex: Optional[str] = None
    requiere_accion_inmediata: Optional[bool] = None
    # CatIps
    nivel: Optional[int] = None
    # CatEapb
    regimen: Optional[str] = None

    @model_validator(mode="after")
    def require_at_least_one_name(self) -> "CatalogItemCreate":
        if not self.nombre and not self.codigo and not self.grupo:
            raise ValueError("Se requiere al menos uno de: nombre, codigo, grupo.")
        return self

class CatalogItemUpdate(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    grupo: Optional[str] = None
    descripcion: Optional[str] = None
    unidad: Optional[str] = None
    dosis_esperadas: Optional[int] = None
    semana_eg_inicio: Optional[int] = None
    semana_eg_fin: Optional[int] = None
    color_hex: Optional[str] = None
    requiere_accion_inmediata: Optional[bool] = None
    nivel: Optional[int] = None
    regimen: Optional[str] = None

class CatalogItemStatusUpdate(BaseModel):
    activo: bool

class CatalogItemResponse(BaseModel):
    id: int
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    grupo: Optional[str] = None
    descripcion: Optional[str] = None
    activo: bool
    unidad: Optional[str] = None
    dosis_esperadas: Optional[int] = None
    semana_eg_inicio: Optional[int] = None
    semana_eg_fin: Optional[int] = None
    color_hex: Optional[str] = None
    requiere_accion_inmediata: Optional[bool] = None
    nivel: Optional[int] = None
    regimen: Optional[str] = None

    class Config:
        from_attributes = True


# ---- 11.4 Contenido Educativo ----

class EducationalCategoryCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    icono: Optional[str] = None
    orden: Optional[int] = None

class EducationalCategoryUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    icono: Optional[str] = None
    orden: Optional[int] = None

class EducationalCategoryResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    icono: Optional[str] = None
    orden: Optional[int] = None
    activo: bool

    class Config:
        from_attributes = True

class EducationalContentCreate(BaseModel):
    categoria_id: Optional[int] = None
    titulo: str
    descripcion: Optional[str] = None
    tipo_contenido: Optional[str] = None
    cuerpo_texto: Optional[str] = None
    url_recurso: Optional[str] = None
    url_imagen: Optional[str] = None
    modulo_id: Optional[int] = None
    semana_eg_inicio: Optional[int] = None
    semana_eg_fin: Optional[int] = None
    duracion_minutos: Optional[int] = None
    orden: Optional[int] = None

class EducationalContentUpdate(BaseModel):
    categoria_id: Optional[int] = None
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    tipo_contenido: Optional[str] = None
    cuerpo_texto: Optional[str] = None
    url_recurso: Optional[str] = None
    url_imagen: Optional[str] = None
    modulo_id: Optional[int] = None
    semana_eg_inicio: Optional[int] = None
    semana_eg_fin: Optional[int] = None
    duracion_minutos: Optional[int] = None
    orden: Optional[int] = None

class EducationalContentStatusUpdate(BaseModel):
    activo: bool

class EducationalContentResponse(BaseModel):
    id: int
    categoria_id: Optional[int] = None
    titulo: str
    descripcion: Optional[str] = None
    tipo_contenido: Optional[str] = None
    cuerpo_texto: Optional[str] = None
    url_recurso: Optional[str] = None
    url_imagen: Optional[str] = None
    modulo_id: Optional[int] = None
    semana_eg_inicio: Optional[int] = None
    semana_eg_fin: Optional[int] = None
    duracion_minutos: Optional[int] = None
    orden: Optional[int] = None
    activo: bool
    created_at: Optional[datetime] = None
    created_by: Optional[str] = None

    class Config:
        from_attributes = True

class ChecklistItemCreate(BaseModel):
    texto: str
    modulo_id: Optional[int] = None
    semana_eg: Optional[int] = None
    orden: Optional[int] = None

class ChecklistItemUpdate(BaseModel):
    texto: Optional[str] = None
    modulo_id: Optional[int] = None
    semana_eg: Optional[int] = None
    orden: Optional[int] = None

class ChecklistItemStatusUpdate(BaseModel):
    activo: bool

class ChecklistItemResponse(BaseModel):
    id: int
    texto: str
    modulo_id: Optional[int] = None
    semana_eg: Optional[int] = None
    orden: Optional[int] = None
    activo: bool

    class Config:
        from_attributes = True


# ---- 11.5 Preguntas de Seguimiento ----

class FollowUpQuestionCreate(BaseModel):
    texto_pregunta: str
    tipo_respuesta: str
    modulo_id: Optional[int] = None
    frecuencia: Optional[str] = None
    es_signo_alarma: bool = False
    prioridad_alerta_default_id: Optional[int] = None
    orden: Optional[int] = None

class FollowUpQuestionUpdate(BaseModel):
    texto_pregunta: Optional[str] = None
    tipo_respuesta: Optional[str] = None
    modulo_id: Optional[int] = None
    frecuencia: Optional[str] = None
    es_signo_alarma: Optional[bool] = None
    prioridad_alerta_default_id: Optional[int] = None
    orden: Optional[int] = None

class FollowUpQuestionStatusUpdate(BaseModel):
    activo: bool

class FollowUpQuestionResponse(BaseModel):
    id: int
    texto_pregunta: str
    tipo_respuesta: str
    modulo_id: Optional[int] = None
    frecuencia: Optional[str] = None
    es_signo_alarma: bool
    prioridad_alerta_default_id: Optional[int] = None
    orden: Optional[int] = None
    activo: bool

    class Config:
        from_attributes = True

class QuestionOptionCreate(BaseModel):
    texto_opcion: str
    valor_numerico: Optional[int] = None
    es_alarma: bool = False
    prioridad_alerta_id: Optional[int] = None
    orden: Optional[int] = None

class QuestionOptionUpdate(BaseModel):
    texto_opcion: Optional[str] = None
    valor_numerico: Optional[int] = None
    es_alarma: Optional[bool] = None
    prioridad_alerta_id: Optional[int] = None
    orden: Optional[int] = None

class QuestionOptionResponse(BaseModel):
    id: int
    pregunta_id: int
    texto_opcion: str
    valor_numerico: Optional[int] = None
    es_alarma: bool
    prioridad_alerta_id: Optional[int] = None
    orden: Optional[int] = None

    class Config:
        from_attributes = True


# ---- 11.6 Auditoría y Monitoreo ----

class AuditLogResponse(BaseModel):
    id: str
    usuario_id: Optional[str] = None
    gestante_id: Optional[str] = None
    accion: str
    tabla_afectada: str
    registro_id: Optional[str] = None
    ip_address: Optional[str] = None
    detalle: Optional[Any] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SystemHealthResponse(BaseModel):
    status: str
    database: str
    version: str
    uptime: str


# ---- 12. Vista Admin de Gestantes ----

class AlertaAdminResponse(BaseModel):
    id: str
    descripcion: Optional[str] = None
    estado: str
    modulo_origen: Optional[str] = None
    tipo_alerta: Optional[str] = None
    prioridad: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RespuestaConPreguntaResponse(BaseModel):
    id: str
    pregunta_id: int
    pregunta_texto: str
    tipo_respuesta: str
    respuesta_texto: Optional[str] = None
    respuesta_booleana: Optional[bool] = None
    respuesta_numerica: Optional[int] = None
    opcion_id: Optional[int] = None
    semana_gestacion: Optional[int] = None
    alerta_id: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Citas Admin ----

class CitaAdminResponse(BaseModel):
    id: str
    gestante_id: str
    codigo_gmi: str
    ips_id: Optional[int] = None
    ips_nombre: Optional[str] = None
    fecha_hora: datetime
    tipo_cita: Optional[str] = None
    estado: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CitaAdminCreate(BaseModel):
    gestante_id: str
    ips_id: Optional[int] = None
    fecha_hora: datetime
    tipo_cita: Optional[str] = None


# ---- 11.9 Gestantes ----

class GestanteListResponse(BaseModel):
    id: str
    codigo_gmi: str
    fecha_nacimiento: date
    fecha_ultima_menstruacion: date
    fecha_probable_parto: Optional[date] = None
    semanas_eg_ingreso: Optional[int] = None
    modulo_activo_id: Optional[int] = None
    activa: bool
    anio_ingreso: int
    created_at: Optional[datetime] = None
    ultimo_acceso: Optional[datetime] = None
    ultima_pregunta_respondida: Optional[str] = None
    ultima_respuesta_fecha: Optional[datetime] = None
    ultimo_estado_alerta: Optional[str] = None
    ultima_prioridad_alerta_id: Optional[int] = None
    nivel_riesgo: Optional[str] = None
    clasificacion_ia: Optional[str] = None

    class Config:
        from_attributes = True