from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.database.models.gestante import Gestante, PreguntaSeguridad
from app.database.models.perfil import PerfilClinico, FormulaObstetrica, AntecedentePatologico
from app.database.models.gestante import ConsentimientoInformado
from app.database.models.gestante import HistorialModulo
from app.database.models.catalogos import CatModuloClinico

# ---- Gestante ----

async def create_gestante(db: AsyncSession, gestante: Gestante) -> Gestante:
    db.add(gestante)
    await db.flush()
    await db.refresh(gestante)
    return gestante


async def get_gestante_by_id(db: AsyncSession, gestante_id: str) -> Gestante | None:
    result = await db.execute(
        select(Gestante).where(Gestante.id == gestante_id)
    )
    return result.scalar_one_or_none()

async def get_gestante_by_codigo(db: AsyncSession, codigo_gmi: str) -> Gestante | None:
    result = await db.execute(
        select(Gestante).where(Gestante.codigo_gmi == codigo_gmi)
    )
    return result.scalar_one_or_none()

async def get_last_codigo_gmi(db: AsyncSession, anio: int) -> str | None:
    result = await db.execute(
        select(Gestante.codigo_gmi)
        .where(Gestante.codigo_gmi.like(f"GMI-{anio}-%"))
        .order_by(Gestante.codigo_gmi.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def update_gestante(db: AsyncSession, gestante: Gestante) -> Gestante:
    gestante.updated_at = datetime.utcnow()
    db.add(gestante)
    await db.flush()
    await db.refresh(gestante)
    return gestante


async def delete_gestante(db: AsyncSession, gestante: Gestante) -> None:
    await db.delete(gestante)
    await db.flush()


# ---- Pregunta de Seguridad ----

async def create_pregunta_seguridad(db: AsyncSession, pregunta: PreguntaSeguridad) -> PreguntaSeguridad:
    db.add(pregunta)
    await db.flush()
    return pregunta


async def get_pregunta_by_gestante_id(db: AsyncSession, gestante_id: str) -> PreguntaSeguridad | None:
    result = await db.execute(
        select(PreguntaSeguridad).where(PreguntaSeguridad.gestante_id == gestante_id)
    )
    return result.scalar_one_or_none()


async def update_pregunta_seguridad(db: AsyncSession, pregunta: PreguntaSeguridad) -> PreguntaSeguridad:
    db.add(pregunta)
    await db.flush()
    return pregunta


# ---- Perfil Clínico ----

async def create_perfil_clinico(db: AsyncSession, perfil: PerfilClinico) -> PerfilClinico:
    db.add(perfil)
    await db.flush()
    return perfil


async def get_perfil_by_gestante_id(db: AsyncSession, gestante_id: str) -> PerfilClinico | None:
    result = await db.execute(
        select(PerfilClinico).where(PerfilClinico.gestante_id == gestante_id)
    )
    return result.scalar_one_or_none()


async def update_perfil_clinico(db: AsyncSession, perfil: PerfilClinico) -> PerfilClinico:
    perfil.updated_at = datetime.utcnow()
    db.add(perfil)
    await db.flush()
    return perfil


# ---- Fórmula Obstétrica ----

async def create_formula_obstetrica(db: AsyncSession, formula: FormulaObstetrica) -> FormulaObstetrica:
    db.add(formula)
    await db.flush()
    return formula


async def get_formula_by_gestante_id(db: AsyncSession, gestante_id: str) -> FormulaObstetrica | None:
    result = await db.execute(
        select(FormulaObstetrica).where(FormulaObstetrica.gestante_id == gestante_id)
    )
    return result.scalar_one_or_none()


async def update_formula_obstetrica(db: AsyncSession, formula: FormulaObstetrica) -> FormulaObstetrica:
    db.add(formula)
    await db.flush()
    return formula


# ---- Antecedentes Patológicos ----

async def create_antecedente(db: AsyncSession, antecedente: AntecedentePatologico) -> AntecedentePatologico:
    db.add(antecedente)
    await db.flush()
    await db.refresh(antecedente)
    return antecedente


async def get_antecedentes_by_gestante_id(db: AsyncSession, gestante_id: str) -> list[AntecedentePatologico]:
    result = await db.execute(
        select(AntecedentePatologico).where(AntecedentePatologico.gestante_id == gestante_id)
    )
    return result.scalars().all()


async def get_antecedente_by_id(db: AsyncSession, antecedente_id: str) -> AntecedentePatologico | None:
    result = await db.execute(
        select(AntecedentePatologico).where(AntecedentePatologico.id == antecedente_id)
    )
    return result.scalar_one_or_none()


async def update_antecedente(db: AsyncSession, antecedente: AntecedentePatologico) -> AntecedentePatologico:
    db.add(antecedente)
    await db.flush()
    return antecedente


async def delete_antecedente(db: AsyncSession, antecedente: AntecedentePatologico) -> None:
    await db.delete(antecedente)
    await db.flush()


# ---- Consentimiento Informado ----

async def create_consentimiento(db: AsyncSession, consentimiento: ConsentimientoInformado) -> ConsentimientoInformado:
    db.add(consentimiento)
    await db.flush()
    await db.refresh(consentimiento)
    return consentimiento


async def get_consentimiento_vigente(db: AsyncSession, gestante_id: str) -> ConsentimientoInformado | None:
    result = await db.execute(
        select(ConsentimientoInformado)
        .where(ConsentimientoInformado.gestante_id == gestante_id)
        .where(ConsentimientoInformado.estado == "ACEPTADO")
        .order_by(ConsentimientoInformado.fecha_aceptacion.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_consentimientos_by_gestante_id(db: AsyncSession, gestante_id: str) -> list[ConsentimientoInformado]:
    result = await db.execute(
        select(ConsentimientoInformado)
        .where(ConsentimientoInformado.gestante_id == gestante_id)
        .order_by(ConsentimientoInformado.fecha_aceptacion.desc())
    )
    return result.scalars().all()


# ---- Historial de Módulo ----

async def create_historial_modulo(db: AsyncSession, historial: HistorialModulo) -> HistorialModulo:
    db.add(historial)
    await db.flush()
    return historial


async def get_historial_by_gestante_id(db: AsyncSession, gestante_id: str) -> list[HistorialModulo]:
    result = await db.execute(
        select(HistorialModulo)
        .where(HistorialModulo.gestante_id == gestante_id)
        .order_by(HistorialModulo.created_at.desc())
    )
    return result.scalars().all()


# ---- Módulo Clínico ----

async def get_modulo_by_semana(db: AsyncSession, semana: int) -> CatModuloClinico | None:
    result = await db.execute(
        select(CatModuloClinico)
        .where(CatModuloClinico.semana_eg_inicio <= semana)
        .where(
            (CatModuloClinico.semana_eg_fin >= semana) |
            (CatModuloClinico.semana_eg_fin.is_(None))
        )
        .where(CatModuloClinico.activo == True)
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_modulo_by_id(db: AsyncSession, modulo_id: int) -> CatModuloClinico | None:
    result = await db.execute(
        select(CatModuloClinico).where(CatModuloClinico.id == modulo_id)
    )
    return result.scalar_one_or_none()