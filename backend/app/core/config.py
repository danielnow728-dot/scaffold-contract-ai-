import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Contract Review AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "password")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "contract_review")
    # For local development, fallback to SQLite if not in prod
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "local")
    if os.getenv("RENDER"):
        # Ensure directory exists on Render
        os.makedirs("/data/uploads", exist_ok=True)
        SQLALCHEMY_DATABASE_URI: str = "sqlite:////data/contract_review.db"
        UPLOAD_DIR: str = "/data/uploads"
    elif ENVIRONMENT == "local":
        os.makedirs("./data/uploads", exist_ok=True)
        SQLALCHEMY_DATABASE_URI: str = "sqlite:///./contract_review.db"
        UPLOAD_DIR: str = "./data/uploads"
    else:
        SQLALCHEMY_DATABASE_URI: str = f"postgresql+pg8000://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}/{POSTGRES_DB}"
        UPLOAD_DIR: str = "./data/uploads"
    
    # AI APIs
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
