import uuid
from datetime import datetime

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import SQLModel, Field


class Rol(SQLModel, table=True):
    __tablename__ = "rol"
    __table_args__ = {"schema": "gmi_auth"}

    id: int | None = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=50, unique=True)
    descripcion: str | None = None
    activo: bool = Field(default=True)


class Permiso(SQLModel, table=True):
    __tablename__ = "permiso"
    __table_args__ = {"schema": "gmi_auth"}

    id: int | None = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=50, unique=True)
    descripcion: str | None = None


class RolPermiso(SQLModel, table=True):
    __tablename__ = "rol_permiso"
    __table_args__ = {"schema": "gmi_auth"}

    id_rol: int = Field(foreign_key="gmi_auth.rol.id", primary_key=True)
    id_permiso: int = Field(foreign_key="gmi_auth.permiso.id", primary_key=True)


class UsuarioStaff(SQLModel, table=True):
    __tablename__ = "usuario_staff"
    __table_args__ = {"schema": "gmi_auth"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    nombre: str = Field(max_length=100)
    email: str = Field(max_length=100, unique=True)
    hash_password: str = Field(max_length=256)
    rol_id: int = Field(foreign_key="gmi_auth.rol.id")
    ips_id: int | None = Field(default=None, foreign_key="gmi_catalogo.cat_ips.id")  # FK a cat_ips
    activo: bool = Field(default=True)
    ultimo_acceso: datetime | None = None
    created_at: datetime | None = Field(default_factory=datetime.utcnow)


class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_log"
    __table_args__ = {"schema": "gmi_auth"}

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    usuario_id: str | None = Field(default=None, foreign_key="gmi_auth.usuario_staff.id")
    gestante_id: str | None = Field(default=None, foreign_key="gmi.gestante.id")  # FK a gestante
    accion: str = Field(max_length=50)
    tabla_afectada: str = Field(max_length=50)
    registro_id: str | None = None
    ip_address: str | None = Field(default=None, max_length=45)
    detalle: dict | None = Field(default=None, sa_column=Column(JSONB, nullable=True))
    created_at: datetime | None = Field(default_factory=datetime.utcnow)