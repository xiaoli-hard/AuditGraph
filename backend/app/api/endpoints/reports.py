from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel
from app.db.neo4j_client import neo4j_client

router = APIRouter()

class AuditReport(BaseModel):
    id: str
    title: str
    date: str
    status: str
    summary: str
    findingsCount: int

@router.get("/", response_model=List[AuditReport])
async def get_reports():
    query = """
    MATCH (r:AuditReport)
    RETURN r.id as id, r.title as title, r.date as date, r.status as status, r.summary as summary, r.findingsCount as findingsCount
    ORDER BY r.date DESC
    """
    try:
        results = neo4j_client.execute_query(query)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
