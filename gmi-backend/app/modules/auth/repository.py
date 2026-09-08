from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.database.models.gestante import Gestante, PreguntaSeguridad
from app.database.models.auth import UsuarioStaff, Rol

async def get_gestante_by_codigo(db: AsyncSession, codigo_gmi: str) -> Gestante | None:
    result = await db.execute(
        select(Gestante).where(Gestante.codigo_gmi == codigo_gmi)
    )
    # 'scalar_one_or_none' devuelve el objeto que encuentra o none
    # si encuentra múltiples resultados, lanza error
    # por eso solo se usa con campos unique
    return result.scalar_one_or_none()

async def get_pregunta_by_gestante_id(db: AsyncSession, gestante_id: str) -> PreguntaSeguridad | None:
    result = await db.execute(
        select(PreguntaSeguridad).where(PreguntaSeguridad.gestante_id == gestante_id)
    )
    return result.scalar_one_or_none()

async def get_pregunta_by_codigo_gmi(db: AsyncSession, codigo_gmi: str) -> PreguntaSeguridad | None:
    gestante = await get_gestante_by_codigo(db, codigo_gmi)
    if gestante is None:
        return None
    return await get_pregunta_by_gestante_id(db, gestante.id)

async def get_staff_by_email(db: AsyncSession, email: str) -> UsuarioStaff | None:
    result = await db.execute(
        select(UsuarioStaff).where(UsuarioStaff.email == email)
    )
    return result.scalar_one_or_none()

async def get_rol_by_id(db: AsyncSession, id: int) -> Rol | None:
    result = await db.execute(
        select(Rol).where(Rol.id == id)
    )
    return result.scalar_one_or_none()

async def get_staff_by_id(db: AsyncSession, staff_id: str) -> UsuarioStaff | None:
    result = await db.execute(
        select(UsuarioStaff).where(UsuarioStaff.id == staff_id)
    )
    return result.scalar_one_or_none()

async def update_staff_last_access(db: AsyncSession, staff: UsuarioStaff) -> None:
    from datetime import datetime
    staff.ultimo_acceso = datetime.utcnow()
    db.add(staff)
    # flush envía el cambio a postgresql en la transacción actual
    # sin hacer commit, el commit lo hace 'get_db' al finalizar la request
    # así si pasa algún error, se hace rollback
    await db.flush()