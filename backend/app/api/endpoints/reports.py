from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from uuid import uuid4
from app.db.neo4j_client import neo4j_client

router = APIRouter()

class AuditReport(BaseModel):
    id: str
    title: str
    date: str
    status: str
    summary: str
    findingsCount: int

class ReportCreateRequest(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    status: Optional[str] = None
    findingsCount: Optional[int] = None

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

@router.post("/", response_model=AuditReport)
async def create_report(request: ReportCreateRequest):
    now = datetime.utcnow().strftime("%Y-%m-%d")
    report_id = f"REP-{uuid4().hex[:8].upper()}"
    payload = {
        "id": report_id,
        "title": request.title or f"审计报告 {now}",
        "date": now,
        "status": request.status or "Draft",
        "summary": request.summary or "自动生成的审计摘要，包含关键控制项与风险概览。",
        "findingsCount": request.findingsCount if request.findingsCount is not None else 0
    }
    query = """
    CREATE (r:AuditReport)
    SET r = $payload
    RETURN r.id as id, r.title as title, r.date as date, r.status as status, r.summary as summary, r.findingsCount as findingsCount
    """
    results = neo4j_client.execute_query(query, {"payload": payload})
    if not results:
        raise HTTPException(status_code=500, detail="Failed to create report")
    return results[0]

@router.get("/{report_id}/download")
async def download_report(report_id: str):
    query = """
    MATCH (r:AuditReport {id: $id})
    RETURN r.id as id, r.title as title, r.date as date, r.status as status, r.summary as summary, r.findingsCount as findingsCount
    """
    results = neo4j_client.execute_query(query, {"id": report_id})
    if not results:
        raise HTTPException(status_code=404, detail="Report not found")
    report = results[0]
    content = (
        f"审计报告: {report['title']}\n"
        f"日期: {report['date']}\n"
        f"状态: {report['status']}\n"
        f"发现项数量: {report['findingsCount']}\n\n"
        f"摘要:\n{report['summary']}\n"
    )
    return {"filename": f"{report_id}.txt", "content": content}
