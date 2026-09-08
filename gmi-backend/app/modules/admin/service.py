import shutil
import csv
import io
from pathlib import Path
import tempfile
import uuid
from datetime import datetime

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from openpyxl import Workbook

from app.modules.admin.excel.processor import process_excel
from app.database.models.soporte import CargaExcel, CargaExcelDetalle
from app.database.models.gestante import Gestante
from app.database.models.riesgo import ClasificacionRiesgo
from app.database.models.examenes import ExamenLaboratorio
from app.database.models.soporte import CitaMedica, LlamadaEmergencia
from app.modules.admin import schemas, repository
from app.modules.clinical import repository as clinical_repository
from app.modules.clinical.schemas import (
    ExamenCreate,
    ExamenResponse,
    SignosVitalesResponse,
)
from app.modules.m6.schemas import (
    CitaMedicaUpdate,
    LlamadaEmergenciaCreate,
    LlamadaEmergenciaResponse,
)
from app.core.security import hash_password
from app.core.exceptions import NotFoundException, ConflictException

UPLOAD_DIR = Path(tempfile.gettempdir()) / "gmi_uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".xlsx", ".xls"}


# ---- 11.2 Carga Masiva Excel ----

async def upload_and_process(
    db: AsyncSession, file: UploadFile, usuario_id: str
) -> CargaExcel:
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Formato no soportado '{ext}'. Solo se aceptan archivos .xlsx o .xls.",
        )

    tmp_path = UPLOAD_DIR / f"{usuario_id}_{file.filename}"
    with open(tmp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        carga = await process_excel(
            db=db,
            file_path=tmp_path,
            archivo_nombre=file.filename,
            usuario_id=usuario_id,
        )
    finally:
        tmp_path.unlink(missing_ok=True)

    return carga


async def get_carga_with_details(
    db: AsyncSession, carga_id: str
) -> tuple[CargaExcel, list[CargaExcelDetalle]]:
    result = await db.execute(
        select(CargaExcel).where(CargaExcel.id == carga_id)
    )
    carga = result.scalar_one_or_none()
    if not carga:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carga no encontrada.",
        )
    detalles_result = await db.execute(
        select(CargaExcelDetalle).where(CargaExcelDetalle.carga_id == carga_id)
    )
    return carga, detalles_result.scalars().all()


async def get_all_cargas(db: AsyncSession) -> list[CargaExcel]:
    result = await db.execute(
        select(CargaExcel).order_by(CargaExcel.created_at.desc())
    )
    return result.scalars().all()


def _not_implemented():
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint en construcción / Modelos de BD pendientes",
    )

# ---- 11.1 Usuarios y Roles ----

async def get_staff_users(db: AsyncSession, page: int = 1, size: int = 20, sort: str = "fecha_desc") -> list[schemas.UserResponse]:
    offset = (page - 1) * size
    users = await repository.get_all_staff(db, offset, size)
    return [schemas.UserResponse.model_validate(u) for u in users]


async def create_staff_user(db: AsyncSession, data: schemas.UserCreate) -> schemas.UserResponse:
    existing = await repository.get_staff_by_email(db, data.email)
    if existing:
        raise ConflictException("Ya existe un usuario con ese email.")

    rol = await repository.get_rol_by_id(db, data.rol_id)
    if rol is None:
        raise NotFoundException("Rol no encontrado.")

    user = await repository.create_staff(db, data.nombre, data.email, hash_password(data.password), data.rol_id)
    return schemas.UserResponse.model_validate(user)


async def update_staff_user(db: AsyncSession, user_id: str, data: schemas.UserUpdate) -> schemas.UserResponse:
    if data.rol_id is not None:
        rol = await repository.get_rol_by_id(db, data.rol_id)
        if rol is None:
            raise NotFoundException("Rol no encontrado.")

    user = await repository.update_staff(db, user_id, nombre=data.nombre, rol_id=data.rol_id)
    if user is None:
        raise NotFoundException("Usuario no encontrado.")
    return schemas.UserResponse.model_validate(user)


