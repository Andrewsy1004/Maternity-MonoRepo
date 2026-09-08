"""
Processor: orquesta el pipeline completo de carga.
  loader → validator → transformer → repository (escritura en BD)

Fixes aplicados:
  1. Validación de IDs de catálogo antes del INSERT (evita NOT NULL violations).
  2. Savepoints por fila (begin_nested) para que un error en una fila no
     invalide toda la sesión AsyncSQLAlchemy.
"""

from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.modules.admin.excel.loader import load_all_sheets
from app.modules.admin.excel.validator import (
    validate_gestante, validate_control, validate_examen,
    validate_ecografia, validate_vacuna, validate_remision, validate_desenlace,
)
from app.modules.admin.excel.transformer import (
    transform_gestante, transform_control, transform_examen,
    transform_ecografia, transform_vacuna, transform_remision, transform_desenlace,
)
from app.modules.admin import repository as repo
from app.database.models.soporte import CargaExcel

from app.database.models.catalogos import (
    CatEspecialidad, CatMetodoAnticonceptivo, CatNacionalidad, CatEapb, CatPertenenciaEtnica, CatGrupoPoblacional, CatIps, CatTipoEcografia, CatTipoProfesional, 
    CatTipoExamen, CatVacuna, CatTipoEcografia
)




class ProcessResult:
    def __init__(self):
        self.nuevas       = 0
        self.actualizadas = 0
        self.errores      = 0
        self.detalles: list[dict] = []

    @property
    def total(self):
        return self.nuevas + self.actualizadas + self.errores

    def add_error(self, hoja: str, fila: int, mensaje: str):
        self.errores += 1
        self.detalles.append({
            "hoja": hoja, "fila": fila,
            "estado": "error", "mensaje": mensaje,
        })

    def add_ok(self, hoja: str, fila: int, accion: str):
        if accion == "nueva":
            self.nuevas += 1
        else:
            self.actualizadas += 1
        self.detalles.append({
            "hoja": hoja, "fila": fila,
            "estado": "ok", "mensaje": accion,
        })


# Carga de catálogos en memoria

async def _resolve_catalogs(db: AsyncSession) -> dict:
    """
    Carga todos los catálogos en un dict { nombre -> { nombre_lower: id } }
    para resolver IDs sin hacer queries por cada fila.
    """
    from app.database.models.catalogos import (
        CatNacionalidad, CatEapb, CatPertenenciaEtnica, CatGrupoPoblacional,
        CatIps, CatTipoProfesional, CatTipoExamen, CatTipoEcografia,
        CatVacuna, CatEspecialidad, CatEstadoNutricional,
        CatMetodoAnticonceptivo,
    )

    async def load(model):
        result = await db.execute(select(model))
        return {row.nombre.lower(): row.id for row in result.scalars().all()}

    return {
        "nacionalidad":       await load(CatNacionalidad),
        "eapb":               await load(CatEapb),
        "pertenencia_etnica": await load(CatPertenenciaEtnica),
        "grupo_poblacional":  await load(CatGrupoPoblacional),
        "ips":                await load(CatIps),
        "tipo_profesional":   await load(CatTipoProfesional),
        "tipo_examen":        await load(CatTipoExamen),
        "tipo_ecografia":     await load(CatTipoEcografia),
        "vacuna":             await load(CatVacuna),
        "especialidad":       await load(CatEspecialidad),
        "estado_nutricional": await load(CatEstadoNutricional),
        "metodo_anti":        await load(CatMetodoAnticonceptivo),
    }


def _cat_id(catalogs: dict, cat: str, val: str | None) -> int | None:
    """Resuelve nombre → id en el catálogo dado. Retorna None si no existe."""
    if not val:
        return None
    return catalogs[cat].get(val.lower())


def _required_cat_id(
    catalogs: dict,
    cat: str,
    val: str | None,
    campo: str,
    sheet: str,
) -> tuple[int | None, str | None]:
    """
    Igual que _cat_id pero también retorna un mensaje de error si el valor
    no se resuelve. Usar cuando el campo es NOT NULL en BD.
    Retorna: (id_resuelto, mensaje_error_o_None)
    """
    resolved = _cat_id(catalogs, cat, val)
    if val and resolved is None:
        return None, f"[{sheet}] Valor '{val}' no encontrado en catálogo '{campo}'"
    if not val:
        return None, f"[{sheet}] Campo obligatorio '{campo}' está vacío"
    return resolved, None



