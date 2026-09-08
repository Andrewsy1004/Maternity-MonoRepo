from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies import get_current_gestante, get_current_staff, get_current_admin, get_gestante_id_for_request
from app.database.models.auth import UsuarioStaff
from app.database.models.gestante import Gestante
from app.modules.clinical import service
from app.modules.clinical.schemas import (
    AdherenciaResponse,
    BirthPlanResponse,
    ChecklistItemResponse,
    ClasificacionRiesgoResponse,
    ControlPrenatalCreate,
    ControlPrenatalResponse,
    DashboardResponse,
    EcografiaCreate,
    EcografiaResponse,
    ExamenCreate,
    ExamenResponse,
    IpsCercanaResponse,
    MicronutrienteCreate,
    MicronutrienteResponse,
    MovimientoFetalCreate,
    MovimientoFetalResponse,
    PreguntaSegResponse,
    RecomendacionResponse,
    RemisionCreate,
    RemisionResponse,
    RemisionUpdate,
    RespuestaResponse,
    RespuestasRequest,
    SignoAlarmaResponse,
    SignosVitalesCreate,
    SignosVitalesResponse,
    SintomaCreate,
    SintomaResponse,
    VacunacionCreate,
    VacunacionResponse,
)

router = APIRouter()


# ---- 4.1 Dashboard y Contexto ----

@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    module_id: Optional[int] = None,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Resumen del módulo activo. Opcional: ?module_id={id} para módulo específico."""
    return await service.get_dashboard(db, gestante, module_id)


@router.get("/alarm-signs", response_model=list[SignoAlarmaResponse])
async def get_alarm_signs(
    module_id: Optional[int] = None,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Signos de alarma del módulo actual. Opcional: ?module_id={id}."""
    return await service.get_alarm_signs(db, gestante, module_id)


