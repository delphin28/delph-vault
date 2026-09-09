from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi import Depends

from app.controllers.Password_controller import router as password_router
from app.controllers.auth_controller import router as auth_router
from app.controllers.category_controller import router as category_router
from app.controllers.user_controller import router as user_router
from app.database.connection import get_db
from app.database.init_db import init_db
from app.database.seed import seed_users, seed_vault
from app.dependencies import get_current_user

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
app.include_router(
    user_router,
    dependencies=[Depends(get_current_user)],
)
app.include_router(
    password_router,
    dependencies=[Depends(get_current_user)],
)
app.include_router(
    category_router,
    dependencies=[Depends(get_current_user)],
)


@app.on_event("startup")
def startup() -> None:
    init_db()
    db = next(get_db())
    try:
        admin = seed_users(db)
        seed_vault(db, admin)
    finally:
        db.close()


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