from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database.session import get_db
from app.models.user import User, UserRole, UserTier

router = APIRouter()


class UserSyncRequest(BaseModel):
    clerk_id: str
    email: str
    full_name: Optional[str] = None
    role: Optional[str] = UserRole.STUDENT.value


@router.post("/sync")
def sync_user(req: UserSyncRequest, db: Session = Depends(get_db)):
    """
    Syncs Clerk user profile with local DB.
    """
    db_user = db.query(User).filter(User.clerk_id == req.clerk_id).first()
    if not db_user:
        db_user = User(
            clerk_id=req.clerk_id,
            email=req.email,
            full_name=req.full_name,
            role=req.role or UserRole.STUDENT.value,
            tier=UserTier.FREE.value,
            simulations_left=3
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    else:
        if req.full_name:
            db_user.full_name = req.full_name
        if req.role:
            db_user.role = req.role
        db.commit()

    return {
        "status": "synced",
        "user_id": db_user.id,
        "role": db_user.role,
        "simulations_left": db_user.simulations_left
    }
