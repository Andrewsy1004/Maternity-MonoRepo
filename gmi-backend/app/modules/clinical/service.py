import json
from datetime import date, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException, ValidationException
from app.database.models.complementarios import (
    RemisionInterdisciplinaria,
    SuministroMicronutriente,
    Vacunacion,
)
from app.database.models.control import ControlPrenatal, SignosVitales
from app.database.models.examenes import Ecografia, ExamenLaboratorio
from app.database.models.gestante import Gestante
from app.database.models.riesgo import Alerta
from app.database.models.seguimiento import RespuestaSeguimiento, SintomaReportado
from app.modules.clinical import repository
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
    ModuloInfo,
    MovimientoFetalCreate,
    MovimientoFetalResponse,
    OpcionPreguntaResponse,
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


# ---- Helpers ----

def _calcular_semanas(fum: date) -> int:
    return (date.today() - fum).days // 7


def _calcular_dias(fum: date) -> int:
    return (date.today() - fum).days % 7


def _calcular_trimestre(semana: int) -> int:
    if semana <= 13:
        return 1
    if semana <= 27:
        return 2
    return 3


def _calcular_imc(peso_kg: float, talla_cm: float) -> float:
    return round(peso_kg / ((talla_cm / 100) ** 2), 2)


def _recomendaciones_por_modulo(codigo: str) -> list[str]:
    recomendaciones = {
        "M1": [
            "Asista a su primer control prenatal lo antes posible",
            "Inicie ácido fólico según indicación médica",
            "Evite el consumo de alcohol, tabaco y drogas",
            "Manténgase hidratada y lleve una alimentación balanceada",
        ],
        "M2": [
            "Asista puntualmente a sus controles prenatales",
            "Realice los exámenes de laboratorio indicados",
            "Inicie la vacunación contra influenza y tosferina",
            "Practique actividad física moderada según indicación",
        ],
        "M3": [
            "Prepare su plan de parto con apoyo del equipo de salud",
            "Aprenda a identificar los signos de alarma del tercer trimestre",
            "Realice el conteo de movimientos fetales diariamente",
            "Tenga lista su bolsa de maternidad a partir de la semana 36",
        ],
        "M4": [
            "Asista a sus controles de puerperio",
            "Consulte al médico ante cualquier signo de alarma posparto",
            "Reciba orientación sobre lactancia materna exclusiva",
            "Planifique su método anticonceptivo posparto",
        ],
    }
    return recomendaciones.get(codigo, recomendaciones["M1"])


# ---- Dashboard ----

async def get_dashboard(db: AsyncSession, gestante: Gestante, module_id: int | None = None) -> DashboardResponse:
    semanas = _calcular_semanas(gestante.fecha_ultima_menstruacion)
    dias = _calcular_dias(gestante.fecha_ultima_menstruacion)

    if module_id:
        modulo = await repository.get_modulo_by_id(db, module_id)
    else:
        modulo = await repository.get_modulo_by_semana(db, semanas)

    if modulo is None:
        raise NotFoundException("Módulo clínico no encontrado")

    controles = await repository.count_controles_by_gestante(db, gestante.id)
    alertas = await repository.count_alertas_activas(db, gestante.id)

    return DashboardResponse(
        modulo_activo=ModuloInfo(
            modulo_id=modulo.id,
            codigo=modulo.codigo,
            nombre=modulo.nombre,
            semana_gestacion_actual=semanas,
            descripcion=modulo.descripcion,
        ),
        semana_gestacion=semanas,
        dias_gestacion=dias,
        fecha_probable_parto=gestante.fecha_probable_parto,
        controles_realizados=controles,
        alertas_activas=alertas,
    )


# ---- Signos de Alarma ----

async def get_alarm_signs(db: AsyncSession, gestante: Gestante, module_id: int | None = None) -> list[SignoAlarmaResponse]:
    if module_id is None:
        semanas = _calcular_semanas(gestante.fecha_ultima_menstruacion)
        modulo = await repository.get_modulo_by_semana(db, semanas)
        module_id = modulo.id if modulo else None

    if module_id is None:
        return []

    preguntas = await repository.get_preguntas_by_modulo(db, module_id)
    return [
        SignoAlarmaResponse(
            pregunta_id=p.id,
            texto=p.texto_pregunta,
            tipo_respuesta=p.tipo_respuesta,
            frecuencia=p.frecuencia,
        )
        for p in preguntas if p.es_signo_alarma
    ]


