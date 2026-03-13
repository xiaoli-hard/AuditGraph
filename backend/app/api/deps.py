from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import BaseModel, ValidationError
from app.core import security
from app.core.config import settings
from app.db.neo4j_client import neo4j_client

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class CurrentUser(BaseModel):
    username: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: str
    disabled: bool = False

def get_current_user(token: str = Depends(reusable_oauth2)) -> CurrentUser:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    if not token_data.sub:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token")
    user = neo4j_client.get_user(token_data.sub)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if user.get("disabled"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User disabled")
    return CurrentUser(
        username=user.get("username"),
        full_name=user.get("full_name"),
        email=user.get("email"),
        role=user.get("role", "user"),
        disabled=bool(user.get("disabled", False))
    )

def get_current_admin(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return current_user
