import os
import logging

ENVIRONMENT = os.getenv('ENVIRONMENT', 'development').lower()
SECRET_KEY = os.getenv('SECRET_KEY', 'portable-theatre-super-secret-key-2026')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

ENABLE_DEMO_ADMIN_ENV = os.getenv('ENABLE_DEMO_ADMIN')
if ENABLE_DEMO_ADMIN_ENV is not None:
    ENABLE_DEMO_ADMIN = ENABLE_DEMO_ADMIN_ENV.lower() == 'true'
else:
    ENABLE_DEMO_ADMIN = ENVIRONMENT != 'production'

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

    # Convert standard postgres / postgresql schemas to asyncpg driver format
    if raw_url.startswith('postgres://'):
        return raw_url.replace('postgres://', 'postgresql+asyncpg://', 1)
    elif raw_url.startswith('postgresql://') and '+asyncpg' not in raw_url:
        return raw_url.replace('postgresql://', 'postgresql+asyncpg://', 1)

    return raw_url

DATABASE_URL = resolve_database_url()

if ENVIRONMENT == 'production' and SECRET_KEY == 'portable-theatre-super-secret-key-2026':
    logging.warning('⚠️ SECURITY WARNING: Production environment is using default SECRET_KEY!')
