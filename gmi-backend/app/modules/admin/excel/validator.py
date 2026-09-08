"""
Validación de filas crudas del Excel antes de transformar.
Retorna lista de errores por fila; lista vacía = fila válida.
"""

from datetime import datetime


REQUIRED_GESTANTE = [
    "fecha_nacimiento", "fecha_ultima_menstruacion", "anio_ingreso",
    "formula_g", "formula_p", "formula_c", "formula_a", "formula_v", "formula_m",
]
REQUIRED_CONTROL = [
    "codigo_gmi", "numero_control", "fecha_control", "semana_gestacion",
    "ips", "tipo_profesional", "tipo_consulta", "peso_kg",
    "estado_nutricional", "riesgo_obstetrico", "riesgo_biosicosocial",
]
REQUIRED_EXAMEN   = ["codigo_gmi", "tipo_examen", "fecha_toma", "resultado", "trimestre"]
REQUIRED_ECOGRAF  = ["codigo_gmi", "tipo_ecografia", "fecha", "semana_gestacion", "resultado"]
REQUIRED_VACUNA   = ["codigo_gmi", "vacuna", "dosis", "fecha_aplicacion"]
REQUIRED_REMISION = ["codigo_gmi", "especialidad", "fecha_remision"]
REQUIRED_DESENLACE= [
    "codigo_gmi", "tipo_parto", "fecha_parto",
    "anticoncepcion_posparto", "uci_materna", "muerte_materna", "rn_vivo", "uci_neonatal",
]

DATE_FIELDS = {
    "fecha_nacimiento", "fecha_ultima_menstruacion", "fecha_probable_parto",
    "fecha_ingreso_cpn", "fecha_control", "fecha_toma", "fecha", "fecha_aplicacion",
    "fecha_remision", "fecha_atencion", "fecha_parto", "fecha_aplicacion_metodo",
    "fecha_muerte",
}


def _check_date(value: str, field: str) -> str | None:
    try:
        datetime.strptime(str(value).strip(), "%Y-%m-%d")
        return None
    except ValueError:
        return f"'{field}' tiene formato de fecha inválido: '{value}' (esperado AAAA-MM-DD)"


def _validate_row(row: dict, required_fields: list[str], sheet: str) -> list[str]:
    errors: list[str] = []

    for field in required_fields:
        val = row.get(field)
        if val is None or str(val).strip() == "" or str(val).lower() == "nan":
            errors.append(f"[{sheet}] Campo obligatorio vacío: '{field}'")

    for field in DATE_FIELDS:
        val = row.get(field)
        if val and str(val).strip() not in ("", "nan"):
            err = _check_date(val, field)
            if err:
                errors.append(f"[{sheet}] {err}")

    return errors


def validate_gestante(row: dict) -> list[str]:
    return _validate_row(row, REQUIRED_GESTANTE, "gestantes")

def validate_control(row: dict) -> list[str]:
    return _validate_row(row, REQUIRED_CONTROL, "controles")

def validate_examen(row: dict) -> list[str]:
    return _validate_row(row, REQUIRED_EXAMEN, "examenes")

def validate_ecografia(row: dict) -> list[str]:
    return _validate_row(row, REQUIRED_ECOGRAF, "ecografias")

def validate_vacuna(row: dict) -> list[str]:
    return _validate_row(row, REQUIRED_VACUNA, "vacunas")

def validate_remision(row: dict) -> list[str]:
    return _validate_row(row, REQUIRED_REMISION, "remisiones")

def validate_desenlace(row: dict) -> list[str]:
    return _validate_row(row, REQUIRED_DESENLACE, "desenlaces")