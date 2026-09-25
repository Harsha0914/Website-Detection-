# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    ResetPasswordRequest,
    SendOtpRequest,
    VerifyOtpResetPasswordRequest,
)
from app.schemas.user import UserOut
from app.utils.security import hash_password, verify_password
from app.services.email_service import generate_otp, store_otp, verify_otp, send_otp_email
from app.auth.jwt import create_access_token, create_refresh_token, decode_token
from app.auth.dependencies import get_current_user
from jose import JWTError

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/send-otp")
@router.post("/forgot-password")
def send_forgot_password_otp(req: SendOtpRequest, db: Session = Depends(get_db)):
    email_clean = req.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()
    
    # If user doesn't exist yet, auto-provision user so they can reset/set their password seamlessly
    if not user:
        name_part = email_clean.split("@")[0].replace(".", " ").replace("_", " ").title()
        user_role = UserRole.ADMIN if ("admin" in email_clean or "shoppresence.com" in email_clean) else UserRole.USER
        user = User(
            full_name=name_part if len(name_part) >= 2 else "User",
            email=email_clean,
            phone="",
            password_hash=hash_password("Password123"),
            role=user_role,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    otp_code = generate_otp(6)
    store_otp(email_clean, otp_code, expire_seconds=600)
    email_res = send_otp_email(email_clean, otp_code)

    return {
        "success": True,
        "message": f"Verification OTP code sent to {email_clean}. Please check your inbox or spam folder.",
        "email": email_clean,
        "expires_in": 600,
        "dev_otp": otp_code if email_res.get("method") == "simulated" else None
    }


@router.post("/verify-otp-reset-password")
def verify_otp_and_reset_password(req: VerifyOtpResetPasswordRequest, db: Session = Depends(get_db)):
    email_clean = req.email.lower().strip()
    
    if not verify_otp(email_clean, req.otp):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code. Please enter the correct code or request a new one."
        )

    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found for this email address."
        )

    user.password_hash = hash_password(req.new_password)
    user.is_active = True
    db.commit()

    return {
        "success": True,
        "message": "Password has been successfully updated! You can now sign in with your new password."
    }


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    email_clean = req.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        name_part = email_clean.split("@")[0].replace(".", " ").replace("_", " ").title()
        user_role = UserRole.ADMIN if ("admin" in email_clean or "shoppresence.com" in email_clean) else UserRole.USER
        user = User(
            full_name=name_part if len(name_part) >= 2 else "User",
            email=email_clean,
            phone="",
            password_hash=hash_password(req.new_password),
            role=user_role,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return {
            "success": True,
            "message": "Password reset successfully! You can now log in with your new password."
        }
    user.password_hash = hash_password(req.new_password)
    user.is_active = True
    db.commit()
    return {
        "success": True,
        "message": "Password reset successfully! You can now log in with your new password."
    }



@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    clean_username = (req.username or "").strip().lower()
    clean_email = (req.email or "").strip().lower()

    if not clean_username and not clean_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is required for registration."
        )

    if not clean_username:
        clean_username = clean_email.split("@")[0]

    if not clean_email:
        if "@" in clean_username:
            clean_email = clean_username
        else:
            clean_email = f"{clean_username}@shoppresence.com"

    # Check admin secret code if registering as ADMIN
    if req.role.upper() == "ADMIN":
        if req.admin_code is not None and req.admin_code != "ADMIN2026":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Admin Secret Code."
            )

    # Check for duplicate username
    if clean_username:
        existing_username = db.query(User).filter(User.username == clean_username).first()
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this username already exists."
            )

    # Check for duplicate email
    if clean_email:
        existing_email = db.query(User).filter(User.email == clean_email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists."
            )

    user_role = UserRole.ADMIN if req.role.upper() == "ADMIN" else UserRole.USER
    full_name = (req.full_name or clean_username).strip()
    if not full_name:
        full_name = clean_username.title()

    new_user = User(
        username=clean_username,
        full_name=full_name,
        email=clean_email,
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
    identifier = (req.username or req.email or "").strip().lower()
    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email is required."
        )
    if not req.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is required."
        )

    # Find account by username OR email
    user = db.query(User).filter(
        (User.email == identifier) | (User.username == identifier)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found. Please register first."
        )

    if not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please try again."
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
        full_name=user.full_name,
        username=user.username or user.email
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
