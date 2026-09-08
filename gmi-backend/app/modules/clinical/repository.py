import json
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.database.models.catalogos import (
    CatEspecialidad,
    CatIps,
    CatMicronutriente,
    CatModuloClinico,
    CatPrioridadAlerta,
    CatTipoAlerta,
    CatTipoEcografia,
    CatTipoExamen,
    CatVacuna,
)
from app.database.models.complementarios import (
    RemisionInterdisciplinaria,
    SuministroMicronutriente,
    Vacunacion,
)
from app.database.models.control import ControlPrenatal, SignosVitales
from app.database.models.examenes import Ecografia, ExamenLaboratorio
from app.database.models.gestante import Gestante
from app.database.models.riesgo import Alerta, ClasificacionRiesgo
from app.database.models.educacion import ChecklistItem, ChecklistGestante
from app.database.models.seguimiento import (
    OpcionPreguntaSeguimiento,
    PreguntaSeguimiento,
    RespuestaSeguimiento,
    SintomaReportado,
)


# ---- Gestante ----

async def get_gestante_by_id(db: AsyncSession, gestante_id: str) -> Gestante | None:
    result = await db.execute(select(Gestante).where(Gestante.id == gestante_id))
    return result.scalars().one_or_none()


# ---- Módulo Clínico ----

async def get_modulo_by_id(db: AsyncSession, modulo_id: int) -> CatModuloClinico | None:
    result = await db.execute(select(CatModuloClinico).where(CatModuloClinico.id == modulo_id))
    return result.scalars().one_or_none()


async def get_modulo_by_semana(db: AsyncSession, semana: int) -> CatModuloClinico | None:
    result = await db.execute(
        select(CatModuloClinico)
        .where(CatModuloClinico.semana_eg_inicio <= semana)
        .where(
            (CatModuloClinico.semana_eg_fin >= semana) |
            (CatModuloClinico.semana_eg_fin.is_(None))
        )
        .where(CatModuloClinico.activo == True)
        .limit(1)
    )
    return result.scalars().one_or_none()


# ---- Controles Prenatales ----

async def create_control_prenatal(db: AsyncSession, control: ControlPrenatal) -> ControlPrenatal:
    db.add(control)
    await db.flush()
    await db.refresh(control)
    return control


async def get_controles_by_gestante(db: AsyncSession, gestante_id: str) -> list[ControlPrenatal]:
    result = await db.execute(
        select(ControlPrenatal)
        .where(ControlPrenatal.gestante_id == gestante_id)
        .order_by(ControlPrenatal.fecha_control.desc())
    )
    return result.scalars().all()


async def get_control_by_id(db: AsyncSession, control_id: str) -> ControlPrenatal | None:
    result = await db.execute(select(ControlPrenatal).where(ControlPrenatal.id == control_id))
    return result.scalars().one_or_none()


async def count_controles_by_gestante(db: AsyncSession, gestante_id: str) -> int:
    result = await db.execute(
        select(func.count()).select_from(ControlPrenatal).where(ControlPrenatal.gestante_id == gestante_id)
    )
    return result.scalar_one()


# ---- Signos Vitales ----

async def create_signos_vitales(db: AsyncSession, sv: SignosVitales) -> SignosVitales:
    db.add(sv)
    await db.flush()
    await db.refresh(sv)
    return sv


async def get_vitales_by_gestante(db: AsyncSession, gestante_id: str) -> list[tuple]:
    result = await db.execute(
        select(SignosVitales, ControlPrenatal.fecha_control)
        .join(ControlPrenatal, SignosVitales.control_prenatal_id == ControlPrenatal.id)
        .where(ControlPrenatal.gestante_id == gestante_id)
        .order_by(ControlPrenatal.fecha_control.desc())
    )
    return result.all()


