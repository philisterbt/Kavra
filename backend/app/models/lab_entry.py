from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from datetime import datetime
from app.database.session import Base


class LabEntry(Base):
    __tablename__ = "lab_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    experiment_id = Column(Integer, ForeignKey("experiments.id"), nullable=True)
    title = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    saved_parameters = Column(Text, nullable=True)  # JSON string of slider values / inputs
    is_bookmarked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
