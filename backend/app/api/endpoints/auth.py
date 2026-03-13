from datetime import timedelta
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core import security
from app.core.config import settings
from app.db.neo4j_client import neo4j_client
from app.api.deps import get_current_user, CurrentUser
from pydantic import BaseModel

router = APIRouter()

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None
    email: Optional[str] = None

class UserOut(BaseModel):
    username: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: str
    disabled: bool = False

@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()) -> Any:
    user = neo4j_client.get_user(form_data.username)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect username or password")
    if not security.verify_password(form_data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect username or password")
    if user.get("disabled"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User disabled")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.get("username")}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UserOut, status_code=201)
async def register_user(payload: UserCreate):
    if neo4j_client.get_user(payload.username):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")
    if payload.email and neo4j_client.get_user_by_email(payload.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
    user_payload = {
        "username": payload.username,
        "password_hash": security.get_password_hash(payload.password),
        "full_name": payload.full_name,
        "email": payload.email,
        "role": "user",
        "disabled": False
    }
    user = neo4j_client.create_user(user_payload)
    return UserOut(
        username=user.get("username"),
        full_name=user.get("full_name"),
        email=user.get("email"),
        role=user.get("role", "user"),
        disabled=bool(user.get("disabled", False))
    )

@router.get("/me", response_model=UserOut)
async def get_me(current_user: CurrentUser = Depends(get_current_user)):
    return UserOut(
        username=current_user.username,
        full_name=current_user.full_name,
        email=current_user.email,
        role=current_user.role,
        disabled=current_user.disabled
    )
