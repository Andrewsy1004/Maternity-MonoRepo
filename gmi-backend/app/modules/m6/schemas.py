from sqlmodel import SQLModel
from datetime import datetime


# ---- Alertas ----

class AlertaResponse(SQLModel):
    id: str
    tipo_alerta_id: int
    prioridad_id: int
    estado: str
    modulo_origen: str | None = None
    descripcion: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}

class AlertaDetalleResponse(SQLModel):
    id: str
    tipo_alerta_id: int
    prioridad_id: int
    estado: str
    modulo_origen: str | None = None
    descripcion: str | None = None
    resuelta_por: str | None = None
    fecha_resolucion: datetime | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}

# ---- Citas Médicas ----

class CitaMedicaCreate(SQLModel):
    ips_id: int | None = None
    fecha_hora: datetime
    tipo_cita: str | None = None

class CitaMedicaUpdate(SQLModel):
    fecha_hora: datetime

class CitaMedicaResponse(SQLModel):
    id: str
    ips_id: int | None = None
    fecha_hora: datetime
    tipo_cita: str | None = None
    estado: str
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


# ---- Recordatorios (próximas citas en los próximos 7 días) ----

class RecordatorioResponse(SQLModel):
    id: str
    fecha_hora: datetime
    tipo_cita: str | None = None
    estado: str

    model_config = {"from_attributes": True}


# ---- Notificaciones ----

class NotificacionResponse(SQLModel):
    id: str
    canal: str
    contenido: str | None = None
    estado_entrega: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}

# ---- Llamada de emergencia ----

class LlamadaEmergenciaCreate(SQLModel):
    motivo: str | None = None
    destino: str | None = None
    resultado: str | None = None

class LlamadaEmergenciaResponse(SQLModel):
    id: str
    motivo: str | None = None
    destino: str | None = None
    duracion_seg: int | None = None
    resultado: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}
