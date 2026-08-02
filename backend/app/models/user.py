from sqlalchemy import Column, Integer, String, DateTime, Enum
from datetime import datetime
import enum
from app.database.session import Base


class UserRole(str, enum.Enum):
    STUDENT = "student"
    TEACHER = "teacher"


class UserTier(str, enum.Enum):
    FREE = "free"
    PRO = "pro"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    clerk_id = Column(String(255), unique=True, index=True, nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default=UserRole.STUDENT.value)
    tier = Column(String(50), default=UserTier.FREE.value)
    simulations_left = Column(Integer, default=3)  # Free tier quota per month
    created_at = Column(DateTime, default=datetime.utcnow)
