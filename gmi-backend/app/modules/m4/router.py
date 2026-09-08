from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies import get_current_gestante
from app.database.models.gestante import Gestante
from app.modules.m4 import service
from app.modules.m4.schemas import (
    BirthRecordCreate,
    BirthRecordResponse,
    BirthRecordUpdate,
    ContraceptionCreate,
    ContraceptionResponse,
    NewbornCreate,
    NewbornResponse,
    PostpartumCreate,
    PostpartumEvolutionResponse,
    PostpartumResponse,
)

router = APIRouter()


# BIRTH RECORD — Registrar / Consultar / Actualizar parto

@router.post(
    "/birth-record",
    response_model=BirthRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar parto",
)
async def create_birth_record(
    request: BirthRecordCreate,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Registrar el evento de parto de la gestante autenticada. Relación 1:1 con gestante."""
    return await service.create_birth_record(db, gestante.id, request)


@router.get(
    "/birth-record",
    response_model=BirthRecordResponse,
    summary="Consultar parto",
)
async def get_birth_record(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Consultar el registro de parto de la gestante autenticada."""
    return await service.get_birth_record(db, gestante.id)


@router.put(
    "/birth-record",
    response_model=BirthRecordResponse,
    summary="Actualizar parto",
)
async def update_birth_record(
    request: BirthRecordUpdate,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Actualizar los datos del registro de parto de la gestante autenticada."""
    return await service.update_birth_record(db, gestante.id, request)


# NEWBORN — Registrar / Consultar recién nacido

@router.post(
    "/newborn",
    response_model=NewbornResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar recién nacido",
)
async def create_newborn(
    request: NewbornCreate,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Registrar los datos del recién nacido. Requiere que el parto ya esté registrado."""
    return await service.create_newborn(db, gestante.id, request)


@router.get(
    "/newborn",
    response_model=list[NewbornResponse],
    summary="Consultar recién nacido",
)
async def get_newborns(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Consultar los recién nacidos registrados para la gestante autenticada."""
    return await service.get_newborns(db, gestante.id)


# POSTPARTUM — Registrar evaluación posparto / Historial posparto

@router.post(
    "/postpartum",
    response_model=PostpartumResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar evaluación posparto",
)
async def create_postpartum(
    request: PostpartumCreate,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Registrar una evaluación del período de puerperio."""
    return await service.create_postpartum(db, gestante.id, request)


@router.get(
    "/postpartum",
    response_model=list[PostpartumResponse],
    summary="Historial posparto",
)
async def get_postpartum(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Consultar el historial completo de evaluaciones posparto."""
    return await service.get_postpartum(db, gestante.id)


# POSTPARTUM EVOLUTION — Evolución posparto (Puerperio + Salud Mental)

@router.get(
    "/postpartum-evolution",
    response_model=PostpartumEvolutionResponse,
    summary="Evolución posparto",
)
async def get_postpartum_evolution(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Evolución completa del posparto: historial de puerperio + evaluaciones de salud mental (EPDS, GAD7, PHQ9)."""
    return await service.get_postpartum_evolution(db, gestante.id)


# CONTRACEPTION — Registrar / Consultar anticoncepción posparto

@router.post(
    "/contraception",
    response_model=ContraceptionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar anticoncepción",
)
async def create_contraception(
    request: ContraceptionCreate,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Registrar el método anticonceptivo aplicado en el posparto."""
    return await service.create_contraception(db, gestante.id, request)


@router.get(
    "/contraception",
    response_model=list[ContraceptionResponse],
    summary="Consultar anticoncepción",
)
async def get_contraception(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Consultar los métodos anticonceptivos registrados para la gestante autenticada."""
    return await service.get_contraception(db, gestante.id)