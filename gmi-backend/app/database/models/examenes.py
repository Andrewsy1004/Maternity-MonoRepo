import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlmodel import SQLModel, Field


class ExamenLaboratorio(SQLModel, table=True):
    __tablename__ = "examen_laboratorio"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    gestante_id: str = Field(foreign_key="gmi.gestante.id")
    control_prenatal_id: str | None = Field(default=None, foreign_key="gmi.control_prenatal.id")
    tipo_examen_id: int = Field(foreign_key="gmi_catalogo.cat_tipo_examen.id")
    fecha_toma: date
    resultado: str = Field(max_length=100)
    resultado_numerico: Decimal | None = None
    unidad: str | None = Field(default=None, max_length=20)
    trimestre: int | None = None
    semana_gestacion: int | None = None
    observaciones: str | None = None
    created_at: datetime | None = Field(default_factory=datetime.utcnow)
    created_by: str | None = Field(default=None, foreign_key="gmi_auth.usuario_staff.id")


class Ecografia(SQLModel, table=True):
    __tablename__ = "ecografia"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    gestante_id: str = Field(foreign_key="gmi.gestante.id")
    tipo_ecografia_id: int | None = Field(default=None, foreign_key="gmi_catalogo.cat_tipo_ecografia.id")
    fecha: date
    semana_gestacion: int | None = None
    resultado: str | None = None
    plan_manejo: str | None = None
    created_at: datetime | None = Field(default_factory=datetime.utcnow)