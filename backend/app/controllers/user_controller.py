# user_controller.py

from fastapi import APIRouter

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)