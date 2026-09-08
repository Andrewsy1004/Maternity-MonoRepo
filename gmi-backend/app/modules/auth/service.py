from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    verify_password,
    verify_security_answer,
    create_access_token,
    create_refresh_token,
    verify_token,
)
from app.core.exceptions import (
    UnauthorizedException,
    NotFoundException,
)
from app.modules.auth import repository
from app.modules.auth.schemas import TokenResponse, SecurityQuestionResponse

# los mensajes de error son diferentes porque sirven para desarrollo
# todo: para producción unificar los mensajes de error de login en un solo mensaje general

async def login_gestante(db: AsyncSession, codigo_gmi: str, respuesta: str) -> TokenResponse:
    gestante = await repository.get_gestante_by_codigo(db, codigo_gmi)
    if gestante is None:
        raise UnauthorizedException("Código GMI no encontrado")

    if not gestante.activa:
        raise UnauthorizedException("Cuenta desactivada")

    pregunta = await repository.get_pregunta_by_gestante_id(db, gestante.id)
    if pregunta is None:
        raise UnauthorizedException("No tiene pregunta de seguridad configurada")

    if not verify_security_answer(respuesta, pregunta.hash_respuesta):
        raise UnauthorizedException("Respuesta de seguridad incorrecta")

    token_data = {"sub": gestante.codigo_gmi, "role": "gestante"}

    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        role="gestante",
    )

async def login_staff(db: AsyncSession, email: str, password: str) -> TokenResponse:
    staff = await repository.get_staff_by_email(db, email)
    if staff is None:
        raise UnauthorizedException("Credenciales inválidas")

    if not staff.activo:
        raise UnauthorizedException("Cuenta desactivada")

    if not verify_password(password, staff.hash_password):
        raise UnauthorizedException("Credenciales inválidas")

    await repository.update_staff_last_access(db, staff)

    rol = await repository.get_rol_by_id(db, staff.rol_id)

    if rol is None or not rol.activo:
        raise UnauthorizedException("Cuenta desactivada")

    token_data = {"sub": staff.id, "role": rol.nombre}

    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        role=rol.nombre,
    )

async def refresh_access_token(db: AsyncSession, refresh_token: str) -> TokenResponse:
    payload = verify_token(refresh_token)

    if payload is None:
        raise UnauthorizedException("Refresh token inválido o expirado")

    if payload.get("type") != "refresh":
        raise UnauthorizedException("No es un refresh token")

    sub = payload.get("sub")
    role = payload.get("role")

    if not sub or not role:
        raise UnauthorizedException("Token malformado")

    if role == "gestante":
        gestante = await repository.get_gestante_by_codigo(db, sub)
        if gestante is None or not gestante.activa:
            raise UnauthorizedException("Cuenta no encontrada o desactivada")
    else:
        staff = await repository.get_staff_by_id(db, sub)
        if staff is None or not staff.activo:
            raise UnauthorizedException("Cuenta no encontrada o desactivada")

    token_data = {"sub": sub, "role": role}

    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        role=role,
    )

async def get_security_question(db: AsyncSession, codigo_gmi: str) -> SecurityQuestionResponse:
    pregunta = await repository.get_pregunta_by_codigo_gmi(db, codigo_gmi)

    if pregunta is None:
        raise NotFoundException("No se encontró pregunta de seguridad para ese código")

    return SecurityQuestionResponse(
        codigo_gmi=codigo_gmi,
        pregunta=pregunta.pregunta,
    )