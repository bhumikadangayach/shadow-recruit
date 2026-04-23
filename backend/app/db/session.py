from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os

# Get DATABASE_URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

# Fix for Render PostgreSQL URLs
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    DATABASE_URL,
    echo=True if os.getenv("DEBUG") == "True" else False,
    future=True
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# ✅ Create tables function
async def create_tables():
    """Create all database tables"""
    # Import Base from models to ensure all models are registered
    from app.models.models import Base
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# Dependency for FastAPI routes
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()