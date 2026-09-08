from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from datetime import datetime
from app.database.models.educacion import ContenidoEducativo, CatCategoriaEducativa, ProgresoEducativo, ChecklistItem, ChecklistGestante
from app.database.models.desenlace import EvaluacionSaludMental
from app.database.models.seguimiento import PreguntaSeguimiento, OpcionPreguntaSeguimiento, RespuestaSeguimiento
from app.database.models.catalogos import CatModuloClinico

# ---- Consulta de contenidos y categorias ----

async def get_content_by_module(db: AsyncSession, modulo_id: int) -> list[ContenidoEducativo]:
    result = await db.execute(
        select(ContenidoEducativo).where(ContenidoEducativo.modulo_id == modulo_id, ContenidoEducativo.activo == True)
        .order_by(ContenidoEducativo.orden)
    )
    return result.scalars().all()

async def get_content_by_id(db: AsyncSession, content_id: int) -> ContenidoEducativo | None:
    result = await db.execute(
        select(ContenidoEducativo).where(ContenidoEducativo.id == content_id, ContenidoEducativo.activo == True)
    )
    return result.scalars().one_or_none()

async def get_categories(db: AsyncSession) -> list[CatCategoriaEducativa]:
    result = await db.execute(
        select(CatCategoriaEducativa).where(CatCategoriaEducativa.activo == True)
        .order_by(CatCategoriaEducativa.orden)
    )
    return result.scalars().all()

async def get_contents_by_category(db: AsyncSession, category_id: int) -> list[ContenidoEducativo]:
    result = await db.execute(
        select(ContenidoEducativo).where(ContenidoEducativo.categoria_id == category_id, ContenidoEducativo.activo == True)
        .order_by(ContenidoEducativo.orden)
    )
    return result.scalars().all()

# ---- Consulta de progreso ----

async def get_progress_by_gestante(db: AsyncSession, gestante_id: str) -> list[ProgresoEducativo]:
    result = await db.execute(
        select(ProgresoEducativo).where(ProgresoEducativo.gestante_id == gestante_id)
    )
    return result.scalars().all()

async def marcar_completado(db: AsyncSession, gestante_id: str, contenido_id: int) -> ProgresoEducativo:
    result = await db.execute(
        select(ProgresoEducativo).where(ProgresoEducativo.gestante_id == gestante_id, ProgresoEducativo.contenido_id == contenido_id)
    )
    progreso = result.scalars().one_or_none()

    if progreso is None:
        progreso = ProgresoEducativo(gestante_id=gestante_id,
                                     contenido_id=contenido_id,
                                     completado=True,
                                     fecha_completado=datetime.utcnow()
                                     )
        db.add(progreso)
    else:
        progreso.completado = True
        progreso.fecha_completado = datetime.utcnow()

    await db.flush()
    await db.refresh(progreso)
    return progreso

# ---- Checklist gestante ----

async def get_checklist_items(db: AsyncSession, modulo_id: int) -> list[ChecklistItem]:
    result = await db.execute(
        select(ChecklistItem).where(ChecklistItem.modulo_id == modulo_id, ChecklistItem.activo == True)
        .order_by(ChecklistItem.orden)
    )
    return result.scalars().all()

async def get_checklist_item_by_id(db: AsyncSession, item_id: int) -> ChecklistItem | None:
    result = await db.execute(
        select(ChecklistItem).where(ChecklistItem.id == item_id, ChecklistItem.activo == True)
    )
    return result.scalars().one_or_none()

async def get_checklist_gestante(db: AsyncSession, gestante_id: str, item_id: int) -> ChecklistGestante | None:
    result = await db.execute(
        select(ChecklistGestante).where(ChecklistGestante.gestante_id == gestante_id, ChecklistGestante.checklist_item_id == item_id)
    )
    return result.scalars().one_or_none()

async def update_checklist_item(db: AsyncSession, gestante_id: str, item_id: int, completado: bool) -> ChecklistGestante:
    result = await db.execute(
        select(ChecklistGestante).where(ChecklistGestante.gestante_id == gestante_id, ChecklistGestante.checklist_item_id == item_id)
    )
    item = result.scalars().one_or_none()

    if item is None:
        item = ChecklistGestante(
            gestante_id=gestante_id,
            checklist_item_id=item_id,
            completado=completado,
            fecha_completado=datetime.utcnow() if completado else None,
        )
        db.add(item)
    else:
        item.completado = completado
        item.fecha_completado = datetime.utcnow() if completado else None

    await db.flush()
    await db.refresh(item)
    return item

# ---- Salud Mental ----

async def create_tamizaje(db: AsyncSession, evaluacion: EvaluacionSaludMental) -> EvaluacionSaludMental:
    db.add(evaluacion)
    await db.flush()
    await db.refresh(evaluacion)
    return evaluacion

async def get_historial_tamizajes(db: AsyncSession, gestante_id: str) -> list[EvaluacionSaludMental]:
    result = await db.execute(
        select(EvaluacionSaludMental).where(EvaluacionSaludMental.gestante_id == gestante_id)
    )
    return result.scalars().all()

# ---- Autoevaluaciones ----

async def get_autoevaluaciones(db: AsyncSession, gestante_id: str) -> list[RespuestaSeguimiento]:
    result = await db.execute(
        select(RespuestaSeguimiento).where(RespuestaSeguimiento.gestante_id == gestante_id)
        .order_by(RespuestaSeguimiento.created_at.desc())
    )
    return result.scalars().all()

async def get_pregunta_seguimiento_by_id(db: AsyncSession, pregunta_id: int) -> PreguntaSeguimiento | None:
    result = await db.execute(
        select(PreguntaSeguimiento).where(PreguntaSeguimiento.id == pregunta_id)
    )
    return result.scalars().one_or_none()

async def get_opcion_seguimiento_by_id(db: AsyncSession, opcion_id: int) -> OpcionPreguntaSeguimiento | None:
    result = await db.execute(
        select(OpcionPreguntaSeguimiento).where(OpcionPreguntaSeguimiento.id == opcion_id)
    )
    return result.scalars().one_or_none()

async def create_autoevaluacion(db: AsyncSession, autoevaluacion: RespuestaSeguimiento) -> RespuestaSeguimiento:
    db.add(autoevaluacion)
    await db.flush()
    await db.refresh(autoevaluacion)
    return autoevaluacion

async def get_modulo_by_semanas_eg(db: AsyncSession, semanas: int) -> CatModuloClinico | None:
    """
    Retorna el módulo clínico que corresponde a las semanas de gestación dadas.
    Para M4 (puerperio), semana_eg_fin es NULL, por eso usamos OR IS NULL.
    """
    result = await db.execute(
        select(CatModuloClinico).where(
            CatModuloClinico.activo == True,
            CatModuloClinico.semana_eg_inicio <= semanas,
            or_(
                CatModuloClinico.semana_eg_fin >= semanas,
                CatModuloClinico.semana_eg_fin.is_(None)
            )
        ).order_by(CatModuloClinico.semana_eg_inicio)
    )
    return result.scalars().first()