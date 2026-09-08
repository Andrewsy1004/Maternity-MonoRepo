from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies import get_current_gestante
from app.database.models.gestante import Gestante
from app.modules.m6 import service
from app.modules.m6.schemas import (
    AlertaResponse, AlertaDetalleResponse,
    CitaMedicaCreate, CitaMedicaUpdate, CitaMedicaResponse,
    RecordatorioResponse,
    NotificacionResponse,
    LlamadaEmergenciaCreate, LlamadaEmergenciaResponse
)

router = APIRouter()


# ---- Alertas ----

@router.get("/alerts", response_model=list[AlertaResponse])
async def get_alertas(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Alertas activas de la gestante con tipo y prioridad."""
    return await service.get_alertas(db, gestante.id)

@router.get("/alerts/{alert_id}", response_model=AlertaDetalleResponse)
async def get_alerta_by_id(
    alert_id: str,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Detalle de una alerta de la gestante."""
    return await service.get_alerta_by_id(db, alert_id, gestante.id)

@router.patch("/alerts/{alert_id}/acknowledge", response_model=AlertaResponse)
async def acknowledge_alerta(
    alert_id: str,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Marcar alerta como leída."""
    return await service.acknowledge_alerta(db, alert_id, gestante.id)


# ---- Citas médicas ----

@router.get("/appointments", response_model=list[CitaMedicaResponse])
async def get_citas(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Citas médicas de la gestante."""
    return await service.get_citas(db, gestante.id)

@router.post("/appointments", response_model=CitaMedicaResponse, status_code=201)
async def create_cita(
    request: CitaMedicaCreate,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Crear nueva cita médica."""
    return await service.create_cita(db, gestante.id, request)

@router.patch("/appointments/{appointment_id}", response_model=CitaMedicaResponse)
async def reprogramar_cita(
    appointment_id: str,
    request: CitaMedicaUpdate,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Reprogramar cita médica."""
    return await service.reprogramar_cita(db, appointment_id, gestante.id, request)

@router.post("/appointments/{appointment_id}/confirm", response_model=CitaMedicaResponse)
async def confirmar_cita(
    appointment_id: str,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Confirmar asistencia a cita médica."""
    return await service.confirmar_cita(db, appointment_id, gestante.id)

@router.delete("/appointments/{appointment_id}", status_code=204)
async def cancelar_cita(
    appointment_id: str,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Cancelar cita médica."""
    await service.cancelar_cita(db, appointment_id, gestante.id)

# ---- Recordatorios ----

@router.get("/reminders", response_model=list[RecordatorioResponse])
async def get_recordatorios(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Recordatorios: citas programadas en los próximos 7 días."""
    return await service.get_recordatorios(db, gestante.id)


# ---- Notificaciones ----

@router.get("/notifications", response_model=list[NotificacionResponse])
async def get_notificaciones(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Notificaciones de la gestante."""
    return await service.get_notificaciones(db, gestante.id)

@router.patch("/notifications/{notification_id}/read", response_model=NotificacionResponse)
async def mark_notificacion_read(
    notification_id: str,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Marcar notificación como leída."""
    return await service.mark_notificacion_read(db, notification_id, gestante.id)


# ---- Llamada de emergencia ----

@router.post("/emergency-call", response_model=LlamadaEmergenciaResponse, status_code=201)
async def create_llamada_emergencia(
    request: LlamadaEmergenciaCreate,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Registrar llamada de emergencia."""
    return await service.create_llamada_emergencia(db, gestante, request)

@router.get("/emergency-call/history", response_model=list[LlamadaEmergenciaResponse])
async def get_historial_llamadas(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Historial de llamadas de emergencia."""
    return await service.get_historial_llamadas(db, gestante.id)