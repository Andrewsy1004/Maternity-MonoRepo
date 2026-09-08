import uuid
from datetime import datetime, date

from sqlmodel import SQLModel, Field


class PerfilClinico(SQLModel, table=True):
    __tablename__ = "perfil_clinico"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    # relación 1:1 con gestante
    gestante_id: str = Field(foreign_key="gmi.gestante.id", unique=True)
    enfermedades_cronicas: str | None = None
    alergias: str | None = None
    habitos: str | None = None
    condiciones_riesgo: str | None = None
    created_at: datetime | None = Field(default_factory=datetime.utcnow)
    updated_at: datetime | None = Field(default_factory=datetime.utcnow)


class FormulaObstetrica(SQLModel, table=True):
    __tablename__ = "formula_obstetrica"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    # relación 1:1 con gestante
    gestante_id: str = Field(foreign_key="gmi.gestante.id", unique=True)
    gestaciones: int = Field(default=0)
    partos: int = Field(default=0)
    cesareas: int = Field(default=0)
    abortos: int = Field(default=0)
    vivos: int = Field(default=0)
    mortinatos: int = Field(default=0)
    created_at: datetime | None = Field(default_factory=datetime.utcnow)


class AntecedentePatologico(SQLModel, table=True):
    __tablename__ = "antecedente_patologico"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    gestante_id: str = Field(foreign_key="gmi.gestante.id")
    tipo_condicion: str = Field(max_length=100)
    descripcion: str | None = None
    fecha_diagnostico: date | None = None  # date
    controlada: bool | None = None
    tratamiento_actual: str | None = None
    created_at: datetime | None = Field(default_factory=datetime.utcnow)