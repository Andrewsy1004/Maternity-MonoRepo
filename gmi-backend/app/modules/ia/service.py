import json
from datetime import date, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.database.models.soporte import ChatIa
from app.database.models.riesgo import ClasificacionRiesgo, Alerta
from app.database.models.gestante import Gestante
from app.modules.ia import repository
from app.modules.ia.schemas import (
    ChatMessageResponse,
    ChatHistoryResponse,
    RiskSummaryResponse,
    RecommendationResponse,
    TriageRequest,
    TriageResponse,
    ClinicalSummaryResponse,
    ExplainabilityResponse,
    AlertaGeneradaInfo,
    AlertaResolverRequest,
    AlertaStaffResponse,
    ChatMensajeStaffResponse,
    ChatHistorialStaffResponse,
)
from app.modules.ia.prompts import (
    build_contexto_clinico,
    build_system_prompt_chat,
    build_prompt_risk_summary,
    build_prompt_recommendations,
    build_prompt_triage,
    build_prompt_clinical_summary,
    build_prompt_explainability,
    _calcular_semanas,
)
from app.services.openai import chat_completion


# ---- Helpers ----

async def _get_contexto(db: AsyncSession, gestante: Gestante) -> tuple[str, int, str]:
    """Recopila todo el contexto clínico y devuelve (contexto_str, semanas, modulo_nombre)."""
    perfil = await repository.get_perfil_clinico(db, gestante.id)
    formula = await repository.get_formula_obstetrica(db, gestante.id)
    antecedentes = await repository.get_antecedentes(db, gestante.id)
    ultimos_controles = await repository.get_ultimos_controles(db, gestante.id)
    signos_vitales = await repository.get_ultimos_signos_vitales(db, gestante.id)
    ultimos_examenes = await repository.get_ultimos_examenes(db, gestante.id)
    alertas_activas = await repository.get_alertas_activas(db, gestante.id)

    modulo_nombre = "No determinado"
    if gestante.modulo_activo_id:
        modulo = await repository.get_modulo_by_id(db, gestante.modulo_activo_id)
        if modulo:
            modulo_nombre = modulo.nombre

    semanas = _calcular_semanas(gestante.fecha_ultima_menstruacion)

    contexto = build_contexto_clinico(
        gestante=gestante,
        perfil=perfil,
        formula=formula,
        antecedentes=antecedentes,
        ultimos_controles=ultimos_controles,
        signos_vitales=signos_vitales,
        ultimos_examenes=ultimos_examenes,
        alertas_activas=alertas_activas,
        modulo_nombre=modulo_nombre,
    )

    return contexto, semanas, modulo_nombre


def _parse_json_response(response_text: str) -> dict:
    """Parsea la respuesta JSON de OpenAI limpiando posibles backticks."""
    clean = response_text.strip()
    if clean.startswith("```"):
        clean = clean.split("```")[1]
        if clean.startswith("json"):
            clean = clean[4:]
    return json.loads(clean.strip())


async def _crear_alerta_ia(
    db: AsyncSession,
    gestante_id: str,
    nivel_urgencia: str,
    descripcion: str,
    clasificacion_riesgo_id: str | None = None,
) -> Alerta | None:
    """Crea una Alerta trazable cuando la IA detecta riesgo alto."""
    tipo_alerta = await repository.get_tipo_alerta_by_codigo(db, "ia")
    if tipo_alerta is None:
        return None
    prioridad_codigo = "rojo" if nivel_urgencia in ("inmediata", "rojo") else "amarillo"
    prioridad = await repository.get_prioridad_by_codigo(db, prioridad_codigo)
    if prioridad is None:
        return None
    alerta = Alerta(
        gestante_id=gestante_id,
        clasificacion_riesgo_id=clasificacion_riesgo_id,
        tipo_alerta_id=tipo_alerta.id,
        prioridad_id=prioridad.id,
        estado="activa",
        modulo_origen="IA",
        descripcion=descripcion,
    )
    return await repository.create_alerta(db, alerta)


def _detectar_señales_criticas(texto: str) -> str | None:
    """Detección rápida de señales de alarma por palabras clave."""
    texto_lower = texto.lower()
    señales = {
        "sangrado": ["sangrado", "hemorragia", "sangre abundante"],
        "convulsiones": ["convulsión", "convulsiones", "convulsionando"],
        "dificultad respiratoria": ["no puedo respirar", "dificultad para respirar"],
        "dolor severo": ["dolor muy fuerte", "dolor insoportable", "dolor severo de cabeza"],
        "pérdida de conciencia": ["me desmayé", "perdí el conocimiento"],
        "movimientos fetales ausentes": ["no siento al bebé", "bebé no se mueve"],
    }
    for descripcion, keywords in señales.items():
        if any(kw in texto_lower for kw in keywords):
            return descripcion
    return None