async def update_staff_user_status(db: AsyncSession, user_id: str, data: schemas.UserStatusUpdate) -> schemas.UserResponse:
    user = await repository.set_staff_status(db, user_id, data.activo)
    if user is None:
        raise NotFoundException("Usuario no encontrado.")
    return schemas.UserResponse.model_validate(user)


async def get_roles(db: AsyncSession, page: int = 1, size: int = 20, sort: str = "fecha_desc") -> list[schemas.RoleResponse]:
    offset = (page - 1) * size
    roles = await repository.get_all_roles(db, offset, size)
    return [schemas.RoleResponse.model_validate(r) for r in roles]


# ---- 11.3 Catálogos ----

def _resolve_catalog(catalog_name: str) -> type:
    model = repository.CATALOG_MAP.get(catalog_name)
    if model is None:
        raise NotFoundException(f"Catálogo '{catalog_name}' no existe. Catálogos válidos: {', '.join(repository.CATALOG_MAP)}")
    return model


async def get_catalog_items(
    db: AsyncSession, catalog_name: str, page: int = 1, size: int = 20
) -> list[schemas.CatalogItemResponse]:
    model = _resolve_catalog(catalog_name)
    offset = (page - 1) * size
    items = await repository.list_catalog_items(db, model, offset, size)
    return [schemas.CatalogItemResponse.model_validate(item) for item in items]


async def create_catalog_item(
    db: AsyncSession, catalog_name: str, data: schemas.CatalogItemCreate
) -> schemas.CatalogItemResponse:
    model = _resolve_catalog(catalog_name)
    payload = data.model_dump(exclude_none=True)
    if "codigo" in payload:
        existing = await repository.get_catalog_item_by_codigo(db, model, payload["codigo"])
        if existing:
            raise ConflictException(f"Ya existe un ítem con codigo '{payload['codigo']}' en {catalog_name}.")
    item = await repository.insert_catalog_item(db, model, payload)
    return schemas.CatalogItemResponse.model_validate(item)


async def update_catalog_item(
    db: AsyncSession, catalog_name: str, item_id: int, data: schemas.CatalogItemUpdate
) -> schemas.CatalogItemResponse:
    model = _resolve_catalog(catalog_name)
    item = await repository.edit_catalog_item(db, model, item_id, data.model_dump(exclude_unset=True))
    if item is None:
        raise NotFoundException("Ítem de catálogo no encontrado.")
    return schemas.CatalogItemResponse.model_validate(item)


async def update_catalog_item_status(
    db: AsyncSession, catalog_name: str, item_id: int, data: schemas.CatalogItemStatusUpdate
) -> schemas.CatalogItemResponse:
    model = _resolve_catalog(catalog_name)
    item = await repository.toggle_catalog_item_status(db, model, item_id, data.activo)
    if item is None:
        raise NotFoundException("Ítem de catálogo no encontrado.")
    return schemas.CatalogItemResponse.model_validate(item)


# ---- 11.4 Contenido Educativo ----

async def get_educational_categories(
    db: AsyncSession, page: int = 1, size: int = 20, sort: str = "fecha_desc"
) -> list[schemas.EducationalCategoryResponse]:
    offset = (page - 1) * size
    items = await repository.get_all_educational_categories(db, offset, limit=size)
    return [schemas.EducationalCategoryResponse.model_validate(c) for c in items]


async def create_educational_category(
    db: AsyncSession, data: schemas.EducationalCategoryCreate
) -> schemas.EducationalCategoryResponse:
    obj = await repository.create_educational_category(
        db,
        nombre=data.nombre,
        descripcion=data.descripcion,
        icono=data.icono,
        orden=data.orden,
    )
    return schemas.EducationalCategoryResponse.model_validate(obj)


async def update_educational_category(
    db: AsyncSession, item_id: int, data: schemas.EducationalCategoryUpdate
) -> schemas.EducationalCategoryResponse:
    obj = await repository.update_educational_category(
        db, item_id,
        nombre=data.nombre,
        descripcion=data.descripcion,
        icono=data.icono,
        orden=data.orden,
    )
    if obj is None:
        raise NotFoundException("Categoría educativa no encontrada.")
    return schemas.EducationalCategoryResponse.model_validate(obj)


