"""
Operaciones de escritura en BD para el pipeline de carga masiva.
"""
from datetime import datetime, timedelta
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from typing import Any

from app.database.models.gestante import Gestante
from app.database.models.auth import AuditLog
from app.database.models.perfil import FormulaObstetrica
from app.database.models.control import ControlPrenatal, SignosVitales
from app.database.models.examenes import ExamenLaboratorio, Ecografia
from app.database.models.complementarios import Vacunacion, RemisionInterdisciplinaria
from app.database.models.desenlace import Parto, RecienNacido, AnticoncepcionPosparto
from app.database.models.riesgo import ClasificacionRiesgo, Alerta
from app.database.models.seguimiento import PreguntaSeguimiento, OpcionPreguntaSeguimiento, RespuestaSeguimiento
from app.database.models.soporte import CargaExcel, CargaExcelDetalle, CitaMedica, LlamadaEmergencia
from app.database.models.educacion import (
    CatCategoriaEducativa,
    ContenidoEducativo,
    ChecklistItem,
)
from app.database.models.catalogos import (CatModuloClinico, CatPrioridadAlerta, CatTipoAlerta, CatIps, CatEapb,
    CatTipoExamen, CatTipoEcografia, CatEstadoNutricional, CatHemoclasificacion,
    CatDiagnosticoCie10, CatVacuna, CatMicronutriente, CatTipoProfesional,
    CatEspecialidad, CatMetodoAnticonceptivo, CatNacionalidad,
    CatPertenenciaEtnica, CatGrupoPoblacional,)


# gestante

async def upsert_gestante(
    db: AsyncSession, data: dict, formula: dict
) -> str:
    """Inserta o actualiza la gestante. Retorna 'nueva' o 'actualizada'."""
    codigo_gmi = data.get("codigo_gmi")
    existing = None

    if codigo_gmi:
        result = await db.execute(
            select(Gestante).where(Gestante.codigo_gmi == codigo_gmi)
        )
        existing = result.scalar_one_or_none()

    if existing:
        for k, v in data.items():
            if v is not None:
                setattr(existing, k, v)
        db.add(existing)
        await db.flush()
        gestante_id = existing.id
        accion = "actualizada"
    else:
        gestante = Gestante(**data)
        db.add(gestante)
        await db.flush()
        gestante_id = gestante.id
        accion = "nueva"

    # fórmula obstétrica (upsert)
    res_f = await db.execute(
        select(FormulaObstetrica).where(FormulaObstetrica.gestante_id == gestante_id)
    )
    fo = res_f.scalar_one_or_none()
    if fo:
        for k, v in formula.items():
            setattr(fo, k, v)
    else:
        fo = FormulaObstetrica(gestante_id=gestante_id, **formula)
    db.add(fo)
    await db.commit()

    return accion


async def get_gestante_map(db: AsyncSession) -> dict[str, str]:
    """Retorna {codigo_gmi: id} para todas las gestantes."""
    result = await db.execute(select(Gestante.codigo_gmi, Gestante.id))
    return {row.codigo_gmi: row.id for row in result.all()}



# control prenatal

async def insert_control(
    db: AsyncSession,
    gestante_id: str,
    control_data: dict,
    signos_data: dict,
    riesgo_obs: str | None,
    dx_riesgo: str | None,
    riesgo_bio: str | None,
    sit_bio: str | None,
):
    control = ControlPrenatal(gestante_id=gestante_id, **control_data)
    db.add(control)
    await db.flush()

    signos = SignosVitales(control_prenatal_id=control.id, **signos_data)
    db.add(signos)

    if riesgo_obs:
        cr_obs = ClasificacionRiesgo(
            gestante_id=gestante_id,
            control_prenatal_id=control.id,
            tipo_riesgo="obstetrico",
            nivel=riesgo_obs.lower(),
            diagnostico_texto=dx_riesgo,
        )
        db.add(cr_obs)

    if riesgo_bio:
        cr_bio = ClasificacionRiesgo(
            gestante_id=gestante_id,
            control_prenatal_id=control.id,
            tipo_riesgo="biosicosocial",
            nivel=riesgo_bio.lower(),
            situaciones_biosicosocial=sit_bio,
        )
        db.add(cr_bio)

    await db.commit()


