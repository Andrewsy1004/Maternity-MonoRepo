from sqlmodel import SQLModel
from pydantic import BaseModel
from datetime import datetime

# no tienen 'table=True' porque son schemas de pydantic puros
# para validación y serialización
class GestanteLoginRequest(SQLModel):
    codigo_gmi: str
    respuesta_seguridad: str

class StaffLoginRequest(SQLModel):
    email: str
    password: str

class TokenResponse(SQLModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str

class RefreshTokenRequest(SQLModel):
    refresh_token: str

class SecurityQuestionResponse(SQLModel):
    codigo_gmi: str
    pregunta: str

class PasswordResetRequest(SQLModel):
    email: str

class PasswordResetConfirm(SQLModel):
    token: str
    new_password: str
    
class SolicitudActivacionCreate(BaseModel):
    codigo_gmi: str
    pregunta: str
    respuesta: str

class SolicitudActivacionResponse(BaseModel):
    id: str
    codigo_gmi: str
    pregunta: str
    estado: str
    created_at: datetime

    class Config:
        from_attributes = True