async def get_educational_contents(
    db: AsyncSession, page: int = 1, size: int = 20, sort: str = "fecha_desc"
) -> list[schemas.EducationalContentResponse]:
    offset = (page - 1) * size
    items = await repository.get_all_educational_contents(db, offset, limit=size)
    return [schemas.EducationalContentResponse.model_validate(c) for c in items]


async def create_educational_content(
    db: AsyncSession, data: schemas.EducationalContentCreate
) -> schemas.EducationalContentResponse:
    obj = await repository.create_educational_content(
        db,
        categoria_id=data.categoria_id,
        titulo=data.titulo,
        descripcion=data.descripcion,
        tipo_contenido=data.tipo_contenido,
        cuerpo_texto=data.cuerpo_texto,
        url_recurso=data.url_recurso,
        url_imagen=data.url_imagen,
        modulo_id=data.modulo_id,
        semana_eg_inicio=data.semana_eg_inicio,
        semana_eg_fin=data.semana_eg_fin,
        duracion_minutos=data.duracion_minutos,
        orden=data.orden,
    )
    return schemas.EducationalContentResponse.model_validate(obj)


async def update_educational_content(
    db: AsyncSession, item_id: int, data: schemas.EducationalContentUpdate
) -> schemas.EducationalContentResponse:
    obj = await repository.update_educational_content(
        db, item_id,
        categoria_id=data.categoria_id,
        titulo=data.titulo,
        descripcion=data.descripcion,
        tipo_contenido=data.tipo_contenido,
        cuerpo_texto=data.cuerpo_texto,
        url_recurso=data.url_recurso,
        url_imagen=data.url_imagen,
        modulo_id=data.modulo_id,
        semana_eg_inicio=data.semana_eg_inicio,
        semana_eg_fin=data.semana_eg_fin,
        duracion_minutos=data.duracion_minutos,
        orden=data.orden,
    )
    if obj is None:
        raise NotFoundException("Contenido educativo no encontrado.")
    return schemas.EducationalContentResponse.model_validate(obj)


async def update_educational_content_status(
    db: AsyncSession, item_id: int, data: schemas.EducationalContentStatusUpdate
) -> schemas.EducationalContentResponse:
    obj = await repository.set_educational_content_status(db, item_id, data.activo)
    if obj is None:
        raise NotFoundException("Contenido educativo no encontrado.")
    return schemas.EducationalContentResponse.model_validate(obj)


async def get_checklist_items(
    db: AsyncSession, page: int = 1, size: int = 20, sort: str = "fecha_desc"
) -> list[schemas.ChecklistItemResponse]:
    offset = (page - 1) * size
    items = await repository.get_all_checklist_items(db, offset, limit=size)
    return [schemas.ChecklistItemResponse.model_validate(c) for c in items]


async def create_checklist_item(
    db: AsyncSession, data: schemas.ChecklistItemCreate
) -> schemas.ChecklistItemResponse:
    obj = await repository.create_checklist_item(
        db,
        texto=data.texto,
        modulo_id=data.modulo_id,
        semana_eg=data.semana_eg,
        orden=data.orden,
    )
    return schemas.ChecklistItemResponse.model_validate(obj)


async def update_checklist_item(
    db: AsyncSession, item_id: int, data: schemas.ChecklistItemUpdate
) -> schemas.ChecklistItemResponse:
    obj = await repository.update_checklist_item(
        db, item_id,
        texto=data.texto,
        modulo_id=data.modulo_id,
        semana_eg=data.semana_eg,
        orden=data.orden,
    )
    if obj is None:
        raise NotFoundException("Ítem de checklist no encontrado.")
    return schemas.ChecklistItemResponse.model_validate(obj)


async def update_checklist_item_status(
    db: AsyncSession, item_id: int, data: schemas.ChecklistItemStatusUpdate
) -> schemas.ChecklistItemResponse:
    obj = await repository.set_checklist_item_status(db, item_id, data.activo)
    if obj is None:
        raise NotFoundException("Ítem de checklist no encontrado.")
    return schemas.ChecklistItemResponse.model_validate(obj)


