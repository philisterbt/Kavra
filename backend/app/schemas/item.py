from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class ItemBase(BaseModel):
    title: str
    description: Optional[str] = None


class ItemCreate(ItemBase):
    pass


class ItemUpdate(ItemBase):
    title: Optional[str] = None


class ItemInDBBase(ItemBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Item(ItemInDBBase):
    pass
