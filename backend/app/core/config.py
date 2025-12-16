
import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "AuditGraph Backend"
    
    # Neo4j Settings
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USERNAME: str = "neo4j"
    NEO4J_PASSWORD: str = "password"
    
    # LLM Settings (Google Gemini / OpenAI)
    GOOGLE_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    
    # RAG Settings
    EMBEDDING_MODEL: str = "models/embedding-001" 
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