# ---- 11.9 Gestantes ----

async def get_gestantes(
    db: AsyncSession, page: int = 1, size: int = 20, sort: str = "fecha_desc"
) -> list[schemas.GestanteListResponse]:
    offset = (page - 1) * size
    items = await repository.get_all_gestantes_with_details(db, offset, size)
    return [schemas.GestanteListResponse.model_validate(item) for item in items]


# ---- 11.5 Preguntas de Seguimiento ----

async def get_follow_up_questions(
    db: AsyncSession, page: int = 1, size: int = 20, sort: str = "fecha_desc"
) -> list[schemas.FollowUpQuestionResponse]:
    offset = (page - 1) * size
    items = await repository.get_all_followup_questions(db, offset, size)
    return [schemas.FollowUpQuestionResponse.model_validate(q) for q in items]


async def create_follow_up_question(
    db: AsyncSession, data: schemas.FollowUpQuestionCreate
) -> schemas.FollowUpQuestionResponse:
    obj = await repository.create_followup_question(
        db,
        texto_pregunta=data.texto_pregunta,
        tipo_respuesta=data.tipo_respuesta,
        modulo_id=data.modulo_id,
        frecuencia=data.frecuencia,
        es_signo_alarma=data.es_signo_alarma,
        prioridad_alerta_default_id=data.prioridad_alerta_default_id,
        orden=data.orden,
    )
    return schemas.FollowUpQuestionResponse.model_validate(obj)


async def update_follow_up_question(
    db: AsyncSession, item_id: int, data: schemas.FollowUpQuestionUpdate
) -> schemas.FollowUpQuestionResponse:
    obj = await repository.update_followup_question(
        db, item_id,
        texto_pregunta=data.texto_pregunta,
        tipo_respuesta=data.tipo_respuesta,
        modulo_id=data.modulo_id,
        frecuencia=data.frecuencia,
        es_signo_alarma=data.es_signo_alarma,
        prioridad_alerta_default_id=data.prioridad_alerta_default_id,
        orden=data.orden,
    )
    if obj is None:
        raise NotFoundException("Pregunta de seguimiento no encontrada.")
    return schemas.FollowUpQuestionResponse.model_validate(obj)


async def update_follow_up_question_status(
    db: AsyncSession, item_id: int, data: schemas.FollowUpQuestionStatusUpdate
) -> schemas.FollowUpQuestionResponse:
    obj = await repository.set_followup_question_status(db, item_id, data.activo)
    if obj is None:
        raise NotFoundException("Pregunta de seguimiento no encontrada.")
    return schemas.FollowUpQuestionResponse.model_validate(obj)


async def get_question_options(
    db: AsyncSession, question_id: int
) -> list[schemas.QuestionOptionResponse]:
    items = await repository.get_options_by_question_id(db, question_id)
    return [schemas.QuestionOptionResponse.model_validate(o) for o in items]


async def create_question_option(
    db: AsyncSession, question_id: int, data: schemas.QuestionOptionCreate
) -> schemas.QuestionOptionResponse:
    obj = await repository.create_option(
        db,
        pregunta_id=question_id,
        texto_opcion=data.texto_opcion,
        valor_numerico=data.valor_numerico,
        es_alarma=data.es_alarma,
        prioridad_alerta_id=data.prioridad_alerta_id,
        orden=data.orden,
    )
    return schemas.QuestionOptionResponse.model_validate(obj)


async def update_question_option(
    db: AsyncSession, option_id: int, data: schemas.QuestionOptionUpdate
) -> schemas.QuestionOptionResponse:
    obj = await repository.update_option(
        db, option_id,
        texto_opcion=data.texto_opcion,
        valor_numerico=data.valor_numerico,
        es_alarma=data.es_alarma,
        prioridad_alerta_id=data.prioridad_alerta_id,
        orden=data.orden,
    )
    if obj is None:
        raise NotFoundException("Opción no encontrada.")
    return schemas.QuestionOptionResponse.model_validate(obj)


async def delete_question_option(
    db: AsyncSession, option_id: int
) -> None:
    deleted = await repository.delete_option(db, option_id)
    if not deleted:
        raise NotFoundException("Opción no encontrada.")


