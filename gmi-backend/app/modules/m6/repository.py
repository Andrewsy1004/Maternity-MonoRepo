from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.models.riesgo import Alerta
from app.database.models.soporte import CitaMedica, Notificacion, LlamadaEmergencia


# ---- Alertas ----

async def get_alertas(db: AsyncSession, gestante_id: str) -> list[Alerta]:
    result = await db.execute(
        select(Alerta)
        .where(Alerta.gestante_id == gestante_id, Alerta.estado == "activa")
        .order_by(Alerta.created_at.desc())
    )
    return result.scalars().all()

async def get_alerta_by_id(db: AsyncSession, alerta_id: str, gestante_id: str) -> Alerta | None:
    result = await db.execute(
        select(Alerta).where(Alerta.id == alerta_id, Alerta.gestante_id == gestante_id)
    )
    return result.scalars().one_or_none()

async def acknowledge_alerta(db: AsyncSession, alerta: Alerta) -> Alerta | None:
    await db.flush()
    await db.refresh(alerta)
    return alerta


# ---- Citas médicas ----

async def get_citas(db: AsyncSession, gestante_id: str) -> list[CitaMedica]:
    result = await db.execute(
        select(CitaMedica)
        .where(CitaMedica.gestante_id == gestante_id)
        .order_by(CitaMedica.fecha_hora)
    )
    return result.scalars().all()

async def get_cita_by_id(db: AsyncSession, cita_id: str, gestante_id: str) -> CitaMedica | None:
    result = await db.execute(
        select(CitaMedica).where(CitaMedica.id == cita_id, CitaMedica.gestante_id == gestante_id)
    )
    return result.scalars().one_or_none()

async def create_cita(db: AsyncSession, cita: CitaMedica) -> CitaMedica:
    db.add(cita)
    await db.flush()
    await db.refresh(cita)
    return cita

async def save_cita(db: AsyncSession, cita: CitaMedica) -> CitaMedica:
    await db.flush()
    await db.refresh(cita)
    return cita

async def get_recordatorios(db: AsyncSession, gestante_id: str) -> list[CitaMedica]:
    ahora = datetime.utcnow()
    limite = ahora + timedelta(days=7)
    result = await db.execute(
        select(CitaMedica)
        .where(
            CitaMedica.gestante_id == gestante_id,
            CitaMedica.fecha_hora >= ahora,
            CitaMedica.fecha_hora <= limite,
            CitaMedica.estado != "cancelada",
        )
        .order_by(CitaMedica.fecha_hora)
    )
    return result.scalars().all()


# ---- Notificaciones ----

async def get_notificaciones(db: AsyncSession, gestante_id: str) -> list[Notificacion]:
    result = await db.execute(
        select(Notificacion)
        .where(Notificacion.gestante_id == gestante_id)
        .order_by(Notificacion.created_at.desc())
    )
    return result.scalars().all()

async def get_notificacion_by_id(db: AsyncSession, notificacion_id: str, gestante_id: str) -> Notificacion | None:
    result = await db.execute(
        select(Notificacion).where(Notificacion.id == notificacion_id, Notificacion.gestante_id == gestante_id)
    )
    return result.scalars().one_or_none()

async def save_notificacion(db: AsyncSession, notificacion: Notificacion) -> Notificacion | None:
    await db.flush()
    await db.refresh(notificacion)
    return notificacion


# ---- Llamadas de emergencia ----

async def create_llamada_emergencia(db: AsyncSession, llamada: LlamadaEmergencia) -> LlamadaEmergencia:
    db.add(llamada)
    await db.flush()
    await db.refresh(llamada)
    return llamada

async def get_historial_llamadas(db: AsyncSession, gestante_id: str) -> list[LlamadaEmergencia]:
    result = await db.execute(
        select(LlamadaEmergencia)
        .where(LlamadaEmergencia.gestante_id == gestante_id)
        .order_by(LlamadaEmergencia.created_at.desc())
    )
    return result.scalars().all()

