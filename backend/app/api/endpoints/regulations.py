from fastapi import APIRouter, HTTPException
from typing import List, Optional, Any
from pydantic import BaseModel
from app.db.neo4j_client import neo4j_client

router = APIRouter()

class RegulationClause(BaseModel):
    id: str
    code: str
    title: str
    description: str
    children: Optional[List[Any]] = []

@router.get("/", response_model=List[RegulationClause])
async def get_regulations():
    # Fetch ControlDomains (e.g. A.5, A.9) and their Controls (e.g. A.5.1.1)
    # This assumes a structure of Standard -> ControlDomain -> Control
    query = """
    MATCH (d:ControlDomain)
    OPTIONAL MATCH (d)-[:CONTAINS]->(c:Control)
    WITH d, c
    ORDER BY d.code, c.code
    WITH d, collect({
        id: c.id,
        code: c.code,
        title: c.title,
        description: c.description,
        children: []
    }) as controls
    RETURN {
        id: d.id,
        code: d.code,
        title: d.title,
        description: d.description,
        children: [x IN controls WHERE x.id IS NOT NULL]
    } as domain
    """
    try:
        results = neo4j_client.execute_query(query)
        # results is a list of dicts, each with a 'domain' key
        regulations = [record['domain'] for record in results]
        return regulations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}/details")
async def get_regulation_details(id: str):
    query = """
    MATCH (c:Control {id: $id})
    OPTIONAL MATCH (c)-[:MITIGATES]->(r:Risk)
    OPTIONAL MATCH (c)<-[:EVIDENCED_BY]-(d:Document)
    RETURN {
        control: {
            id: c.id,
            code: c.code,
            title: c.title,
            description: c.description
        },
        risks: collect(DISTINCT {
            id: r.id,
            title: r.title,
            severity: r.severity,
            status: r.status,
            description: r.description
        }),
        evidence: collect(DISTINCT {
            id: d.id,
            name: d.name,
            status: d.status
        })
    } as details
    """
    try:
        results = neo4j_client.execute_query(query, parameters={"id": id})
        if not results:
             raise HTTPException(status_code=404, detail="Regulation control not found")
        return results[0]['details']
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