# ---- Chat ----

async def send_chat_message(db: AsyncSession, gestante: Gestante, mensaje: str) -> ChatMessageResponse:
    contexto, _, _ = await _get_contexto(db, gestante)
    system_prompt = build_system_prompt_chat(contexto)

    historial = await repository.get_historial_by_gestante(db, gestante.id)

    messages = [{"role": "system", "content": system_prompt}]
    for h in historial:
        messages.append({"role": h.rol, "content": h.contenido})
    messages.append({"role": "user", "content": mensaje})

    msg_usuario = ChatIa(
        gestante_id=gestante.id,
        rol="user",
        contenido=mensaje,
    )
    await repository.create_mensaje(db, msg_usuario)

    respuesta_texto = await chat_completion(messages, temperature=0.5, max_tokens=300)

    msg_asistente = ChatIa(
        gestante_id=gestante.id,
        rol="assistant",
        contenido=respuesta_texto,
    )
    msg_asistente = await repository.create_mensaje(db, msg_asistente)

    alerta_info: AlertaGeneradaInfo | None = None
    señales_criticas = _detectar_señales_criticas(mensaje)
    if señales_criticas:
        alerta = await _crear_alerta_ia(
            db=db,
            gestante_id=gestante.id,
            nivel_urgencia="inmediata",
            descripcion=f"Señal de alarma detectada en chat: {señales_criticas}",
        )
        if alerta:
            alerta_info = AlertaGeneradaInfo(
                alerta_id=alerta.id,
                nivel_urgencia="inmediata",
                descripcion=alerta.descripcion,
            )
            
    contenido_final = msg_asistente.contenido
    
    if alerta_info and alerta_info.nivel_urgencia == "inmediata":
        contenido_final += (
            "\n\n Esta información ha sido remitida a un especialista. "
            "Mantente tranquila y permanece atenta a nuestros canales de comunicación. "
            "Un profesional se pondrá en contacto contigo lo antes posible."
        ) 

    return ChatMessageResponse(
        id=msg_asistente.id,
        rol=msg_asistente.rol,
        contenido=msg_asistente.contenido,
        created_at=msg_asistente.created_at,
        alerta_generada=alerta_info,
    )


async def get_chat_history(db: AsyncSession, gestante_id: str) -> ChatHistoryResponse:
    historial = await repository.get_historial_by_gestante(db, gestante_id, limit=50)
    mensajes = [
        ChatMessageResponse(
            id=h.id,
            rol=h.rol,
            contenido=h.contenido,
            created_at=h.created_at,
        )
        for h in historial
    ]
    return ChatHistoryResponse(mensajes=mensajes, total=len(mensajes))


async def delete_chat_history(db: AsyncSession, gestante_id: str) -> dict:
    await repository.delete_historial_by_gestante(db, gestante_id)
    return {"detail": "Historial de conversación eliminado exitosamente"}


# ---- Risk Summary ----

async def get_risk_summary(db: AsyncSession, gestante: Gestante) -> RiskSummaryResponse:
    contexto, semanas, _ = await _get_contexto(db, gestante)
    messages = build_prompt_risk_summary(contexto, semanas)

    response_text = await chat_completion(messages, temperature=0.2, max_tokens=800)

    try:
        data = _parse_json_response(response_text)
    except (json.JSONDecodeError, ValueError):
        return RiskSummaryResponse(
            assessment_id="",
            nivel_riesgo="amarillo",
            resumen="No se pudo generar el resumen de riesgo automáticamente.",
            factores_riesgo=[],
            recomendaciones=["Consulte con su médico tratante"],
            explicacion_ia=response_text,
            semana_gestacion=semanas,
        )

    nivel = data.get("nivel_riesgo", "amarillo")

    clasificacion = ClasificacionRiesgo(
        gestante_id=gestante.id,
        tipo_riesgo="obstetrico",
        nivel=nivel,
        clasificacion_ia=nivel,
        diagnostico_texto=data.get("resumen", ""),
        explicacion_ia=data.get("explicacion_ia", ""),
        fecha_evaluacion=datetime.utcnow(),
    )
    clasificacion = await repository.create_clasificacion_riesgo(db, clasificacion)

    alerta_info: AlertaGeneradaInfo | None = None
    if nivel == "rojo":
        alerta = await _crear_alerta_ia(
            db=db,
            gestante_id=gestante.id,
            nivel_urgencia="rojo",
            descripcion=f"Riesgo IA rojo: {data.get('resumen', '')[:200]}",
            clasificacion_riesgo_id=clasificacion.id,
        )
        if alerta:
            alerta_info = AlertaGeneradaInfo(
                alerta_id=alerta.id,
                nivel_urgencia="rojo",
                descripcion=alerta.descripcion,
            )

    return RiskSummaryResponse(
        assessment_id=clasificacion.id,
        nivel_riesgo=nivel,
        resumen=data.get("resumen", ""),
        factores_riesgo=data.get("factores_riesgo", []),
        recomendaciones=data.get("recomendaciones", []),
        explicacion_ia=data.get("explicacion_ia", ""),
        semana_gestacion=semanas,
        alerta_generada=alerta_info,
    )


