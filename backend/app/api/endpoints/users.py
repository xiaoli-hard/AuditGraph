from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.api.deps import get_current_admin, CurrentUser
from app.core import security
from app.db.neo4j_client import neo4j_client

router = APIRouter()

class UserOut(BaseModel):
    username: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: str
    disabled: bool = False

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: str = "user"

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    disabled: Optional[bool] = None
    password: Optional[str] = None

@router.get("/", response_model=List[UserOut])
async def list_users(_: CurrentUser = Depends(get_current_admin)):
    users = neo4j_client.list_users()
    return [
        UserOut(
            username=u.get("username"),
            full_name=u.get("full_name"),
            email=u.get("email"),
            role=u.get("role", "user"),
            disabled=bool(u.get("disabled", False))
        )
        for u in users
    ]

@router.post("/", response_model=UserOut, status_code=201)
async def create_user(payload: UserCreate, _: CurrentUser = Depends(get_current_admin)):
    if neo4j_client.get_user(payload.username):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")
    if payload.email and neo4j_client.get_user_by_email(payload.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
    user_payload = {
        "username": payload.username,
        "password_hash": security.get_password_hash(payload.password),
        "full_name": payload.full_name,
        "email": payload.email,
        "role": payload.role,
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

@router.patch("/{username}", response_model=UserOut)
async def update_user(username: str, payload: UserUpdate, _: CurrentUser = Depends(get_current_admin)):
    if payload.email and neo4j_client.get_user_by_email(payload.email):
        existing = neo4j_client.get_user_by_email(payload.email)
        if existing and existing.get("username") != username:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
    updates = {}
    if payload.full_name is not None:
        updates["full_name"] = payload.full_name
    if payload.email is not None:
        updates["email"] = payload.email
    if payload.role is not None:
        updates["role"] = payload.role
    if payload.disabled is not None:
        updates["disabled"] = payload.disabled
    if payload.password:
        updates["password_hash"] = security.get_password_hash(payload.password)
    user = neo4j_client.update_user(username, updates)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserOut(
        username=user.get("username"),
        full_name=user.get("full_name"),
        email=user.get("email"),
        role=user.get("role", "user"),
        disabled=bool(user.get("disabled", False))
    )

@router.delete("/{username}", status_code=204)
async def delete_user(username: str, _: CurrentUser = Depends(get_current_admin)):
    neo4j_client.delete_user(username)
    return None