# ---- 11.6 Auditoría y Monitoreo ----

async def get_audit_logs(
    db: AsyncSession, page: int = 1, size: int = 20, sort: str = "fecha_desc"
) -> list[schemas.AuditLogResponse]:
    offset = (page - 1) * size
    items = await repository.get_all_audit_logs(db, offset, size, sort)
    return [schemas.AuditLogResponse.model_validate(a) for a in items]


async def get_system_health(db: AsyncSession) -> schemas.SystemHealthResponse:
    try:
        await db.execute(select(1))
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    return schemas.SystemHealthResponse(
        status="ok",
        database=db_status,
        version="1.0",
        uptime="running",
    )


# ---- Helpers ----

def _calcular_trimestre(semana: int) -> int:
    if semana <= 13:
        return 1
    if semana <= 27:
        return 2
    return 3


# ---- 12. Vista Admin de Gestantes ----

async def get_gestante_exams(db: AsyncSession, gestante_id: str) -> list[ExamenResponse]:
    gestante = await clinical_repository.get_gestante_by_id(db, gestante_id)
    if not gestante:
        raise NotFoundException("Gestante no encontrada")

    examenes = await clinical_repository.get_examenes_by_gestante(db, gestante_id)
    result = []
    for e in examenes:
        tipo = await clinical_repository.get_tipo_examen_by_id(db, e.tipo_examen_id)
        result.append(ExamenResponse(
            id=e.id,
            tipo_examen_id=e.tipo_examen_id,
            tipo_examen_nombre=tipo.nombre if tipo else None,
            fecha_toma=e.fecha_toma,
            resultado=e.resultado,
            resultado_numerico=e.resultado_numerico,
            unidad=e.unidad,
            trimestre=e.trimestre,
            semana_gestacion=e.semana_gestacion,
            observaciones=e.observaciones,
            created_at=e.created_at,
        ))
    return result


async def get_gestante_exam_by_id(db: AsyncSession, gestante_id: str, exam_id: str) -> ExamenResponse:
    gestante = await clinical_repository.get_gestante_by_id(db, gestante_id)
    if not gestante:
        raise NotFoundException("Gestante no encontrada")

    examen = await clinical_repository.get_examen_by_id(db, exam_id)
    if examen is None or examen.gestante_id != gestante_id:
        raise NotFoundException("Examen no encontrado")

    tipo = await clinical_repository.get_tipo_examen_by_id(db, examen.tipo_examen_id)
    return ExamenResponse(
        id=examen.id,
        tipo_examen_id=examen.tipo_examen_id,
        tipo_examen_nombre=tipo.nombre if tipo else None,
        fecha_toma=examen.fecha_toma,
        resultado=examen.resultado,
        resultado_numerico=examen.resultado_numerico,
        unidad=examen.unidad,
        trimestre=examen.trimestre,
        semana_gestacion=examen.semana_gestacion,
        observaciones=examen.observaciones,
        created_at=examen.created_at,
    )


async def create_gestante_exam(db: AsyncSession, gestante_id: str, data: ExamenCreate, staff_id: str) -> ExamenResponse:
    gestante = await clinical_repository.get_gestante_by_id(db, gestante_id)
    if not gestante:
        raise NotFoundException("Gestante no encontrada")

    tipo = await clinical_repository.get_tipo_examen_by_id(db, data.tipo_examen_id)
    if tipo is None:
        raise NotFoundException("Tipo de examen no encontrado")

    trimestre = _calcular_trimestre(data.semana_gestacion) if data.semana_gestacion else None

    examen = ExamenLaboratorio(
        gestante_id=gestante_id,
        control_prenatal_id=data.control_prenatal_id,
        tipo_examen_id=data.tipo_examen_id,
        fecha_toma=data.fecha_toma,
        resultado=data.resultado,
        resultado_numerico=data.resultado_numerico,
        unidad=data.unidad,
        trimestre=trimestre,
        semana_gestacion=data.semana_gestacion,
        observaciones=data.observaciones,
        created_by=staff_id,
    )
    examen = await clinical_repository.create_examen(db, examen)

    return ExamenResponse(
        id=examen.id,
        tipo_examen_id=examen.tipo_examen_id,
        tipo_examen_nombre=tipo.nombre,
        fecha_toma=examen.fecha_toma,
        resultado=examen.resultado,
        resultado_numerico=examen.resultado_numerico,
        unidad=examen.unidad,
        trimestre=examen.trimestre,
        semana_gestacion=examen.semana_gestacion,
        observaciones=examen.observaciones,
        created_at=examen.created_at,
    )


