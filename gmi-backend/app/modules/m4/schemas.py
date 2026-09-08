from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


# BIRTH RECORD (Parto)

class BirthRecordCreate(BaseModel):
    tipo_parto: str
    fecha_parto: date
    complicaciones: Optional[str] = None
    uci_materna: bool = False
    muerte_materna: bool = False
    causa_muerte: Optional[str] = None
    fecha_muerte: Optional[date] = None


class BirthRecordUpdate(BaseModel):
    tipo_parto: Optional[str] = None
    fecha_parto: Optional[date] = None
    complicaciones: Optional[str] = None
    uci_materna: Optional[bool] = None
    muerte_materna: Optional[bool] = None
    causa_muerte: Optional[str] = None
    fecha_muerte: Optional[date] = None


class BirthRecordResponse(BaseModel):
    id: str
    gestante_id: str
    tipo_parto: str
    fecha_parto: date
    complicaciones: Optional[str]
    uci_materna: bool
    muerte_materna: bool
    causa_muerte: Optional[str]
    fecha_muerte: Optional[date]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# NEWBORN (Recién Nacido)

class NewbornCreate(BaseModel):
    vivo: bool
    peso_gramos: Optional[float] = None
    talla_cm: Optional[float] = None
    uci_neonatal: bool = False
    observaciones: Optional[str] = None


class NewbornResponse(BaseModel):
    id: str
    parto_id: str
    vivo: bool
    peso_gramos: Optional[float]
    talla_cm: Optional[float]
    uci_neonatal: bool
    observaciones: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# POSTPARTUM (Puerperio)

class PostpartumCreate(BaseModel):
    dias_posparto: int
    fecha_evaluacion: date
    complicaciones: Optional[str] = None
    observaciones: Optional[str] = None


class PostpartumResponse(BaseModel):
    id: str
    gestante_id: str
    dias_posparto: int
    fecha_evaluacion: date
    complicaciones: Optional[str]
    observaciones: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class MentalHealthResponse(BaseModel):
    id: str
    gestante_id: str
    instrumento: str
    puntaje: int
    fecha: date
    recomendaciones: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class PostpartumEvolutionResponse(BaseModel):
    puerperios: list[PostpartumResponse]
    evaluaciones_salud_mental: list[MentalHealthResponse]


# CONTRACEPTION (Anticoncepción Posparto)

class ContraceptionCreate(BaseModel):
    metodo_id: Optional[int] = None
    fecha_aplicacion: date


class ContraceptionResponse(BaseModel):
    id: str
    gestante_id: str
    metodo_id: Optional[int]
    fecha_aplicacion: date
    created_at: Optional[datetime]

    class Config:
        from_attributes = True