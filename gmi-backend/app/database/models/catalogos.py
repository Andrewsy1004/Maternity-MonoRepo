from sqlmodel import SQLModel, Field

class CatModuloClinico(SQLModel, table=True):
    __tablename__ = "cat_modulo_clinico"
    __table_args__ = {"schema": "gmi_catalogo"}

    id: int | None = Field(default=None, primary_key=True)
    codigo: str = Field(max_length=5, unique=True)
    nombre: str = Field(max_length=100)
    semana_eg_inicio: int | None = None
    semana_eg_fin: int | None = None
    descripcion: str | None = None
    activo: bool = Field(default=True)


class CatPrioridadAlerta(SQLModel, table=True):
    __tablename__ = "cat_prioridad_alerta"
    __table_args__ = {"schema": "gmi_catalogo"}

    id: int | None = Field(default=None, primary_key=True)
    codigo: str = Field(max_length=10, unique=True)
    nombre: str = Field(max_length=50)
    color_hex: str | None = Field(default=None, max_length=7)
    requiere_accion_inmediata: bool = Field(default=False)
    activo: bool = Field(default=True)


class CatTipoAlerta(SQLModel, table=True):
    __tablename__ = "cat_tipo_alerta"
    __table_args__ = {"schema": "gmi_catalogo"}

    id: int | None = Field(default=None, primary_key=True)
    codigo: str = Field(max_length=30, unique=True)
    nombre: str = Field(max_length=100)
    descripcion: str | None = None
    activo: bool = Field(default=True)


class CatIps(SQLModel, table=True):
    __tablename__ = "cat_ips"
    __table_args__ = {"schema": "gmi_catalogo"}

    id: int | None = Field(default=None, primary_key=True)
    codigo: str | None = Field(default=None, max_length=20, unique=True)
    nombre: str = Field(max_length=100)
    nivel: int | None = None
    activo: bool = Field(default=True)


class CatEapb(SQLModel, table=True):
    __tablename__ = "cat_eapb"
    __table_args__ = {"schema": "gmi_catalogo"}

    id: int | None = Field(default=None, primary_key=True)
    codigo: str | None = Field(default=None, max_length=20, unique=True)
    nombre: str = Field(max_length=100)
    regimen: str | None = Field(default=None, max_length=20)
    activo: bool = Field(default=True)


class CatTipoExamen(SQLModel, table=True):
    __tablename__ = "cat_tipo_examen"
    __table_args__ = {"schema": "gmi_catalogo"}

    id: int | None = Field(default=None, primary_key=True)
    codigo: str | None = Field(default=None, max_length=20, unique=True)
    nombre: str = Field(max_length=100)
    unidad: str | None = Field(default=None, max_length=20)
    activo: bool = Field(default=True)


class CatTipoEcografia(SQLModel, table=True):
    __tablename__ = "cat_tipo_ecografia"
    __table_args__ = {"schema": "gmi_catalogo"}

    id: int | None = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100)
    activo: bool = Field(default=True)


class CatEstadoNutricional(SQLModel, table=True):
    __tablename__ = "cat_estado_nutricional"
    __table_args__ = {"schema": "gmi_catalogo"}

    id: int | None = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=50)
    activo: bool = Field(default=True)


class CatHemoclasificacion(SQLModel, table=True):
    __tablename__ = "cat_hemoclasificacion"
    __table_args__ = {"schema": "gmi_catalogo"}

    id: int | None = Field(default=None, primary_key=True)
    grupo: str = Field(max_length=5)
    activo: bool = Field(default=True)


class CatDiagnosticoCie10(SQLModel, table=True):
    __tablename__ = "cat_diagnostico_cie10"
    __table_args__ = {"schema": "gmi_catalogo"}

    id: int | None = Field(default=None, primary_key=True)
    codigo: str = Field(max_length=10, unique=True)
    nombre: str = Field(max_length=200)
    activo: bool = Field(default=True)


class CatVacuna(SQLModel, table=True):
    __tablename__ = "cat_vacuna"
    __table_args__ = {"schema": "gmi_catalogo"}

    id: int | None = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100)
    dosis_esperadas: int | None = None
    activo: bool = Field(default=True)


class CatMicronutriente(SQLModel, table=True):
    __tablename__ = "cat_micronutriente"
    __table_args__ = {"schema": "gmi_catalogo"}

    id: int | None = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100)
    activo: bool = Field(default=True)


class CatTipoProfesional(SQLModel, table=True):
    __tablename__ = "cat_tipo_profesional"
    __table_args__ = {"schema": "gmi_catalogo"}

    id: int | None = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=50)
    activo: bool = Field(default=True)


class CatEspecialidad(SQLModel, table=True):
    __tablename__ = "cat_especialidad"
    __table_args__ = {"schema": "gmi_catalogo"}

    id: int | None = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100)
    activo: bool = Field(default=True)


class CatMetodoAnticonceptivo(SQLModel, table=True):
    __tablename__ = "cat_metodo_anticonceptivo"
    __table_args__ = {"schema": "gmi_catalogo"}

    id: int | None = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100)
    activo: bool = Field(default=True)


class CatNacionalidad(SQLModel, table=True):
    __tablename__ = "cat_nacionalidad"
    __table_args__ = {"schema": "gmi_catalogo"}

    id: int | None = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=50)
    activo: bool = Field(default=True)


class CatPertenenciaEtnica(SQLModel, table=True):
    __tablename__ = "cat_pertenencia_etnica"
    __table_args__ = {"schema": "gmi_catalogo"}

    id: int | None = Field(default=None, primary_key=True)
    codigo: str | None = Field(default=None, max_length=10)
    nombre: str = Field(max_length=100)
    activo: bool = Field(default=True)


class CatGrupoPoblacional(SQLModel, table=True):
    __tablename__ = "cat_grupo_poblacional"
    __table_args__ = {"schema": "gmi_catalogo"}

    id: int | None = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100)
    activo: bool = Field(default=True)