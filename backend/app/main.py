from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import api_router
from app.database.session import engine, Base

# Automatically create database tables for development.
# In production, we'd typically use migrations (like Alembic).
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins. Feel free to adjust this for security.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(api_router, prefix=settings.API_V1_STR)

# Video Sync / Fallback route handler to prevent 404 crashes from generated JS scripts
@app.api_route("/api/videos/{path:path}", methods=["GET", "POST", "OPTIONS"])
@app.api_route("/api/v1/videos/{path:path}", methods=["GET", "POST", "OPTIONS"])
def video_sync_fallback(path: str):
    return {"status": "success", "message": "Video route handled", "path": path}


@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "docs_url": "/docs",
        "api_v1_prefix": settings.API_V1_STR
    }
