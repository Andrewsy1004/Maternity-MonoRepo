"""
Carga el archivo Excel y devuelve cada hoja como lista de dicts.

Estructura del template (todas las hojas):
  Fila 1  → instrucción descriptiva        ← skiprows=[0]
  Fila 2  → encabezados reales             ← header=0 (sobre el df ya filtrado)
  Fila 3  → tipos de dato (Texto, Entero…) ← se descarta con iloc[1:]
  Fila 4+ → datos reales
"""

import pandas as pd
from pathlib import Path


SHEETS = [
    "gestantes",
    "controles",
    "examenes",
    "ecografias",
    "vacunas",
    "remisiones",
    "desenlaces",
]


def load_sheet(path: str | Path, sheet_name: str) -> list[dict]:
    df = pd.read_excel(
        path,
        sheet_name=sheet_name,
        skiprows=[0],
        header=0,
        dtype=str,
    )

    # Limpiar espacios en nombres de columna
    # df.columns = [str(c).strip() for c in df.columns]
    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]


    # Descartar fila 3 del Excel (ahora índice 0 del df) que contiene los tipos
    # de dato: "Texto", "AAAA-MM-DD", "Entero", etc.
    df = df.iloc[1:]

    # Eliminar filas completamente vacías y resetear índice
    df = df.dropna(how="all").reset_index(drop=True)

    # Reemplazar NaN por None para que el validator los detecte como vacíos
    df = df.where(df.notna(), other=None)

    return df.to_dict(orient="records")


def load_all_sheets(path: str | Path) -> dict[str, list[dict]]:
    return {sheet: load_sheet(path, sheet) for sheet in SHEETS}