async def _get_or_create_cat(
    db: AsyncSession,
    model,
    nombre: str | None,
    catalogs: dict,
    cat_key: str,
) -> int | None:
    """Si el valor existe en catálogo retorna su ID, si no lo crea automáticamente."""
    if not nombre:
        return None

    nombre_lower = nombre.lower()

    # Ya existe en memoria
    if nombre_lower in catalogs[cat_key]:
        return catalogs[cat_key][nombre_lower]

    # No existe → crear en BD
    nuevo = model(nombre=nombre, activo=True)
    db.add(nuevo)
    await db.flush()
    await db.refresh(nuevo)

    # Actualizar cache en memoria para las siguientes filas
    catalogs[cat_key][nombre_lower] = nuevo.id
    return nuevo.id



# Procesamiento por hoja

async def _process_gestantes(
    rows: list[dict],
    db: AsyncSession,
    catalogs: dict,
    result: ProcessResult,
):
    for idx, raw in enumerate(rows, start=4):
        errors = validate_gestante(raw)
        if errors:
            result.add_error("gestantes", idx, " | ".join(errors))
            continue
        try:
            t       = transform_gestante(raw)
            formula = t.pop("_formula")
            t.pop("_hemoclasificacion", None)

            # Catálogos opcionales para gestante (pueden ser None)
            # t["nacionalidad_id"]       = _cat_id(catalogs, "nacionalidad",       t.pop("_nacionalidad"))
            # t["eapb_id"]               = _cat_id(catalogs, "eapb",               t.pop("_eapb"))
            # t["pertenencia_etnica_id"] = _cat_id(catalogs, "pertenencia_etnica", t.pop("_pertenencia_etnica"))
            # t["grupo_poblacional_id"]  = _cat_id(catalogs, "grupo_poblacional",  t.pop("_grupo_poblacional"))
            
            t["nacionalidad_id"]       = await _get_or_create_cat(db, CatNacionalidad,      t.pop("_nacionalidad"),      catalogs, "nacionalidad")
            t["eapb_id"]               = await _get_or_create_cat(db, CatEapb,              t.pop("_eapb"),              catalogs, "eapb")
            t["pertenencia_etnica_id"] = await _get_or_create_cat(db, CatPertenenciaEtnica, t.pop("_pertenencia_etnica"),catalogs, "pertenencia_etnica")
            t["grupo_poblacional_id"]  = await _get_or_create_cat(db, CatGrupoPoblacional,  t.pop("_grupo_poblacional"), catalogs, "grupo_poblacional")
                 
            # FIX 2: savepoint por fila — si falla solo revierte esta fila
            async with db.begin_nested():
                accion = await repo.upsert_gestante(db, t, formula)

            result.add_ok("gestantes", idx, accion)
        except Exception as e:
            result.add_error("gestantes", idx, str(e))


async def _process_controles(
    rows: list[dict],
    db: AsyncSession,
    catalogs: dict,
    gestante_map: dict,
    result: ProcessResult,
):
    for idx, raw in enumerate(rows, start=4):
        errors = validate_control(raw)
        if errors:
            result.add_error("controles", idx, " | ".join(errors))
            continue
        try:
            t           = transform_control(raw)
            codigo_gmi  = t.pop("codigo_gmi")
            gestante_id = gestante_map.get(codigo_gmi)
            if not gestante_id:
                result.add_error("controles", idx, f"[controles] Gestante '{codigo_gmi}' no encontrada.")
                continue

            signos = t.pop("_signos")
            signos["estado_nutricional_id"] = _cat_id(
                catalogs, "estado_nutricional", signos.pop("_estado_nutricional")
            )
            riesgo_obs = t.pop("_riesgo_obstetrico")
            dx_riesgo  = t.pop("_dx_alto_riesgo")
            riesgo_bio = t.pop("_riesgo_biosicosocial")
            sit_bio    = t.pop("_situaciones_bio")

            # Catálogos opcionales para control
            # t["ips_id"]              = _cat_id(catalogs, "ips",              t.pop("_ips"))
            # t["tipo_profesional_id"] = _cat_id(catalogs, "tipo_profesional", t.pop("_tipo_profesional"))
            
            t["ips_id"]              = await _get_or_create_cat(db, CatIps,             t.pop("_ips"),              catalogs, "ips")
            t["tipo_profesional_id"] = await _get_or_create_cat(db, CatTipoProfesional, t.pop("_tipo_profesional"), catalogs, "tipo_profesional")   

            # FIX 2: savepoint por fila
            async with db.begin_nested():
                await repo.insert_control(
                    db, gestante_id, t, signos,
                    riesgo_obs, dx_riesgo, riesgo_bio, sit_bio, 
                )

            result.add_ok("controles", idx, "nueva")
        except Exception as e:
            result.add_error("controles", idx, str(e))