# ---- Recommendations ----

async def get_recommendations(db: AsyncSession, gestante: Gestante) -> RecommendationResponse:
    contexto, semanas, modulo_nombre = await _get_contexto(db, gestante)
    messages = build_prompt_recommendations(contexto, semanas, modulo_nombre)

    response_text = await chat_completion(messages, temperature=0.4, max_tokens=600)

    try:
        data = _parse_json_response(response_text)
    except (json.JSONDecodeError, ValueError):
        return RecommendationResponse(
            semana_gestacion=semanas,
            modulo=modulo_nombre,
            recomendaciones=["Consulte con su médico para recomendaciones personalizadas"],
            mensaje_motivacional="Cada día que cuidas de ti misma es un paso hacia el bienestar de tu bebé.",
        )

    return RecommendationResponse(
        semana_gestacion=semanas,
        modulo=modulo_nombre,
        recomendaciones=data.get("recomendaciones", []),
        mensaje_motivacional=data.get("mensaje_motivacional", ""),
    )


# ---- Triage ----

async def run_triage(db: AsyncSession, gestante: Gestante, data: TriageRequest) -> TriageResponse:
    contexto, semanas, _ = await _get_contexto(db, gestante)
    messages = build_prompt_triage(
        sintomas=data.sintomas,
        respuestas_recientes=data.respuestas_recientes,
        contexto=contexto,
        semanas=semanas,
    )

    response_text = await chat_completion(messages, temperature=0.1, max_tokens=500)

    try:
        data_resp = _parse_json_response(response_text)
    except (json.JSONDecodeError, ValueError):
        return TriageResponse(
            nivel_urgencia="urgente",
            descripcion="No se pudo evaluar automáticamente. Consulte con su médico.",
            acciones_recomendadas=["Contacte a su IPS de referencia"],
            requiere_llamada_emergencia=False,
        )

    nivel_urgencia = data_resp.get("nivel_urgencia", "urgente")

    alerta_info: AlertaGeneradaInfo | None = None
    if nivel_urgencia == "inmediata":
        alerta = await _crear_alerta_ia(
            db=db,
            gestante_id=gestante.id,
            nivel_urgencia="inmediata",
            descripcion=f"Triage urgente: {data_resp.get('descripcion', '')[:200]}",
        )
        if alerta:
            alerta_info = AlertaGeneradaInfo(
                alerta_id=alerta.id,
                nivel_urgencia=nivel_urgencia,
                descripcion=alerta.descripcion,
            )

    return TriageResponse(
        nivel_urgencia=nivel_urgencia,
        descripcion=data_resp.get("descripcion", ""),
        acciones_recomendadas=data_resp.get("acciones_recomendadas", []),
        requiere_llamada_emergencia=data_resp.get("requiere_llamada_emergencia", False),
        alerta_generada=alerta_info,
    )


# ---- Clinical Summary (para staff) ----

async def get_clinical_summary(db: AsyncSession, gestante: Gestante) -> ClinicalSummaryResponse:
    contexto, semanas, modulo_nombre = await _get_contexto(db, gestante)
    alertas = await repository.get_alertas_activas(db, gestante.id)

    messages = build_prompt_clinical_summary(
        contexto=contexto,
        semanas=semanas,
        modulo=modulo_nombre,
        alertas_count=len(alertas),
    )

    response_text = await chat_completion(
        messages, model="gpt-4o", temperature=0.2, max_tokens=800
    )

    try:
        data = _parse_json_response(response_text)
    except (json.JSONDecodeError, ValueError):
        return ClinicalSummaryResponse(
            codigo_gmi=gestante.codigo_gmi,
            semana_gestacion=semanas,
            modulo_activo=modulo_nombre,
            resumen_clinico="No se pudo generar el resumen clínico automáticamente.",
            alertas_activas=len(alertas),
            puntos_clave=[],
            sugerencias_clinico=[],
        )

    return ClinicalSummaryResponse(
        codigo_gmi=gestante.codigo_gmi,
        semana_gestacion=semanas,
        modulo_activo=modulo_nombre,
        resumen_clinico=data.get("resumen_clinico", ""),
        alertas_activas=len(alertas),
        puntos_clave=data.get("puntos_clave", []),
        sugerencias_clinico=data.get("sugerencias_clinico", []),
    )


# ---- Explainability ----

