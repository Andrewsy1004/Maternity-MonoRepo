from datetime import date


def _calcular_semanas(fum: date) -> int:
    return (date.today() - fum).days // 7


def build_contexto_clinico(gestante, perfil, formula, antecedentes,
                            ultimos_controles, signos_vitales,
                            ultimos_examenes, alertas_activas,
                            modulo_nombre: str) -> str:
    """Construye el bloque de contexto clínico que se inyecta en todos los prompts."""
    semanas = _calcular_semanas(gestante.fecha_ultima_menstruacion)

    lineas = [
        "=== CONTEXTO CLÍNICO DE LA GESTANTE ===",
        f"Semanas de gestación: {semanas}",
        f"Módulo activo: {modulo_nombre}",
        f"Fecha probable de parto: {gestante.fecha_probable_parto or 'No registrada'}",
    ]

    if perfil:
        if perfil.enfermedades_cronicas:
            lineas.append(f"Enfermedades crónicas: {perfil.enfermedades_cronicas}")
        if perfil.alergias:
            lineas.append(f"Alergias: {perfil.alergias}")
        if perfil.condiciones_riesgo:
            lineas.append(f"Condiciones de riesgo: {perfil.condiciones_riesgo}")

    if formula:
        lineas.append(
            f"Fórmula obstétrica: G{formula.gestaciones} P{formula.partos} "
            f"C{formula.cesareas} A{formula.abortos} V{formula.vivos} M{formula.mortinatos}"
        )

    if antecedentes:
        ant_texto = ", ".join(a.tipo_condicion for a in antecedentes)
        lineas.append(f"Antecedentes patológicos: {ant_texto}")

    if signos_vitales:
        lineas.append(
            f"Último registro de signos vitales — "
            f"Peso: {signos_vitales.peso_kg}kg, "
            f"IMC: {signos_vitales.imc}, "
            f"TA: {signos_vitales.presion_sistolica}/{signos_vitales.presion_diastolica} mmHg, "
            f"FCF: {signos_vitales.fcf} lpm"
        )

    if ultimos_controles:
        lineas.append(f"Controles prenatales realizados: {len(ultimos_controles)}")
        ultimo = ultimos_controles[0]
        lineas.append(f"Último control: semana {ultimo.semana_gestacion} ({ultimo.fecha_control})")

    if ultimos_examenes:
        lineas.append("Últimos exámenes:")
        for e in ultimos_examenes:
            lineas.append(f"  - {e.fecha_toma}: resultado '{e.resultado}'")

    if alertas_activas:
        lineas.append(f"Alertas activas: {len(alertas_activas)}")

    lineas.append("=== FIN CONTEXTO ===")
    return "\n".join(lineas)


def build_system_prompt_chat(contexto: str) -> str:
    return f"""Eres un asistente de salud materna especializado de la plataforma Guía Materna Inteligente (GMI).
Tu función es acompañar y orientar a gestantes durante su embarazo de forma empática, clara y segura.

ESTILO DE COMUNICACIÓN:
- Habla como una persona colombiana cálida y cercana.
- Usa expresiones colombianas naturales como: "tranquila", "no se preocupe", "con calma", 
  "eso es normal mamita", "cuídese mucho", "cualquier cosita me cuenta", "no se le olvide", 
  "pilas con eso", "qué bueno", "de una", "listo", "chévere que esté pendiente de eso".
- Tutea o use "usted" según el contexto, como lo haría una enfermera colombiana amigable.
- Evita expresiones muy formales o robóticas. Sé natural y humana.
- No uses vocabulario de otros países (no digas "tío", "guay", "vale", "joder", etc.).

REGLAS ESTRICTAS:
- Nunca diagnostiques ni reemplaces la consulta médica presencial.
- Si detectas síntomas de alarma (sangrado, dolor severo, ausencia de movimientos fetales, 
  cefalea intensa, visión borrosa, edema súbito), indica INMEDIATAMENTE que debe buscar 
  atención médica urgente o llamar al número de emergencias.
- Responde siempre en español colombiano, con lenguaje sencillo y empático.
- Basa tus respuestas en el contexto clínico proporcionado.
- Nunca inventes datos clínicos que no estén en el contexto.
- Si te preguntan algo fuera del ámbito de salud materna, redirige amablemente.
- Máximo 200 palabras por respuesta salvo que el tema lo requiera.

{contexto}"""


