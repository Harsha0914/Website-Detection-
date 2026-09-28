# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserOut, UserUpdate
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("/profile", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserOut)
def update_profile(
    req: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.full_name is not None:
        current_user.full_name = req.full_name
    if req.phone is not None:
        current_user.phone = req.phone

    db.commit()
    db.refresh(current_user)

    try:
        from app.mongodb import upsert_user
        upsert_user({
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "phone": current_user.phone or "",
            "password_hash": current_user.password_hash,
            "role": current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
            "is_active": current_user.is_active,
            "updated_at": str(current_user.updated_at) if hasattr(current_user, 'updated_at') and current_user.updated_at else None,
        })
    except Exception as e:
        print(f"MongoDB profile update sync note: {e}")

    return current_user
