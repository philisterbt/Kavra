from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime
from app.database.session import Base


class GeneratedContent(Base):
    __tablename__ = "generated_contents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    prompt = Column(Text, nullable=False)
    topic = Column(String(255), nullable=False)
    content_type = Column(String(50), default="interactive")  # interactive, diagram, model_3d
    generated_payload = Column(Text, nullable=False)  # Generated HTML/JS or image/3D URL
    validation_status = Column(String(50), default="approved")  # pending, approved, flagged
    created_at = Column(DateTime, default=datetime.utcnow)
