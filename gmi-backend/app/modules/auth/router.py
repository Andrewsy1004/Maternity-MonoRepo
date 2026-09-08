from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import delete, select

from app.core.security import hash_security_answer
from app.database.session import get_db
from app.dependencies import get_current_user
from app.modules.auth import service
from app.database.models.gestante import Gestante, PreguntaSeguridad, SolicitudActivacion
from app.modules.auth.schemas import (
    GestanteLoginRequest,
    StaffLoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    SecurityQuestionResponse,
    PasswordResetRequest,
    PasswordResetConfirm,
    SolicitudActivacionCreate,
    SolicitudActivacionResponse,    
)

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
async def login_gestante(
    request: GestanteLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    return await service.login_gestante(db, request.codigo_gmi, request.respuesta_seguridad)

@router.post("/login/staff", response_model=TokenResponse)
async def login_staff(
    request: StaffLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    return await service.login_staff(db, request.email, request.password)

@router.post("/logout")
async def logout(user: dict = Depends(get_current_user)):
    return {"detail": "Sesión cerrada exitosamente"}

@router.post("/refresh-token", response_model=TokenResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    return await service.refresh_access_token(db, request.refresh_token)

@router.get("/security-question/{codigo_gmi}", response_model=SecurityQuestionResponse)
async def get_security_question(
    codigo_gmi: str,
    db: AsyncSession = Depends(get_db),
):
    return await service.get_security_question(db, codigo_gmi)

@router.post("/password/reset-request")
async def request_password_reset(
    request: PasswordResetRequest,
    db: AsyncSession = Depends(get_db),
):
    # todo: implementar envío de email con token de reset
    return {"detail": "Si el email existe, recibirás instrucciones de restablecimiento"}

@router.post("/password/reset")
async def confirm_password_reset(
    request: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db),
):
    """Confirmar restablecimiento de contraseña con token."""
    # todo: implementar verificación de token y cambio de contraseña
    return {"detail": "Contraseña restablecida exitosamente"}


@router.post("/solicitud-activacion", status_code=201)
async def crear_solicitud_activacion(
    request: SolicitudActivacionCreate,
    db: AsyncSession = Depends(get_db),
):
    """Permite a una gestante sin pregunta de seguridad enviar una solicitud de activación. Endpoint público."""
    res_g = await db.execute(select(Gestante).where(Gestante.codigo_gmi == request.codigo_gmi))
    gestante = res_g.scalar_one_or_none()
    if not gestante:
        raise HTTPException(status_code=404, detail="Código GMI no encontrado.")

    res_p = await db.execute(select(PreguntaSeguridad).where(PreguntaSeguridad.gestante_id == gestante.id))
    if res_p.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Esta cuenta ya se encuentra activa.")

    await db.execute(delete(SolicitudActivacion).where(SolicitudActivacion.codigo_gmi == request.codigo_gmi))

    db.add(SolicitudActivacion(
        codigo_gmi=request.codigo_gmi,
        pregunta=request.pregunta,
        hash_respuesta=hash_security_answer(request.respuesta),
    ))
    await db.commit()
    return {"detail": "Solicitud enviada. Espera la aprobación de tu médico o administrador."}