async def _process_examenes(
    rows: list[dict],
    db: AsyncSession,
    catalogs: dict,
    gestante_map: dict,
    result: ProcessResult,
):
    for idx, raw in enumerate(rows, start=4):
        errors = validate_examen(raw)
        if errors:
            result.add_error("examenes", idx, " | ".join(errors))
            continue
        try:
            t           = transform_examen(raw)
            codigo_gmi  = t.pop("codigo_gmi")
            gestante_id = gestante_map.get(codigo_gmi)
            if not gestante_id:
                result.add_error("examenes", idx, f"[examenes] Gestante '{codigo_gmi}' no encontrada.")
                continue

            t["tipo_examen_id"] = await _get_or_create_cat(
                db, CatTipoExamen, t.pop("_tipo_examen"), catalogs, "tipo_examen"
            )
            if not t["tipo_examen_id"]:
                result.add_error("examenes", idx, "[examenes] Campo obligatorio 'tipo_examen' está vacío")
                continue

            async with db.begin_nested():
                await repo.insert_examen(db, gestante_id, t)

            result.add_ok("examenes", idx, "nueva")
        except Exception as e:
            result.add_error("examenes", idx, str(e))


async def _process_ecografias(
    rows: list[dict],
    db: AsyncSession,
    catalogs: dict,
    gestante_map: dict,
    result: ProcessResult,
):
    for idx, raw in enumerate(rows, start=4):
        errors = validate_ecografia(raw)
        if errors:
            result.add_error("ecografias", idx, " | ".join(errors))
            continue
        try:
            t           = transform_ecografia(raw)
            codigo_gmi  = t.pop("codigo_gmi")
            gestante_id = gestante_map.get(codigo_gmi)
            if not gestante_id:
                result.add_error("ecografias", idx, f"[ecografias] Gestante '{codigo_gmi}' no encontrada.")
                continue

            t["tipo_ecografia_id"] = await _get_or_create_cat(
                db, CatTipoEcografia, t.pop("_tipo_ecografia"), catalogs, "tipo_ecografia"
            )
            if not t["tipo_ecografia_id"]:
                result.add_error("ecografias", idx, "[ecografias] Campo obligatorio 'tipo_ecografia' está vacío")
                continue

            async with db.begin_nested():
                await repo.insert_ecografia(db, gestante_id, t)

            result.add_ok("ecografias", idx, "nueva")
        except Exception as e:
            result.add_error("ecografias", idx, str(e))


async def _process_vacunas(
    rows: list[dict],
    db: AsyncSession,
    catalogs: dict,
    gestante_map: dict,
    result: ProcessResult,
):
    for idx, raw in enumerate(rows, start=4):
        errors = validate_vacuna(raw)
        if errors:
            result.add_error("vacunas", idx, " | ".join(errors))
            continue
        try:
            t           = transform_vacuna(raw)
            codigo_gmi  = t.pop("codigo_gmi")
            gestante_id = gestante_map.get(codigo_gmi)
            if not gestante_id:
                result.add_error("vacunas", idx, f"[vacunas] Gestante '{codigo_gmi}' no encontrada.")
                continue

            # FIX 1: validar catálogo (campo NOT NULL)
            # vacuna_id, cat_err = _required_cat_id(
            #     catalogs, "vacuna", t.pop("_vacuna"), "vacuna", "vacunas"
            # )
            # if cat_err:
            #     result.add_error("vacunas", idx, cat_err)
            #     continue

            # t["vacuna_id"] = vacuna_id
            
            t["vacuna_id"] = await _get_or_create_cat(db, CatVacuna, t.pop("_vacuna"), catalogs, "vacuna")


            # FIX 2: savepoint por fila
            async with db.begin_nested():
                await repo.insert_vacuna(db, gestante_id, t)

            result.add_ok("vacunas", idx, "nueva")
        except Exception as e:
            result.add_error("vacunas", idx, str(e))


