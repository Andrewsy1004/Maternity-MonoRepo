
"""
Transforma filas crudas del Excel (dict con strings) a dicts tipados
listos para construir los modelos SQLAlchemy / SQLModel.
No hace IO — solo convierte y limpia valores.
"""

from datetime import datetime, date
from typing import Any


def _date(val: Any) -> date | None:
    if not val or str(val).strip() in ("", "nan"):
        return None
    return datetime.strptime(str(val).strip(), "%Y-%m-%d").date()


def _int(val: Any) -> int | None:
    try:
        return int(val)
    except (TypeError, ValueError):
        return None


def _float(val: Any) -> float | None:
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


def _str(val: Any) -> str | None:
    s = str(val).strip() if val is not None else None
    return None if not s or s.lower() == "nan" else s


def _bool_yn(val: Any) -> bool:
    return str(val).strip().lower() in ("sí", "si", "yes", "true", "1")



def transform_gestante(row: dict) -> dict:
    return {
        "codigo_gmi":                 _str(row.get("codigo_gmi")),          # None → se genera en BD
        "fecha_nacimiento":           _date(row["fecha_nacimiento"]),
        "fecha_ultima_menstruacion":  _date(row["fecha_ultima_menstruacion"]),
        "fecha_probable_parto":       _date(row.get("fecha_probable_parto")),
        "anio_ingreso":               _int(row["anio_ingreso"]),
        "fecha_ingreso_cpn":          _date(row.get("fecha_ingreso_cpn")),
        "semanas_eg_ingreso":         _int(row.get("semanas_eg_ingreso")),
        "tipo_regimen":               _str(row.get("tipo_regimen")),
        # IDs de catálogo se resuelven en el processor
        "_nacionalidad":              _str(row.get("nacionalidad")),
        "_eapb":                      _str(row.get("eapb")),
        "_pertenencia_etnica":        _str(row.get("pertenencia_etnica")),
        "_grupo_poblacional":         _str(row.get("grupo_poblacional")),
        # fórmula obstétrica (se guarda aparte)
        "_formula": {
            "gestaciones": _int(row.get("formula_g")) or 0,
            "partos":      _int(row.get("formula_p")) or 0,
            "cesareas":    _int(row.get("formula_c")) or 0,
            "abortos":     _int(row.get("formula_a")) or 0,
            "vivos":       _int(row.get("formula_v")) or 0,
            "mortinatos":  _int(row.get("formula_m")) or 0,
        },
        "_hemoclasificacion": _str(row.get("hemoclasificacion")),
    }


def transform_control(row: dict) -> dict:
    return {
        "codigo_gmi":       _str(row["codigo_gmi"]),
        "numero_control":   _int(row["numero_control"]),
        "fecha_control":    _date(row["fecha_control"]),
        "semana_gestacion": _int(row["semana_gestacion"]),
        "tipo_consulta":    _str(row.get("tipo_consulta")),
        "observaciones":    _str(row.get("observaciones")),
        # catálogos
        "_ips":              _str(row.get("ips")),
        "_tipo_profesional": _str(row.get("tipo_profesional")),
        # signos vitales (se guardan en SignosVitales)
        "_signos": {
            "peso_kg":             _float(row.get("peso_kg")),
            "talla_cm":            _float(row.get("talla_cm")),
            "imc":                 _float(row.get("imc")),
            "altura_uterina":      _float(row.get("altura_uterina")),
            "_estado_nutricional": _str(row.get("estado_nutricional")),
        },
        # riesgo (se guarda en ClasificacionRiesgo)
        "_riesgo_obstetrico":     _str(row.get("riesgo_obstetrico")),
        "_dx_alto_riesgo":        _str(row.get("dx_alto_riesgo")),
        "_riesgo_biosicosocial":  _str(row.get("riesgo_biosicosocial")),
        "_situaciones_bio":       _str(row.get("situaciones_biosicosocial")),
    }


def transform_examen(row: dict) -> dict:
    return {
        "codigo_gmi":       _str(row["codigo_gmi"]),
        "fecha_toma":       _date(row["fecha_toma"]),
        "resultado":        _str(row["resultado"]),
        "trimestre":        _int(row.get("trimestre")),
        "semana_gestacion": _int(row.get("semana_gestacion")),
        "observaciones":    _str(row.get("observaciones")),
        "_tipo_examen":     _str(row["tipo_examen"]),
    }


def transform_ecografia(row: dict) -> dict:
    return {
        "codigo_gmi":       _str(row["codigo_gmi"]),
        "fecha":            _date(row["fecha"]),
        "semana_gestacion": _int(row["semana_gestacion"]),
        "resultado":        _str(row["resultado"]),
        "plan_manejo":      _str(row.get("plan_manejo")),
        "_tipo_ecografia":  _str(row["tipo_ecografia"]),
    }


def transform_vacuna(row: dict) -> dict:
    return {
        "codigo_gmi":        _str(row["codigo_gmi"]),
        "dosis":             _str(row["dosis"]),
        "fecha_aplicacion":  _date(row["fecha_aplicacion"]),
        "_vacuna":           _str(row["vacuna"]),
    }


def transform_remision(row: dict) -> dict:
    return {
        "codigo_gmi":       _str(row["codigo_gmi"]),
        "fecha_remision":   _date(row["fecha_remision"]),
        "fecha_atencion":   _date(row.get("fecha_atencion")),
        "semana_gestacion": _int(row.get("semana_gestacion")),
        "_especialidad":    _str(row["especialidad"]),
    }


def transform_desenlace(row: dict) -> dict:
    return {
        "codigo_gmi":    _str(row["codigo_gmi"]),
        "tipo_parto":    _str(row["tipo_parto"]),
        "fecha_parto":   _date(row["fecha_parto"]),
        "uci_materna":   _bool_yn(row.get("uci_materna")),
        "muerte_materna":_bool_yn(row.get("muerte_materna")),
        "causa_muerte":  _str(row.get("causa_muerte")),
        "fecha_muerte":  _date(row.get("fecha_muerte")),
        # recién nacido
        "_rn": {
            "vivo":         _bool_yn(row.get("rn_vivo")),
            "peso_gramos":  _float(row.get("rn_peso_gramos")),
            "talla_cm":     _float(row.get("rn_talla_cm")),
            "uci_neonatal": _bool_yn(row.get("uci_neonatal")),
            "observaciones":_str(row.get("observaciones")),
        },
        # anticoncepción posparto
        "_anticoncepcion": {
            "aplicada":          _bool_yn(row.get("anticoncepcion_posparto")),
            "_metodo":           _str(row.get("tipo_metodo")),
            "fecha_aplicacion":  _date(row.get("fecha_aplicacion_metodo")),
        },
    }