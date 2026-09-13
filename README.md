# Delph Vault

Delph Vault is a security-focused password manager with a React single-page frontend, a FastAPI backend, and PostgreSQL persistence. Users can create an encrypted vault, organize credentials with categories, generate strong passwords, enable authenticator-based MFA, and export vault data in an encrypted format.

The application is designed to run behind an HTTPS Nginx reverse proxy. Docker Compose provides the complete local deployment, including PostgreSQL, the backend API, the production frontend image, and TLS termination.

## Features

### Account and authentication

- User registration with email, username, and master password.
- Login with an HttpOnly JWT cookie.
- Optional TOTP MFA with authenticator applications such as Microsoft Authenticator.
- One-time backup codes for MFA recovery.
- Password reset protected by MFA.
- Logout and password-reset session invalidation through per-user session versions.
- Session persistence across page refreshes while the JWT is valid.

### Vault management

- Create, view, reveal, update, and delete password entries.
- Encrypted password values stored with Fernet before persistence.
- Password reveal is temporary in the frontend and does not expose the stored ciphertext.
- Secure password generator using browser cryptographic randomness.
- Search by service name or URL.
- Filter entries by category.
- Open saved service URLs in a separate browser tab.

### Categories

- Create categories.
- Rename categories without changing the category IDs used by vault entries.
- Assign and reassign vault entries to user-owned categories.

### Encrypted export

The vault can be exported as encrypted JSON. The export uses a password-derived key with scrypt and Fernet encryption. The export contains vault metadata and decrypted entry values only inside the encrypted payload.

## Architecture

```text
Browser
	|
	| HTTPS :8443
	v
Nginx reverse proxy
	|-- /       -> frontend static files
	|-- /api/*  -> FastAPI backend
												 |
												 v
										PostgreSQL
```

### Backend

- Python 3.12
- FastAPI
- SQLAlchemy
- PostgreSQL with `psycopg`
- PyJWT
- `pwdlib` with Argon2 password hashing
- `cryptography` Fernet encryption
- PyOTP for TOTP MFA
- SlowAPI request rate limiting

The backend exposes authentication, user, category, password, health, and encrypted-export endpoints. Protected resources are scoped to the authenticated user's ID.

### Frontend

- React
- React Router 6
- Material UI
- Axios
- `qrcode.react` for MFA enrollment QR codes

The production frontend is compiled into static assets and served by Nginx. The browser uses `/api` through the reverse proxy in the Docker deployment.

### Database

PostgreSQL is the Docker deployment database. The backend test suite uses isolated in-memory SQLite fixtures and does not modify the application database.

## Security model

### Passwords and secrets

- Master passwords are hashed with Argon2 through `pwdlib`.
- Vault passwords are encrypted with Fernet using `VAULT_ENCRYPTION_KEY`.
- MFA secrets are encrypted before database storage.
- JWT signing uses `JWT_SECRET_KEY`.
- Secrets must be supplied through environment variables and must not be committed.

### Cookies and sessions

- Authentication tokens use `HttpOnly`, `SameSite=Strict`, and `Secure` cookies in the Docker HTTPS deployment.
- JWTs contain an expiration time and a per-user session version.
- Logout and password reset increment the session version, invalidating older tokens.
- `COOKIE_SECURE` defaults to secure cookies. Set it to `false` only for deliberate direct HTTP development.

### CSRF protection

State-changing requests require a signed double-submit CSRF token:

- `csrf_token` cookie
- Matching `X-CSRF-Token` header

The frontend obtains a token before login and registration. Missing, mismatched, or forged tokens are rejected with HTTP 403. Only the read-only `/auth/csrf` bootstrap endpoint is exempt from the middleware.

### Authorization

Password and category queries are filtered by the current user's ID. A user cannot read, update, delete, export, or reassign another user's vault data through the API.

### Deployment defaults

- Demo seeding is disabled unless `SEED_DEMO_DATA=true`.
- SQLAlchemy SQL logging is disabled unless `SQLALCHEMY_ECHO=true`.
- CORS origins are configured through `CORS_ALLOWED_ORIGINS`.
- PostgreSQL is available to backend containers through the private Docker network and is not published to the host.

## Requirements

For Docker deployment:

- Docker Desktop with Docker Compose
- Windows, macOS, or Linux
- `mkcert` for locally trusted HTTPS certificates

For direct development:

- Python 3.12+
- Node.js 22+
- PostgreSQL, or another database URL supported by SQLAlchemy

## Configuration

Copy the environment template before starting the stack:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and replace all placeholder values. Do not commit `.env`.

Required production values include:

```text
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
JWT_SECRET_KEY
VAULT_ENCRYPTION_KEY
```

Generate cryptographic values with:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Important optional settings:

| Variable | Purpose | Recommended production value |
| --- | --- | --- |
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Session lifetime | A short operationally appropriate duration |
| `SEED_DEMO_DATA` | Create demo data at startup | `false` |
| `SQLALCHEMY_ECHO` | Log SQL statements | `false` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated trusted browser origins | `https://your-domain.example` |
| `COOKIE_SECURE` | Require HTTPS for cookies | `true` |

## Local HTTPS setup

The Compose proxy expects these files:

```text
certs/localhost.crt
certs/localhost.key
```

Install `mkcert` on Windows:

```powershell
winget install FiloSottile.mkcert
```

Create a local certificate from the repository root:

```powershell
mkcert -install
New-Item -ItemType Directory -Force certs
mkcert -key-file certs/localhost.key -cert-file certs/localhost.crt localhost 127.0.0.1 ::1
```

The `certs` directory is ignored by Git.

## Run with Docker Compose

From the repository root:

```powershell
docker compose up -d --build
```

Open the application at:

```text
https://localhost:8443
```

Check service status:

```powershell
docker compose ps
```

View logs:

```powershell
docker compose logs -f backend
docker compose logs -f https
```

Stop the stack:

```powershell
docker compose down
```

The PostgreSQL data volume is preserved by `docker compose down`. To remove the local database volume as well, use the destructive command below only for disposable development data:

```powershell
docker compose down -v
```

## API overview

The reverse proxy exposes the backend below `/api`, while the FastAPI application itself uses the paths listed here:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Backend health check |
| `GET` | `/health/db` | Database connectivity check |
| `GET` | `/auth/csrf` | Obtain the CSRF bootstrap token |
| `POST` | `/auth/login` | Authenticate and issue a session cookie |
| `POST` | `/auth/logout` | Revoke the current session and clear the cookie |
| `GET` | `/auth/me` | Return the current user |
| `POST` | `/auth/mfa/setup` | Start MFA enrollment |
| `POST` | `/auth/mfa/verify` | Enable MFA and create backup codes |
| `POST` | `/auth/mfa/disable` | Disable MFA after verification |
| `GET` | `/passwords` | List the current user's vault entries |
| `POST` | `/passwords` | Create a vault entry |
| `PUT` | `/passwords/{id}` | Update a vault entry |
| `GET` | `/passwords/{id}/reveal` | Temporarily reveal a password |
| `DELETE` | `/passwords/{id}` | Delete a vault entry |
| `GET` | `/categories` | List categories |
| `POST` | `/categories` | Create a category |
| `PUT` | `/categories/{id}` | Rename a category |
| `POST` | `/passwords/export` | Create an encrypted vault export |

## Testing

### Backend tests

Install development dependencies and run the isolated backend tests:

```powershell
Push-Location backend
python -m pip install -r requirements-dev.txt
pytest -q
Pop-Location
```

The backend tests cover JWT expiry, session invalidation, CSRF enforcement, category updates, password updates, and ownership checks.

### Frontend tests and build

```powershell
Push-Location frontend
npm ci
npm test -- --watchAll=false
npm run build
Pop-Location
```

The frontend tests cover application rendering, category editing, category API calls, and password update API calls.

## Continuous integration

GitHub Actions is configured in [.github/workflows/ci.yml](.github/workflows/ci.yml). On pushes to `main` or `master` and on pull requests, it:

1. Installs Python 3.12 backend dependencies.
2. Runs the backend pytest suite.
3. Installs frontend dependencies with `npm ci`.
4. Runs frontend tests.
5. Builds the frontend production bundle.

## Production checklist

- Use unique, strong values for all database and application secrets.
- Keep `.env`, certificates, backup codes, and encrypted exports outside version control.
- Keep `SEED_DEMO_DATA=false`.
- Keep `SQLALCHEMY_ECHO=false`.
- Set `COOKIE_SECURE=true`.
- Set `CORS_ALLOWED_ORIGINS` to the real HTTPS frontend origin only.
- Use a managed certificate and real hostname instead of the local `mkcert` certificate.
- Put PostgreSQL on a private network and restrict database access at the infrastructure layer.
- Back up the PostgreSQL volume and `VAULT_ENCRYPTION_KEY` securely. Encrypted vault values cannot be recovered if the encryption key is lost.
- Rotate JWT and vault keys according to an operational key-management policy. Key rotation requires a migration strategy for existing encrypted data.
- Review dependency security alerts before deploying.

## Repository layout

```text
backend/
	app/
		controllers/     API routes
		database/        Engine, schema initialization, optional demo seed
		models/          SQLAlchemy models
		repositories/    User-scoped database operations
		services/        Vault and export encryption
		tests/            Backend unit and integration tests
frontend/
	src/
		api/             Axios API clients and frontend API tests
		components/      Shared layout components
		features/        Auth, dashboard, categories, settings, and vault pages
		routes/          React Router configuration
nginx/
	default.conf       HTTPS reverse proxy configuration
.github/workflows/
	ci.yml             GitHub Actions test and build workflow
docker-compose.yaml  Local production-style multi-container deployment
```

## License

See [LICENSE](LICENSE).