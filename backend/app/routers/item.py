from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.schemas.item import Item, ItemCreate, ItemUpdate
from app.services.item import item_service

router = APIRouter()


@router.get("/", response_model=List[Item])
def read_items(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    """
    Retrieve items.
    """
    items = item_service.get_multi(db, skip=skip, limit=limit)
    return items


@router.post("/", response_model=Item, status_code=status.HTTP_201_CREATED)
def create_item(item_in: ItemCreate, db: Session = Depends(get_db)):
    """
    Create a new item.
    """
    return item_service.create(db, obj_in=item_in)


@router.get("/{id}", response_model=Item)
def read_item(id: int, db: Session = Depends(get_db)):
    """
    Get item by ID.
    """
    db_item = item_service.get(db, id=id)
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    return db_item


@router.put("/{id}", response_model=Item)
def update_item(id: int, item_in: ItemUpdate, db: Session = Depends(get_db)):
    """
    Update an item.
    """
    db_item = item_service.get(db, id=id)
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    return item_service.update(db, db_obj=db_item, obj_in=item_in)


@router.delete("/{id}", response_model=Item)
def delete_item(id: int, db: Session = Depends(get_db)):
    """
    Delete an item.
    """
    db_item = item_service.get(db, id=id)
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    return item_service.remove(db, id=id)
