import uuid
from datetime import datetime

from sqlmodel import SQLModel, Field

# Ensure catalogo models are registered in metadata before FK resolution
import app.database.models.catalogos  # noqa: F401


class CatCategoriaEducativa(SQLModel, table=True):
    __tablename__ = "cat_categoria_educativa"
    __table_args__ = {"schema": "gmi"}

    id: int | None = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100)
    descripcion: str | None = None
    icono: str | None = Field(default=None, max_length=100)
    orden: int | None = None
    activo: bool = Field(default=True)


class ContenidoEducativo(SQLModel, table=True):
    __tablename__ = "contenido_educativo"
    __table_args__ = {"schema": "gmi"}

    id: int | None = Field(default=None, primary_key=True)
    categoria_id: int | None = Field(default=None, foreign_key="gmi.cat_categoria_educativa.id")
    titulo: str = Field(max_length=200)
    descripcion: str | None = None
    tipo_contenido: str | None = Field(default=None, max_length=30)  # 'texto', 'video', 'audio', 'infografia', 'interactivo'
    cuerpo_texto: str | None = None
    url_recurso: str | None = Field(default=None, max_length=500)
    url_imagen: str | None = Field(default=None, max_length=500)
    modulo_id: int | None = Field(default=None, foreign_key="gmi_catalogo.cat_modulo_clinico.id")
    semana_eg_inicio: int | None = None
    semana_eg_fin: int | None = None
    duracion_minutos: int | None = None
    orden: int | None = None
    activo: bool = Field(default=True)
    created_at: datetime | None = Field(default_factory=datetime.utcnow)
    created_by: str | None = Field(default=None, foreign_key="gmi_auth.usuario_staff.id")


class PreguntaEducativa(SQLModel, table=True):
    __tablename__ = "pregunta_educativa"
    __table_args__ = {"schema": "gmi"}

    id: int | None = Field(default=None, primary_key=True)
    contenido_id: int = Field(foreign_key="gmi.contenido_educativo.id")
    texto_pregunta: str
    tipo_pregunta: str | None = Field(default=None, max_length=30)  # 'opcion_multiple', 'verdadero_falso'
    orden: int | None = None
    activo: bool = Field(default=True)


class OpcionRespuestaEducativa(SQLModel, table=True):
    __tablename__ = "opcion_respuesta_educativa"
    __table_args__ = {"schema": "gmi"}

    id: int | None = Field(default=None, primary_key=True)
    pregunta_id: int = Field(foreign_key="gmi.pregunta_educativa.id")
    texto_opcion: str
    es_correcta: bool
    orden: int | None = None


class RespuestaEducativaGestante(SQLModel, table=True):
    __tablename__ = "respuesta_educativa_gestante"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    gestante_id: str = Field(foreign_key="gmi.gestante.id")
    pregunta_id: int = Field(foreign_key="gmi.pregunta_educativa.id")
    opcion_seleccionada_id: int | None = Field(default=None, foreign_key="gmi.opcion_respuesta_educativa.id")
    es_correcta: bool | None = None
    created_at: datetime | None = Field(default_factory=datetime.utcnow)


class ChecklistItem(SQLModel, table=True):
    __tablename__ = "checklist_item"
    __table_args__ = {"schema": "gmi"}

    id: int | None = Field(default=None, primary_key=True)
    texto: str = Field(max_length=200)
    modulo_id: int | None = Field(default=None, foreign_key="gmi_catalogo.cat_modulo_clinico.id")
    semana_eg: int | None = None
    orden: int | None = None
    activo: bool = Field(default=True)


class ChecklistGestante(SQLModel, table=True):
    __tablename__ = "checklist_gestante"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    gestante_id: str = Field(foreign_key="gmi.gestante.id")
    checklist_item_id: int = Field(foreign_key="gmi.checklist_item.id")
    completado: bool = Field(default=False)
    fecha_completado: datetime | None = None
    created_at: datetime | None = Field(default_factory=datetime.utcnow)


class ProgresoEducativo(SQLModel, table=True):
    __tablename__ = "progreso_educativo"
    __table_args__ = {"schema": "gmi"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    gestante_id: str = Field(foreign_key="gmi.gestante.id")
    contenido_id: int = Field(foreign_key="gmi.contenido_educativo.id")
    completado: bool = Field(default=False)
    fecha_completado: datetime | None = None
    created_at: datetime | None = Field(default_factory=datetime.utcnow)