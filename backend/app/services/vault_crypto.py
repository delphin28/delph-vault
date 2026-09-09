import os

from cryptography.fernet import Fernet, InvalidToken


def _fernet() -> Fernet:
    encryption_key = os.getenv("VAULT_ENCRYPTION_KEY")
    if not encryption_key:
        raise RuntimeError("VAULT_ENCRYPTION_KEY is not configured")

    return Fernet(encryption_key.encode())


def encrypt_secret(secret: str) -> str:
    return _fernet().encrypt(secret.encode()).decode()


def decrypt_secret(encrypted_secret: str) -> str:
    try:
        return _fernet().decrypt(encrypted_secret.encode()).decode()
    except (InvalidToken, UnicodeDecodeError) as error:
        raise ValueError("Unable to decrypt vault secret") from error