# exámenes

async def insert_examen(db: AsyncSession, gestante_id: str, data: dict):
    examen = ExamenLaboratorio(gestante_id=gestante_id, **data)
    db.add(examen)
    await db.commit()


# ecografías

async def insert_ecografia(db: AsyncSession, gestante_id: str, data: dict):
    eco = Ecografia(gestante_id=gestante_id, **data)
    db.add(eco)
    await db.commit()


# vacunas

async def insert_vacuna(db: AsyncSession, gestante_id: str, data: dict):
    vac = Vacunacion(gestante_id=gestante_id, **data)
    db.add(vac)
    await db.commit()


# remisiones

async def insert_remision(db: AsyncSession, gestante_id: str, data: dict):
    rem = RemisionInterdisciplinaria(gestante_id=gestante_id, **data)
    db.add(rem)
    await db.commit()


# desenlaces  

async def insert_desenlace(
    db: AsyncSession,
    gestante_id: str,
    parto_data: dict,
    rn_data: dict,
    anticoncepcion_data: dict,
):
    result = await db.execute(
        select(Parto).where(Parto.gestante_id == gestante_id)
    )
    parto = result.scalar_one_or_none()

    if parto:
        # Actualizar campos del parto existente
        for k, v in parto_data.items():
            setattr(parto, k, v)
    else:
        parto = Parto(gestante_id=gestante_id, **parto_data)
        db.add(parto)

    await db.flush()  # necesario para tener parto.id antes de los hijos

    # --- Recién nacido (upsert por parto_id) ---
    result_rn = await db.execute(
        select(RecienNacido).where(RecienNacido.parto_id == parto.id)
    )
    rn = result_rn.scalar_one_or_none()

    if rn:
        for k, v in rn_data.items():
            setattr(rn, k, v)
    else:
        rn = RecienNacido(parto_id=parto.id, **rn_data)
        db.add(rn)

    # --- Anticoncepción posparto (upsert por gestante_id) ---
    if anticoncepcion_data.get("aplicada"):
        result_anti = await db.execute(
            select(AnticoncepcionPosparto).where(
                AnticoncepcionPosparto.gestante_id == gestante_id
            )
        )
        anti = result_anti.scalar_one_or_none()

        if anti:
            anti.metodo_id       = anticoncepcion_data.get("metodo_id")
            anti.fecha_aplicacion = anticoncepcion_data["fecha_aplicacion"]
        else:
            anti = AnticoncepcionPosparto(
                gestante_id=gestante_id,
                metodo_id=anticoncepcion_data.get("metodo_id"),
                fecha_aplicacion=anticoncepcion_data["fecha_aplicacion"],
            )
            db.add(anti)

    await db.commit()


# registro de carga

async def create_carga_excel(db: AsyncSession, **kwargs) -> CargaExcel:
    carga = CargaExcel(**kwargs)
    db.add(carga)
    await db.commit()
    await db.refresh(carga)
    return carga


async def create_carga_detalles(
    db: AsyncSession, carga_id: str, detalles: list[dict]
):
    for d in detalles:
        detalle = CargaExcelDetalle(
            carga_id=carga_id,
            fila_numero=d["fila"],
            hoja=d["hoja"],
            estado=d["estado"],
            mensaje_error=d["mensaje"] if d["estado"] == "error" else None,
        )
        db.add(detalle)
    await db.commit()


# =====================================================================
# USUARIOS Y ROLES
# =====================================================================

from app.database.models.auth import UsuarioStaff, Rol


