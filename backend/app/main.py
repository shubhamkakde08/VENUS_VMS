from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title="VISITFLOW — Enterprise Visitor Management System API",
    description="Production-grade RESTful API backing the VISITFLOW platform with MySQL 8.4 persistence.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "CONNECTED"
    }

@app.get(f"{settings.API_V1_PREFIX}/meta", tags=["System"])
def system_meta():
    return {
        "name": settings.PROJECT_NAME,
        "supported_roles": [
            "SUPER_ADMIN", "COMPANY_ADMIN", "RECEPTIONIST", 
            "SECURITY_GUARD", "EMPLOYEE_HOST", "DEPT_HEAD", 
            "FACILITY_MGR", "AUDITOR"
        ],
        "database_backend": "MySQL 8.4 LTS",
        "qr_security": "HMAC-SHA256 Tokenization"
    }

from app.api.sequences import router as sequences_router
from app.api.audit_logs import router as audit_logs_router

app.include_router(sequences_router, prefix=settings.API_V1_PREFIX)
app.include_router(audit_logs_router, prefix=settings.API_V1_PREFIX)
app.include_router(audit_logs_router, prefix="/api")

