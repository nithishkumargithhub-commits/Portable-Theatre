import os
import logging

ENVIRONMENT = os.getenv('ENVIRONMENT', 'development').lower()
SECRET_KEY = os.getenv('SECRET_KEY', 'portable-theatre-super-secret-key-2026')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

# Disable demo admin bypass in production and by default
ENABLE_DEMO_ADMIN = False

ALLOWED_ORIGINS_RAW = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000')
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_RAW.split(',') if origin.strip()]

def resolve_database_url():
    env = os.getenv('ENVIRONMENT', 'development').lower()
    raw_url = os.getenv('DATABASE_URL')

    if env == 'production':
        if not raw_url:
            raise ValueError(
                "❌ PRODUCTION DATABASE ERROR: DATABASE_URL environment variable is mandatory in production! "
                "SQLite is prohibited in production to prevent data loss on ephemeral container restarts. "
                "Please configure a valid PostgreSQL DATABASE_URL (e.g. postgresql+asyncpg://user:password@host:5432/dbname)."
            )
        if "sqlite" in raw_url.lower():
            raise ValueError(
                "❌ PRODUCTION DATABASE ERROR: SQLite is prohibited in production! "
                "Ephemeral container disks reset SQLite databases on restart. "
                "Please configure a persistent PostgreSQL DATABASE_URL."
            )

    if not raw_url:
        return 'sqlite+aiosqlite:///./portable_theatre.db'

    url = raw_url

    # Convert standard postgres / postgresql schemas to asyncpg driver format
    if url.startswith('postgres://'):
        url = url.replace('postgres://', 'postgresql+asyncpg://', 1)
    elif url.startswith('postgresql://') and '+asyncpg' not in url:
        url = url.replace('postgresql://', 'postgresql+asyncpg://', 1)

    # Convert psycopg2 sslmode parameter to asyncpg ssl parameter
    if 'sslmode=' in url:
        url = url.replace('sslmode=', 'ssl=')

    return url

DATABASE_URL = resolve_database_url()

if ENVIRONMENT == 'production' and SECRET_KEY == 'portable-theatre-super-secret-key-2026':
    logging.warning('⚠️ SECURITY WARNING: Production environment is using default SECRET_KEY!')