@router.get("/recommendations", response_model=RecomendacionResponse)
async def get_recommendations(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Recomendaciones según módulo y semana gestacional actual."""
    return await service.get_recommendations(db, gestante)


# ---- 4.2 Síntomas ----

@router.post("/symptoms", response_model=SintomaResponse, status_code=201)
async def report_symptom(
    request: SintomaCreate,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Reportar síntomas actuales."""
    return await service.report_symptom(db, gestante, request)


@router.get("/symptoms", response_model=list[SintomaResponse])
async def get_symptoms(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Historial de síntomas reportados."""
    return await service.get_symptoms(db, gestante.id)


# ---- 4.3 Signos Vitales ----

@router.post("/vitals", response_model=SignosVitalesResponse, status_code=201)
async def register_vitals(
    request: SignosVitalesCreate,
    admin: UsuarioStaff = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Registrar signos vitales y peso. Solo administradores. Requiere control_prenatal_id."""
    return await service.register_vitals(db, request, admin.id)


@router.get("/vitals", response_model=list[SignosVitalesResponse])
async def get_vitals(
    gestante_id: str = Depends(get_gestante_id_for_request),
    db: AsyncSession = Depends(get_db),
):
    """Historial de signos vitales. Gestante (auto) o admin (?gestante_id)."""
    return await service.get_vitals_history(db, gestante_id)


# ---- 4.4 Clasificación de Riesgo ----

@router.get("/risk-assessment", response_model=ClasificacionRiesgoResponse)
async def get_risk_assessment(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Riesgo actual (verde/amarillo/rojo) con explicación IA."""
    return await service.get_risk_assessment(db, gestante.id)


@router.get("/risk-assessment/history", response_model=list[ClasificacionRiesgoResponse])
async def get_risk_history(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Historial completo de clasificaciones de riesgo."""
    return await service.get_risk_history(db, gestante.id)


# ---- 4.5 Exámenes de Laboratorio ----

@router.post("/exams", response_model=ExamenResponse, status_code=201)
async def register_exam(
    request: ExamenCreate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Registrar resultado de examen de laboratorio. Solo staff."""
    return await service.register_exam(db, request, staff.id)


@router.get("/exams", response_model=list[ExamenResponse])
async def get_exams(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Historial de exámenes de laboratorio."""
    return await service.get_exams_history(db, gestante.id)


@router.get("/exams/{exam_id}", response_model=ExamenResponse)
async def get_exam(
    exam_id: str,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Detalle de examen específico."""
    return await service.get_exam_by_id(db, gestante.id, exam_id)


# ---- 4.6 Ecografías ----

@router.post("/ecography", response_model=EcografiaResponse, status_code=201)
async def register_ecography(
    request: EcografiaCreate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Registrar ecografía. Solo staff."""
    return await service.register_ecography(db, request, staff.id)


@router.get("/ecography", response_model=list[EcografiaResponse])
async def get_ecography(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Historial de ecografías."""
    return await service.get_ecography_history(db, gestante.id)


@router.get("/ecography/{ecography_id}", response_model=EcografiaResponse)
async def get_ecography_by_id(
    ecography_id: str,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Detalle de ecografía específica."""
    return await service.get_ecography_by_id(db, gestante.id, ecography_id)


# ---- 4.7 Vacunación ----

@router.post("/vaccination", response_model=VacunacionResponse, status_code=201)
async def register_vaccination(
    request: VacunacionCreate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Registrar dosis de vacuna. Solo staff."""
    return await service.register_vaccination(db, request, staff.id)


@router.get("/vaccination", response_model=list[VacunacionResponse])
async def get_vaccination(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Historial de vacunación."""
    return await service.get_vaccination_history(db, gestante.id)


# ---- 4.8 Micronutrientes ----

@router.post("/micronutrients", response_model=MicronutrienteResponse, status_code=201)
async def register_micronutrient(
    request: MicronutrienteCreate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Registrar suministro de micronutriente. Solo staff."""
    return await service.register_micronutrient(db, request, staff.id)


@router.get("/micronutrients", response_model=list[MicronutrienteResponse])
async def get_micronutrients(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Estado de micronutrientes suministrados."""
    return await service.get_micronutrients(db, gestante.id)


# ---- 4.9 Remisiones Interdisciplinarias ----

@router.post("/referral-interdisciplinary", response_model=RemisionResponse, status_code=201)
async def register_referral(
    request: RemisionCreate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Registrar remisión interdisciplinaria. Solo staff."""
    return await service.register_referral(db, request, staff.id)


@router.get("/referral-interdisciplinary", response_model=list[RemisionResponse])
async def get_referrals(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Historial de remisiones interdisciplinarias."""
    return await service.get_referrals(db, gestante.id)


@router.patch("/referral-interdisciplinary/{referral_id}", response_model=RemisionResponse)
async def update_referral(
    referral_id: str,
    request: RemisionUpdate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Actualizar fecha de atención de remisión. Solo staff."""
    return await service.update_referral(db, referral_id, request, staff.id)


# ---- 4.10 Controles Prenatales ----

@router.post("/prenatal-control", response_model=ControlPrenatalResponse, status_code=201)
async def register_prenatal_control(
    request: ControlPrenatalCreate,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Registrar control prenatal. Solo staff."""
    return await service.register_prenatal_control(db, request, staff.id)


@router.get("/prenatal-control", response_model=list[ControlPrenatalResponse])
async def get_prenatal_controls(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Historial de controles prenatales."""
    return await service.get_prenatal_controls(db, gestante.id)


@router.get("/prenatal-adherence", response_model=AdherenciaResponse)
async def get_prenatal_adherence(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Adherencia al programa de control prenatal."""
    return await service.get_prenatal_adherence(db, gestante)


@router.get("/prenatal-control/{control_id}", response_model=ControlPrenatalResponse)
async def get_prenatal_control(
    control_id: str,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Detalle de control prenatal específico."""
    return await service.get_prenatal_control_by_id(db, gestante.id, control_id)


# ---- 4.11 Preguntas de Seguimiento ----

@router.get("/daily-questions", response_model=list[PreguntaSegResponse])
async def get_daily_questions(
    module_id: Optional[int] = None,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Preguntas activas para hoy según EG y módulo."""
    return await service.get_daily_questions(db, gestante, module_id)


@router.post("/daily-questions/respond", response_model=list[RespuestaResponse], status_code=201)
async def submit_daily_answers(
    request: RespuestasRequest,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Enviar respuestas a preguntas de seguimiento. Puede generar alertas."""
    return await service.submit_daily_answers(db, gestante, request)


@router.get("/daily-questions/history", response_model=list[RespuestaResponse])
async def get_daily_questions_history(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Historial de respuestas a preguntas de seguimiento."""
    return await service.get_daily_questions_history(db, gestante.id)


# ---- 4.12 Movimientos Fetales ----

@router.post("/fetal-movement", response_model=MovimientoFetalResponse, status_code=201)
async def register_fetal_movement(
    request: MovimientoFetalCreate,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Registrar conteo diario de movimientos fetales."""
    return await service.register_fetal_movement(db, gestante, request)


@router.get("/fetal-movement", response_model=list[MovimientoFetalResponse])
async def get_fetal_movements(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Historial de conteos de movimientos fetales."""
    return await service.get_fetal_movements(db, gestante.id)


# ---- 4.13 Plan de Parto y Geolocalización ----

@router.get("/birth-plan", response_model=BirthPlanResponse)
async def get_birth_plan(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Plan de parto seguro con recomendaciones personalizadas."""
    return await service.get_birth_plan(db, gestante)


@router.get("/nearest-ips", response_model=IpsCercanaResponse)
async def get_nearest_ips(
    db: AsyncSession = Depends(get_db),
):
    """IPS disponible para atención."""
    return await service.get_nearest_ips(db)


# ---- 4.14 Vistas Longitudinales ----

@router.get("/history/exams", response_model=list[ExamenResponse])
async def history_exams(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Todos los exámenes de laboratorio (vista longitudinal)."""
    return await service.get_exams_history(db, gestante.id)


@router.get("/history/vitals", response_model=list[SignosVitalesResponse])
async def history_vitals(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Evolución de signos vitales (vista longitudinal)."""
    return await service.get_vitals_history(db, gestante.id)


@router.get("/history/risks", response_model=list[ClasificacionRiesgoResponse])
async def history_risks(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Historial completo de clasificaciones de riesgo."""
    return await service.get_risk_history(db, gestante.id)


@router.get("/history/controls", response_model=list[ControlPrenatalResponse])
async def history_controls(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Todos los controles prenatales (vista longitudinal)."""
    return await service.get_prenatal_controls(db, gestante.id)


@router.get("/history/daily-questions", response_model=list[RespuestaResponse])
async def history_daily_questions(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Historial de respuestas a preguntas de seguimiento (vista longitudinal)."""
    return await service.get_daily_questions_history(db, gestante.id)


# ---- 4.15 Checklist Items ----

@router.get("/checklist-items", response_model=list[ChecklistItemResponse])
async def get_checklist_items(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Checklist items para el módulo activo de la gestante."""
    return await service.get_checklist_items(db, gestante)

@router.get("/checklist-items/{gestante_id}", response_model=list[ChecklistItemResponse])
async def get_checklist_items(
        gestante_id: str,
        staff: UsuarioStaff = Depends(get_current_staff),
        db: AsyncSession = Depends(get_db),
):
    """Checklist items para el módulo activo de la gestante."""
    return await service.get_checklist_items_by_staff(db, gestante_id=gestante_id)



