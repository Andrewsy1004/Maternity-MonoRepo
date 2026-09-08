from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.exceptions import GMIException, gmi_exception_handler
from app.config import settings
import app.database.base # noqa: F401 - carga todos los modelos al iniciar

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"{settings.APP_NAME} v{settings.APP_VERSION} iniciando...")
    yield
    print(f"{settings.APP_NAME} detenido.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API REST para el seguimiento médico integral de gestantes",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# registrar exception handler
app.add_exception_handler(GMIException, gmi_exception_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


# routers
from app.modules.auth.router import router as auth_router
from app.modules.m0.router import router as m0_router
from app.modules.m5.router import router as m5_router
from app.modules.m4.router import router as m4_router
from app.modules.m6.router import router as m6_router
from app.modules.ia.router import router as ia_router
from app.modules.admin.router import router as admin_router
from app.modules.clinical.router import router as clinical_router

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(m0_router, prefix="/api/v1/m0", tags=["M0 - Registro y Perfil"])
app.include_router(clinical_router, prefix="/api/v1/clinical", tags=["Clinical - Seguimiento Clínico"])
app.include_router(m4_router, prefix="/api/v1/m4", tags=["M4 - Parto y Puerperio"])
app.include_router(m5_router, prefix="/api/v1/m5", tags=["M5 - Educación y Autocuidado"])
app.include_router(m6_router, prefix="/api/v1/m6", tags=["M6 - Comunicaciones y Alertas"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin - Administración"])
app.include_router(ia_router, prefix="/api/v1/ia", tags=["IA"])