from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies import get_current_gestante, get_current_staff, get_gestante_id_for_request
from app.database.models.gestante import Gestante
from app.database.models.auth import UsuarioStaff
from app.modules.m0 import service
from app.modules.m0.schemas import (
    GestanteRegisterRequest,
    GestanteRegisterResponse,
    ClinicalProfileResponse,
    ClinicalProfileUpdate,
    ObstetricFormulaResponse,
    ObstetricFormulaUpdate,
    PathologicalHistoryCreate,
    PathologicalHistoryUpdate,
    PathologicalHistoryResponse,
    ConsentRequest,
    ConsentResponse,
    GestationalAgeResponse,
    ActiveModuleResponse,
    ModuleHistoryResponse,
    SecurityQuestionUpdate,
)

router = APIRouter()


# ---- Registro ----

@router.post("/register", response_model=GestanteRegisterResponse)
async def register_gestante(
    request: GestanteRegisterRequest,
    staff: UsuarioStaff = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Registrar nueva gestante manualmente. Solo staff autorizado. Genera código ID-GMI automáticamente."""
    return await service.register_gestante(db, request, staff.id)


# ---- Perfil Clínico ----

@router.get("/profile/clinical", response_model=ClinicalProfileResponse)
async def get_clinical_profile(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Obtener perfil clínico básico de la gestante autenticada."""
    return await service.get_clinical_profile(db, gestante.id)


@router.put("/profile/clinical", response_model=ClinicalProfileResponse)
async def update_clinical_profile(
    request: ClinicalProfileUpdate,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Actualizar perfil clínico básico."""
    return await service.update_clinical_profile(db, gestante.id, request)


# ---- Fórmula Obstétrica ----

@router.get("/profile/obstetric-formula", response_model=ObstetricFormulaResponse)
async def get_obstetric_formula(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Obtener fórmula obstétrica (G, P, C, A, V, M)."""
    return await service.get_obstetric_formula(db, gestante.id)


@router.put("/profile/obstetric-formula", response_model=ObstetricFormulaResponse)
async def update_obstetric_formula(
    request: ObstetricFormulaUpdate,
    gestante_id: str = Depends(get_gestante_id_for_request), 
    db: AsyncSession = Depends(get_db),
):
    """Actualizar fórmula obstétrica."""
    return await service.update_obstetric_formula(db, gestante_id, request)


# ---- Antecedentes Patológicos ----

@router.get("/profile/pathological-history", response_model=list[PathologicalHistoryResponse])
async def get_pathological_history(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Listar antecedentes patológicos de la gestante."""
    return await service.get_pathological_history(db, gestante.id)


@router.post("/profile/pathological-history", response_model=PathologicalHistoryResponse, status_code=201)
async def create_pathological_history(
    request: PathologicalHistoryCreate,
    gestante_id: str = Depends(get_gestante_id_for_request),  
    db: AsyncSession = Depends(get_db),
):
    return await service.create_pathological_history(db, gestante_id, request)  


@router.put("/profile/pathological-history/{antecedente_id}", response_model=PathologicalHistoryResponse)
async def update_pathological_history(
    antecedente_id: str,
    request: PathologicalHistoryUpdate,
    gestante_id: str = Depends(get_gestante_id_for_request),
    db: AsyncSession = Depends(get_db),
):
    """Actualizar antecedente patológico."""
    return await service.update_pathological_history(db, gestante_id, antecedente_id, request)


@router.delete("/profile/pathological-history/{antecedente_id}", status_code=204)
async def delete_pathological_history(
    antecedente_id: str,
    gestante_id: str = Depends(get_gestante_id_for_request),
    db: AsyncSession = Depends(get_db),
):
    """Eliminar antecedente patológico."""
    await service.delete_pathological_history(db, gestante_id, antecedente_id)


# ---- Consentimiento Informado ----

@router.post("/consent", response_model=ConsentResponse, status_code=201)
async def register_consent(
    request: ConsentRequest,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Registrar aceptación del consentimiento informado digital."""
    return await service.register_consent(db, gestante.id, request)


@router.get("/consent", response_model=ConsentResponse)
async def get_consent(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Consultar estado del consentimiento informado vigente."""
    return await service.get_consent(db, gestante.id)


@router.post("/consent/revoke")
async def revoke_consent(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Revocar el consentimiento informado."""
    return await service.revoke_consent(db, gestante.id)


@router.get("/consent/document")
async def get_consent_document():
    """Descargar versión legal extendida del consentimiento (PDF)."""
    # TODO: retornar archivo PDF del consentimiento
    return {"detail": "Endpoint pendiente de implementación"}


# ---- Edad Gestacional ----

@router.get("/gestational-age", response_model=GestationalAgeResponse)
async def get_gestational_age(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Obtener edad gestacional calculada automáticamente a partir de la FUR."""
    return await service.get_gestational_age(db, gestante.id)


# ---- Módulo Activo ----

@router.get("/active-module", response_model=ActiveModuleResponse)
async def get_active_module(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Obtener módulo clínico activo según la edad gestacional actual."""
    return await service.get_active_module(db, gestante.id)


@router.get("/module-history", response_model=list[ModuleHistoryResponse])
async def get_module_history(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Historial de cambios de módulo activo con trazabilidad."""
    return await service.get_module_history(db, gestante.id)


# ---- Pregunta de Seguridad ----

@router.put("/security-question")
async def update_security_question(
    request: SecurityQuestionUpdate,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Actualizar pregunta y respuesta de seguridad."""
    return await service.update_security_question(db, gestante.id, request)


# ---- Eliminar Cuenta ----

@router.delete("/account")
async def delete_account(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db),
):
    """Solicitar eliminación de cuenta y datos (derecho de supresión)."""
    return await service.delete_account(db, gestante.id)