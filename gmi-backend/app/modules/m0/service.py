from datetime import date, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_security_answer
from app.core.exceptions import (
    NotFoundException,
    ValidationException,
)
from app.database.models.gestante import Gestante, PreguntaSeguridad, ConsentimientoInformado, HistorialModulo
from app.database.models.perfil import PerfilClinico, FormulaObstetrica, AntecedentePatologico
from app.modules.m0 import repository
from app.modules.m0.schemas import (
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


# ---- Registro ----

async def register_gestante(db: AsyncSession, data, staff_id: str) -> GestanteRegisterResponse:
    # Generar código GMI
    anio = data.anio_ingreso
    last_code = await repository.get_last_codigo_gmi(db, anio)

    if last_code:
        last_num = int(last_code.split("-")[-1])
        new_num = last_num + 1
    else:
        new_num = 1

    codigo_gmi = f"GMI-{anio}-{new_num:04d}"

    # Calcular módulo activo
    semanas = _calcular_semanas_gestacion(data.fecha_ultima_menstruacion)
    modulo = await repository.get_modulo_by_semana(db, semanas)

    # Crear gestante
    gestante = Gestante(
        codigo_gmi=codigo_gmi,
        fecha_nacimiento=data.fecha_nacimiento,
        fecha_ultima_menstruacion=data.fecha_ultima_menstruacion,
        fecha_probable_parto=data.fecha_probable_parto,
        anio_ingreso=data.anio_ingreso,
        tipo_regimen=data.tipo_regimen,
        nacionalidad_id=data.nacionalidad_id,
        eapb_id=data.eapb_id,
        pertenencia_etnica_id=data.pertenencia_etnica_id,
        grupo_poblacional_id=data.grupo_poblacional_id,
        fecha_ingreso_cpn=data.fecha_ingreso_cpn,
        semanas_eg_ingreso=data.semanas_eg_ingreso,
        modulo_activo_id=modulo.id if modulo else None,
        created_by=staff_id,
    )
    gestante = await repository.create_gestante(db, gestante)

    # Crear pregunta de seguridad
    pregunta = PreguntaSeguridad(
        gestante_id=gestante.id,
        pregunta=data.pregunta_seguridad,
        hash_respuesta=hash_security_answer(data.respuesta_seguridad),
    )
    await repository.create_pregunta_seguridad(db, pregunta)

    # Crear perfil clínico vacío
    perfil = PerfilClinico(gestante_id=gestante.id)
    await repository.create_perfil_clinico(db, perfil)

    # Crear fórmula obstétrica vacía
    formula = FormulaObstetrica(gestante_id=gestante.id)
    await repository.create_formula_obstetrica(db, formula)

    return GestanteRegisterResponse(codigo_gmi=codigo_gmi)


# ---- Perfil Clínico ----

async def get_clinical_profile(db: AsyncSession, gestante_id: str) -> ClinicalProfileResponse:
    perfil = await repository.get_perfil_by_gestante_id(db, gestante_id)
    if perfil is None:
        raise NotFoundException("Perfil clínico no encontrado")

    return ClinicalProfileResponse(
        enfermedades_cronicas=perfil.enfermedades_cronicas,
        alergias=perfil.alergias,
        habitos=perfil.habitos,
        condiciones_riesgo=perfil.condiciones_riesgo,
    )


async def update_clinical_profile(db: AsyncSession, gestante_id: str, data: ClinicalProfileUpdate) -> ClinicalProfileResponse:
    perfil = await repository.get_perfil_by_gestante_id(db, gestante_id)
    if perfil is None:
        raise NotFoundException("Perfil clínico no encontrado")

    if data.enfermedades_cronicas is not None:
        perfil.enfermedades_cronicas = data.enfermedades_cronicas
    if data.alergias is not None:
        perfil.alergias = data.alergias
    if data.habitos is not None:
        perfil.habitos = data.habitos
    if data.condiciones_riesgo is not None:
        perfil.condiciones_riesgo = data.condiciones_riesgo

    perfil = await repository.update_perfil_clinico(db, perfil)

    return ClinicalProfileResponse(
        enfermedades_cronicas=perfil.enfermedades_cronicas,
        alergias=perfil.alergias,
        habitos=perfil.habitos,
        condiciones_riesgo=perfil.condiciones_riesgo,
    )


# ---- Fórmula Obstétrica ----

async def get_obstetric_formula(db: AsyncSession, gestante_id: str) -> ObstetricFormulaResponse:
    formula = await repository.get_formula_by_gestante_id(db, gestante_id)
    if formula is None:
        raise NotFoundException("Fórmula obstétrica no encontrada")

    return ObstetricFormulaResponse(
        gestaciones=formula.gestaciones,
        partos=formula.partos,
        cesareas=formula.cesareas,
        abortos=formula.abortos,
        vivos=formula.vivos,
        mortinatos=formula.mortinatos,
    )


async def update_obstetric_formula(db: AsyncSession, gestante_id: str, data: ObstetricFormulaUpdate) -> ObstetricFormulaResponse:
    formula = await repository.get_formula_by_gestante_id(db, gestante_id)
    if formula is None:
        raise NotFoundException("Fórmula obstétrica no encontrada")

    if data.gestaciones < data.partos + data.cesareas + data.abortos:
        raise ValidationException("Gestaciones no puede ser menor que la suma de partos + cesáreas + abortos")

    formula.gestaciones = data.gestaciones
    formula.partos = data.partos
    formula.cesareas = data.cesareas
    formula.abortos = data.abortos
    formula.vivos = data.vivos
    formula.mortinatos = data.mortinatos

    formula = await repository.update_formula_obstetrica(db, formula)

    return ObstetricFormulaResponse(
        gestaciones=formula.gestaciones,
        partos=formula.partos,
        cesareas=formula.cesareas,
        abortos=formula.abortos,
        vivos=formula.vivos,
        mortinatos=formula.mortinatos,
    )


# ---- Antecedentes Patológicos ----

async def get_pathological_history(db: AsyncSession, gestante_id: str) -> list[PathologicalHistoryResponse]:
    antecedentes = await repository.get_antecedentes_by_gestante_id(db, gestante_id)
    return [
        PathologicalHistoryResponse(
            id=a.id,
            tipo_condicion=a.tipo_condicion,
            descripcion=a.descripcion,
            fecha_diagnostico=a.fecha_diagnostico,
            controlada=a.controlada,
            tratamiento_actual=a.tratamiento_actual,
        )
        for a in antecedentes
    ]


async def create_pathological_history(db: AsyncSession, gestante_id: str, data: PathologicalHistoryCreate) -> PathologicalHistoryResponse:
    antecedente = AntecedentePatologico(
        gestante_id=gestante_id,
        tipo_condicion=data.tipo_condicion,
        descripcion=data.descripcion,
        fecha_diagnostico=data.fecha_diagnostico,
        controlada=data.controlada,
        tratamiento_actual=data.tratamiento_actual,
    )
    antecedente = await repository.create_antecedente(db, antecedente)

    return PathologicalHistoryResponse(
        id=antecedente.id,
        tipo_condicion=antecedente.tipo_condicion,
        descripcion=antecedente.descripcion,
        fecha_diagnostico=antecedente.fecha_diagnostico,
        controlada=antecedente.controlada,
        tratamiento_actual=antecedente.tratamiento_actual,
    )


async def update_pathological_history(db: AsyncSession, gestante_id: str, antecedente_id: str, data: PathologicalHistoryUpdate) -> PathologicalHistoryResponse:
    antecedente = await repository.get_antecedente_by_id(db, antecedente_id)
    if antecedente is None or antecedente.gestante_id != gestante_id:
        raise NotFoundException("Antecedente no encontrado")

    if data.tipo_condicion is not None:
        antecedente.tipo_condicion = data.tipo_condicion
    if data.descripcion is not None:
        antecedente.descripcion = data.descripcion
    if data.fecha_diagnostico is not None:
        antecedente.fecha_diagnostico = data.fecha_diagnostico
    if data.controlada is not None:
        antecedente.controlada = data.controlada
    if data.tratamiento_actual is not None:
        antecedente.tratamiento_actual = data.tratamiento_actual

    antecedente = await repository.update_antecedente(db, antecedente)

    return PathologicalHistoryResponse(
        id=antecedente.id,
        tipo_condicion=antecedente.tipo_condicion,
        descripcion=antecedente.descripcion,
        fecha_diagnostico=antecedente.fecha_diagnostico,
        controlada=antecedente.controlada,
        tratamiento_actual=antecedente.tratamiento_actual,
    )


async def delete_pathological_history(db: AsyncSession, gestante_id: str, antecedente_id: str) -> None:
    antecedente = await repository.get_antecedente_by_id(db, antecedente_id)
    if antecedente is None or antecedente.gestante_id != gestante_id:
        raise NotFoundException("Antecedente no encontrado")

    await repository.delete_antecedente(db, antecedente)


# ---- Consentimiento Informado ----

async def register_consent(db: AsyncSession, gestante_id: str, data: ConsentRequest) -> ConsentResponse:
    consentimiento = ConsentimientoInformado(
        gestante_id=gestante_id,
        hash_consentimiento=data.hash_consentimiento,
        version=data.version,
        estado="ACEPTADO",
        fecha_aceptacion=datetime.utcnow(),
    )
    consentimiento = await repository.create_consentimiento(db, consentimiento)

    return ConsentResponse(
        id=consentimiento.id,
        version=consentimiento.version,
        estado=consentimiento.estado,
        fecha_aceptacion=str(consentimiento.fecha_aceptacion),
    )


async def get_consent(db: AsyncSession, gestante_id: str) -> ConsentResponse:
    consentimiento = await repository.get_consentimiento_vigente(db, gestante_id)
    if consentimiento is None:
        raise NotFoundException("No hay consentimiento informado vigente")

    return ConsentResponse(
        id=consentimiento.id,
        version=consentimiento.version,
        estado=consentimiento.estado,
        fecha_aceptacion=str(consentimiento.fecha_aceptacion),
    )


async def revoke_consent(db: AsyncSession, gestante_id: str) -> dict:
    consentimiento = await repository.get_consentimiento_vigente(db, gestante_id)
    if consentimiento is None:
        raise NotFoundException("No hay consentimiento informado vigente para revocar")

    consentimiento.estado = "REVOCADO"
    db.add(consentimiento)
    await db.flush()

    return {"detail": "Consentimiento informado revocado exitosamente"}


# ---- Edad Gestacional ----

async def get_gestational_age(db: AsyncSession, gestante_id: str) -> GestationalAgeResponse:
    gestante = await repository.get_gestante_by_id(db, gestante_id)
    if gestante is None:
        raise NotFoundException("Gestante no encontrada")

    semanas = _calcular_semanas_gestacion(gestante.fecha_ultima_menstruacion)
    dias_restantes = _calcular_dias_restantes(gestante.fecha_ultima_menstruacion)

    return GestationalAgeResponse(
        semanas=semanas,
        dias=dias_restantes,
        descripcion=f"{semanas} semanas y {dias_restantes} días de gestación",
        fecha_ultima_menstruacion=gestante.fecha_ultima_menstruacion,
        fecha_probable_parto=gestante.fecha_probable_parto,
    )


# ---- Módulo Activo ----

async def get_active_module(db: AsyncSession, gestante_id: str) -> ActiveModuleResponse:
    gestante = await repository.get_gestante_by_id(db, gestante_id)
    if gestante is None:
        raise NotFoundException("Gestante no encontrada")

    semanas = _calcular_semanas_gestacion(gestante.fecha_ultima_menstruacion)
    modulo = await repository.get_modulo_by_semana(db, semanas)

    if modulo is None:
        raise NotFoundException("No se pudo determinar el módulo activo")

    # Actualizar módulo activo si cambió
    if gestante.modulo_activo_id != modulo.id:
        old_modulo_id = gestante.modulo_activo_id
        gestante.modulo_activo_id = modulo.id
        await repository.update_gestante(db, gestante)

        # Registrar cambio en historial
        historial = HistorialModulo(
            gestante_id=gestante.id,
            modulo_anterior_id=old_modulo_id,
            modulo_nuevo_id=modulo.id,
            motivo="Avance de edad gestacional",
            origen="sistema",
        )
        await repository.create_historial_modulo(db, historial)

    return ActiveModuleResponse(
        modulo_id=modulo.id,
        codigo=modulo.codigo,
        nombre=modulo.nombre,
        semana_gestacion_actual=semanas,
    )


# ---- Historial de Módulo ----

async def get_module_history(db: AsyncSession, gestante_id: str) -> list[ModuleHistoryResponse]:
    historiales = await repository.get_historial_by_gestante_id(db, gestante_id)

    result = []
    for h in historiales:
        mod_anterior = await repository.get_modulo_by_id(db, h.modulo_anterior_id) if h.modulo_anterior_id else None
        mod_nuevo = await repository.get_modulo_by_id(db, h.modulo_nuevo_id)

        result.append(ModuleHistoryResponse(
            id=h.id,
            modulo_anterior=mod_anterior.codigo if mod_anterior else None,
            modulo_nuevo=mod_nuevo.codigo if mod_nuevo else "Desconocido",
            motivo=h.motivo,
            origen=h.origen,
            created_at=str(h.created_at),
        ))

    return result


# ---- Pregunta de Seguridad ----

async def update_security_question(db: AsyncSession, gestante_id: str, data: SecurityQuestionUpdate) -> dict:
    pregunta = await repository.get_pregunta_by_gestante_id(db, gestante_id)
    if pregunta is None:
        raise NotFoundException("Pregunta de seguridad no encontrada")

    pregunta.pregunta = data.pregunta
    pregunta.hash_respuesta = hash_security_answer(data.respuesta)
    await repository.update_pregunta_seguridad(db, pregunta)

    return {"detail": "Pregunta de seguridad actualizada exitosamente"}


# ---- Eliminar Cuenta ----

async def delete_account(db: AsyncSession, gestante_id: str) -> dict:
    gestante = await repository.get_gestante_by_id(db, gestante_id)
    if gestante is None:
        raise NotFoundException("Gestante no encontrada")

    gestante.activa = False
    await repository.update_gestante(db, gestante)

    return {"detail": "Cuenta desactivada exitosamente. Los datos serán eliminados según la política de retención."}


# ---- Funciones internas ----

def _calcular_semanas_gestacion(fum: date) -> int:
    hoy = date.today()
    dias = (hoy - fum).days
    return dias // 7


def _calcular_dias_restantes(fum: date) -> int:
    hoy = date.today()
    dias = (hoy - fum).days
    return dias % 7