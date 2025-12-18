
import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # API 设置
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "AuditGraph Backend"
    
    # Neo4j 设置
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USERNAME: str = "neo4j"
    NEO4J_PASSWORD: str = "password"
    
    # LLM 设置 (Google Gemini / OpenAI / Doubao)
    GOOGLE_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    
    # 豆包 (火山引擎) 设置
    ARK_API_KEY: str = ""
    DOUBAO_API_KEY: str = ""
    DOUBAO_MODEL: str = "doubao-seed-1-6-250615"
    DOUBAO_BASE_URL: str = "https://ark.cn-beijing.volces.com/api/v3"
    
    # RAG 设置
    EMBEDDING_MODEL: str = "models/embedding-001" 
    
    # Auth Settings
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_HERE_CHANGE_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30 
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
