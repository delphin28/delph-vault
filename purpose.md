# Password Vault

## Overview

Password Vault is a secure web application designed to store, organize, and manage personal credentials in an encrypted digital vault.

The application provides strong authentication mechanisms, encrypted password storage, advanced password management tools, and security-focused user interface protections to minimize accidental exposure of sensitive data.

---

# Objectives

The main objective of the project is to provide users with a secure environment for storing and managing credentials while implementing modern security practices including:

- Secure authentication
- Password encryption
- Multi-factor verification
- Session protection
- Password generation tools
- Credential categorization and search

---

# Technical Architecture

## Backend

The backend is built using:

- Python 3
- FastAPI (preferred)
- RESTful API architecture

### Responsibilities

- User authentication
- JWT token generation and validation
- Business logic implementation
- Encryption and decryption operations
- Database interactions
- Security validations

---

## Frontend

The frontend is developed using:

- React.js

### Responsibilities

- Single Page Application (SPA)
- Authentication screens
- Vault management interface
- Search and filtering features
- Secure display of credentials

---

## Database

Supported databases:

- SQLite (development)
- PostgreSQL (production)

### Stored data

- User accounts
- Master password hashes
- PIN codes (hashed)
- Vault entries
- Categories
- URLs and metadata

---

## ORM Layer

SQLAlchemy is used as the Object Relational Mapper.

### Benefits

- Database abstraction
- Secure query generation
- Easier migration between SQLite and PostgreSQL
- Relationship management

---

# Security Architecture

## Master Password Protection

The master password is never stored in plain text.

### Requirements

- One unique salt per user
- Strong password hashing algorithm

### Recommended Libraries

- passlib[bcrypt]
- argon2-cffi

---

## Password Encryption

Stored credentials must remain decryptable when the user is authenticated.

### Encryption Mechanism

- Symmetric encryption
- cryptography.fernet module

### Characteristics

Fernet provides:

- AES-128 encryption
- CBC mode
- HMAC-SHA256 signature verification

---

## Authentication System

Authentication uses JSON Web Tokens (JWT).

### Workflow

1. User submits credentials.
2. Master password is verified.
3. PIN code is verified.
4. JWT access token is issued.
5. Protected endpoints require a valid JWT.

---

# Functional Specifications

## Account Management

### Registration

A user account contains:

- Email address
- Master password
- 4-digit confidential PIN

### Login

Authentication occurs in two steps:

1. Master password verification
2. PIN verification

Only after successful validation of both factors can access be granted.

### Logout

Logout immediately removes authentication tokens stored on the client side.

---

# Digital Vault Management

## Password Entry

Each vault entry contains:

| Field | Description |
|---------|-------------|
| Title | Service name |
| Email / Username | Account identifier |
| Password | Encrypted password |
| Category | Classification type |
| URL | Service link |

### Examples

- GitHub
- Gmail
- Banking accounts
- Wi-Fi credentials
- Professional services

---

## Categories

Typical categories include:

- Wi-Fi
- Banking
- Professional
- Personal
- Miscellaneous

---

# Password Visualization Security

Passwords are never displayed in plain text by default.

## Default State

```text
••••••••
```

## Reveal Feature

A visibility toggle allows temporary display of the password.

## Auto-Hide Mechanism

When revealed:

- The password automatically returns to hidden mode after 10 seconds of inactivity.

---

# Data Leakage Prevention

To reduce unauthorized disclosure risks, the interface enforces several protections.

## Copy Prohibition

The application intentionally does not provide:

- Copy button
- Clipboard export functionality

## Text Selection Blocking

Password containers disable text selection.

Example:

```css
user-select: none;
```

## Context Menu Protection

Right-click actions are disabled in password display zones.

## Keyboard Shortcut Interception

The application blocks common copy shortcuts:

- Ctrl + C
- Cmd + C

---

# Search and Filtering

Users can quickly locate credentials using category-based filtering.

Examples:

- Display only banking accounts
- Display only professional accounts
- Display only personal accounts

Filtering updates the displayed 