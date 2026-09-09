from fastapi import Request
from slowapi import Limiter


def client_identifier(request: Request) -> str:
    return request.headers.get("x-real-ip") or (
        request.client.host if request.client else "unknown"
    )


limiter = Limiter(key_func=client_identifier)
