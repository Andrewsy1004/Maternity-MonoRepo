from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.database.models.soporte import ChatIa
from app.database.models.gestante import Gestante
from app.database.models.perfil import PerfilClinico, FormulaObstetrica, AntecedentePatologico
from app.database.models.control import ControlPrenatal, SignosVitales
from app.database.models.examenes import ExamenLaboratorio
from app.database.models.riesgo import ClasificacionRiesgo, Alerta
from app.database.models.seguimiento import RespuestaSeguimiento, SintomaReportado
from app.database.models.catalogos import CatModuloClinico, CatTipoAlerta, CatPrioridadAlerta


# ---- Chat ----

async def create_mensaje(db: AsyncSession, mensaje: ChatIa) -> ChatIa:
    db.add(mensaje)
    await db.flush()
    await db.refresh(mensaje)
    return mensaje


async def get_historial_by_gestante(db: AsyncSession, gestante_id: str, limit: int = 20) -> list[ChatIa]:
    result = await db.execute(
        select(ChatIa)
        .where(ChatIa.gestante_id == gestante_id)
        .order_by(ChatIa.created_at.asc())
        .limit(limit)
    )
    return result.scalars().all()


async def delete_historial_by_gestante(db: AsyncSession, gestante_id: str) -> None:
    mensajes = await get_historial_by_gestante(db, gestante_id, limit=1000)
    for m in mensajes:
        await db.delete(m)
    await db.flush()


# ---- Contexto clínico (para construir prompts) ----

async def get_perfil_clinico(db: AsyncSession, gestante_id: str) -> PerfilClinico | None:
    result = await db.execute(
        select(PerfilClinico).where(PerfilClinico.gestante_id == gestante_id)
    )
    return result.scalars().one_or_none()


async def get_formula_obstetrica(db: AsyncSession, gestante_id: str) -> FormulaObstetrica | None:
    result = await db.execute(
        select(FormulaObstetrica).where(FormulaObstetrica.gestante_id == gestante_id)
    )
    return result.scalars().one_or_none()


async def get_antecedentes(db: AsyncSession, gestante_id: str) -> list[AntecedentePatologico]:
    result = await db.execute(
        select(AntecedentePatologico)
        .where(AntecedentePatologico.gestante_id == gestante_id)
    )
    return result.scalars().all()


async def get_ultimos_controles(db: AsyncSession, gestante_id: str, limit: int = 3) -> list[ControlPrenatal]:
    result = await db.execute(
        select(ControlPrenatal)
        .where(ControlPrenatal.gestante_id == gestante_id)
        .order_by(ControlPrenatal.fecha_control.desc())
        .limit(limit)
    )
    return result.scalars().all()


async def get_ultimos_signos_vitales(db: AsyncSession, gestante_id: str) -> SignosVitales | None:
    result = await db.execute(
        select(SignosVitales)
        .join(ControlPrenatal, SignosVitales.control_prenatal_id == ControlPrenatal.id)
        .where(ControlPrenatal.gestante_id == gestante_id)
        .order_by(ControlPrenatal.fecha_control.desc())
        .limit(1)
    )
    return result.scalars().one_or_none()


async def get_ultimos_examenes(db: AsyncSession, gestante_id: str, limit: int = 5) -> list[ExamenLaboratorio]:
    result = await db.execute(
        select(ExamenLaboratorio)
        .where(ExamenLaboratorio.gestante_id == gestante_id)
        .order_by(ExamenLaboratorio.fecha_toma.desc())
        .limit(limit)
    )
    return result.scalars().all()


async def get_ultima_clasificacion_riesgo(db: AsyncSession, gestante_id: str) -> ClasificacionRiesgo | None:
    result = await db.execute(
        select(ClasificacionRiesgo)
        .where(ClasificacionRiesgo.gestante_id == gestante_id)
        .order_by(ClasificacionRiesgo.fecha_evaluacion.desc())
        .limit(1)
    )
    return result.scalars().one_or_none()


async def get_clasificacion_riesgo_by_id(db: AsyncSession, assessment_id: str) -> ClasificacionRiesgo | None:
    result = await db.execute(
        select(ClasificacionRiesgo).where(ClasificacionRiesgo.id == assessment_id)
    )
    return result.scalars().one_or_none()


async def get_alertas_activas(db: AsyncSession, gestante_id: str) -> list[Alerta]:
    result = await db.execute(
        select(Alerta)
        .where(Alerta.gestante_id == gestante_id)
        .where(Alerta.estado == "activa")
        .order_by(Alerta.created_at.desc())
    )
    return result.scalars().all()


async def get_ultimas_respuestas_seguimiento(db: AsyncSession, gestante_id: str, limit: int = 10) -> list[RespuestaSeguimiento]:
    result = await db.execute(
        select(RespuestaSeguimiento)
        .where(RespuestaSeguimiento.gestante_id == gestante_id)
        .order_by(RespuestaSeguimiento.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


async def get_ultimos_sintomas(db: AsyncSession, gestante_id: str, limit: int = 5) -> list[SintomaReportado]:
    result = await db.execute(
        select(SintomaReportado)
        .where(SintomaReportado.gestante_id == gestante_id)
        .where(SintomaReportado.modulo_origen != "MF")
        .order_by(SintomaReportado.fecha_reporte.desc())
        .limit(limit)
    )
    return result.scalars().all()


async def get_modulo_by_id(db: AsyncSession, modulo_id: int) -> CatModuloClinico | None:
    result = await db.execute(
        select(CatModuloClinico).where(CatModuloClinico.id == modulo_id)
    )
    return result.scalars().one_or_none()


async def create_clasificacion_riesgo(db: AsyncSession, clasificacion: ClasificacionRiesgo) -> ClasificacionRiesgo:
    db.add(clasificacion)
    await db.flush()
    await db.refresh(clasificacion)
    return clasificacion

# ---- Alertas IA ----

async def get_tipo_alerta_by_codigo(db: AsyncSession, codigo: str) -> CatTipoAlerta | None:
    result = await db.execute(
        select(CatTipoAlerta).where(CatTipoAlerta.codigo == codigo)
    )
    return result.scalars().one_or_none()


async def get_prioridad_by_codigo(db: AsyncSession, codigo: str) -> CatPrioridadAlerta | None:
    result = await db.execute(
        select(CatPrioridadAlerta).where(CatPrioridadAlerta.codigo == codigo)
    )
    return result.scalars().one_or_none()


async def create_alerta(db: AsyncSession, alerta: Alerta) -> Alerta:
    db.add(alerta)
    await db.flush()
    await db.refresh(alerta)
    return alerta


# ---- Staff: gestión de alertas ----

async def get_alerta_by_id(db: AsyncSession, alerta_id: str) -> Alerta | None:
    result = await db.execute(
        select(Alerta).where(Alerta.id == alerta_id)
    )
    return result.scalars().one_or_none()


async def get_alertas_with_catalogo_by_gestante(db: AsyncSession, gestante_id: str) -> list:
    result = await db.execute(
        select(Alerta, CatTipoAlerta.nombre, CatPrioridadAlerta.codigo)
        .join(CatTipoAlerta, Alerta.tipo_alerta_id == CatTipoAlerta.id)
        .join(CatPrioridadAlerta, Alerta.prioridad_id == CatPrioridadAlerta.id)
        .where(Alerta.gestante_id == gestante_id)
        .order_by(Alerta.created_at.desc())
    )
    return result.all()


async def update_alerta(db: AsyncSession, alerta: Alerta) -> Alerta:
    db.add(alerta)
    await db.flush()
    await db.refresh(alerta)
    return alerta