# ---- Recomendaciones ----

async def get_recommendations(db: AsyncSession, gestante: Gestante) -> RecomendacionResponse:
    semanas = _calcular_semanas(gestante.fecha_ultima_menstruacion)

    if gestante.modulo_activo_id:
        modulo = await repository.get_modulo_by_id(db, gestante.modulo_activo_id)
    else:
        modulo = await repository.get_modulo_by_semana(db, semanas)

    codigo = modulo.codigo if modulo else "M1"

    return RecomendacionResponse(
        modulo=codigo,
        semana_gestacion=semanas,
        recomendaciones=_recomendaciones_por_modulo(codigo),
    )


# ---- Síntomas ----

async def report_symptom(db: AsyncSession, gestante: Gestante, data: SintomaCreate) -> SintomaResponse:
    modulo_origen = None
    if gestante.modulo_activo_id:
        modulo = await repository.get_modulo_by_id(db, gestante.modulo_activo_id)
        modulo_origen = modulo.codigo if modulo else None

    sintoma = SintomaReportado(
        gestante_id=gestante.id,
        descripcion=data.descripcion,
        severidad=data.severidad,
        modulo_origen=modulo_origen,
        fecha_reporte=datetime.utcnow(),
    )
    sintoma = await repository.create_sintoma(db, sintoma)

    # Generar alerta si la severidad es Moderado, Leve y Severo
    if data.severidad in ("Leve","Moderado","Severo"):
        prioridad_codigo = "rojo" if data.severidad == "Severo" else "amarillo"
        tipo_alerta = await repository.get_tipo_alerta_by_codigo(db, "seguimiento")
        prioridad = await repository.get_prioridad_by_codigo(db, prioridad_codigo)

        if tipo_alerta and prioridad:
            alerta = Alerta(
                gestante_id=gestante.id,
                tipo_alerta_id=tipo_alerta.id,
                prioridad_id=prioridad.id,
                estado="activa",
                modulo_origen=modulo_origen or "clinical",
                descripcion=f"Síntoma {data.severidad.lower()} reportado: {data.descripcion}",
            )
            await repository.create_alerta(db, alerta)

    return SintomaResponse.model_validate(sintoma)


async def get_symptoms(db: AsyncSession, gestante_id: str) -> list[SintomaResponse]:
    sintomas = await repository.get_sintomas_by_gestante(db, gestante_id)
    return [SintomaResponse.model_validate(s) for s in sintomas]


# ---- Signos Vitales ----

