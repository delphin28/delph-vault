from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.controllers.Password_controller import router as password_router
from app.controllers.auth_controller import router as auth_router
from app.controllers.user_controller import router as user_router
from app.database.connection import get_db

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(password_router)


@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/health")
def health():
    return {
        "status": "UP"
    }


@app.get("/health/db")
def database_health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {
        "status": "UP",
        "database": "reachable",
    }