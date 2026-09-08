from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.database.session import get_db
from app.dependencies import get_current_staff
from app.database.models.auth import UsuarioStaff
from app.modules.admin import service
from app.modules.admin import schemas
from app.modules.auth.schemas import SolicitudActivacionResponse
from app.modules.clinical.schemas import (
    ExamenCreate,
    ExamenResponse,
    SignosVitalesResponse,
)
from app.modules.admin.schemas import AlertaAdminResponse, RespuestaConPreguntaResponse, CitaAdminResponse, CitaAdminCreate
from app.modules.m6.schemas import CitaMedicaUpdate, LlamadaEmergenciaCreate, LlamadaEmergenciaResponse
from app.modules.admin.schemas import CitaAdminCreate, CitaAdminResponse

from app.database.models.gestante import Gestante, PreguntaSeguridad, SolicitudActivacion
router = APIRouter()


# ---- 11.1 Usuarios y Roles ----

@router.get("/users", response_model=list[schemas.UserResponse])
async def list_staff(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort: str = "fecha_desc",
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Listar staff"""
    return await service.get_staff_users(db, page, size, sort)

@router.post("/users", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
async def create_staff(
    request: schemas.UserCreate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Crear staff"""
    return await service.create_staff_user(db, request)

@router.put("/users/{userId}", response_model=schemas.UserResponse)
async def update_staff(
    userId: str,
    request: schemas.UserUpdate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Actualizar staff"""
    return await service.update_staff_user(db, userId, request)

@router.patch("/users/{userId}/status", response_model=schemas.UserResponse)
async def update_staff_status(
    userId: str,
    request: schemas.UserStatusUpdate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Activar/desactivar staff"""
    return await service.update_staff_user_status(db, userId, request)

@router.get("/roles", response_model=list[schemas.RoleResponse])
async def list_roles(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort: str = "fecha_desc",
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Listar roles"""
    return await service.get_roles(db, page, size, sort)


# ---- 11.2 Carga Masiva Excel ----

#@router.post("/upload/gestantes", response_model=schemas.CargaExcelResponse, status_code=status.HTTP_201_CREATED)
#async def upload_excel(
#    file: UploadFile = File(...),
#    staff: UsuarioStaff = Depends(get_current_staff),
#    db: AsyncSession = Depends(get_db),
#):
#    """Subir Excel (modo: validar_solo | procesar)"""
#    return await service.upload_and_process(db, file, staff.id)

#@router.get("/upload/gestantes/history", response_model=list[schemas.CargaExcelResponse])
#async def list_cargas(
#    db: AsyncSession = Depends(get_db),
#):
#    """Historial de cargas"""
#    return await service.get_all_cargas(db)

#@router.get("/upload/gestantes/template")
#async def download_template(
#    staff: UsuarioStaff = Depends(get_current_staff),
#):
#    """Descargar plantilla Excel"""
    # Placeholder for template download
#    return service._not_implemented()

#@router.get("/upload/gestantes/{cargaId}", response_model=schemas.CargaExcelResponse)
#async def get_carga_status(
#    cargaId: str,
#    staff: UsuarioStaff = Depends(get_current_staff),
#    db: AsyncSession = Depends(get_db),
#):
#    """Estado de carga"""
#    carga, _ = await service.get_carga_with_details(db, cargaId)
#    return carga

#@router.get("/upload/gestantes/{cargaId}/detail", response_model=schemas.CargaExcelDetalleResponse)
#async def get_carga_detail(
#    cargaId: str,
#    staff: UsuarioStaff = Depends(get_current_staff),
#    db: AsyncSession = Depends(get_db),
#):
#    """Detalle fila por fila"""
#    carga, detalles = await service.get_carga_with_details(db, cargaId)
#    return schemas.CargaExcelDetalleResponse(
#        **schemas.CargaExcelResponse.model_validate(carga).model_dump(),
#        detalles=[schemas.CargaDetalleResponse.model_validate(d) for d in detalles],
#    )

# ---- 11.2 Carga Masiva Excel ----

@router.post("/upload/gestantes", response_model=schemas.CargaExcelResponse, status_code=status.HTTP_201_CREATED)
async def upload_excel(
    file: UploadFile = File(...),
    # staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Subir Excel (modo: validar_solo | procesar)"""
    # return await service.upload_and_process(db, file, staff.id)
    return await service.upload_and_process(db, file, "a1b2c3d4-0000-0000-0000-000000000001")

@router.get("/upload/gestantes/history", response_model=list[schemas.CargaExcelResponse])
async def list_cargas(
    db: AsyncSession = Depends(get_db),
):
    """Historial de cargas"""
    return await service.get_all_cargas(db)

@router.get("/upload/gestantes/template")
async def download_template(
    staff: UsuarioStaff = Depends(get_current_staff),
):
    """Descargar plantilla Excel"""
    # Placeholder for template download
    return service._not_implemented()

@router.get("/upload/gestantes/{cargaId}", response_model=schemas.CargaExcelResponse)
async def get_carga_status(
    cargaId: str,
    # staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Estado de carga"""
    carga, _ = await service.get_carga_with_details(db, cargaId)
    return carga

@router.get("/upload/gestantes/{cargaId}/detail", response_model=schemas.CargaExcelDetalleResponse)
async def get_carga_detail(
    cargaId: str,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Detalle fila por fila"""
    carga, detalles = await service.get_carga_with_details(db, cargaId)
    return schemas.CargaExcelDetalleResponse(
        **schemas.CargaExcelResponse.model_validate(carga).model_dump(),
        detalles=[schemas.CargaDetalleResponse.model_validate(d) for d in detalles],
    )

# ---- 11.3 Catálogos ----

@router.get("/catalogs/{catalogName}", response_model=list[schemas.CatalogItemResponse])
async def list_catalog_items(
    catalogName: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Listar ítems"""
    return await service.get_catalog_items(db, catalogName, page, size)

@router.post("/catalogs/{catalogName}", response_model=schemas.CatalogItemResponse, status_code=status.HTTP_201_CREATED)
async def create_catalog_item(
    catalogName: str,
    request: schemas.CatalogItemCreate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Crear ítem"""
    return await service.create_catalog_item(db, catalogName, request)

@router.put("/catalogs/{catalogName}/{id}", response_model=schemas.CatalogItemResponse)
async def update_catalog_item(
    catalogName: str,
    id: int,
    request: schemas.CatalogItemUpdate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Actualizar ítem"""
    return await service.update_catalog_item(db, catalogName, id, request)

@router.patch("/catalogs/{catalogName}/{id}/status", response_model=schemas.CatalogItemResponse)
async def update_catalog_item_status(
    catalogName: str,
    id: int,
    request: schemas.CatalogItemStatusUpdate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Activar/desactivar ítem"""
    return await service.update_catalog_item_status(db, catalogName, id, request)


# ---- 11.4 Contenido Educativo ----

@router.get("/educational-content", response_model=list[schemas.EducationalContentResponse])
async def list_educational_contents(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort: str = "fecha_desc",
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Listar contenidos"""
    return await service.get_educational_contents(db, page, size, sort)

@router.post("/educational-content", response_model=schemas.EducationalContentResponse, status_code=status.HTTP_201_CREATED)
async def create_educational_content(
    request: schemas.EducationalContentCreate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Crear contenido"""
    return await service.create_educational_content(db, request)

@router.put("/educational-content/{id}", response_model=schemas.EducationalContentResponse)
async def update_educational_content(
    id: int,
    request: schemas.EducationalContentUpdate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Actualizar contenido"""
    return await service.update_educational_content(db, id, request)

@router.patch("/educational-content/{id}/status", response_model=schemas.EducationalContentResponse)
async def update_educational_content_status(
    id: int,
    request: schemas.EducationalContentStatusUpdate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Activar/desactivar"""
    return await service.update_educational_content_status(db, id, request)

@router.get("/educational-categories", response_model=list[schemas.EducationalCategoryResponse])
async def list_educational_categories(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort: str = "fecha_desc",
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Listar categorías"""
    return await service.get_educational_categories(db, page, size, sort)

@router.post("/educational-categories", response_model=schemas.EducationalCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_educational_category(
    request: schemas.EducationalCategoryCreate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Crear categoría"""
    return await service.create_educational_category(db, request)

@router.put("/educational-categories/{id}", response_model=schemas.EducationalCategoryResponse)
async def update_educational_category(
    id: int,
    request: schemas.EducationalCategoryUpdate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Actualizar categoría"""
    return await service.update_educational_category(db, id, request)

@router.get("/checklist-items", response_model=list[schemas.ChecklistItemResponse])
async def list_checklist_items(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort: str = "fecha_desc",
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Listar checklist"""
    return await service.get_checklist_items(db, page, size, sort)

@router.post("/checklist-items", response_model=schemas.ChecklistItemResponse, status_code=status.HTTP_201_CREATED)
async def create_checklist_item(
    request: schemas.ChecklistItemCreate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Crear ítem checklist"""
    return await service.create_checklist_item(db, request)

@router.put("/checklist-items/{id}", response_model=schemas.ChecklistItemResponse)
async def update_checklist_item(
    id: int,
    request: schemas.ChecklistItemUpdate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Actualizar ítem"""
    return await service.update_checklist_item(db, id, request)

@router.patch("/checklist-items/{id}/status", response_model=schemas.ChecklistItemResponse)
async def update_checklist_item_status(
    id: int,
    request: schemas.ChecklistItemStatusUpdate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Activar/desactivar ítem"""
    return await service.update_checklist_item_status(db, id, request)


# ---- 11.5 Preguntas de Seguimiento ----

@router.get("/follow-up-questions", response_model=list[schemas.FollowUpQuestionResponse])
async def list_follow_up_questions(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort: str = "fecha_desc",
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Listar preguntas"""
    return await service.get_follow_up_questions(db, page, size, sort)

@router.post("/follow-up-questions", response_model=schemas.FollowUpQuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_follow_up_question(
    request: schemas.FollowUpQuestionCreate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Crear pregunta"""
    return await service.create_follow_up_question(db, request)

@router.put("/follow-up-questions/{id}", response_model=schemas.FollowUpQuestionResponse)
async def update_follow_up_question(
    id: int,
    request: schemas.FollowUpQuestionUpdate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Actualizar pregunta"""
    return await service.update_follow_up_question(db, id, request)

@router.patch("/follow-up-questions/{id}/status", response_model=schemas.FollowUpQuestionResponse)
async def update_follow_up_question_status(
    id: int,
    request: schemas.FollowUpQuestionStatusUpdate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Activar/desactivar"""
    return await service.update_follow_up_question_status(db, id, request)

@router.get("/follow-up-questions/{id}/options", response_model=list[schemas.QuestionOptionResponse])
async def list_question_options(
    id: int,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Listar opciones"""
    return await service.get_question_options(db, id)

@router.post("/follow-up-questions/{id}/options", response_model=schemas.QuestionOptionResponse, status_code=status.HTTP_201_CREATED)
async def create_question_option(
    id: int,
    request: schemas.QuestionOptionCreate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Agregar opción"""
    return await service.create_question_option(db, id, request)

@router.put("/follow-up-questions/options/{optionId}", response_model=schemas.QuestionOptionResponse)
async def update_question_option(
    optionId: int,
    request: schemas.QuestionOptionUpdate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Actualizar opción"""
    return await service.update_question_option(db, optionId, request)

@router.delete("/follow-up-questions/options/{optionId}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question_option(
    optionId: int,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Eliminar opción"""
    await service.delete_question_option(db, optionId)


# ---- 11.6 Auditoría y Monitoreo ----

@router.get("/audit-log", response_model=list[schemas.AuditLogResponse])
async def list_audit_log(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort: str = "fecha_desc",
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Bitácora de auditoría"""
    return await service.get_audit_logs(db, page, size, sort)

@router.get("/system/health", response_model=schemas.SystemHealthResponse)
async def get_system_health(
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Salud del sistema (auth admin)"""
    return await service.get_system_health(db)


# ---- 12. Vista Admin de Gestantes (detalle de paciente) ----

@router.get("/gestantes/{gestante_id}/exams", response_model=list[ExamenResponse])
async def admin_get_gestante_exams(
    gestante_id: str,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Lista de exámenes de laboratorio de la gestante (vista admin)."""
    return await service.get_gestante_exams(db, gestante_id)


@router.get("/gestantes/{gestante_id}/exams/{exam_id}", response_model=ExamenResponse)
async def admin_get_gestante_exam_by_id(
    gestante_id: str,
    exam_id: str,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Detalle de un examen específico (vista admin)."""
    return await service.get_gestante_exam_by_id(db, gestante_id, exam_id)


@router.post("/gestantes/{gestante_id}/exams", response_model=ExamenResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_gestante_exam(
    gestante_id: str,
    request: ExamenCreate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Registrar resultado de examen para una gestante (vista admin)."""
    return await service.create_gestante_exam(db, gestante_id, request, staff.id)


@router.get("/gestantes/{gestante_id}/alarm-signs", response_model=list[AlertaAdminResponse])
async def admin_get_gestante_alarm_signs(
    gestante_id: str,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Signos de alarma activos de la gestante (vista admin)."""
    return await service.get_gestante_alarm_signs(db, gestante_id)


@router.get("/gestantes/{gestante_id}/daily-questions/history", response_model=list[RespuestaConPreguntaResponse])
async def admin_get_gestante_daily_questions_history(
    gestante_id: str,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Historial de respuestas a preguntas de seguimiento (vista admin)."""
    return await service.get_gestante_daily_questions_history(db, gestante_id)


@router.get("/gestantes/{gestante_id}/vitals", response_model=list[SignosVitalesResponse])
async def admin_get_gestante_vitals(
    gestante_id: str,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Historial de signos vitales de la gestante (vista admin/staff)."""
    return await service.get_gestante_vitals(db, gestante_id)


# ---- Citas Admin ----

@router.get("/appointments", response_model=list[CitaAdminResponse])
async def admin_list_appointments(
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    gestante_id: Optional[str] = Query(None),
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Lista todas las citas con filtros opcionales por rango de fechas y gestante."""
    f_date = datetime.fromisoformat(from_date) if from_date else None
    t_date = datetime.fromisoformat(to_date) if to_date else None
    return await service.get_all_appointments(db, f_date, t_date, gestante_id)


@router.post("/appointments", response_model=CitaAdminResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_appointment(
    request: CitaAdminCreate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Crear nueva cita médica para una gestante."""
    return await service.create_appointment(db, request)


@router.get("/gestantes/{gestante_id}/appointments", response_model=list[CitaAdminResponse])
async def admin_list_gestante_appointments(
    gestante_id: str,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Citas de una gestante específica."""
    return await service.get_gestante_appointments(db, gestante_id)


@router.patch("/appointments/{appointment_id}", response_model=CitaAdminResponse)
async def admin_reprogramar_appointment(
    appointment_id: str,
    request: CitaMedicaUpdate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Reprogramar cita (cambiar fecha_hora)."""
    return await service.reprogramar_appointment(db, appointment_id, request)


@router.post("/appointments/{appointment_id}/cancel", response_model=CitaAdminResponse)
async def admin_cancelar_appointment(
    appointment_id: str,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Cancelar cita (cambia estado a cancelada)."""
    return await service.cancelar_appointment(db, appointment_id)


@router.post("/appointments/{appointment_id}/confirm", response_model=CitaAdminResponse)
async def admin_confirmar_appointment(
    appointment_id: str,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Confirmar asistencia a cita médica."""
    return await service.confirmar_appointment(db, appointment_id)


@router.post("/gestantes/{gestante_id}/emergency-call", response_model=LlamadaEmergenciaResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_emergency_call(
    gestante_id: str,
    request: LlamadaEmergenciaCreate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Registrar llamada de emergencia para una gestante."""
    return await service.create_gestante_emergency_call(db, gestante_id, request)


@router.get("/gestantes/{gestante_id}/emergency-call/history", response_model=list[LlamadaEmergenciaResponse])
async def admin_emergency_call_history(
    gestante_id: str,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Historial de llamadas de emergencia de una gestante."""
    return await service.get_gestante_emergency_call_history(db, gestante_id)


# ---- 11.7 Exportación ----

@router.get("/export/gestantes")
async def export_gestantes(
    format: str = Query("xlsx", pattern="^(xlsx|csv)$"),
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Exportar gestantes"""
    data = await service.export_gestantes(db, format)
    media = "text/csv; charset=utf-8-sig" if format == "csv" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ext = "csv" if format == "csv" else "xlsx"
    return StreamingResponse(
        iter([data]),
        media_type=media,
        headers={"Content-Disposition": f'attachment; filename="gestantes_{datetime.utcnow().strftime("%Y%m%d")}.{ext}"'},
    )


@router.get("/export/indicators")
async def export_indicators(
    format: str = Query("xlsx", pattern="^(xlsx|csv)$"),
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Exportar indicadores"""
    data = await service.export_indicators(db, format)
    media = "text/csv; charset=utf-8-sig" if format == "csv" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ext = "csv" if format == "csv" else "xlsx"
    return StreamingResponse(
        iter([data]),
        media_type=media,
        headers={"Content-Disposition": f'attachment; filename="indicadores_{datetime.utcnow().strftime("%Y%m%d")}.{ext}"'},
    )
    return await service.export_indicators(db, format)


# ---- 11.9 Gestantes ----

@router.get("/gestantes", response_model=list[schemas.GestanteListResponse])
async def list_gestantes(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort: str = "fecha_desc",
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Listar gestantes con datos de seguimiento y alertas"""
    return await service.get_gestantes(db, page, size, sort)


@router.get("/solicitudes-activacion", response_model=list[SolicitudActivacionResponse])
async def listar_solicitudes_activacion(
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Listar solicitudes de activación pendientes."""
    res = await db.execute(
        select(SolicitudActivacion)
        .where(SolicitudActivacion.estado == "pendiente")
        .order_by(SolicitudActivacion.created_at.desc())
    )
    return res.scalars().all()


@router.post("/solicitudes-activacion/{solicitud_id}/resolver")
async def resolver_solicitud_activacion(
    solicitud_id: str,
    aprobar: bool = Query(...),
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Aprobar o rechazar una solicitud de activación."""
    res_s = await db.execute(select(SolicitudActivacion).where(SolicitudActivacion.id == solicitud_id))
    solicitud = res_s.scalar_one_or_none()
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada.")
    if solicitud.estado != "pendiente":
        raise HTTPException(status_code=400, detail="Esta solicitud ya fue resuelta.")

    if aprobar:
        res_g = await db.execute(select(Gestante).where(Gestante.codigo_gmi == solicitud.codigo_gmi))
        gestante = res_g.scalar_one_or_none()
        if not gestante:
            raise HTTPException(status_code=404, detail="Gestante no encontrada.")
        db.add(PreguntaSeguridad(
            gestante_id=gestante.id,
            pregunta=solicitud.pregunta,
            hash_respuesta=solicitud.hash_respuesta,
        ))
        solicitud.estado = "aprobada"
    else:
        solicitud.estado = "rechazada"

    db.add(solicitud)
    await db.commit()
    return {"detail": "Solicitud procesada correctamente."}