async def get_all_staff(db: AsyncSession, offset: int, limit: int) -> list[UsuarioStaff]:
    result = await db.execute(
        select(UsuarioStaff)
        .order_by(UsuarioStaff.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return result.scalars().all()


async def get_staff_by_id(db: AsyncSession, user_id: str) -> UsuarioStaff | None:
    result = await db.execute(
        select(UsuarioStaff).where(UsuarioStaff.id == user_id)
    )
    return result.scalar_one_or_none()


async def get_staff_by_email(db: AsyncSession, email: str) -> UsuarioStaff | None:
    result = await db.execute(
        select(UsuarioStaff).where(UsuarioStaff.email == email)
    )
    return result.scalar_one_or_none()


async def create_staff(
    db: AsyncSession, nombre: str, email: str, hashed_pw: str, rol_id: int
) -> UsuarioStaff:
    user = UsuarioStaff(nombre=nombre, email=email, hash_password=hashed_pw, rol_id=rol_id)
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def update_staff(
    db: AsyncSession, user_id: str, nombre: str | None = None, rol_id: int | None = None
) -> UsuarioStaff | None:
    user = await get_staff_by_id(db, user_id)
    if user is None:
        return None
    if nombre is not None:
        user.nombre = nombre
    if rol_id is not None:
        user.rol_id = rol_id
    await db.flush()
    await db.refresh(user)
    return user


async def set_staff_status(db: AsyncSession, user_id: str, activo: bool) -> UsuarioStaff | None:
    user = await get_staff_by_id(db, user_id)
    if user is None:
        return None
    user.activo = activo
    await db.flush()
    await db.refresh(user)
    return user


async def get_all_roles(db: AsyncSession, offset: int, limit: int) -> list[Rol]:
    result = await db.execute(
        select(Rol)
        .order_by(Rol.nombre)
        .offset(offset)
        .limit(limit)
    )
    return result.scalars().all()


async def get_rol_by_id(db: AsyncSession, rol_id: int) -> Rol | None:
    result = await db.execute(
        select(Rol).where(Rol.id == rol_id)
    )
    return result.scalar_one_or_none()


# =====================================================================
# CATÁLOGOS
# =====================================================================

CATALOG_MAP: dict[str, type] = {
    "modulo-clinico": CatModuloClinico,
    "prioridad-alerta": CatPrioridadAlerta,
    "tipo-alerta": CatTipoAlerta,
    "ips": CatIps,
    "eapb": CatEapb,
    "tipo-examen": CatTipoExamen,
    "tipo-ecografia": CatTipoEcografia,
    "estado-nutricional": CatEstadoNutricional,
    "hemoclasificacion": CatHemoclasificacion,
    "diagnostico-cie10": CatDiagnosticoCie10,
    "vacuna": CatVacuna,
    "micronutriente": CatMicronutriente,
    "tipo-profesional": CatTipoProfesional,
    "especialidad": CatEspecialidad,
    "metodo-anticonceptivo": CatMetodoAnticonceptivo,
    "nacionalidad": CatNacionalidad,
    "pertenencia-etnica": CatPertenenciaEtnica,
    "grupo-poblacional": CatGrupoPoblacional,
}

async def list_catalog_items(db: AsyncSession, model: type, offset: int, limit: int) -> list:
    result = await db.execute(
        select(model).order_by(model.id).offset(offset).limit(limit)
    )
    return result.scalars().all()


async def get_catalog_item(db: AsyncSession, model: type, item_id: int) -> Any | None:
    result = await db.execute(select(model).where(model.id == item_id))
    return result.scalar_one_or_none()


async def get_catalog_item_by_codigo(db: AsyncSession, model: type, codigo: str) -> Any | None:
    if not hasattr(model, "codigo"):
        return None
    result = await db.execute(select(model).where(model.codigo == codigo))
    return result.scalar_one_or_none()


async def insert_catalog_item(db: AsyncSession, model: type, data: dict) -> Any:
    cols = set(model.__table__.columns.keys())
    filtered = {k: v for k, v in data.items() if k in cols}
    item = model(**filtered)
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


async def edit_catalog_item(db: AsyncSession, model: type, item_id: int, data: dict) -> Any | None:
    item = await get_catalog_item(db, model, item_id)
    if item is None:
        return None
    cols = set(model.__table__.columns.keys())
    for k, v in data.items():
        if k in cols:
            setattr(item, k, v)
    await db.flush()
    await db.refresh(item)
    return item


async def toggle_catalog_item_status(db: AsyncSession, model: type, item_id: int, activo: bool) -> Any | None:
    item = await get_catalog_item(db, model, item_id)
    if item is None:
        return None
    item.activo = activo
    await db.flush()
    await db.refresh(item)
    return item

    return result.scalar_one_or_none()


# =====================================================================
# CONTENIDO EDUCATIVO — 11.4
# =====================================================================

async def get_all_educational_categories(
    db: AsyncSession, offset: int, limit: int
) -> list[CatCategoriaEducativa]:
    result = await db.execute(
        select(CatCategoriaEducativa)
        .order_by(CatCategoriaEducativa.orden.asc().nulls_last(), CatCategoriaEducativa.nombre)
        .offset(offset)
        .limit(limit)
    )
    return result.scalars().all()


async def get_educational_category_by_id(
    db: AsyncSession, category_id: int
) -> CatCategoriaEducativa | None:
    result = await db.execute(
        select(CatCategoriaEducativa).where(CatCategoriaEducativa.id == category_id)
    )
    return result.scalar_one_or_none()


async def create_educational_category(
    db: AsyncSession, **data
) -> CatCategoriaEducativa:
    obj = CatCategoriaEducativa(**data)
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


async def update_educational_category(
    db: AsyncSession, category_id: int, **data
) -> CatCategoriaEducativa | None:
    obj = await get_educational_category_by_id(db, category_id)
    if obj is None:
        return None
    for k, v in data.items():
        if v is not None:
            setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


async def get_all_educational_contents(
    db: AsyncSession, offset: int, limit: int
) -> list[ContenidoEducativo]:
    result = await db.execute(
        select(ContenidoEducativo)
        .order_by(ContenidoEducativo.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return result.scalars().all()


async def get_educational_content_by_id(
    db: AsyncSession, content_id: int
) -> ContenidoEducativo | None:
    result = await db.execute(
        select(ContenidoEducativo).where(ContenidoEducativo.id == content_id)
    )
    return result.scalar_one_or_none()


async def create_educational_content(
    db: AsyncSession, **data
) -> ContenidoEducativo:
    obj = ContenidoEducativo(**data)
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


async def update_educational_content(
    db: AsyncSession, content_id: int, **data
) -> ContenidoEducativo | None:
    obj = await get_educational_content_by_id(db, content_id)
    if obj is None:
        return None
    for k, v in data.items():
        if v is not None:
            setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


async def set_educational_content_status(
    db: AsyncSession, content_id: int, activo: bool
) -> ContenidoEducativo | None:
    obj = await get_educational_content_by_id(db, content_id)
    if obj is None:
        return None
    obj.activo = activo
    await db.flush()
    await db.refresh(obj)
    return obj


async def get_all_checklist_items(
    db: AsyncSession, offset: int, limit: int
) -> list[ChecklistItem]:
    result = await db.execute(
        select(ChecklistItem)
        .order_by(ChecklistItem.orden.asc().nulls_last(), ChecklistItem.texto)
        .offset(offset)
        .limit(limit)
    )
    return result.scalars().all()


async def get_checklist_item_by_id(
    db: AsyncSession, item_id: int
) -> ChecklistItem | None:
    result = await db.execute(
        select(ChecklistItem).where(ChecklistItem.id == item_id)
    )
    return result.scalar_one_or_none()


async def create_checklist_item(
    db: AsyncSession, **data
) -> ChecklistItem:
    obj = ChecklistItem(**data)
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


async def update_checklist_item(
    db: AsyncSession, item_id: int, **data
) -> ChecklistItem | None:
    obj = await get_checklist_item_by_id(db, item_id)
    if obj is None:
        return None
    for k, v in data.items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


async def set_checklist_item_status(
    db: AsyncSession, item_id: int, activo: bool
) -> ChecklistItem | None:
    obj = await get_checklist_item_by_id(db, item_id)
    if obj is None:
        return None
    obj.activo = activo
    await db.flush()
    await db.refresh(obj)
    return obj


# ---- 11.5 Preguntas de Seguimiento ----

async def get_all_followup_questions(
    db: AsyncSession, offset: int, limit: int
) -> list[PreguntaSeguimiento]:
    result = await db.execute(
        select(PreguntaSeguimiento)
        .order_by(PreguntaSeguimiento.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return result.scalars().all()


async def get_followup_question_by_id(
    db: AsyncSession, question_id: int
) -> PreguntaSeguimiento | None:
    result = await db.execute(
        select(PreguntaSeguimiento).where(PreguntaSeguimiento.id == question_id)
    )
    return result.scalar_one_or_none()


async def create_followup_question(
    db: AsyncSession, **data
) -> PreguntaSeguimiento:
    obj = PreguntaSeguimiento(**data)
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


async def update_followup_question(
    db: AsyncSession, question_id: int, **data
) -> PreguntaSeguimiento | None:
    obj = await get_followup_question_by_id(db, question_id)
    if obj is None:
        return None
    for k, v in data.items():
        if v is not None:
            setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


async def set_followup_question_status(
    db: AsyncSession, question_id: int, activo: bool
) -> PreguntaSeguimiento | None:
    obj = await get_followup_question_by_id(db, question_id)
    if obj is None:
        return None
    obj.activo = activo
    await db.flush()
    await db.refresh(obj)
    return obj


async def get_options_by_question_id(
    db: AsyncSession, question_id: int
) -> list[OpcionPreguntaSeguimiento]:
    result = await db.execute(
        select(OpcionPreguntaSeguimiento)
        .where(OpcionPreguntaSeguimiento.pregunta_id == question_id)
        .order_by(OpcionPreguntaSeguimiento.orden.asc().nulls_last())
    )
    return result.scalars().all()


async def get_option_by_id(
    db: AsyncSession, option_id: int
) -> OpcionPreguntaSeguimiento | None:
    result = await db.execute(
        select(OpcionPreguntaSeguimiento).where(OpcionPreguntaSeguimiento.id == option_id)
    )
    return result.scalar_one_or_none()


async def create_option(
    db: AsyncSession, **data
) -> OpcionPreguntaSeguimiento:
    obj = OpcionPreguntaSeguimiento(**data)
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


async def update_option(
    db: AsyncSession, option_id: int, **data
) -> OpcionPreguntaSeguimiento | None:
    obj = await get_option_by_id(db, option_id)
    if obj is None:
        return None
    for k, v in data.items():
        if v is not None:
            setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


async def delete_option(
    db: AsyncSession, option_id: int
) -> bool:
    obj = await get_option_by_id(db, option_id)
    if obj is None:
        return False
    await db.delete(obj)
    await db.flush()
    return True


# ---- 12. Vista Admin de Gestantes ----

async def get_alertas_by_gestante(db: AsyncSession, gestante_id: str) -> list:
    from app.database.models.riesgo import Alerta
    result = await db.execute(
        select(Alerta, CatTipoAlerta.nombre, CatPrioridadAlerta.codigo)
        .join(CatTipoAlerta, Alerta.tipo_alerta_id == CatTipoAlerta.id)
        .join(CatPrioridadAlerta, Alerta.prioridad_id == CatPrioridadAlerta.id)
        .where(Alerta.gestante_id == gestante_id)
        .order_by(Alerta.created_at.desc())
    )
    return result.all()


async def get_respuestas_with_pregunta_by_gestante(db: AsyncSession, gestante_id: str) -> list:
    result = await db.execute(
        select(RespuestaSeguimiento, PreguntaSeguimiento.texto_pregunta, PreguntaSeguimiento.tipo_respuesta)
        .join(PreguntaSeguimiento, RespuestaSeguimiento.pregunta_id == PreguntaSeguimiento.id)
        .where(RespuestaSeguimiento.gestante_id == gestante_id)
        .order_by(RespuestaSeguimiento.created_at.desc())
    )
    return result.all()


# ---- Citas Admin ----

async def get_all_citas(
    db: AsyncSession,
    from_date: datetime | None = None,
    to_date: datetime | None = None,
    gestante_id: str | None = None,
) -> list:
    if from_date is None:
        from_date = datetime.utcnow()
    if to_date is None:
        to_date = from_date + timedelta(days=30)

    query = (
        select(CitaMedica, Gestante.codigo_gmi, CatIps.nombre)
        .join(Gestante, CitaMedica.gestante_id == Gestante.id)
        .join(CatIps, CitaMedica.ips_id == CatIps.id, isouter=True)
        .where(CitaMedica.fecha_hora >= from_date)
        .where(CitaMedica.fecha_hora <= to_date)
        .order_by(CitaMedica.fecha_hora.asc())
    )
    if gestante_id:
        query = query.where(CitaMedica.gestante_id == gestante_id)

    result = await db.execute(query)
    return result.all()


async def get_citas_by_gestante(db: AsyncSession, gestante_id: str) -> list:
    result = await db.execute(
        select(CitaMedica, Gestante.codigo_gmi, CatIps.nombre)
        .join(Gestante, CitaMedica.gestante_id == Gestante.id)
        .join(CatIps, CitaMedica.ips_id == CatIps.id, isouter=True)
        .where(CitaMedica.gestante_id == gestante_id)
        .order_by(CitaMedica.fecha_hora.asc())
    )
    return result.all()


async def get_cita_by_id_admin(db: AsyncSession, cita_id: str) -> tuple | None:
    result = await db.execute(
        select(CitaMedica, Gestante.codigo_gmi, CatIps.nombre)
        .join(Gestante, CitaMedica.gestante_id == Gestante.id)
        .join(CatIps, CitaMedica.ips_id == CatIps.id, isouter=True)
        .where(CitaMedica.id == cita_id)
    )
    return result.one_or_none()


async def create_cita_admin(db: AsyncSession, cita: CitaMedica) -> CitaMedica:
    db.add(cita)
    await db.flush()
    await db.refresh(cita)
    return cita


async def save_cita_admin(db: AsyncSession, cita: CitaMedica) -> CitaMedica:
    await db.flush()
    await db.refresh(cita)
    return cita


async def get_llamadas_by_gestante(db: AsyncSession, gestante_id: str) -> list[LlamadaEmergencia]:
    result = await db.execute(
        select(LlamadaEmergencia)
        .where(LlamadaEmergencia.gestante_id == gestante_id)
        .order_by(LlamadaEmergencia.created_at.desc())
    )
    return result.scalars().all()


async def create_llamada_emergencia_admin(db: AsyncSession, llamada: LlamadaEmergencia) -> LlamadaEmergencia:
    db.add(llamada)
    await db.flush()
    await db.refresh(llamada)
    return llamada


# ---- 11.6 Auditoría y Monitoreo ----

async def get_all_audit_logs(
    db: AsyncSession, offset: int, limit: int, sort: str = "fecha_desc"
) -> list[AuditLog]:
    order = AuditLog.created_at.desc() if sort == "fecha_desc" else AuditLog.created_at.asc()
    result = await db.execute(
        select(AuditLog)
        .order_by(order)
        .offset(offset)
        .limit(limit)
    )
    return result.scalars().all()

    return obj


# ---- 11.9 Gestantes ----

async def get_all_gestantes_with_details(
    db: AsyncSession, offset: int, limit: int
) -> list[dict]:
    result = await db.execute(
        select(Gestante)
        .order_by(Gestante.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    gestantes = result.scalars().all()
    if not gestantes:
        return []

    ids = [g.id for g in gestantes]

    # Last login from audit_log
    q_al = select(
        AuditLog.gestante_id,
        func.max(AuditLog.created_at).label("ultimo_acceso")
    ).where(
        AuditLog.gestante_id.in_(ids),
        AuditLog.accion == "login"
    ).group_by(AuditLog.gestante_id)
    acceso_map = {r.gestante_id: r.ultimo_acceso for r in (await db.execute(q_al)).all()}

    # Latest respuesta_seguimiento + question text
    latest_rs = (
        select(
            RespuestaSeguimiento.gestante_id,
            RespuestaSeguimiento.pregunta_id,
            RespuestaSeguimiento.created_at,
            func.row_number().over(
                partition_by=RespuestaSeguimiento.gestante_id,
                order_by=RespuestaSeguimiento.created_at.desc()
            ).label("rn")
        )
        .where(RespuestaSeguimiento.gestante_id.in_(ids))
        .subquery()
    )
    q_rs = select(
        latest_rs.c.gestante_id,
        latest_rs.c.created_at,
        PreguntaSeguimiento.texto_pregunta
    ).join(
        PreguntaSeguimiento, PreguntaSeguimiento.id == latest_rs.c.pregunta_id
    ).where(latest_rs.c.rn == 1)
    respuesta_map = {}
    for r in (await db.execute(q_rs)).all():
        respuesta_map[r.gestante_id] = (r.created_at, r.texto_pregunta)

    # Latest alerta per gestante
    latest_al = (
        select(
            Alerta.gestante_id,
            Alerta.estado,
            Alerta.prioridad_id,
            func.row_number().over(
                partition_by=Alerta.gestante_id,
                order_by=Alerta.created_at.desc()
            ).label("rn")
        )
        .where(Alerta.gestante_id.in_(ids))
        .subquery()
    )
    q_alert = select(
        latest_al.c.gestante_id,
        latest_al.c.estado,
        latest_al.c.prioridad_id
    ).where(latest_al.c.rn == 1)
    alerta_map = {}
    for r in (await db.execute(q_alert)).all():
        alerta_map[r.gestante_id] = (r.estado, r.prioridad_id)

    # Latest clasificacion_riesgo per gestante
    latest_cr = (
        select(
            ClasificacionRiesgo.gestante_id,
            ClasificacionRiesgo.nivel,
            ClasificacionRiesgo.clasificacion_ia,
            func.row_number().over(
                partition_by=ClasificacionRiesgo.gestante_id,
                order_by=ClasificacionRiesgo.fecha_evaluacion.desc()
            ).label("rn")
        )
        .where(ClasificacionRiesgo.gestante_id.in_(ids))
        .subquery()
    )
    q_cr = select(
        latest_cr.c.gestante_id,
        latest_cr.c.nivel,
        latest_cr.c.clasificacion_ia
    ).where(latest_cr.c.rn == 1)
    riesgo_map = {}
    for r in (await db.execute(q_cr)).all():
        riesgo_map[r.gestante_id] = (r.nivel, r.clasificacion_ia)

    out = []
    for g in gestantes:
        acceso = acceso_map.get(g.id)
        resp_data = respuesta_map.get(g.id)
        alert_data = alerta_map.get(g.id)
        riesgo_data = riesgo_map.get(g.id)
        out.append({
            "id": g.id,
            "codigo_gmi": g.codigo_gmi,
            "fecha_nacimiento": g.fecha_nacimiento,
            "fecha_ultima_menstruacion": g.fecha_ultima_menstruacion,
            "fecha_probable_parto": g.fecha_probable_parto,
            "semanas_eg_ingreso": g.semanas_eg_ingreso,
            "modulo_activo_id": g.modulo_activo_id,
            "activa": g.activa,
            "anio_ingreso": g.anio_ingreso,
            "created_at": g.created_at,
            "ultimo_acceso": acceso,
            "ultima_pregunta_respondida": resp_data[1] if resp_data else None,
            "ultima_respuesta_fecha": resp_data[0] if resp_data else None,
            "ultimo_estado_alerta": alert_data[0] if alert_data else None,
            "ultima_prioridad_alerta_id": alert_data[1] if alert_data else None,
            "nivel_riesgo": riesgo_data[0] if riesgo_data else None,
            "clasificacion_ia": riesgo_data[1] if riesgo_data else None,
        })
    return out
