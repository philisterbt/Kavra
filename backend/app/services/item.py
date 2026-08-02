from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.item import Item
from app.schemas.item import ItemCreate, ItemUpdate


class ItemService:
    def get(self, db: Session, id: int) -> Optional[Item]:
        return db.query(Item).filter(Item.id == id).first()

    def get_multi(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[Item]:
        return db.query(Item).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: ItemCreate) -> Item:
        db_obj = Item(
            title=obj_in.title,
            description=obj_in.description
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: Item, obj_in: ItemUpdate) -> Item:
        # Convert update schema to dictionary
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: int) -> Optional[Item]:
        obj = db.query(Item).get(id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj


item_service = ItemService()
