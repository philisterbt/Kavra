from fastapi import APIRouter
from app.routers import item, experiment, generate, user

api_router = APIRouter()

# Include sub-routers
api_router.include_router(item.router, prefix="/items", tags=["items"])
api_router.include_router(experiment.router, prefix="/experiments", tags=["experiments"])
api_router.include_router(generate.router, prefix="/generate", tags=["generate"])
api_router.include_router(user.router, prefix="/users", tags=["users"])
