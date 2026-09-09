import base64
import json
import secrets

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.kdf.scrypt import Scrypt


SALT_BYTES = 16
SCRYPT_N = 2**14
SCRYPT_R = 8
SCRYPT_P = 1


def _derive_key(password: str, salt: bytes) -> bytes:
    derived_key = Scrypt(
        salt=salt,
        length=32,
        n=SCRYPT_N,
        r=SCRYPT_R,
        p=SCRYPT_P,
    ).derive(password.encode())
    return base64.urlsafe_b64encode(derived_key)


def encrypt_export(data: dict, password: str) -> dict:
    salt = secrets.token_bytes(SALT_BYTES)
    key = _derive_key(password, salt)
    ciphertext = Fernet(key).encrypt(json.dumps(data).encode()).decode()

    return {
        "format": "delph-vault-encrypted-export",
        "version": 1,
        "kdf": {
            "name": "scrypt",
            "salt": base64.urlsafe_b64encode(salt).decode(),
            "n": SCRYPT_N,
            "r": SCRYPT_R,
            "p": SCRYPT_P,
        },
        "ciphertext": ciphertext,
    }