async def get_vitales_by_control_id(db: AsyncSession, control_id: str) -> SignosVitales | None:
    result = await db.execute(
        select(SignosVitales).where(SignosVitales.control_prenatal_id == control_id)
    )
    return result.scalars().one_or_none()


# ---- Síntomas ----

async def create_sintoma(db: AsyncSession, sintoma: SintomaReportado) -> SintomaReportado:
    db.add(sintoma)
    await db.flush()
    await db.refresh(sintoma)
    return sintoma


async def get_sintomas_by_gestante(db: AsyncSession, gestante_id: str) -> list[SintomaReportado]:
    result = await db.execute(
        select(SintomaReportado)
        .where(SintomaReportado.gestante_id == gestante_id)
        .where(SintomaReportado.modulo_origen != "MF")
        .order_by(SintomaReportado.fecha_reporte.desc())
    )
    return result.scalars().all()


async def get_movimientos_by_gestante(db: AsyncSession, gestante_id: str) -> list[SintomaReportado]:
    result = await db.execute(
        select(SintomaReportado)
        .where(SintomaReportado.gestante_id == gestante_id)
        .where(SintomaReportado.modulo_origen == "MF")
        .order_by(SintomaReportado.fecha_reporte.desc())
    )
    return result.scalars().all()


# ---- Clasificación de Riesgo ----

async def get_riesgo_actual(db: AsyncSession, gestante_id: str) -> ClasificacionRiesgo | None:
    result = await db.execute(
        select(ClasificacionRiesgo)
        .where(ClasificacionRiesgo.gestante_id == gestante_id)
        .order_by(ClasificacionRiesgo.fecha_evaluacion.desc())
        .limit(1)
    )
    return result.scalars().one_or_none()


async def get_riesgos_by_gestante(db: AsyncSession, gestante_id: str) -> list[ClasificacionRiesgo]:
    result = await db.execute(
        select(ClasificacionRiesgo)
        .where(ClasificacionRiesgo.gestante_id == gestante_id)
        .order_by(ClasificacionRiesgo.fecha_evaluacion.desc())
    )
    return result.scalars().all()


# ---- Exámenes de Laboratorio ----

async def create_examen(db: AsyncSession, examen: ExamenLaboratorio) -> ExamenLaboratorio:
    db.add(examen)
    await db.flush()
    await db.refresh(examen)
    return examen


async def get_examenes_by_gestante(db: AsyncSession, gestante_id: str) -> list[ExamenLaboratorio]:
    result = await db.execute(
        select(ExamenLaboratorio)
        .where(ExamenLaboratorio.gestante_id == gestante_id)
        .order_by(ExamenLaboratorio.fecha_toma.desc())
    )
    return result.scalars().all()


async def get_examen_by_id(db: AsyncSession, examen_id: str) -> ExamenLaboratorio | None:
    result = await db.execute(select(ExamenLaboratorio).where(ExamenLaboratorio.id == examen_id))
    return result.scalars().one_or_none()


async def get_tipo_examen_by_id(db: AsyncSession, tipo_id: int) -> CatTipoExamen | None:
    result = await db.execute(select(CatTipoExamen).where(CatTipoExamen.id == tipo_id))
    return result.scalars().one_or_none()


# ---- Ecografías ----

async def create_ecografia(db: AsyncSession, eco: Ecografia) -> Ecografia:
    db.add(eco)
    await db.flush()
    await db.refresh(eco)
    return eco


async def get_ecografias_by_gestante(db: AsyncSession, gestante_id: str) -> list[Ecografia]:
    result = await db.execute(
        select(Ecografia)
        .where(Ecografia.gestante_id == gestante_id)
        .order_by(Ecografia.fecha.desc())
    )
    return result.scalars().all()


async def get_ecografia_by_id(db: AsyncSession, eco_id: str) -> Ecografia | None:
    result = await db.execute(select(Ecografia).where(Ecografia.id == eco_id))
    return result.scalars().one_or_none()


