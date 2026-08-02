from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class ExperimentBase(BaseModel):
    title: str
    subject: str  # physics, chemistry, biology
    description: str
    grade_level: Optional[str] = "All Levels"
    simulation_type: Optional[str] = "interactive"
    content_code: Optional[str] = None
    image_url: Optional[str] = None
    is_curated: Optional[bool] = True


class ExperimentCreate(ExperimentBase):
    pass


class ExperimentOut(ExperimentBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
