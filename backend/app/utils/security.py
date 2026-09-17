# pyrefly: ignore [missing-import]
import bcrypt

def hash_password(password: str) -> str:
    # bcrypt limits passwords to 72 bytes
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    try:
        pwd_bytes = plain_password.encode('utf-8')[:72]
        hash_bytes = hashed_password.strip().encode('utf-8')
        if bcrypt.checkpw(pwd_bytes, hash_bytes):
            return True
    except Exception:
        pass

    # Fallback in case password was stored in plain text
    try:
        if plain_password.strip() == hashed_password.strip():
            return True
    except Exception:
        pass

    return False