async def get_explainability(db: AsyncSession, gestante: Gestante, assessment_id: str) -> ExplainabilityResponse:
    clasificacion = await repository.get_clasificacion_riesgo_by_id(db, assessment_id)
    if clasificacion is None or clasificacion.gestante_id != gestante.id:
        raise NotFoundException("Clasificación de riesgo no encontrada")

    contexto, _, _ = await _get_contexto(db, gestante)
    messages = build_prompt_explainability(clasificacion, contexto)

    response_text = await chat_completion(messages, temperature=0.2, max_tokens=600)

    try:
        data = _parse_json_response(response_text)
    except (json.JSONDecodeError, ValueError):
        return ExplainabilityResponse(
            assessment_id=assessment_id,
            nivel_riesgo=clasificacion.clasificacion_ia or "amarillo",
            explicacion=clasificacion.explicacion_ia or "No disponible",
            factores_determinantes=[],
            datos_utilizados=[],
        )

    return ExplainabilityResponse(
        assessment_id=assessment_id,
        nivel_riesgo=clasificacion.clasificacion_ia or "amarillo",
        explicacion=data.get("explicacion", ""),
        factores_determinantes=data.get("factores_determinantes", []),
        datos_utilizados=data.get("datos_utilizados", []),
    )


# ---- Staff: explainability por gestante ----

async def get_explainability_for_staff(
    db: AsyncSession, gestante_id: str, assessment_id: str
) -> ExplainabilityResponse:
    from app.modules.m0.repository import get_gestante_by_id
    gestante = await get_gestante_by_id(db, gestante_id)
    if gestante is None:
        raise NotFoundException("Gestante no encontrada")
    return await get_explainability(db, gestante, assessment_id)


# ---- Staff: historial de chat de una gestante ----

async def get_chat_history_for_staff(
    db: AsyncSession, gestante_id: str
) -> ChatHistorialStaffResponse:
    from app.modules.m0.repository import get_gestante_by_id
    gestante = await get_gestante_by_id(db, gestante_id)
    if gestante is None:
        raise NotFoundException("Gestante no encontrada")
    historial = await repository.get_historial_by_gestante(db, gestante_id, limit=100)
    mensajes = [
        ChatMensajeStaffResponse(
            id=h.id, rol=h.rol, contenido=h.contenido, created_at=h.created_at,
        )
        for h in historial
    ]
    return ChatHistorialStaffResponse(
        codigo_gmi=gestante.codigo_gmi,
        mensajes=mensajes,
        total=len(mensajes),
    )


# ---- Staff: gestión de alertas ----

async def get_alertas_gestante(db: AsyncSession, gestante_id: str) -> list[AlertaStaffResponse]:
    rows = await repository.get_alertas_with_catalogo_by_gestante(db, gestante_id)
    return [
        AlertaStaffResponse(
            id=a.id,
            gestante_id=a.gestante_id,
            tipo_alerta_id=a.tipo_alerta_id,
            tipo_alerta_nombre=tipo_nombre,
            prioridad_id=a.prioridad_id,
            prioridad_codigo=prioridad_codigo,
            estado=a.estado,
            modulo_origen=a.modulo_origen,
            descripcion=a.descripcion,
            clasificacion_riesgo_id=a.clasificacion_riesgo_id,
            resuelta_por=a.resuelta_por,
            fecha_resolucion=a.fecha_resolucion,
            created_at=a.created_at,
        )
        for a, tipo_nombre, prioridad_codigo in rows
    ]


async def resolver_alerta(
    db: AsyncSession, alerta_id: str, staff_id: str, data: AlertaResolverRequest,
) -> AlertaStaffResponse:
    alerta = await repository.get_alerta_by_id(db, alerta_id)
    if alerta is None:
        raise NotFoundException("Alerta no encontrada")

    alerta.estado = "resuelta"
    alerta.resuelta_por = staff_id
    alerta.fecha_resolucion = datetime.utcnow()
    if data.observaciones:
        alerta.descripcion = f"{alerta.descripcion or ''} | Resolución: {data.observaciones}".strip(" |")

    alerta = await repository.update_alerta(db, alerta)

    rows = await repository.get_alertas_with_catalogo_by_gestante(db, alerta.gestante_id)
    for a, tipo_nombre, prioridad_codigo in rows:
        if a.id == alerta_id:
            return AlertaStaffResponse(
                id=a.id,
                gestante_id=a.gestante_id,
                tipo_alerta_id=a.tipo_alerta_id,
                tipo_alerta_nombre=tipo_nombre,
                prioridad_id=a.prioridad_id,
                prioridad_codigo=prioridad_codigo,
                estado=a.estado,
                modulo_origen=a.modulo_origen,
                descripcion=a.descripcion,
                clasificacion_riesgo_id=a.clasificacion_riesgo_id,
                resuelta_por=a.resuelta_por,
                fecha_resolucion=a.fecha_resolucion,
                created_at=a.created_at,
            )

    raise NotFoundException("Alerta no encontrada tras actualización")