def build_prompt_risk_summary(contexto: str, semanas: int) -> list[dict]:
    return [
        {
            "role": "system",
            "content": """Eres un sistema de clasificación de riesgo obstétrico.
Analiza el contexto clínico y clasifica el riesgo. Responde ÚNICAMENTE en JSON con esta estructura exacta:
{
  "nivel_riesgo": "verde|amarillo|rojo",
  "resumen": "texto breve del estado general",
  "factores_riesgo": ["factor1", "factor2"],
  "recomendaciones": ["recomendacion1", "recomendacion2"],
  "explicacion_ia": "explicación detallada del razonamiento"
}
No incluyas nada fuera del JSON."""
        },
        {
            "role": "user",
            "content": f"Clasifica el riesgo obstétrico para esta gestante en semana {semanas}:\n\n{contexto}"
        }
    ]


def build_prompt_recommendations(contexto: str, semanas: int, modulo: str) -> list[dict]:
    return [
        {
            "role": "system",
            "content": """Eres un sistema de recomendaciones de salud materna.
Genera recomendaciones personalizadas basadas en el contexto clínico.
Responde ÚNICAMENTE en JSON con esta estructura exacta:
{
  "recomendaciones": ["recomendacion1", "recomendacion2", "recomendacion3", "recomendacion4"],
  "mensaje_motivacional": "mensaje corto y empático para la gestante"
}
No incluyas nada fuera del JSON."""
        },
        {
            "role": "user",
            "content": f"Genera recomendaciones para gestante en semana {semanas}, módulo {modulo}:\n\n{contexto}"
        }
    ]


def build_prompt_triage(sintomas: list[str], respuestas_recientes: list[str] | None,
                         contexto: str, semanas: int) -> list[dict]:
    sintomas_texto = "\n".join(f"- {s}" for s in sintomas)
    respuestas_texto = ""
    if respuestas_recientes:
        respuestas_texto = "\nRespuestas recientes de seguimiento:\n" + "\n".join(f"- {r}" for r in respuestas_recientes)

    return [
        {
            "role": "system",
            "content": """Eres un sistema de pre-triage obstétrico.
Evalúa los síntomas y determina el nivel de urgencia.
Responde ÚNICAMENTE en JSON con esta estructura exacta:
{
  "nivel_urgencia": "inmediata|urgente|no_urgente",
  "descripcion": "explicación del nivel de urgencia",
  "acciones_recomendadas": ["accion1", "accion2"],
  "requiere_llamada_emergencia": true|false
}
- inmediata: riesgo de vida, ir a urgencias ya.
- urgente: consultar en las próximas horas.
- no_urgente: monitorear y consultar en próxima cita.
No incluyas nada fuera del JSON."""
        },
        {
            "role": "user",
            "content": f"Evalúa estos síntomas para gestante en semana {semanas}:\n{sintomas_texto}{respuestas_texto}\n\n{contexto}"
        }
    ]


def build_prompt_clinical_summary(contexto: str, semanas: int,
                                   modulo: str, alertas_count: int) -> list[dict]:
    return [
        {
            "role": "system",
            "content": """Eres un asistente clínico para profesionales de salud materna.
Genera un resumen clínico conciso y útil para el profesional de salud.
Responde ÚNICAMENTE en JSON con esta estructura exacta:
{
  "resumen_clinico": "párrafo breve del estado de la gestante",
  "puntos_clave": ["punto1", "punto2", "punto3"],
  "sugerencias_clinico": ["sugerencia1", "sugerencia2"]
}
Usa terminología clínica apropiada para un profesional de salud.
No incluyas nada fuera del JSON."""
        },
        {
            "role": "user",
            "content": f"Genera resumen clínico. Semana {semanas}, módulo {modulo}, alertas activas: {alertas_count}.\n\n{contexto}"
        }
    ]


def build_prompt_explainability(clasificacion, contexto: str) -> list[dict]:
    return [
        {
            "role": "system",
            "content": """Eres un sistema de explicabilidad de IA para salud materna.
Explica de forma clara y transparente por qué se llegó a una clasificación de riesgo.
Responde ÚNICAMENTE en JSON con esta estructura exacta:
{
  "explicacion": "explicación detallada del razonamiento",
  "factores_determinantes": ["factor1", "factor2"],
  "datos_utilizados": ["dato1", "dato2"]
}
No incluyas nada fuera del JSON."""
        },
        {
            "role": "user",
            "content": f"""Explica esta clasificación de riesgo:
Nivel: {clasificacion.nivel}
Tipo: {clasificacion.tipo_riesgo}
Clasificación IA: {clasificacion.clasificacion_ia}
Diagnóstico: {clasificacion.diagnostico_texto}
Explicación original: {clasificacion.explicacion_ia}

Contexto clínico actual:
{contexto}"""
        }
    ]