async def get_gestante_alarm_signs(db: AsyncSession, gestante_id: str) -> list[schemas.AlertaAdminResponse]:
    gestante = await clinical_repository.get_gestante_by_id(db, gestante_id)
    if not gestante:
        raise NotFoundException("Gestante no encontrada")

    rows = await repository.get_alertas_by_gestante(db, gestante_id)
    return [
        schemas.AlertaAdminResponse(
            id=alerta.id,
            descripcion=alerta.descripcion,
            estado=alerta.estado,
            modulo_origen=alerta.modulo_origen,
            tipo_alerta=tipo_alerta_nombre,
            prioridad=prioridad_codigo,
            created_at=alerta.created_at,
        )
        for alerta, tipo_alerta_nombre, prioridad_codigo in rows
    ]


async def get_gestante_daily_questions_history(db: AsyncSession, gestante_id: str) -> list[schemas.RespuestaConPreguntaResponse]:
    gestante = await clinical_repository.get_gestante_by_id(db, gestante_id)
    if not gestante:
        raise NotFoundException("Gestante no encontrada")

    rows = await repository.get_respuestas_with_pregunta_by_gestante(db, gestante_id)
    return [
        schemas.RespuestaConPreguntaResponse(
            id=r.id,
            pregunta_id=r.pregunta_id,
            pregunta_texto=pregunta_texto,
            tipo_respuesta=tipo_respuesta,
            respuesta_texto=r.respuesta_texto,
            respuesta_booleana=r.respuesta_booleana,
            respuesta_numerica=r.respuesta_numerica,
            opcion_id=r.opcion_id,
            semana_gestacion=r.semana_gestacion,
            alerta_id=r.alerta_id,
            created_at=r.created_at,
        )
        for r, pregunta_texto, tipo_respuesta in rows
    ]


async def get_gestante_vitals(db: AsyncSession, gestante_id: str) -> list[SignosVitalesResponse]:
    gestante = await clinical_repository.get_gestante_by_id(db, gestante_id)
    if not gestante:
        raise NotFoundException("Gestante no encontrada")
    rows = await clinical_repository.get_vitales_by_gestante(db, gestante_id)
    return [
        SignosVitalesResponse(
            id=sv.id,
            control_prenatal_id=sv.control_prenatal_id,
            fecha_control=fecha_control,
            peso_kg=sv.peso_kg,
            talla_cm=sv.talla_cm,
            imc=sv.imc,
            estado_nutricional_id=sv.estado_nutricional_id,
            altura_uterina=sv.altura_uterina,
            presion_sistolica=sv.presion_sistolica,
            presion_diastolica=sv.presion_diastolica,
            fcf=sv.fcf,
            created_at=sv.created_at,
        )
        for sv, fecha_control in rows
    ]


# ---- Citas Admin ----

async def get_all_appointments(
    db: AsyncSession,
    from_date: datetime | None = None,
    to_date: datetime | None = None,
    gestante_id: str | None = None,
) -> list[schemas.CitaAdminResponse]:
    rows = await repository.get_all_citas(db, from_date, to_date, gestante_id)
    return [
        schemas.CitaAdminResponse(
            id=c.id,
            gestante_id=c.gestante_id,
            codigo_gmi=codigo_gmi,
            ips_id=c.ips_id,
            ips_nombre=ips_nombre,
            fecha_hora=c.fecha_hora,
            tipo_cita=c.tipo_cita,
            estado=c.estado,
            created_at=c.created_at,
        )
        for c, codigo_gmi, ips_nombre in rows
    ]


