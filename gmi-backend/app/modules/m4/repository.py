from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.models.desenlace import (
    AnticoncepcionPosparto,
    EvaluacionSaludMental,
    Parto,
    Puerperio,
    RecienNacido,
)


# BIRTH RECORD

async def create_birth_record(db: AsyncSession, gestante_id: str, data: dict) -> Parto:
    parto = Parto(gestante_id=gestante_id, **data)
    db.add(parto)
    await db.commit()
    await db.refresh(parto)
    return parto


async def get_birth_record_by_gestante(db: AsyncSession, gestante_id: str) -> Parto | None:
    result = await db.execute(
        select(Parto).where(Parto.gestante_id == gestante_id)
    )
    return result.scalar_one_or_none()


async def update_birth_record(db: AsyncSession, parto: Parto, data: dict) -> Parto:
    for field, value in data.items():
        setattr(parto, field, value)
    db.add(parto)
    await db.commit()
    await db.refresh(parto)
    return parto


# NEWBORN

async def create_newborn(db: AsyncSession, parto_id: str, data: dict) -> RecienNacido:
    recien_nacido = RecienNacido(parto_id=parto_id, **data)
    db.add(recien_nacido)
    await db.commit()
    await db.refresh(recien_nacido)
    return recien_nacido


async def get_newborns_by_parto(db: AsyncSession, parto_id: str) -> list[RecienNacido]:
    result = await db.execute(
        select(RecienNacido).where(RecienNacido.parto_id == parto_id)
    )
    return result.scalars().all()


# POSTPARTUM

async def create_postpartum(db: AsyncSession, gestante_id: str, data: dict) -> Puerperio:
    puerperio = Puerperio(gestante_id=gestante_id, **data)
    db.add(puerperio)
    await db.commit()
    await db.refresh(puerperio)
    return puerperio


async def get_postpartum_by_gestante(db: AsyncSession, gestante_id: str) -> list[Puerperio]:
    result = await db.execute(
        select(Puerperio).where(Puerperio.gestante_id == gestante_id)
    )
    return result.scalars().all()


# POSTPARTUM EVOLUTION

async def get_postpartum_evolution(
    db: AsyncSession, gestante_id: str
) -> tuple[list[Puerperio], list[EvaluacionSaludMental]]:
    puerperios_result = await db.execute(
        select(Puerperio).where(Puerperio.gestante_id == gestante_id)
    )
    evaluaciones_result = await db.execute(
        select(EvaluacionSaludMental).where(EvaluacionSaludMental.gestante_id == gestante_id)
    )
    return puerperios_result.scalars().all(), evaluaciones_result.scalars().all()


# CONTRACEPTION

async def create_contraception(
    db: AsyncSession, gestante_id: str, data: dict
) -> AnticoncepcionPosparto:
    anticoncepcion = AnticoncepcionPosparto(gestante_id=gestante_id, **data)
    db.add(anticoncepcion)
    await db.commit()
    await db.refresh(anticoncepcion)
    return anticoncepcion


async def get_contraception_by_gestante(
    db: AsyncSession, gestante_id: str
) -> list[AnticoncepcionPosparto]:
    result = await db.execute(
        select(AnticoncepcionPosparto).where(AnticoncepcionPosparto.gestante_id == gestante_id)
    )
    return result.scalars().all()