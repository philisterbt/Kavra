from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from datetime import datetime
from app.database.session import Base


class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    subject = Column(String(50), nullable=False, index=True)  # physics, chemistry, biology
    description = Column(Text, nullable=False)
    grade_level = Column(String(50), default="All Levels")  # Middle School, High School, University
    simulation_type = Column(String(50), default="interactive")  # static, interactive, 3d
    content_code = Column(Text, nullable=True)  # Embedded HTML/JS or config JSON
    image_url = Column(String(500), nullable=True)
    is_curated = Column(Boolean, default=True)  # Curated vs AI generated
    created_at = Column(DateTime, default=datetime.utcnow)
