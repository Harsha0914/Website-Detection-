# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest, ResetPasswordRequest
from app.schemas.user import UserOut
from app.utils.security import hash_password, verify_password
from app.auth.jwt import create_access_token, create_refresh_token, decode_token
from app.auth.dependencies import get_current_user
from jose import JWTError

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    email_clean = req.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address."
        )
    user.password_hash = hash_password(req.new_password)
    user.is_active = True
    db.commit()
    return {"message": "Password reset successfully! You can now log in with your new password."}


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # Duplicate email check
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # Determine role
    user_role = UserRole.USER
    if req.role.upper() == "ADMIN":
        from app.config import settings
        if not req.admin_code or req.admin_code.strip() != settings.ADMIN_SECRET_CODE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Admin Secret Code. Please enter the correct authorization code."
            )
        user_role = UserRole.ADMIN

    new_user = User(
        full_name=req.full_name,
        email=req.email.lower(),
        phone=req.phone,
        password_hash=hash_password(req.password),
        role=user_role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    email_clean = req.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not found with this email. Please register first."
        )
    
    if not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please check your password and try again."
        )

    # Auto-upgrade plain or legacy hash to fresh bcrypt hash if needed
    if not user.password_hash.startswith("$2"):
        user.password_hash = hash_password(req.password)
        db.commit()

    if not user.is_active:
        user.is_active = True
        db.commit()

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user_id=user.id,
        role=user.role.value,
        full_name=user.full_name
    )

@router.post("/refresh", response_model=TokenResponse)
def refresh_token_endpoint(req: RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(req.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token subject")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user = None
    try:
        user_id_int = int(user_id)
        user = db.query(User).filter(User.id == user_id_int).first()
    except (ValueError, TypeError):
        user = db.query(User).filter(User.email == str(user_id).lower()).first()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    new_access = create_access_token(user.id)
    new_refresh = create_refresh_token(user.id)

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        token_type="bearer",
        user_id=user.id,
        role=user.role.value,
        full_name=user.full_name
    )

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully"}
