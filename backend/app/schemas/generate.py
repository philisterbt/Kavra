from pydantic import BaseModel, Field
from typing import Optional


class SimulationGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=2, description="Öğrencinin anlamadığı konu veya soru")
    output_type: Optional[str] = Field("interactive", description="interactive, diagram, veya model_3d")
    grade_level: Optional[str] = "Ortaokul/Lise"


class SimulationGenerateResponse(BaseModel):
    status: str
    topic: str
    content_type: str
    html_code: str
    validation_status: str
