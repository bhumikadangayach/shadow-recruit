from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    app_name: str = "Shadow Recruit"
    app_env: str = "development"
    debug: bool = True
    api_prefix: str = "/api/v1"
    
    # Security
    secret_key: str = "your-super-secret-key-change-this"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    
    # Database & Storage
    database_url: str = "sqlite+aiosqlite:///./shadow_recruit.db"
    upload_dir: str = "uploads"
    chroma_persist_dir: str = "chroma_db"
    
    # OpenAI
    # openai_api_key: str = "your-openai-api-key"
    groq_api_key: str = ""
    
    # CORS
    allowed_origins: str = "http://localhost:5173"

    @property
    def allowed_origins_list(self) -> List[str]:
        return self.allowed_origins.split(",")

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    class Config:
        env_file = ".env"

settings = Settings()