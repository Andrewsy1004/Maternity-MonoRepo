from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.database.models.gestante import Gestante
from app.database.models.auth import UsuarioStaff
from app.dependencies import get_current_gestante, get_current_staff
from app.modules.ia import service
from app.modules.ia.schemas import (
    ChatMessageRequest,
    ChatMessageResponse,
    ChatHistoryResponse,
    RiskSummaryResponse,
    RecommendationResponse,
    TriageRequest,
    TriageResponse,
    ClinicalSummaryResponse,
    ExplainabilityResponse,
    AlertaResolverRequest,
    AlertaStaffResponse,
    ChatHistorialStaffResponse,
)
from app.modules.m0.repository import get_gestante_by_id

router = APIRouter()


# ---- Chat (gestante) ----

@router.post("/chat", response_model=ChatMessageResponse)
async def send_message(
    request: ChatMessageRequest,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Enviar mensaje al asistente de IA. Si detecta señal de alarma crítica, genera alerta trazable."""
    return await service.send_chat_message(db, gestante, request.mensaje)


@router.get("/chat/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Obtener historial de conversación con el asistente de IA."""
    return await service.get_chat_history(db, gestante.id)


@router.delete("/chat/history")
async def delete_chat_history(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Limpiar historial de conversación."""
    return await service.delete_chat_history(db, gestante.id)


# ---- Risk Summary (gestante) ----

@router.get("/risk-summary", response_model=RiskSummaryResponse)
async def get_risk_summary(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Resumen de riesgo generado por IA. Si el nivel es rojo, crea alerta trazable."""
    return await service.get_risk_summary(db, gestante)


# ---- Recommendations (gestante) ----

@router.get("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Recomendaciones personalizadas de IA según el contexto clínico actual."""
    return await service.get_recommendations(db, gestante)


# ---- Triage (gestante) ----

@router.post("/triage", response_model=TriageResponse)
async def run_triage(
    request: TriageRequest,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Pre-triage automático. Si el nivel es inmediato, crea alerta trazable."""
    return await service.run_triage(db, gestante, request)


# ---- Explainability (gestante) ----

@router.get("/explainability/{assessment_id}", response_model=ExplainabilityResponse)
async def get_explainability(
    assessment_id: str,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Explicación detallada de una clasificación de riesgo. Solo para la gestante autenticada."""
    return await service.get_explainability(db, gestante, assessment_id)


# ---- Staff: resumen clínico ----

@router.get("/clinical-summary/{codigo_gmi}", response_model=ClinicalSummaryResponse)
async def get_clinical_summary(
    codigo_gmi: str,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Resumen clínico de una gestante generado por IA. Solo para personal autorizado."""
    from app.modules.m0 import repository as m0_repo
    from app.core.exceptions import NotFoundException
    gestante = await m0_repo.get_gestante_by_codigo(db, codigo_gmi)
    if gestante is None:
        raise NotFoundException("Gestante no encontrada")
    return await service.get_clinical_summary(db, gestante)


# ---- Staff: explainability por gestante ----

@router.get("/gestantes/{gestante_id}/explainability/{assessment_id}", response_model=ExplainabilityResponse)
async def get_explainability_staff(
    gestante_id: str,
    assessment_id: str,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Explicación de una clasificación de riesgo para cualquier gestante. Solo staff."""
    return await service.get_explainability_for_staff(db, gestante_id, assessment_id)


# ---- Staff: historial de chat de una gestante ----

@router.get("/gestantes/{gestante_id}/chat/history", response_model=ChatHistorialStaffResponse)
async def get_gestante_chat_history_staff(
    gestante_id: str,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Historial completo de chat de una gestante. Solo para personal autorizado."""
    return await service.get_chat_history_for_staff(db, gestante_id)


# ---- Staff: alertas de una gestante ----

@router.get("/gestantes/{gestante_id}/alerts", response_model=list[AlertaStaffResponse])
async def get_gestante_alerts_staff(
    gestante_id: str,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Todas las alertas de una gestante incluidas las de IA. Solo staff."""
    return await service.get_alertas_gestante(db, gestante_id)


# ---- Staff: resolver alerta ----

@router.patch("/alerts/{alerta_id}/resolve", response_model=AlertaStaffResponse)
async def resolver_alerta(
    alerta_id: str,
    request: AlertaResolverRequest,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Marcar una alerta como resuelta. Registra quién la resolvió y cuándo."""
    return await service.resolver_alerta(db, alerta_id, staff.id, request)