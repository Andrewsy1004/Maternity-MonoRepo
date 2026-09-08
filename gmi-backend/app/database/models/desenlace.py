import uuid
from datetime import date, datetime

from sqlmodel import SQLModel, Field


class Parto(SQLModel, table=True):
    __tablename__ = "parto"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    # relación 1:1 con gestante
    gestante_id: str = Field(foreign_key="gmi.gestante.id", unique=True)
    tipo_parto: str = Field(max_length=20)
    fecha_parto: date
    complicaciones: str | None = None
    uci_materna: bool = Field(default=False)
    muerte_materna: bool = Field(default=False)
    causa_muerte: str | None = None
    fecha_muerte: date | None = None
    created_at: datetime | None = Field(default_factory=datetime.utcnow)


class RecienNacido(SQLModel, table=True):
    __tablename__ = "recien_nacido"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    parto_id: str = Field(foreign_key="gmi.parto.id")
    vivo: bool
    peso_gramos: float | None = None
    talla_cm: float | None = None
    uci_neonatal: bool = Field(default=False)
    observaciones: str | None = None
    created_at: datetime | None = Field(default_factory=datetime.utcnow)


class Puerperio(SQLModel, table=True):
    __tablename__ = "puerperio"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    gestante_id: str = Field(foreign_key="gmi.gestante.id")
    dias_posparto: int
    fecha_evaluacion: date
    complicaciones: str | None = None
    observaciones: str | None = None
    created_at: datetime | None = Field(default_factory=datetime.utcnow)


class EvaluacionSaludMental(SQLModel, table=True):
    __tablename__ = "evaluacion_salud_mental"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    gestante_id: str = Field(foreign_key="gmi.gestante.id")
    instrumento: str = Field(max_length=20)  # 'EPDS', 'GAD7', 'PHQ9'
    puntaje: int
    fecha: date
    recomendaciones: str | None = None
    created_at: datetime | None = Field(default_factory=datetime.utcnow)


class AnticoncepcionPosparto(SQLModel, table=True):
    __tablename__ = "anticoncepcion_posparto"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    gestante_id: str = Field(foreign_key="gmi.gestante.id")
    metodo_id: int | None = Field(default=None, foreign_key="gmi_catalogo.cat_metodo_anticonceptivo.id")
    fecha_aplicacion: date
    created_at: datetime | None = Field(default_factory=datetime.utcnow)