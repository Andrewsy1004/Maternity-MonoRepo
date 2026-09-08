import uuid
from datetime import datetime

from sqlmodel import SQLModel, Field


class CargaExcel(SQLModel, table=True):
    __tablename__ = "carga_excel"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    archivo_nombre: str = Field(max_length=200)
    estado: str = Field(max_length=30)
    total_gestantes: int | None = None
    nuevas: int | None = None
    actualizadas: int | None = None
    errores: int | None = None
    usuario_id: str | None = Field(default=None, foreign_key="gmi_auth.usuario_staff.id")
    created_at: datetime | None = Field(default_factory=datetime.utcnow)


class CargaExcelDetalle(SQLModel, table=True):
    __tablename__ = "carga_excel_detalle"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    carga_id: str = Field(foreign_key="gmi.carga_excel.id")
    fila_numero: int
    hoja: str = Field(max_length=50)
    estado: str = Field(max_length=20)
    mensaje_error: str | None = None
    created_at: datetime | None = Field(default_factory=datetime.utcnow)


class LlamadaEmergencia(SQLModel, table=True):
    __tablename__ = "llamada_emergencia"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    gestante_id: str = Field(foreign_key="gmi.gestante.id")
    alerta_id: str | None = Field(default=None, foreign_key="gmi.alerta.id")
    motivo: str | None = None
    destino: str | None = Field(default=None, max_length=100)
    duracion_seg: int | None = None
    resultado: str | None = Field(default=None, max_length=20)
    created_at: datetime | None = Field(default_factory=datetime.utcnow)


class CitaMedica(SQLModel, table=True):
    __tablename__ = "cita_medica"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    gestante_id: str = Field(foreign_key="gmi.gestante.id")
    ips_id: int | None = Field(default=None, foreign_key="gmi_catalogo.cat_ips.id")
    fecha_hora: datetime
    tipo_cita: str | None = Field(default=None, max_length=50)
    estado: str = Field(max_length=20)
    created_at: datetime | None = Field(default_factory=datetime.utcnow)


class Notificacion(SQLModel, table=True):
    __tablename__ = "notificacion"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    gestante_id: str = Field(foreign_key="gmi.gestante.id")
    canal: str = Field(max_length=20)
    contenido: str | None = None
    estado_entrega: str | None = Field(default=None, max_length=20)
    created_at: datetime | None = Field(default_factory=datetime.utcnow)


class ChatIa(SQLModel, table=True):
    __tablename__ = "chat_ia"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    gestante_id: str = Field(foreign_key="gmi.gestante.id")
    rol: str = Field(max_length=20)
    contenido: str
    alerta_id: str | None = Field(default=None, foreign_key="gmi.alerta.id")
    created_at: datetime | None = Field(default_factory=datetime.utcnow)