async def get_gestante_appointments(db: AsyncSession, gestante_id: str) -> list[schemas.CitaAdminResponse]:
    gestante = await clinical_repository.get_gestante_by_id(db, gestante_id)
    if not gestante:
        raise NotFoundException("Gestante no encontrada")

    rows = await repository.get_citas_by_gestante(db, gestante_id)
    return [
        schemas.CitaAdminResponse(
            id=c.id,
            gestante_id=c.gestante_id,
            codigo_gmi=codigo_gmi,
            ips_id=c.ips_id,
            ips_nombre=ips_nombre,
            fecha_hora=c.fecha_hora,
            tipo_cita=c.tipo_cita,
            estado=c.estado,
            created_at=c.created_at,
        )
        for c, codigo_gmi, ips_nombre in rows
    ]


async def create_appointment(db: AsyncSession, data: schemas.CitaAdminCreate) -> schemas.CitaAdminResponse:
    gestante = await clinical_repository.get_gestante_by_id(db, data.gestante_id)
    if not gestante:
        raise NotFoundException("Gestante no encontrada")

    dt = data.fecha_hora
    if dt.tzinfo:
        dt = dt.astimezone(datetime.timezone.utc).replace(tzinfo=None)
    cita = CitaMedica(
        gestante_id=data.gestante_id,
        ips_id=data.ips_id,
        fecha_hora=dt,
        tipo_cita=data.tipo_cita,
        estado="programada",
    )
    cita = await repository.create_cita_admin(db, cita)

    # Re-query to get codigo_gmi and ips_nombre for response
    row = await repository.get_cita_by_id_admin(db, cita.id)
    if row is None:
        raise NotFoundException("Cita no encontrada tras crearla")
    c, codigo_gmi, ips_nombre = row
    return schemas.CitaAdminResponse(
        id=c.id,
        gestante_id=c.gestante_id,
        codigo_gmi=codigo_gmi,
        ips_id=c.ips_id,
        ips_nombre=ips_nombre,
        fecha_hora=c.fecha_hora,
        tipo_cita=c.tipo_cita,
        estado=c.estado,
        created_at=c.created_at,
    )


async def reprogramar_appointment(db: AsyncSession, appointment_id: str, data: CitaMedicaUpdate) -> schemas.CitaAdminResponse:
    row = await repository.get_cita_by_id_admin(db, appointment_id)
    if row is None:
        raise NotFoundException("Cita no encontrada")
    cita, codigo_gmi, ips_nombre = row
    cita.fecha_hora = data.fecha_hora
    cita = await repository.save_cita_admin(db, cita)
    return schemas.CitaAdminResponse(
        id=cita.id,
        gestante_id=cita.gestante_id,
        codigo_gmi=codigo_gmi,
        ips_id=cita.ips_id,
        ips_nombre=ips_nombre,
        fecha_hora=cita.fecha_hora,
        tipo_cita=cita.tipo_cita,
        estado=cita.estado,
        created_at=cita.created_at,
    )


async def cancelar_appointment(db: AsyncSession, appointment_id: str) -> schemas.CitaAdminResponse:
    row = await repository.get_cita_by_id_admin(db, appointment_id)
    if row is None:
        raise NotFoundException("Cita no encontrada")
    cita, codigo_gmi, ips_nombre = row
    cita.estado = "cancelada"
    cita = await repository.save_cita_admin(db, cita)
    return schemas.CitaAdminResponse(
        id=cita.id,
        gestante_id=cita.gestante_id,
        codigo_gmi=codigo_gmi,
        ips_id=cita.ips_id,
        ips_nombre=ips_nombre,
        fecha_hora=cita.fecha_hora,
        tipo_cita=cita.tipo_cita,
        estado=cita.estado,
        created_at=cita.created_at,
    )


