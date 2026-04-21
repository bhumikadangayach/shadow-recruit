import logging
from contextlib import asynccontextmanager
from pathlib import Path

import structlog
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.session import create_tables
from app.routers import auth, job_descriptions, resumes, sessions, interview

# ─── Logging ─────────────────────────────────────────────────────────────────

logging.basicConfig(level=logging.INFO if not settings.debug else logging.DEBUG)
log = structlog.get_logger()


# ─── Lifespan ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting Shadow Recruit API", env=settings.app_env)

    # Create upload directory
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    Path(settings.chroma_persist_dir).mkdir(parents=True, exist_ok=True)

    # Create DB tables (use Alembic in production)
    if settings.app_env == "development":
        await create_tables()
        log.info("Database tables created")

    yield

    log.info("Shutting down Shadow Recruit API")


# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Shadow Recruit API",
    description="AI-powered mock interview platform",
    version="1.0.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    lifespan=lifespan,
)

# ─── Middleware ───────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*",],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    log.info("request", method=request.method, path=request.url.path)
    response = await call_next(request)
    log.info("response", status_code=response.status_code)
    return response


# ─── Global Exception Handler ─────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.error("unhandled_error", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


# ─── Routers ─────────────────────────────────────────────────────────────────

API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(sessions.router, prefix=API_PREFIX)
app.include_router(job_descriptions.router, prefix=API_PREFIX)
app.include_router(resumes.router, prefix=API_PREFIX)
app.include_router(interview.router, prefix=API_PREFIX)


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health", tags=["health"])
async def health():
    return {
        "status": "healthy",
        "app": settings.app_name,
        "env": settings.app_env,
        "version": "1.0.0",
    }


@app.get("/", tags=["root"])
async def root():
    return {"message": f"Welcome to {settings.app_name} API. Visit /docs for documentation."}
