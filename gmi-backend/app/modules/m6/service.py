from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.database.models.gestante import Gestante
from app.database.models.soporte import CitaMedica, LlamadaEmergencia
from app.modules.m6 import repository
from app.modules.m6.schemas import (
    AlertaResponse, AlertaDetalleResponse,
    CitaMedicaCreate, CitaMedicaUpdate, CitaMedicaResponse,
    RecordatorioResponse,
    NotificacionResponse,
    LlamadaEmergenciaCreate, LlamadaEmergenciaResponse,
)


# ---- Alertas ----

async def get_alertas(db: AsyncSession, gestante_id: str) -> list[AlertaResponse]:
    alertas = await repository.get_alertas(db, gestante_id)
    return [AlertaResponse.model_validate(a) for a in alertas]

async def get_alerta_by_id(db: AsyncSession, alerta_id: str, gestante_id: str) -> AlertaDetalleResponse:
    alerta = await repository.get_alerta_by_id(db, alerta_id, gestante_id)
    if alerta is None:
        raise NotFoundException("Alerta no encontrada.")
    return AlertaDetalleResponse.model_validate(alerta)

async def acknowledge_alerta(db: AsyncSession, alerta_id: str, gestante_id: str) -> AlertaResponse:
    alerta = await repository.get_alerta_by_id(db, alerta_id, gestante_id)
    if alerta is None:
        raise NotFoundException("Alerta no encontrada.")
    alerta.estado = "leida"
    alerta = await repository.acknowledge_alerta(db, alerta)
    return AlertaResponse.model_validate(alerta)


# ---- Citas médicas ----

async def get_citas(db: AsyncSession, gestante_id: str) -> list[CitaMedicaResponse]:
    citas = await repository.get_citas(db, gestante_id)
    return [CitaMedicaResponse.model_validate(c) for c in citas]

async def create_cita(db: AsyncSession, gestante_id: str, data: CitaMedicaCreate) -> CitaMedicaResponse:
    cita = CitaMedica(
        gestante_id=gestante_id,
        ips_id=data.ips_id,
        fecha_hora=data.fecha_hora,
        tipo_cita=data.tipo_cita,
        estado="programada",
    )
    cita = await repository.create_cita(db, cita)
    return CitaMedicaResponse.model_validate(cita)

async def reprogramar_cita(db: AsyncSession, cita_id: str, gestante_id: str, data: CitaMedicaUpdate) -> CitaMedicaResponse:
    cita = await repository.get_cita_by_id(db, cita_id, gestante_id)
    if cita is None:
        raise NotFoundException("Cita no encontrada.")
    cita.fecha_hora = data.fecha_hora
    cita = await repository.save_cita(db, cita)
    return CitaMedicaResponse.model_validate(cita)

async def confirmar_cita(db: AsyncSession, cita_id: str, gestante_id: str) -> CitaMedicaResponse:
    cita = await repository.get_cita_by_id(db, cita_id, gestante_id)
    if cita is None:
        raise NotFoundException("Cita no encontrada.")
    cita.estado = "confirmada"
    cita = await repository.save_cita(db, cita)
    return CitaMedicaResponse.model_validate(cita)

async def cancelar_cita(db: AsyncSession, cita_id: str, gestante_id: str) -> None:
    cita = await repository.get_cita_by_id(db, cita_id, gestante_id)
    if cita is None:
        raise NotFoundException("Cita no encontrada.")
    cita.estado = "cancelada"
    await repository.save_cita(db, cita)


# ---- Recordatorios ----

async def get_recordatorios(db: AsyncSession, gestante_id: str) -> list[RecordatorioResponse]:
    citas = await repository.get_recordatorios(db, gestante_id)
    return [RecordatorioResponse.model_validate(c) for c in citas]


# ---- Notificaciones ----

async def get_notificaciones(db: AsyncSession, gestante_id: str) -> list[NotificacionResponse]:
    notificaciones = await repository.get_notificaciones(db, gestante_id)
    return [NotificacionResponse.model_validate(n) for n in notificaciones]

async def mark_notificacion_read(db: AsyncSession, notificacion_id: str, gestante_id: str) -> NotificacionResponse:
    notificacion = await repository.get_notificacion_by_id(db, notificacion_id, gestante_id)
    if notificacion is None:
        raise NotFoundException("Notificación no encontrada.")
    notificacion.estado_entrega = "leida"
    notificacion = await repository.save_notificacion(db, notificacion)
    return NotificacionResponse.model_validate(notificacion)


# ---- Llamadas de emergencia ----

async def create_llamada_emergencia(db: AsyncSession, gestante: Gestante, data: LlamadaEmergenciaCreate) -> LlamadaEmergenciaResponse:
    llamada = LlamadaEmergencia(
        gestante_id=gestante.id,
        motivo=data.motivo,
        destino=data.destino,
        resultado=data.resultado,
    )
    llamada = await repository.create_llamada_emergencia(db, llamada)
    return LlamadaEmergenciaResponse.model_validate(llamada)

async def get_historial_llamadas(db: AsyncSession, gestante_id: str) -> list[LlamadaEmergenciaResponse]:
    llamadas = await repository.get_historial_llamadas(db, gestante_id)
    return [LlamadaEmergenciaResponse.model_validate(l) for l in llamadas]

# ---- Preferencias de notificación ----

