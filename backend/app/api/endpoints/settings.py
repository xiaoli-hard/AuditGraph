from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db.neo4j_client import neo4j_client
from app.core.config import settings

router = APIRouter()

class SettingsPayload(BaseModel):
    modelName: str
    temperature: float
    maxTokens: int
    retrievalTopK: int
    useGraphRAG: bool

def default_settings():
    return {
        "id": "default",
        "modelName": settings.DOUBAO_MODEL,
        "temperature": 0.7,
        "maxTokens": 2048,
        "retrievalTopK": 5,
        "useGraphRAG": True
    }

@router.get("/", response_model=SettingsPayload)
async def get_settings():
    query = """
    MATCH (s:SystemSettings {id: 'default'})
    RETURN s
    """
    try:
        results = neo4j_client.execute_query(query)
        if not results:
            return default_settings()
        stored = results[0].get("s", {})
        merged = default_settings()
        merged.update({k: stored.get(k, merged[k]) for k in merged.keys()})
        return merged
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/", response_model=SettingsPayload)
async def update_settings(payload: SettingsPayload):
    query = """
    MERGE (s:SystemSettings {id: 'default'})
    SET s.modelName = $modelName,
        s.temperature = $temperature,
        s.maxTokens = $maxTokens,
        s.retrievalTopK = $retrievalTopK,
        s.useGraphRAG = $useGraphRAG
    RETURN s
    """
    try:
        results = neo4j_client.execute_query(query, payload.model_dump())
        if not results:
            raise HTTPException(status_code=500, detail="Failed to save settings")
        stored = results[0].get("s", {})
        merged = default_settings()
        merged.update({k: stored.get(k, merged[k]) for k in merged.keys()})
        return merged
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