async def get_tipo_ecografia_by_id(db: AsyncSession, tipo_id: int) -> CatTipoEcografia | None:
    result = await db.execute(select(CatTipoEcografia).where(CatTipoEcografia.id == tipo_id))
    return result.scalars().one_or_none()


# ---- Vacunación ----

async def create_vacunacion(db: AsyncSession, vacuna: Vacunacion) -> Vacunacion:
    db.add(vacuna)
    await db.flush()
    await db.refresh(vacuna)
    return vacuna


async def get_vacunacion_by_gestante(db: AsyncSession, gestante_id: str) -> list[Vacunacion]:
    result = await db.execute(
        select(Vacunacion)
        .where(Vacunacion.gestante_id == gestante_id)
        .order_by(Vacunacion.fecha_aplicacion.desc())
    )
    return result.scalars().all()


async def get_vacuna_cat_by_id(db: AsyncSession, vacuna_id: int) -> CatVacuna | None:
    result = await db.execute(select(CatVacuna).where(CatVacuna.id == vacuna_id))
    return result.scalars().one_or_none()


# ---- Micronutrientes ----

async def create_micronutriente(db: AsyncSession, m: SuministroMicronutriente) -> SuministroMicronutriente:
    db.add(m)
    await db.flush()
    await db.refresh(m)
    return m


async def get_micronutrientes_by_gestante(db: AsyncSession, gestante_id: str) -> list[SuministroMicronutriente]:
    result = await db.execute(
        select(SuministroMicronutriente)
        .where(SuministroMicronutriente.gestante_id == gestante_id)
        .order_by(SuministroMicronutriente.created_at.desc())
    )
    return result.scalars().all()


async def get_micronutriente_cat_by_id(db: AsyncSession, m_id: int) -> CatMicronutriente | None:
    result = await db.execute(select(CatMicronutriente).where(CatMicronutriente.id == m_id))
    return result.scalars().one_or_none()


# ---- Remisiones ----

async def create_remision(db: AsyncSession, r: RemisionInterdisciplinaria) -> RemisionInterdisciplinaria:
    db.add(r)
    await db.flush()
    await db.refresh(r)
    return r


async def get_remisiones_by_gestante(db: AsyncSession, gestante_id: str) -> list[RemisionInterdisciplinaria]:
    result = await db.execute(
        select(RemisionInterdisciplinaria)
        .where(RemisionInterdisciplinaria.gestante_id == gestante_id)
        .order_by(RemisionInterdisciplinaria.fecha_remision.desc())
    )
    return result.scalars().all()


async def get_remision_by_id(db: AsyncSession, r_id: str) -> RemisionInterdisciplinaria | None:
    result = await db.execute(
        select(RemisionInterdisciplinaria).where(RemisionInterdisciplinaria.id == r_id)
    )
    return result.scalars().one_or_none()


async def update_remision(db: AsyncSession, r: RemisionInterdisciplinaria) -> RemisionInterdisciplinaria:
    db.add(r)
    await db.flush()
    return r


async def get_especialidad_by_id(db: AsyncSession, e_id: int) -> CatEspecialidad | None:
    result = await db.execute(select(CatEspecialidad).where(CatEspecialidad.id == e_id))
    return result.scalars().one_or_none()


# ---- Preguntas de Seguimiento ----

async def get_preguntas_by_modulo(db: AsyncSession, modulo_id: int) -> list[PreguntaSeguimiento]:
    result = await db.execute(
        select(PreguntaSeguimiento)
        .where(PreguntaSeguimiento.modulo_id == modulo_id)
        .where(PreguntaSeguimiento.activo == True)
        .order_by(PreguntaSeguimiento.orden)
    )
    return result.scalars().all()


