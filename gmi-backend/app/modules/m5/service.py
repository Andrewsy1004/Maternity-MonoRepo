from datetime import date, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.database.models.gestante import Gestante
from app.database.models.desenlace import EvaluacionSaludMental
from app.database.models.seguimiento import RespuestaSeguimiento
from app.modules.m5 import repository
from app.modules.m5.schemas import ContenidoEducativoResponse, ContenidoEducativoDetalleResponse, CategoriaResponse, \
    ProgresoResponse, ChecklistItemResponse, ChecklistResponse, CompletadoUpdate, TamizajeCreate, TamizajeResponse, \
    RecommendationsResponse, AutoevaluacionCreate, AutoevaluacionResponse, AutoevaluacionDetalleResponse


# ---- Consulta de contenidos y categorias ----

def _calcular_semanas_gestacion(fum: date) -> int:
    """Calcula las semanas de gestación desde la FUM hasta hoy."""
    hoy = date.today()
    dias = (hoy - fum).days
    return max(0, dias // 7)

async def get_content_by_module(db: AsyncSession, gestante: Gestante) -> list[ContenidoEducativoResponse]:
    # 1. Calcular el módulo real según la semana de gestación actual (FUM)
    modulo_id = None
    if gestante.fecha_ultima_menstruacion:
        semanas = _calcular_semanas_gestacion(gestante.fecha_ultima_menstruacion)
        modulo = await repository.get_modulo_by_semanas_eg(db, semanas)
        modulo_id = modulo.id if modulo else None

    # 2. Si no se pudo calcular (sin FUM), usar el valor cacheado en BD como fallback
    if modulo_id is None:
        modulo_id = gestante.modulo_activo_id

    # 3. Si aún no hay módulo, retornar lista vacía
    if modulo_id is None:
        return []

    contenidos = await repository.get_content_by_module(db, modulo_id=modulo_id)
    return [ContenidoEducativoResponse.model_validate(c) for c in contenidos]

async def get_content_by_id(db: AsyncSession, content_id: int) -> ContenidoEducativoDetalleResponse:
    contenido = await repository.get_content_by_id(db, content_id)

    if contenido is None:
        raise NotFoundException("No se encontraron contenidos.")

    return ContenidoEducativoDetalleResponse.model_validate(contenido)

async def get_categories(db: AsyncSession) -> list[CategoriaResponse]:
    categorias = await repository.get_categories(db)
    return [CategoriaResponse.model_validate(c) for c in categorias]

async def get_contents_by_category(db: AsyncSession, category_id: int) -> list[ContenidoEducativoResponse]:
    contenidos = await repository.get_contents_by_category(db, category_id)
    return [ContenidoEducativoResponse.model_validate(c) for c in contenidos]

# ---- Consulta de progreso ----

async def get_progress_by_gestante(db: AsyncSession, gestante_id: str) -> list[ProgresoResponse]:
    progresos = await repository.get_progress_by_gestante(db, gestante_id)
    return [ProgresoResponse.model_validate(c) for c in progresos]

async def marcar_completado(db: AsyncSession, gestante_id: str, content_id: int) -> ProgresoResponse:
    progreso = await repository.marcar_completado(db, gestante_id, content_id)
    return ProgresoResponse.model_validate(progreso)

# ---- Checklist gestante ----

async def get_checklist(db: AsyncSession, gestante: Gestante) -> ChecklistResponse:
    # Calcular el módulo real según la semana de gestación actual (FUM)
    modulo_id = None
    if gestante.fecha_ultima_menstruacion:
        semanas = _calcular_semanas_gestacion(gestante.fecha_ultima_menstruacion)
        modulo = await repository.get_modulo_by_semanas_eg(db, semanas)
        modulo_id = modulo.id if modulo else None

    # Si no se pudo calcular (sin FUM), usar el valor cacheado en BD como fallback
    if modulo_id is None:
        modulo_id = gestante.modulo_activo_id

    items = await repository.get_checklist_items(db, modulo_id)

    items_response = []
    for item in items:
        progreso = await repository.get_checklist_gestante(db, gestante.id, item.id)
        items_response.append(ChecklistItemResponse(
            id=item.id,
            texto=item.texto,
            orden=item.orden,
            completado=progreso.completado if progreso else False,
            fecha_completado=progreso.fecha_completado if progreso else None,
        ))

    return ChecklistResponse(
        modulo_id=modulo_id,
        total_items=len(items),
        completados=sum(1 for i in items_response if i.completado),
        items=items_response,
    )

async def update_checklist_item(db: AsyncSession, gestante: Gestante, item_id: int, data: CompletadoUpdate) -> ChecklistItemResponse:
    checklist_item = await repository.get_checklist_item_by_id(db, item_id)

    if checklist_item is None:
        raise NotFoundException("Item no encontrado.")

    item = await repository.update_checklist_item(db, gestante.id, item_id, data.completado)

    return ChecklistItemResponse(
        id=item_id,
        texto=checklist_item.texto,
        orden=checklist_item.orden,
        completado=item.completado,
        fecha_completado=item.fecha_completado,
    )

# ---- Salud Mental ----

async def create_tamizaje(db: AsyncSession, gestante: Gestante, data: TamizajeCreate) -> TamizajeResponse:
    evaluacion = EvaluacionSaludMental(
        gestante_id=gestante.id,
        instrumento=data.instrumento,
        puntaje=data.puntaje,
        fecha=date.today(),
    )
    evaluacion = await repository.create_tamizaje(db, evaluacion)
    return TamizajeResponse.model_validate(evaluacion)

async def get_historial_tamizajes(db: AsyncSession, gestante_id: str) -> list[TamizajeResponse]:
    evaluaciones = await repository.get_historial_tamizajes(db, gestante_id)
    return [TamizajeResponse.model_validate(c) for c in evaluaciones]

async def get_recommendations(db: AsyncSession, gestante_id: str) -> list[RecommendationsResponse]:
    recommendations = await repository.get_historial_tamizajes(db, gestante_id)
    return [RecommendationsResponse.model_validate(c) for c in recommendations]

# ---- Autoevaluaciones ----

async def get_autoevaluaciones(db: AsyncSession, gestante_id: str) -> list[AutoevaluacionDetalleResponse]:
    respuestas = await repository.get_autoevaluaciones(db, gestante_id)
    result = []
    for r in respuestas:
        pregunta = await repository.get_pregunta_seguimiento_by_id(db, r.pregunta_id)
        opcion = await repository.get_opcion_seguimiento_by_id(db, r.opcion_id) if r.opcion_id else None
        result.append(AutoevaluacionDetalleResponse(
            id=r.id,
            pregunta_id=r.pregunta_id,
            texto_pregunta=pregunta.texto_pregunta if pregunta else "",
            tipo_respuesta=pregunta.tipo_respuesta if pregunta else "",
            respuesta_texto=r.respuesta_texto,
            respuesta_booleana=r.respuesta_booleana,
            respuesta_numerica=r.respuesta_numerica,
            opcion_id=r.opcion_id,
            texto_opcion=opcion.texto_opcion if opcion else None,
            created_at=r.created_at,
        ))
    return result

async def create_autoevaluacion(db: AsyncSession, gestante_id: str, data: AutoevaluacionCreate) -> AutoevaluacionResponse:
    autoevaluacion = RespuestaSeguimiento(
        gestante_id=gestante_id,
        pregunta_id=data.pregunta_id,
        respuesta_texto=data.respuesta_texto,
        respuesta_booleana=data.respuesta_booleana,
        respuesta_numerica=data.respuesta_numerica,
        opcion_id=data.opcion_id,
    )
    autoevaluacion = await repository.create_autoevaluacion(db, autoevaluacion)
    return AutoevaluacionResponse.model_validate(autoevaluacion)