async def _process_remisiones(
    rows: list[dict],
    db: AsyncSession,
    catalogs: dict,
    gestante_map: dict,
    result: ProcessResult,
):
    for idx, raw in enumerate(rows, start=4):
        errors = validate_remision(raw)
        if errors:
            result.add_error("remisiones", idx, " | ".join(errors))
            continue
        try:
            t           = transform_remision(raw)
            codigo_gmi  = t.pop("codigo_gmi")
            gestante_id = gestante_map.get(codigo_gmi)
            if not gestante_id:
                result.add_error("remisiones", idx, f"[remisiones] Gestante '{codigo_gmi}' no encontrada.")
                continue

            # FIX 1: validar catálogo (campo NOT NULL)
            # especialidad_id, cat_err = _required_cat_id(
            #     catalogs, "especialidad", t.pop("_especialidad"), "especialidad", "remisiones"
            # )
            # if cat_err:
            #     result.add_error("remisiones", idx, cat_err)
            #     continue

            # t["especialidad_id"] = especialidad_id
            
            t["especialidad_id"] = await _get_or_create_cat(db, CatEspecialidad, t.pop("_especialidad"), catalogs, "especialidad")


            # FIX 2: savepoint por fila
            async with db.begin_nested():
                await repo.insert_remision(db, gestante_id, t)

            result.add_ok("remisiones", idx, "nueva")
        except Exception as e:
            result.add_error("remisiones", idx, str(e))


async def _process_desenlaces(
    rows: list[dict],
    db: AsyncSession,
    catalogs: dict,
    gestante_map: dict,
    result: ProcessResult,
):
    for idx, raw in enumerate(rows, start=4):
        errors = validate_desenlace(raw)
        if errors:
            result.add_error("desenlaces", idx, " | ".join(errors))
            continue
        try:
            t           = transform_desenlace(raw)
            codigo_gmi  = t.pop("codigo_gmi")
            gestante_id = gestante_map.get(codigo_gmi)
            if not gestante_id:
                result.add_error("desenlaces", idx, f"[desenlaces] Gestante '{codigo_gmi}' no encontrada.")
                continue

            rn             = t.pop("_rn")
            anticoncepcion = t.pop("_anticoncepcion")

            # Método anticonceptivo es opcional, puede ser None
            # anticoncepcion["metodo_id"] = _cat_id(
            #     catalogs, "metodo_anti", anticoncepcion.pop("_metodo")
            # )
            
            anticoncepcion["metodo_id"] = await _get_or_create_cat(db, CatMetodoAnticonceptivo, anticoncepcion.pop("_metodo"), catalogs, "metodo_anti")
             
            # FIX 2: savepoint por fila
            async with db.begin_nested():
                await repo.insert_desenlace(db, gestante_id, t, rn, anticoncepcion)

            result.add_ok("desenlaces", idx, "nueva")
        except Exception as e:
            result.add_error("desenlaces", idx, str(e))


# Entrada pública

async def process_excel(
    db: AsyncSession,
    file_path: str | Path,
    archivo_nombre: str,
    usuario_id: str,
) -> CargaExcel:
    """
    Pipeline principal:
      1. Carga catálogos en memoria (un solo query por catálogo).
      2. Procesa la hoja 'gestantes' con upsert.
      3. Reconstruye el mapa codigo_gmi → id desde BD.
      4. Procesa el resto de hojas referenciando gestantes por codigo_gmi.
      5. Persiste CargaExcel + CargaExcelDetalle con el resumen final.

    Cada fila de cada hoja usa un savepoint (begin_nested) para que un
    error de BD en una fila no invalide la sesión completa y el resto
    del archivo pueda seguir procesándose.
    """
    result   = ProcessResult()
    sheets   = load_all_sheets(file_path)
    catalogs = await _resolve_catalogs(db)

    #  gestantes primero 
    await _process_gestantes(sheets["gestantes"], db, catalogs, result)

    # Reconstruir mapa fresco desde BD después del upsert
    gestante_map = await repo.get_gestante_map(db)

    #  resto de hojas 
    await _process_controles(  sheets["controles"],  db, catalogs, gestante_map, result)
    await _process_examenes(   sheets["examenes"],   db, catalogs, gestante_map, result)
    await _process_ecografias( sheets["ecografias"], db, catalogs, gestante_map, result)
    await _process_vacunas(    sheets["vacunas"],    db, catalogs, gestante_map, result)
    await _process_remisiones( sheets["remisiones"], db, catalogs, gestante_map, result)
    await _process_desenlaces( sheets["desenlaces"], db, catalogs, gestante_map, result)

    #  persistir registro de carga 
    estado = "completado" if result.errores == 0 else "completado_con_errores"

    carga = await repo.create_carga_excel(
        db,
        archivo_nombre=archivo_nombre,
        usuario_id=usuario_id,
        total_gestantes=len(sheets["gestantes"]),
        nuevas=result.nuevas,
        actualizadas=result.actualizadas,
        errores=result.errores,
        estado=estado,
    )
    await repo.create_carga_detalles(db, carga.id, result.detalles)

    return carga


