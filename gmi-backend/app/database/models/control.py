import uuid
from datetime import date, datetime

from sqlmodel import SQLModel, Field


class ControlPrenatal(SQLModel, table=True):
    __tablename__ = "control_prenatal"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    gestante_id: str = Field(foreign_key="gmi.gestante.id")
    numero_control: int
    fecha_control: date
    semana_gestacion: int
    # trimestre se calcula automáticamente en base a semana_gestacion (columna generada en DB)
    ips_id: int | None = Field(default=None, foreign_key="gmi_catalogo.cat_ips.id")
    tipo_profesional_id: int | None = Field(default=None, foreign_key="gmi_catalogo.cat_tipo_profesional.id")
    tipo_consulta: str | None = Field(default=None, max_length=50)
    observaciones: str | None = None
    created_at: datetime | None = Field(default_factory=datetime.utcnow)
    created_by: str | None = Field(default=None, foreign_key="gmi_auth.usuario_staff.id")


class SignosVitales(SQLModel, table=True):
    __tablename__ = "signos_vitales"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    # relación 1:1 con control prenatal
    control_prenatal_id: str = Field(foreign_key="gmi.control_prenatal.id", unique=True)
    peso_kg: float
    talla_cm: float | None = None
    imc: float | None = None
    estado_nutricional_id: int | None = Field(default=None, foreign_key="gmi_catalogo.cat_estado_nutricional.id")
    altura_uterina: float | None = None
    presion_sistolica: int | None = None
    presion_diastolica: int | None = None
    fcf: int | None = None  # frecuencia cardiaca fetal
    created_at: datetime | None = Field(default_factory=datetime.utcnow)