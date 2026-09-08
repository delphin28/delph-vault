# password_controller.py

from fastapi import APIRouter

router = APIRouter(
    prefix="/passwords",
    tags=["Passwords"]
)