import uuid
from datetime import date, datetime

from sqlmodel import SQLModel, Field

# table=True significará que no será solo un schema sino también una tabla
class Gestante(SQLModel, table=True):
    __tablename__ = "gestante"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    codigo_gmi: str = Field(max_length=20, unique=True)
    fecha_nacimiento: date
    # TODO: foreign keys se agregan después cuando se creen los modelos
    nacionalidad_id: int | None = Field(default=None, foreign_key="gmi_catalogo.cat_nacionalidad.id")
    eapb_id: int | None = Field(default=None, foreign_key="gmi_catalogo.cat_eapb.id")
    pertenencia_etnica_id: int | None = Field(default=None, foreign_key="gmi_catalogo.cat_pertenencia_etnica.id")
    grupo_poblacional_id: int | None = Field(default=None, foreign_key="gmi_catalogo.cat_grupo_poblacional.id")
    tipo_regimen: str | None = Field(default=None, max_length=20)
    fecha_ultima_menstruacion: date
    fecha_probable_parto: date | None = None
    anio_ingreso: int
    fecha_ingreso_cpn: date | None = None
    semanas_eg_ingreso: int | None = None
    activa: bool = Field(default=True)
    # nullable porque cuando la gestante se crea por primera vez, el módulo se calcula con la fum
    modulo_activo_id: int | None = Field(default=None, foreign_key="gmi_catalogo.cat_modulo_clinico.id")
    created_at: datetime | None = Field(default_factory=datetime.utcnow)
    updated_at: datetime | None = Field(default_factory=datetime.utcnow)
    created_by: str | None = Field(default=None, foreign_key="gmi_auth.usuario_staff.id")


class PreguntaSeguridad(SQLModel, table=True):
    __tablename__ = "pregunta_seguridad"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    # relación 1:1 con gestante
    gestante_id: str = Field(foreign_key="gmi.gestante.id", unique=True)
    pregunta: str = Field(max_length=200)
    hash_respuesta: str = Field(max_length=256)
    created_at: datetime | None = Field(default_factory=datetime.utcnow)


class ConsentimientoInformado(SQLModel, table=True):
    __tablename__ = "consentimiento_informado"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    gestante_id: str = Field(foreign_key="gmi.gestante.id")
    hash_consentimiento: str = Field(max_length=256)
    version: str = Field(max_length=10)
    estado: str = Field(max_length=20)
    fecha_aceptacion: datetime
    created_at: datetime | None = Field(default_factory=datetime.utcnow)


class HistorialModulo(SQLModel, table=True):
    __tablename__ = "historial_modulo"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    gestante_id: str = Field(foreign_key="gmi.gestante.id")
    modulo_anterior_id: int | None = Field(default=None, foreign_key="gmi_catalogo.cat_modulo_clinico.id")
    modulo_nuevo_id: int = Field(foreign_key="gmi_catalogo.cat_modulo_clinico.id")
    motivo: str | None = None
    origen: str | None = Field(default=None, max_length=20)  # 'sistema', 'clinico', 'admin'
    created_by: str | None = Field(default=None, foreign_key="gmi_auth.usuario_staff.id")
    created_at: datetime | None = Field(default_factory=datetime.utcnow) 
    
       
class SolicitudActivacion(SQLModel, table=True):
    __tablename__ = "solicitud_activacion"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    codigo_gmi: str = Field(max_length=20, unique=True)
    pregunta: str = Field(max_length=200)
    hash_respuesta: str = Field(max_length=256)
    estado: str = Field(default="pendiente", max_length=20)
    created_at: datetime | None = Field(default_factory=datetime.utcnow)    
