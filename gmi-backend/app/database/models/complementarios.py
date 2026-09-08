import uuid
from datetime import date, datetime

from sqlmodel import SQLModel, Field


class Vacunacion(SQLModel, table=True):
    __tablename__ = "vacunacion"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    gestante_id: str = Field(foreign_key="gmi.gestante.id")
    vacuna_id: int = Field(foreign_key="gmi_catalogo.cat_vacuna.id")
    dosis: str = Field(max_length=20)
    fecha_aplicacion: date
    created_at: datetime | None = Field(default_factory=datetime.utcnow)


class SuministroMicronutriente(SQLModel, table=True):
    __tablename__ = "suministro_micronutriente"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    gestante_id: str = Field(foreign_key="gmi.gestante.id")
    micronutriente_id: int = Field(foreign_key="gmi_catalogo.cat_micronutriente.id")
    suministrado: bool
    fecha_inicio: date | None = None
    created_at: datetime | None = Field(default_factory=datetime.utcnow)


class RemisionInterdisciplinaria(SQLModel, table=True):
    __tablename__ = "remision_interdisciplinaria"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    gestante_id: str = Field(foreign_key="gmi.gestante.id")
    especialidad_id: int = Field(foreign_key="gmi_catalogo.cat_especialidad.id")
    fecha_remision: date
    fecha_atencion: date | None = None
    semana_gestacion: int | None = None
    created_at: datetime | None = Field(default_factory=datetime.utcnow)