async def get_opciones_by_pregunta(db: AsyncSession, pregunta_id: int) -> list[OpcionPreguntaSeguimiento]:
    result = await db.execute(
        select(OpcionPreguntaSeguimiento)
        .where(OpcionPreguntaSeguimiento.pregunta_id == pregunta_id)
        .order_by(OpcionPreguntaSeguimiento.orden)
    )
    return result.scalars().all()


async def get_pregunta_by_id(db: AsyncSession, pregunta_id: int) -> PreguntaSeguimiento | None:
    result = await db.execute(
        select(PreguntaSeguimiento).where(PreguntaSeguimiento.id == pregunta_id)
    )
    return result.scalars().one_or_none()


async def get_opcion_by_id(db: AsyncSession, opcion_id: int) -> OpcionPreguntaSeguimiento | None:
    result = await db.execute(
        select(OpcionPreguntaSeguimiento).where(OpcionPreguntaSeguimiento.id == opcion_id)
    )
    return result.scalars().one_or_none()


async def create_respuesta(db: AsyncSession, r: RespuestaSeguimiento) -> RespuestaSeguimiento:
    db.add(r)
    await db.flush()
    await db.refresh(r)
    return r


async def update_respuesta(db: AsyncSession, r: RespuestaSeguimiento) -> RespuestaSeguimiento:
    db.add(r)
    await db.flush()
    return r


async def get_respuestas_by_gestante(db: AsyncSession, gestante_id: str) -> list[RespuestaSeguimiento]:
    result = await db.execute(
        select(RespuestaSeguimiento)
        .where(RespuestaSeguimiento.gestante_id == gestante_id)
        .order_by(RespuestaSeguimiento.created_at.desc())
    )
    return result.scalars().all()


# ---- Alertas ----

async def count_alertas_activas(db: AsyncSession, gestante_id: str) -> int:
    result = await db.execute(
        select(func.count()).select_from(Alerta)
        .where(Alerta.gestante_id == gestante_id)
        .where(Alerta.estado == "activa")
    )
    return result.scalar_one()


async def create_alerta(db: AsyncSession, alerta: Alerta) -> Alerta:
    db.add(alerta)
    await db.flush()
    await db.refresh(alerta)
    return alerta


async def get_tipo_alerta_by_codigo(db: AsyncSession, codigo: str) -> CatTipoAlerta | None:
    result = await db.execute(select(CatTipoAlerta).where(CatTipoAlerta.codigo == codigo))
    return result.scalars().one_or_none()


async def get_prioridad_by_id(db: AsyncSession, prioridad_id: int) -> CatPrioridadAlerta | None:
    result = await db.execute(select(CatPrioridadAlerta).where(CatPrioridadAlerta.id == prioridad_id))
    return result.scalars().one_or_none()


async def get_prioridad_by_codigo(db: AsyncSession, codigo: str) -> CatPrioridadAlerta | None:
    result = await db.execute(select(CatPrioridadAlerta).where(CatPrioridadAlerta.codigo == codigo))
    return result.scalars().one_or_none()


# ---- IPS ----

async def get_ips_activas(db: AsyncSession) -> list[CatIps]:
    result = await db.execute(
        select(CatIps).where(CatIps.activo == True).order_by(CatIps.nivel)
    )
    return result.scalars().all()


# ---- Checklist Items ----

async def get_checklist_items_by_modulo(
    db: AsyncSession, modulo_id: int
) -> list[ChecklistItem]:
    result = await db.execute(
        select(ChecklistItem)
        .where(ChecklistItem.modulo_id == modulo_id, ChecklistItem.activo == True)
        .order_by(ChecklistItem.orden.asc().nulls_last(), ChecklistItem.texto)
    )
    return result.scalars().all()

async def get_checklist_gestante(db: AsyncSession, gestante_id: str, item_id: int) -> ChecklistGestante | None:
    result = await db.execute(
        select(ChecklistGestante).where(ChecklistGestante.gestante_id == gestante_id, ChecklistGestante.checklist_item_id == item_id)
    )
    return result.scalars().one_or_none()