async def register_vitals(db: AsyncSession, data: SignosVitalesCreate, staff_id: str) -> SignosVitalesResponse:
    control = await repository.get_control_by_id(db, data.control_prenatal_id)
    if control is None:
        raise NotFoundException("Control prenatal no encontrado")

    existing = await repository.get_vitales_by_control_id(db, data.control_prenatal_id)
    if existing:
        raise ValidationException("Ya existen signos vitales registrados para este control prenatal")

    imc = None
    if data.talla_cm:
        imc = _calcular_imc(data.peso_kg, data.talla_cm)

    sv = SignosVitales(
        control_prenatal_id=data.control_prenatal_id,
        peso_kg=data.peso_kg,
        talla_cm=data.talla_cm,
        imc=imc,
        estado_nutricional_id=data.estado_nutricional_id,
        altura_uterina=data.altura_uterina,
        presion_sistolica=data.presion_sistolica,
        presion_diastolica=data.presion_diastolica,
        fcf=data.fcf,
    )
    sv = await repository.create_signos_vitales(db, sv)

    return SignosVitalesResponse(
        id=sv.id,
        control_prenatal_id=sv.control_prenatal_id,
        fecha_control=control.fecha_control,
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


async def get_vitals_history(db: AsyncSession, gestante_id: str) -> list[SignosVitalesResponse]:
    rows = await repository.get_vitales_by_gestante(db, gestante_id)
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


# ---- Clasificación de Riesgo ----

async def get_risk_assessment(db: AsyncSession, gestante_id: str) -> ClasificacionRiesgoResponse:
    riesgo = await repository.get_riesgo_actual(db, gestante_id)
    if riesgo is None:
        raise NotFoundException("No se encontró clasificación de riesgo para esta gestante")
    return ClasificacionRiesgoResponse.model_validate(riesgo)


async def get_risk_history(db: AsyncSession, gestante_id: str) -> list[ClasificacionRiesgoResponse]:
    riesgos = await repository.get_riesgos_by_gestante(db, gestante_id)
    return [ClasificacionRiesgoResponse.model_validate(r) for r in riesgos]


# ---- Exámenes de Laboratorio ----

async def register_exam(db: AsyncSession, data: ExamenCreate, staff_id: str) -> ExamenResponse:
    tipo = await repository.get_tipo_examen_by_id(db, data.tipo_examen_id)
    if tipo is None:
        raise NotFoundException("Tipo de examen no encontrado")

    trimestre = _calcular_trimestre(data.semana_gestacion) if data.semana_gestacion else None

    examen = ExamenLaboratorio(
        gestante_id=data.gestante_id,
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
    examen = await repository.create_examen(db, examen)

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


async def get_exams_history(db: AsyncSession, gestante_id: str) -> list[ExamenResponse]:
    examenes = await repository.get_examenes_by_gestante(db, gestante_id)
    result = []
    for e in examenes:
        tipo = await repository.get_tipo_examen_by_id(db, e.tipo_examen_id)
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


async def get_exam_by_id(db: AsyncSession, gestante_id: str, examen_id: str) -> ExamenResponse:
    examen = await repository.get_examen_by_id(db, examen_id)
    if examen is None or examen.gestante_id != gestante_id:
        raise NotFoundException("Examen no encontrado")

    tipo = await repository.get_tipo_examen_by_id(db, examen.tipo_examen_id)
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


# ---- Ecografías ----

async def register_ecography(db: AsyncSession, data: EcografiaCreate, staff_id: str) -> EcografiaResponse:
    eco = Ecografia(
        gestante_id=data.gestante_id,
        tipo_ecografia_id=data.tipo_ecografia_id,
        fecha=data.fecha,
        semana_gestacion=data.semana_gestacion,
        resultado=data.resultado,
        plan_manejo=data.plan_manejo,
    )
    eco = await repository.create_ecografia(db, eco)

    tipo_nombre = None
    if data.tipo_ecografia_id:
        tipo = await repository.get_tipo_ecografia_by_id(db, data.tipo_ecografia_id)
        tipo_nombre = tipo.nombre if tipo else None

    return EcografiaResponse(
        id=eco.id,
        tipo_ecografia_id=eco.tipo_ecografia_id,
        tipo_ecografia_nombre=tipo_nombre,
        fecha=eco.fecha,
        semana_gestacion=eco.semana_gestacion,
        resultado=eco.resultado,
        plan_manejo=eco.plan_manejo,
        created_at=eco.created_at,
    )


async def get_ecography_history(db: AsyncSession, gestante_id: str) -> list[EcografiaResponse]:
    ecos = await repository.get_ecografias_by_gestante(db, gestante_id)
    result = []
    for e in ecos:
        tipo_nombre = None
        if e.tipo_ecografia_id:
            tipo = await repository.get_tipo_ecografia_by_id(db, e.tipo_ecografia_id)
            tipo_nombre = tipo.nombre if tipo else None
        result.append(EcografiaResponse(
            id=e.id,
            tipo_ecografia_id=e.tipo_ecografia_id,
            tipo_ecografia_nombre=tipo_nombre,
            fecha=e.fecha,
            semana_gestacion=e.semana_gestacion,
            resultado=e.resultado,
            plan_manejo=e.plan_manejo,
            created_at=e.created_at,
        ))
    return result


async def get_ecography_by_id(db: AsyncSession, gestante_id: str, eco_id: str) -> EcografiaResponse:
    eco = await repository.get_ecografia_by_id(db, eco_id)
    if eco is None or eco.gestante_id != gestante_id:
        raise NotFoundException("Ecografía no encontrada")

    tipo_nombre = None
    if eco.tipo_ecografia_id:
        tipo = await repository.get_tipo_ecografia_by_id(db, eco.tipo_ecografia_id)
        tipo_nombre = tipo.nombre if tipo else None

    return EcografiaResponse(
        id=eco.id,
        tipo_ecografia_id=eco.tipo_ecografia_id,
        tipo_ecografia_nombre=tipo_nombre,
        fecha=eco.fecha,
        semana_gestacion=eco.semana_gestacion,
        resultado=eco.resultado,
        plan_manejo=eco.plan_manejo,
        created_at=eco.created_at,
    )


# ---- Vacunación ----

async def register_vaccination(db: AsyncSession, data: VacunacionCreate, staff_id: str) -> VacunacionResponse:
    vacuna_cat = await repository.get_vacuna_cat_by_id(db, data.vacuna_id)
    if vacuna_cat is None:
        raise NotFoundException("Vacuna no encontrada en catálogo")

    v = Vacunacion(
        gestante_id=data.gestante_id,
        vacuna_id=data.vacuna_id,
        dosis=data.dosis,
        fecha_aplicacion=data.fecha_aplicacion,
    )
    v = await repository.create_vacunacion(db, v)

    return VacunacionResponse(
        id=v.id,
        vacuna_id=v.vacuna_id,
        vacuna_nombre=vacuna_cat.nombre,
        dosis=v.dosis,
        fecha_aplicacion=v.fecha_aplicacion,
        created_at=v.created_at,
    )


async def get_vaccination_history(db: AsyncSession, gestante_id: str) -> list[VacunacionResponse]:
    vacunas = await repository.get_vacunacion_by_gestante(db, gestante_id)
    result = []
    for v in vacunas:
        cat = await repository.get_vacuna_cat_by_id(db, v.vacuna_id)
        result.append(VacunacionResponse(
            id=v.id,
            vacuna_id=v.vacuna_id,
            vacuna_nombre=cat.nombre if cat else None,
            dosis=v.dosis,
            fecha_aplicacion=v.fecha_aplicacion,
            created_at=v.created_at,
        ))
    return result


# ---- Micronutrientes ----

async def register_micronutrient(db: AsyncSession, data: MicronutrienteCreate, staff_id: str) -> MicronutrienteResponse:
    cat = await repository.get_micronutriente_cat_by_id(db, data.micronutriente_id)
    if cat is None:
        raise NotFoundException("Micronutriente no encontrado en catálogo")

    m = SuministroMicronutriente(
        gestante_id=data.gestante_id,
        micronutriente_id=data.micronutriente_id,
        suministrado=data.suministrado,
        fecha_inicio=data.fecha_inicio,
    )
    m = await repository.create_micronutriente(db, m)

    return MicronutrienteResponse(
        id=m.id,
        micronutriente_id=m.micronutriente_id,
        micronutriente_nombre=cat.nombre,
        suministrado=m.suministrado,
        fecha_inicio=m.fecha_inicio,
        created_at=m.created_at,
    )


async def get_micronutrients(db: AsyncSession, gestante_id: str) -> list[MicronutrienteResponse]:
    items = await repository.get_micronutrientes_by_gestante(db, gestante_id)
    result = []
    for m in items:
        cat = await repository.get_micronutriente_cat_by_id(db, m.micronutriente_id)
        result.append(MicronutrienteResponse(
            id=m.id,
            micronutriente_id=m.micronutriente_id,
            micronutriente_nombre=cat.nombre if cat else None,
            suministrado=m.suministrado,
            fecha_inicio=m.fecha_inicio,
            created_at=m.created_at,
        ))
    return result


# ---- Remisiones ----

async def register_referral(db: AsyncSession, data: RemisionCreate, staff_id: str) -> RemisionResponse:
    esp = await repository.get_especialidad_by_id(db, data.especialidad_id)
    if esp is None:
        raise NotFoundException("Especialidad no encontrada")

    r = RemisionInterdisciplinaria(
        gestante_id=data.gestante_id,
        especialidad_id=data.especialidad_id,
        fecha_remision=data.fecha_remision,
        semana_gestacion=data.semana_gestacion,
    )
    r = await repository.create_remision(db, r)

    return RemisionResponse(
        id=r.id,
        especialidad_id=r.especialidad_id,
        especialidad_nombre=esp.nombre,
        fecha_remision=r.fecha_remision,
        fecha_atencion=r.fecha_atencion,
        semana_gestacion=r.semana_gestacion,
        created_at=r.created_at,
    )


async def get_referrals(db: AsyncSession, gestante_id: str) -> list[RemisionResponse]:
    remisiones = await repository.get_remisiones_by_gestante(db, gestante_id)
    result = []
    for r in remisiones:
        esp = await repository.get_especialidad_by_id(db, r.especialidad_id)
        result.append(RemisionResponse(
            id=r.id,
            especialidad_id=r.especialidad_id,
            especialidad_nombre=esp.nombre if esp else None,
            fecha_remision=r.fecha_remision,
            fecha_atencion=r.fecha_atencion,
            semana_gestacion=r.semana_gestacion,
            created_at=r.created_at,
        ))
    return result


async def update_referral(db: AsyncSession, remision_id: str, data: RemisionUpdate, staff_id: str) -> RemisionResponse:
    r = await repository.get_remision_by_id(db, remision_id)
    if r is None:
        raise NotFoundException("Remisión no encontrada")

    r.fecha_atencion = data.fecha_atencion
    r = await repository.update_remision(db, r)

    esp = await repository.get_especialidad_by_id(db, r.especialidad_id)
    return RemisionResponse(
        id=r.id,
        especialidad_id=r.especialidad_id,
        especialidad_nombre=esp.nombre if esp else None,
        fecha_remision=r.fecha_remision,
        fecha_atencion=r.fecha_atencion,
        semana_gestacion=r.semana_gestacion,
        created_at=r.created_at,
    )


# ---- Controles Prenatales ----

async def register_prenatal_control(db: AsyncSession, data: ControlPrenatalCreate, staff_id: str) -> ControlPrenatalResponse:
    control = ControlPrenatal(
        gestante_id=data.gestante_id,
        numero_control=data.numero_control,
        fecha_control=data.fecha_control,
        semana_gestacion=data.semana_gestacion,
        ips_id=data.ips_id,
        tipo_profesional_id=data.tipo_profesional_id,
        tipo_consulta=data.tipo_consulta,
        observaciones=data.observaciones,
        created_by=staff_id,
    )
    control = await repository.create_control_prenatal(db, control)

    return ControlPrenatalResponse(
        id=control.id,
        numero_control=control.numero_control,
        fecha_control=control.fecha_control,
        semana_gestacion=control.semana_gestacion,
        trimestre=_calcular_trimestre(control.semana_gestacion),
        ips_id=control.ips_id,
        tipo_profesional_id=control.tipo_profesional_id,
        tipo_consulta=control.tipo_consulta,
        observaciones=control.observaciones,
        created_at=control.created_at,
    )


async def get_prenatal_controls(db: AsyncSession, gestante_id: str) -> list[ControlPrenatalResponse]:
    controles = await repository.get_controles_by_gestante(db, gestante_id)
    return [
        ControlPrenatalResponse(
            id=c.id,
            numero_control=c.numero_control,
            fecha_control=c.fecha_control,
            semana_gestacion=c.semana_gestacion,
            trimestre=_calcular_trimestre(c.semana_gestacion),
            ips_id=c.ips_id,
            tipo_profesional_id=c.tipo_profesional_id,
            tipo_consulta=c.tipo_consulta,
            observaciones=c.observaciones,
            created_at=c.created_at,
        )
        for c in controles
    ]


async def get_prenatal_control_by_id(db: AsyncSession, gestante_id: str, control_id: str) -> ControlPrenatalResponse:
    control = await repository.get_control_by_id(db, control_id)
    if control is None or control.gestante_id != gestante_id:
        raise NotFoundException("Control prenatal no encontrado")

    return ControlPrenatalResponse(
        id=control.id,
        numero_control=control.numero_control,
        fecha_control=control.fecha_control,
        semana_gestacion=control.semana_gestacion,
        trimestre=_calcular_trimestre(control.semana_gestacion),
        ips_id=control.ips_id,
        tipo_profesional_id=control.tipo_profesional_id,
        tipo_consulta=control.tipo_consulta,
        observaciones=control.observaciones,
        created_at=control.created_at,
    )


async def get_prenatal_adherence(db: AsyncSession, gestante: Gestante) -> AdherenciaResponse:
    semanas = _calcular_semanas(gestante.fecha_ultima_menstruacion)
    realizados = await repository.count_controles_by_gestante(db, gestante.id)

    if semanas <= 13:
        esperados = 2
    elif semanas <= 27:
        esperados = 4
    else:
        esperados = 4 + max(0, (semanas - 28) // 2)

    porcentaje = round((realizados / esperados) * 100, 1) if esperados > 0 else 0.0

    return AdherenciaResponse(
        controles_realizados=realizados,
        controles_esperados=esperados,
        porcentaje_adherencia=porcentaje,
        semana_gestacion_actual=semanas,
    )


# ---- Preguntas de Seguimiento ----

async def get_daily_questions(db: AsyncSession, gestante: Gestante, module_id: int | None = None) -> list[PreguntaSegResponse]:
    if module_id is None:
        if gestante.modulo_activo_id:
            module_id = gestante.modulo_activo_id
        else:
            semanas = _calcular_semanas(gestante.fecha_ultima_menstruacion)
            modulo = await repository.get_modulo_by_semana(db, semanas)
            module_id = modulo.id if modulo else None

    if module_id is None:
        return []

    preguntas = await repository.get_preguntas_by_modulo(db, module_id)
    result = []
    for p in preguntas:
        opciones = await repository.get_opciones_by_pregunta(db, p.id)
        result.append(PreguntaSegResponse(
            id=p.id,
            texto_pregunta=p.texto_pregunta,
            tipo_respuesta=p.tipo_respuesta,
            es_signo_alarma=p.es_signo_alarma,
            frecuencia=p.frecuencia,
            orden=p.orden,
            opciones=[OpcionPreguntaResponse.model_validate(o) for o in opciones],
        ))
    return result


async def submit_daily_answers(db: AsyncSession, gestante: Gestante, data: RespuestasRequest) -> list[RespuestaResponse]:
    semanas = data.semana_gestacion or _calcular_semanas(gestante.fecha_ultima_menstruacion)

    tipo_alerta = await repository.get_tipo_alerta_by_codigo(db, "seguimiento")
    prioridad_default = await repository.get_prioridad_by_codigo(db, "amarillo")

    modulo_codigo = None
    if gestante.modulo_activo_id:
        modulo = await repository.get_modulo_by_id(db, gestante.modulo_activo_id)
        modulo_codigo = modulo.codigo if modulo else None

    responses = []
    for item in data.respuestas:
        pregunta = await repository.get_pregunta_by_id(db, item.pregunta_id)
        if pregunta is None:
            raise NotFoundException(f"Pregunta {item.pregunta_id} no encontrada")

        respuesta = RespuestaSeguimiento(
            gestante_id=gestante.id,
            pregunta_id=item.pregunta_id,
            respuesta_texto=item.respuesta_texto,
            respuesta_booleana=item.respuesta_booleana,
            respuesta_numerica=item.respuesta_numerica,
            opcion_id=item.opcion_id,
            semana_gestacion=semanas,
        )
        respuesta = await repository.create_respuesta(db, respuesta)

        # Verificar si genera alerta
        genera_alarma = pregunta.es_signo_alarma
        if not genera_alarma and item.opcion_id:
            opcion = await repository.get_opcion_by_id(db, item.opcion_id)
            if opcion and opcion.es_alarma:
                genera_alarma = True

        if genera_alarma and tipo_alerta:
            prioridad = None
            if item.opcion_id:
                opcion = await repository.get_opcion_by_id(db, item.opcion_id)
                if opcion and opcion.prioridad_alerta_id:
                    prioridad = await repository.get_prioridad_by_id(db, opcion.prioridad_alerta_id)
            if prioridad is None and pregunta.prioridad_alerta_default_id:
                prioridad = await repository.get_prioridad_by_id(db, pregunta.prioridad_alerta_default_id)
            if prioridad is None:
                prioridad = prioridad_default

            if prioridad:
                alerta = Alerta(
                    gestante_id=gestante.id,
                    tipo_alerta_id=tipo_alerta.id,
                    prioridad_id=prioridad.id,
                    estado="activa",
                    modulo_origen=modulo_codigo,
                    descripcion=f"Respuesta de alarma: {pregunta.texto_pregunta}",
                )
                alerta = await repository.create_alerta(db, alerta)
                respuesta.alerta_id = alerta.id
                respuesta = await repository.update_respuesta(db, respuesta)

        responses.append(RespuestaResponse.model_validate(respuesta))

    return responses


async def get_daily_questions_history(db: AsyncSession, gestante_id: str) -> list[RespuestaResponse]:
    respuestas = await repository.get_respuestas_by_gestante(db, gestante_id)
    return [RespuestaResponse.model_validate(r) for r in respuestas]


# ---- Movimientos Fetales ----

async def register_fetal_movement(db: AsyncSession, gestante: Gestante, data: MovimientoFetalCreate) -> MovimientoFetalResponse:
    payload = json.dumps({
        "conteo": data.conteo,
        "duracion_minutos": data.duracion_minutos,
        "observaciones": data.observaciones,
    })

    sintoma = SintomaReportado(
        gestante_id=gestante.id,
        modulo_origen="MF",
        descripcion=payload,
        fecha_reporte=datetime.utcnow(),
    )
    sintoma = await repository.create_sintoma(db, sintoma)

    return MovimientoFetalResponse(
        id=sintoma.id,
        conteo=data.conteo,
        duracion_minutos=data.duracion_minutos,
        observaciones=data.observaciones,
        fecha_reporte=sintoma.fecha_reporte,
    )


async def get_fetal_movements(db: AsyncSession, gestante_id: str) -> list[MovimientoFetalResponse]:
    registros = await repository.get_movimientos_by_gestante(db, gestante_id)
    result = []
    for r in registros:
        try:
            payload = json.loads(r.descripcion)
        except (ValueError, TypeError):
            payload = {"conteo": 0, "duracion_minutos": None, "observaciones": None}
        result.append(MovimientoFetalResponse(
            id=r.id,
            conteo=payload.get("conteo", 0),
            duracion_minutos=payload.get("duracion_minutos"),
            observaciones=payload.get("observaciones"),
            fecha_reporte=r.fecha_reporte,
        ))
    return result


# ---- Plan de Parto ----

async def get_birth_plan(db: AsyncSession, gestante: Gestante) -> BirthPlanResponse:
    semanas = _calcular_semanas(gestante.fecha_ultima_menstruacion)
    return BirthPlanResponse(
        semana_gestacion=semanas,
        fecha_probable_parto=gestante.fecha_probable_parto,
        recomendaciones=[
            "Identifique y tenga el contacto de su IPS de referencia para el parto",
            "Prepare los documentos necesarios: carnet de controles y documento de identidad",
            "Conozca las señales de inicio del trabajo de parto",
            "Tenga lista la bolsa de maternidad desde la semana 36",
            "Informe a su red de apoyo (familia, acompañante) sobre el plan",
            "Conozca las rutas de acceso a la IPS en caso de emergencia",
        ],
    )


# ---- IPS más cercana ----

async def get_nearest_ips(db: AsyncSession) -> IpsCercanaResponse:
    ips_list = await repository.get_ips_activas(db)
    if not ips_list:
        raise NotFoundException("No se encontraron IPS disponibles")

    ips = ips_list[0]
    return IpsCercanaResponse(
        id=ips.id,
        nombre=ips.nombre,
        nivel=ips.nivel,
        mensaje="IPS disponible para atención. Comuníquese con su IPS de referencia para mayor información.",
    )


# ---- Checklist Items ----

async def get_checklist_items(
    db: AsyncSession, gestante: Gestante
) -> list[ChecklistItemResponse]:
    if not gestante.modulo_activo_id:
        return []
    items = await repository.get_checklist_items_by_modulo(db, gestante.modulo_activo_id)

    items_response = []
    for item in items:
        progreso = await repository.get_checklist_gestante(db, gestante.id, item.id)
        items_response.append(ChecklistItemResponse(
            id=item.id,
            texto=item.texto,
            modulo_id=item.modulo_id,
            semana_eg=item.semana_eg,
            orden=item.orden,
            completado=progreso.completado if progreso else False,
            fecha_completado=progreso.fecha_completado if progreso else None,
        ))

    return items_response

async def get_checklist_items_by_staff(
        db: AsyncSession, gestante_id: str
) -> list[ChecklistItemResponse]:

    gestante = await repository.get_gestante_by_id(db, gestante_id=gestante_id)

    if gestante is None:
        raise NotFoundException("No se encontró a ninguna gestante con ese código.")

    if not gestante.modulo_activo_id:
        return []
    items = await repository.get_checklist_items_by_modulo(db, gestante.modulo_activo_id)

    items_response = []
    for item in items:
        progreso = await repository.get_checklist_gestante(db, gestante.id, item.id)
        items_response.append(ChecklistItemResponse(
            id=item.id,
            texto=item.texto,
            modulo_id=item.modulo_id,
            semana_eg=item.semana_eg,
            orden=item.orden,
            completado=progreso.completado if progreso else False,
            fecha_completado=progreso.fecha_completado if progreso else None,
        ))

    return items_response
