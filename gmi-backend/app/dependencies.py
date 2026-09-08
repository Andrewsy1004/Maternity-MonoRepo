from fastapi import Depends, HTTPException, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.database.session import get_db
from app.database.models.gestante import Gestante
from app.database.models.auth import UsuarioStaff
from app.core.security import verify_token
from app.core.exceptions import UnauthorizedException

# así fastapi sabe que los endpoints protegidos necesitarán access token bearer
security_scheme = HTTPBearer()

# dependencia para un endpoint sin restricción por rol
# se usa en get_current_gestante y get_current_staff
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> dict:
    token = credentials.credentials
    payload = verify_token(token)

    if payload is None:
        raise UnauthorizedException("Token inválido o expirado")

    if payload.get("type") != "access":
        raise UnauthorizedException("Tipo de token inválido")

    sub = payload.get("sub")
    role = payload.get("role")

    if not sub or not role:
        raise UnauthorizedException("Token malformado")

    return {"sub": sub, "role": role}

# dependencia para endpoints solo de gestantes
async def get_current_gestante(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Gestante:
    if user["role"] != "gestante":
        raise UnauthorizedException("Este endpoint es solo para gestantes")

    result = await db.execute(
        select(Gestante).where(Gestante.codigo_gmi == user["sub"])
    )
    gestante = result.scalar_one_or_none()

    if gestante is None:
        raise UnauthorizedException("Gestante no encontrada")

    return gestante

# dependencia para endpoints de staff
async def get_current_staff(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UsuarioStaff:
    if user["role"] not in ("clinico", "admin", "hospital"):
        raise UnauthorizedException("Este endpoint es solo para personal autorizado")

    result = await db.execute(
        select(UsuarioStaff).where(UsuarioStaff.id == user["sub"])
    )
    staff = result.scalar_one_or_none()

    if staff is None:
        raise UnauthorizedException("Usuario no encontrado")

    if not staff.activo:
        raise UnauthorizedException("Usuario desactivado")

    return staff

# dependencia para endpoints exclusivos de admin
async def get_current_admin(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UsuarioStaff:
    if user["role"] != "admin":
        raise UnauthorizedException("Este endpoint es solo para administradores")

    result = await db.execute(
        select(UsuarioStaff).where(UsuarioStaff.id == user["sub"])
    )
    staff = result.scalar_one_or_none()

    if staff is None:
        raise UnauthorizedException("Usuario no encontrado")

    if not staff.activo:
        raise UnauthorizedException("Usuario desactivado")

    return staff

async def get_gestante_id_for_request(
    gestante_id: str | None = Query(default=None),  
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> str:
    if user["role"] == "gestante":
        result = await db.execute(
            select(Gestante).where(Gestante.codigo_gmi == user["sub"])
        )
        gestante = result.scalar_one_or_none()
        if gestante is None:
            raise UnauthorizedException("Gestante no encontrada")
        return gestante.id

    elif user["role"] in ("clinico", "admin"):
        if not gestante_id:
            raise HTTPException(status_code=400, detail="Admin debe proveer gestante_id")
        return gestante_id

    raise UnauthorizedException("Rol no permitido")