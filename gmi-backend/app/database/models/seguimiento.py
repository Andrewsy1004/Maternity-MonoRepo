import uuid
from datetime import datetime

from sqlmodel import SQLModel, Field


class SintomaReportado(SQLModel, table=True):
    __tablename__ = "sintoma_reportado"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    gestante_id: str = Field(foreign_key="gmi.gestante.id")
    modulo_origen: str | None = Field(default=None, max_length=5)
    descripcion: str
    severidad: str | None = Field(default=None, max_length=20)
    fecha_reporte: datetime
    created_at: datetime | None = Field(default_factory=datetime.utcnow)


class PreguntaSeguimiento(SQLModel, table=True):
    __tablename__ = "pregunta_seguimiento"
    __table_args__ = {"schema": "gmi"}

    id: int | None = Field(default=None, primary_key=True)
    texto_pregunta: str
    tipo_respuesta: str = Field(max_length=30)  # 'si_no', 'opcion_multiple', 'texto_libre', 'escala_1_5'
    modulo_id: int | None = Field(default=None, foreign_key="gmi_catalogo.cat_modulo_clinico.id")
    frecuencia: str | None = Field(default=None, max_length=20)  # 'diaria', 'semanal', 'por_control'
    es_signo_alarma: bool = Field(default=False)
    prioridad_alerta_default_id: int | None = Field(default=None, foreign_key="gmi_catalogo.cat_prioridad_alerta.id")
    orden: int | None = None
    activo: bool = Field(default=True)
    created_at: datetime | None = Field(default_factory=datetime.utcnow)
    created_by: str | None = Field(default=None, foreign_key="gmi_auth.usuario_staff.id")


class OpcionPreguntaSeguimiento(SQLModel, table=True):
    __tablename__ = "opcion_pregunta_seguimiento"
    __table_args__ = {"schema": "gmi"}

    id: int | None = Field(default=None, primary_key=True)
    pregunta_id: int = Field(foreign_key="gmi.pregunta_seguimiento.id")
    texto_opcion: str = Field(max_length=200)
    valor_numerico: int | None = None
    es_alarma: bool = Field(default=False)
    prioridad_alerta_id: int | None = Field(default=None, foreign_key="gmi_catalogo.cat_prioridad_alerta.id")
    orden: int | None = None


class RespuestaSeguimiento(SQLModel, table=True):
    __tablename__ = "respuesta_seguimiento"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    gestante_id: str = Field(foreign_key="gmi.gestante.id")
    pregunta_id: int = Field(foreign_key="gmi.pregunta_seguimiento.id")
    respuesta_texto: str | None = None
    respuesta_booleana: bool | None = None
    respuesta_numerica: int | None = None
    opcion_id: int | None = Field(default=None, foreign_key="gmi.opcion_pregunta_seguimiento.id")
    semana_gestacion: int | None = None
    alerta_id: str | None = None  # FK se agrega después de crear gmi.alerta
    created_at: datetime | None = Field(default_factory=datetime.utcnow)