from fastapi import Request, status
from fastapi.responses import JSONResponse

# clase base de la que herederán las demás
class GMIException(Exception):
    def __init__(self, detail: str, status_code: int = 500):
        self.detail = detail
        self.status_code = status_code

class NotFoundException(GMIException):
    def __init__(self, detail: str = "Recurso no encontrado"):
        super().__init__(detail=detail, status_code=status.HTTP_404_NOT_FOUND)

class ForbiddenException(GMIException):
    def __init__(self, detail: str = "No tienes permisos para esta acción"):
        super().__init__(detail=detail, status_code=status.HTTP_403_FORBIDDEN)

class UnauthorizedException(GMIException):
    def __init__(self, detail: str = "Credenciales inválidas"):
        super().__init__(detail=detail, status_code=status.HTTP_401_UNAUTHORIZED)

class ConflictException(GMIException):
    def __init__(self, detail: str = "El recurso ya existe"):
        super().__init__(detail=detail, status_code=status.HTTP_409_CONFLICT)

class ValidationException(GMIException):
    def __init__(self, detail: str = "Datos inválidos"):
        super().__init__(detail=detail, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)

# handler que convierte las excepciones en respuestas http
async def gmi_exception_handler(request: Request, exc: GMIException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )