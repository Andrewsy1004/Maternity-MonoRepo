import uuid
from datetime import datetime

from sqlmodel import SQLModel, Field

# Ensure FK target tables are registered in metadata
import app.database.models.auth  # noqa: F401
import app.database.models.catalogos  # noqa: F401


class ClasificacionRiesgo(SQLModel, table=True):
    __tablename__ = "clasificacion_riesgo"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    gestante_id: str = Field(foreign_key="gmi.gestante.id")
    control_prenatal_id: str | None = Field(default=None, foreign_key="gmi.control_prenatal.id")
    tipo_riesgo: str = Field(max_length=30)  # 'obstetrico', 'biosicosocial'
    nivel: str = Field(max_length=10)  # 'alto', 'bajo'
    clasificacion_ia: str | None = Field(default=None, max_length=10)  # 'verde', 'amarillo', 'rojo'
    diagnostico_texto: str | None = None
    situaciones_biosicosocial: str | None = None
    explicacion_ia: str | None = None
    fecha_evaluacion: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime | None = Field(default_factory=datetime.utcnow)
    created_by: str | None = Field(default=None, foreign_key="gmi_auth.usuario_staff.id")


class Alerta(SQLModel, table=True):
    __tablename__ = "alerta"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    gestante_id: str = Field(foreign_key="gmi.gestante.id")
    clasificacion_riesgo_id: str | None = Field(default=None, foreign_key="gmi.clasificacion_riesgo.id")
    tipo_alerta_id: int = Field(foreign_key="gmi_catalogo.cat_tipo_alerta.id")
    prioridad_id: int = Field(foreign_key="gmi_catalogo.cat_prioridad_alerta.id")
    estado: str = Field(max_length=20)  # 'activa', 'leida', 'resuelta', 'escalada'
    modulo_origen: str | None = Field(default=None, max_length=5)
    descripcion: str | None = None
    resuelta_por: str | None = Field(default=None, foreign_key="gmi_auth.usuario_staff.id")
    fecha_resolucion: datetime | None = None
    created_at: datetime | None = Field(default_factory=datetime.utcnow)


class Referencia(SQLModel, table=True):
    __tablename__ = "referencia"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    gestante_id: str = Field(foreign_key="gmi.gestante.id")
    alerta_id: str | None = Field(default=None, foreign_key="gmi.alerta.id")
    ips_origen_id: int | None = Field(default=None, foreign_key="gmi_catalogo.cat_ips.id")
    ips_destino_id: int | None = Field(default=None, foreign_key="gmi_catalogo.cat_ips.id")
    estado: str = Field(max_length=20)
    motivo: str
    fecha_referencia: datetime
    created_at: datetime | None = Field(default_factory=datetime.utcnow)


class Contrareferencia(SQLModel, table=True):
    __tablename__ = "contrareferencia"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    # relación 1:1 con referencia
    referencia_id: str = Field(foreign_key="gmi.referencia.id", unique=True)
    respuesta: str
    diagnostico: str | None = None
    indicaciones: str | None = None
    fecha_atencion: datetime
    created_at: datetime | None = Field(default_factory=datetime.utcnow)