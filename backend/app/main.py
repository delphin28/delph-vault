from hmac import compare_digest

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
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
from app.dependencies import CSRF_COOKIE, CSRF_HEADER, get_current_user, issue_csrf_token, verify_csrf_token
from app.rate_limit import limiter

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.middleware("http")
async def csrf_protection(request, call_next):
    safe_methods = {"GET", "HEAD", "OPTIONS"}
    public_paths = {"/auth/login", "/auth/csrf", "/users"}
    if request.method not in safe_methods and request.url.path not in public_paths:
        csrf_cookie = request.cookies.get(CSRF_COOKIE)
        csrf_header = request.headers.get(CSRF_HEADER)
        if (
            not csrf_cookie
            or not csrf_header
            or not compare_digest(csrf_cookie, csrf_header)
            or not verify_csrf_token(csrf_cookie)
        ):
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=403, content={"detail": "CSRF validation failed"})

    response = await call_next(request)
    if not request.cookies.get(CSRF_COOKIE):
        response.set_cookie(CSRF_COOKIE, issue_csrf_token(), httponly=False, secure=True, samesite="strict", max_age=3600, path="/")
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://localhost:8443",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(
    user_router,
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