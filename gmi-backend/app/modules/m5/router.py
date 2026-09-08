from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.dependencies import get_current_gestante
from app.database.models.gestante import Gestante
from app.modules.m5 import service
from app.modules.m5.schemas import ContenidoEducativoResponse, ContenidoEducativoDetalleResponse, CategoriaResponse, \
    ProgresoResponse, ChecklistResponse, ChecklistItemResponse, CompletadoUpdate, TamizajeResponse, TamizajeCreate, \
    RecommendationsResponse, AutoevaluacionCreate, AutoevaluacionResponse, AutoevaluacionDetalleResponse

router = APIRouter()

# ---- Consulta de contenidos y categorias ----

@router.get("/content", response_model=list[ContenidoEducativoResponse])
async def get_content_by_module(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db)
):
    """Contenidos educativos según EG y módulo activo de la gestante."""
    return await service.get_content_by_module(db, gestante)

@router.get("/content/categories", response_model=list[CategoriaResponse])
async def get_categories(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db)
):
    """Categorías educativas disponibles."""
    return await service.get_categories(db)

@router.get("/content/category/{category_id}", response_model=list[ContenidoEducativoResponse])
async def get_contents_by_category(
    category_id: int,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db)
):
    """Contenidos educativos según categoría."""
    return await service.get_contents_by_category(db, category_id)

@router.get("/content/{content_id}", response_model=ContenidoEducativoDetalleResponse)
async def get_content_by_id(
    content_id: int,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db)
):
    """Contenido educativo detallado con preguntas y opciones de respuesta."""
    return await service.get_content_by_id(db, content_id)

# ---- Consulta de progreso ----

@router.get("/progress", response_model=list[ProgresoResponse])
async def get_progress_by_gestante(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db)
):
    """Progreso educativo por gestante."""
    return await service.get_progress_by_gestante(db, gestante.id)

@router.post("/content/{content_id}/complete", response_model=ProgresoResponse, status_code=201)
async def marcar_completado(
    content_id: int,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db)
):
    """Marcar contenido educativo como completado."""
    return await service.marcar_completado(db, gestante.id, content_id)

# ---- Checklist gestante ----

@router.get("/checklist", response_model=ChecklistResponse)
async def get_checklist(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db)
):
    """Checklist según módulo activo de la gestante."""
    return await service.get_checklist(db, gestante)

@router.patch("/checklist/{item_id}", response_model=ChecklistItemResponse)
async def update_checklist_item(
    item_id: int,
    request: CompletadoUpdate,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db)
):
    """Marcar o desmarcar ítem del checklist."""
    return await service.update_checklist_item(db, gestante, item_id, request)

# ---- Salud Mental ----

@router.post("/mental-health/screening", response_model=TamizajeResponse, status_code=201)
async def create_tamizaje(
    request: TamizajeCreate,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db)
):
    """Crear nuevo registro de tamizaje."""
    return await service.create_tamizaje(db, gestante, request)

@router.get("/mental-health/screening", response_model=list[TamizajeResponse])
async def get_historial_tamizajes(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db)
):
    """Historial de tamizajes por gestante."""
    return await service.get_historial_tamizajes(db, gestante.id)

@router.get("/mental-health/recommendations", response_model=list[RecommendationsResponse])
async def get_recommendations(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db)
):
    """Historia de recomendaciones por gestante."""
    return await service.get_recommendations(db, gestante.id)

# ---- Autoevaluaciones ----

@router.get("/self-assessment", response_model=list[AutoevaluacionDetalleResponse])
async def get_autoevaluaciones(
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db)
):
    """Historial de autoevaluaciones de la gestante."""
    return await service.get_autoevaluaciones(db, gestante.id)

@router.post("/self-assessment", response_model=AutoevaluacionResponse, status_code=201)
async def create_autoevaluacion(
    request: AutoevaluacionCreate,
    gestante: Gestante = Depends(get_current_gestante),
    db: AsyncSession = Depends(get_db)
):
    """Crear nuevo registro de autoevaluacion."""
    return await service.create_autoevaluacion(db, gestante.id, request)
