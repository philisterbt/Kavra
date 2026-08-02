import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseModel):
    PROJECT_NAME: str = "Kavra — AI Destekli Fen Bilimleri Laboratuvarı"
    API_V1_STR: str = "/api/v1"

    # Database Settings
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{BASE_DIR}/kavra.db"
    )

    # Security Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "KAVRA_SUPER_SECRET_KEY")

    # Wiro AI Gateway Settings
    WIRO_AI_API_KEY: str = os.getenv("WIRO_AI_API_KEY", "xmme2l0g74s4wb75do80e2ec7nvg7fd7")
    WIRO_AI_API_SECRET: str = os.getenv("WIRO_AI_API_SECRET", "2e509cd0d22ecf9758670e185e46146f1178ce1441c69f93b751bca605b4e291")
    WIRO_AI_BASE_URL: str = os.getenv("WIRO_AI_BASE_URL", "https://api.wiro.ai/v1")

    # Clerk Authentication Settings
    CLERK_SECRET_KEY: str = os.getenv("CLERK_SECRET_KEY", "")
    CLERK_PUBLISHABLE_KEY: str = os.getenv("VITE_CLERK_PUBLISHABLE_KEY", "")

    class Config:
        case_sensitive = True


settings = Settings()
