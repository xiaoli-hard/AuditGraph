from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.db.neo4j_client import neo4j_client

router = APIRouter()

class Document(BaseModel):
    id: str
    name: str
    type: str
    size: Optional[str] = "Unknown"
    uploadDate: Optional[str] = None
    status: Optional[str] = "Indexed"

@router.get("/", response_model=List[Document])
async def get_documents():
    query = """
    MATCH (d:Document)
    RETURN d.id as id, d.name as name, d.type as type, d.size as size, d.uploadDate as uploadDate, d.status as status
    """
    try:
        results = neo4j_client.execute_query(query)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