async def confirmar_appointment(db: AsyncSession, appointment_id: str) -> schemas.CitaAdminResponse:
    row = await repository.get_cita_by_id_admin(db, appointment_id)
    if row is None:
        raise NotFoundException("Cita no encontrada")
    cita, codigo_gmi, ips_nombre = row
    cita.estado = "confirmada"
    cita = await repository.save_cita_admin(db, cita)
    return schemas.CitaAdminResponse(
        id=cita.id,
        gestante_id=cita.gestante_id,
        codigo_gmi=codigo_gmi,
        ips_id=cita.ips_id,
        ips_nombre=ips_nombre,
        fecha_hora=cita.fecha_hora,
        tipo_cita=cita.tipo_cita,
        estado=cita.estado,
        created_at=cita.created_at,
    )


async def create_gestante_emergency_call(db: AsyncSession, gestante_id: str, data: LlamadaEmergenciaCreate) -> LlamadaEmergenciaResponse:
    gestante = await clinical_repository.get_gestante_by_id(db, gestante_id)
    if not gestante:
        raise NotFoundException("Gestante no encontrada")

    llamada = LlamadaEmergencia(
        gestante_id=gestante_id,
        motivo=data.motivo,
        destino=data.destino,
        resultado=data.resultado,
    )
    llamada = await repository.create_llamada_emergencia_admin(db, llamada)
    return LlamadaEmergenciaResponse.model_validate(llamada)


async def get_gestante_emergency_call_history(db: AsyncSession, gestante_id: str) -> list[LlamadaEmergenciaResponse]:
    gestante = await clinical_repository.get_gestante_by_id(db, gestante_id)
    if not gestante:
        raise NotFoundException("Gestante no encontrada")

    llamadas = await repository.get_llamadas_by_gestante(db, gestante_id)
    return [LlamadaEmergenciaResponse.model_validate(l) for l in llamadas]


# ---- 11.7 Exportación ----

async def export_gestantes(db: AsyncSession, format: str = "xlsx") -> bytes:
    result = await db.execute(select(Gestante).order_by(Gestante.created_at.desc()))
    gestantes = result.scalars().all()

    rows = []
    for g in gestantes:
        rows.append({
            "codigo_gmi": g.codigo_gmi,
            "fecha_nacimiento": str(g.fecha_nacimiento) if g.fecha_nacimiento else "",
            "fecha_ultima_menstruacion": str(g.fecha_ultima_menstruacion) if g.fecha_ultima_menstruacion else "",
            "fecha_probable_parto": str(g.fecha_probable_parto) if g.fecha_probable_parto else "",
            "tipo_regimen": g.tipo_regimen or "",
            "anio_ingreso": g.anio_ingreso,
            "semanas_eg_ingreso": g.semanas_eg_ingreso or "",
            "activa": "Sí" if g.activa else "No",
            "modulo_activo_id": g.modulo_activo_id or "",
            "created_at": str(g.created_at) if g.created_at else "",
        })

    if format == "csv":
        return _rows_to_csv(rows)
    return _rows_to_xlsx(rows, "Gestantes")


async def export_indicators(db: AsyncSession, format: str = "xlsx") -> bytes:
    total = await db.scalar(select(func.count(Gestante.id)))
    activas = await db.scalar(select(func.count(Gestante.id)).where(Gestante.activa == True))

    riesgo_counts = await db.execute(
        select(ClasificacionRiesgo.tipo_riesgo, func.count(ClasificacionRiesgo.id))
        .group_by(ClasificacionRiesgo.tipo_riesgo)
    )
    riesgo_rows = []
    for tipo, cnt in riesgo_counts:
        riesgo_rows.append({"indicador": f"Gestantes riesgo {tipo}", "valor": cnt})

    rows = [
        {"indicador": "Total gestantes", "valor": total or 0},
        {"indicador": "Gestantes activas", "valor": activas or 0},
    ] + riesgo_rows

    if format == "csv":
        return _rows_to_csv(rows)
    return _rows_to_xlsx(rows, "Indicadores")


def _rows_to_xlsx(rows: list[dict], sheet_name: str) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = sheet_name
    if rows:
        ws.append(list(rows[0].keys()))
        for row in rows:
            ws.append(list(row.values()))
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf.getvalue()


def _rows_to_csv(rows: list[dict]) -> bytes:
    buf = io.StringIO()
    if rows:
        writer = csv.DictWriter(buf, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    return buf.getvalue().encode("utf-8-sig")