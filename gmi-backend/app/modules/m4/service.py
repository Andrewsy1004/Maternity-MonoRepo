from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models.desenlace import AnticoncepcionPosparto, Parto, Puerperio, RecienNacido
from app.modules.m4 import repository
from app.modules.m4.schemas import (
    BirthRecordCreate,
    BirthRecordUpdate,
    ContraceptionCreate,
    NewbornCreate,
    PostpartumCreate,
    PostpartumEvolutionResponse,
)


# BIRTH RECORD

async def create_birth_record(
    db: AsyncSession, gestante_id: str, data: BirthRecordCreate
) -> Parto:
    existing = await repository.get_birth_record_by_gestante(db, gestante_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un registro de parto para esta gestante.",
        )
    return await repository.create_birth_record(db, gestante_id, data.model_dump())


async def get_birth_record(db: AsyncSession, gestante_id: str) -> Parto:
    parto = await repository.get_birth_record_by_gestante(db, gestante_id)
    if not parto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro de parto no encontrado para esta gestante.",
        )
    return parto


async def update_birth_record(
    db: AsyncSession, gestante_id: str, data: BirthRecordUpdate
) -> Parto:
    parto = await repository.get_birth_record_by_gestante(db, gestante_id)
    if not parto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro de parto no encontrado para esta gestante.",
        )
    return await repository.update_birth_record(db, parto, data.model_dump(exclude_none=True))


# NEWBORN

async def create_newborn(
    db: AsyncSession, gestante_id: str, data: NewbornCreate
) -> RecienNacido:
    parto = await repository.get_birth_record_by_gestante(db, gestante_id)
    if not parto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Debe registrar primero el parto antes de agregar un recién nacido.",
        )
    return await repository.create_newborn(db, parto.id, data.model_dump())


async def get_newborns(db: AsyncSession, gestante_id: str) -> list[RecienNacido]:
    parto = await repository.get_birth_record_by_gestante(db, gestante_id)
    if not parto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró parto registrado para esta gestante.",
        )
    return await repository.get_newborns_by_parto(db, parto.id)


# POSTPARTUM

async def create_postpartum(
    db: AsyncSession, gestante_id: str, data: PostpartumCreate
) -> Puerperio:
    return await repository.create_postpartum(db, gestante_id, data.model_dump())


async def get_postpartum(db: AsyncSession, gestante_id: str) -> list[Puerperio]:
    registros = await repository.get_postpartum_by_gestante(db, gestante_id)
    if not registros:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontraron registros de posparto para esta gestante.",
        )
    return registros


async def get_postpartum_evolution(
    db: AsyncSession, gestante_id: str
) -> PostpartumEvolutionResponse:
    puerperios, evaluaciones = await repository.get_postpartum_evolution(db, gestante_id)
    return PostpartumEvolutionResponse(
        puerperios=puerperios,
        evaluaciones_salud_mental=evaluaciones,
    )


# CONTRACEPTION

async def create_contraception(
    db: AsyncSession, gestante_id: str, data: ContraceptionCreate
) -> AnticoncepcionPosparto:
    return await repository.create_contraception(db, gestante_id, data.model_dump())


async def get_contraception(
    db: AsyncSession, gestante_id: str
) -> list[AnticoncepcionPosparto]:
    registros = await repository.get_contraception_by_gestante(db, gestante_id)
    if not registros:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontraron registros de anticoncepción para esta gestante.",
        )
    return registros