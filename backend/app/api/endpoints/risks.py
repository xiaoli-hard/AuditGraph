from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from app.db.neo4j_client import neo4j_client
from datetime import datetime
from uuid import uuid4

router = APIRouter()

class RiskItem(BaseModel):
    id: str
    title: str
    severity: str
    category: Optional[str] = None
    status: str
    description: str
    dateIdentified: Optional[str] = None
    owner: Optional[str] = None
    remediation_suggestion: Optional[str] = None
    remediation_source: Optional[str] = None

class RemediationRequest(BaseModel):
    suggestion: str

class RiskCreateRequest(BaseModel):
    title: str
    description: str
    severity: str
    category: Optional[str] = None
    owner: Optional[str] = None

@router.get("/", response_model=List[RiskItem])
async def get_risks(
    search: Optional[str] = Query(default=None),
    severity: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    sort: Optional[str] = Query(default=None)
):
    """
    获取所有风险项列表。
    """
    order_clause = ""
    if sort == "severity_asc":
        order_clause = "ORDER BY CASE r.severity WHEN 'Low' THEN 1 WHEN 'Medium' THEN 2 WHEN 'High' THEN 3 ELSE 4 END ASC"
    elif sort == "severity_desc":
        order_clause = "ORDER BY CASE r.severity WHEN 'Low' THEN 1 WHEN 'Medium' THEN 2 WHEN 'High' THEN 3 ELSE 4 END DESC"

    query = f"""
    MATCH (r:Risk)
    WHERE ($search IS NULL OR toLower(r.title) CONTAINS toLower($search) OR toLower(r.description) CONTAINS toLower($search) OR toLower(r.id) CONTAINS toLower($search))
      AND ($severity IS NULL OR r.severity = $severity)
      AND ($status IS NULL OR r.status = $status)
      AND ($category IS NULL OR r.category = $category)
    RETURN r
    {order_clause}
    """
    results = neo4j_client.execute_query(query, {
        "search": search,
        "severity": severity,
        "status": status,
        "category": category
    })
    
    # results 是字典列表, 例如 [{'r': {'id': 'R-001', ...}}]
    risks = []
    for record in results:
        node_data = record.get("r", {})
        # 确保所有必需字段都存在 (Pydantic 验证)
        # 我们依赖种子数据的完整性，或者在需要时提供默认值。
        risks.append(node_data)
        
    return risks

@router.post("/", response_model=RiskItem)
async def create_risk(request: RiskCreateRequest):
    risk_id = f"R-{uuid4().hex[:8].upper()}"
    now = datetime.utcnow().strftime("%Y-%m-%d")
    payload = {
        "id": risk_id,
        "title": request.title,
        "description": request.description,
        "severity": request.severity,
        "category": request.category,
        "owner": request.owner,
        "status": "Open",
        "dateIdentified": now
    }
    query = """
    CREATE (r:Risk)
    SET r = $payload
    RETURN r
    """
    results = neo4j_client.execute_query(query, {"payload": payload})
    if not results:
        raise HTTPException(status_code=500, detail="Failed to create risk")
    return results[0].get("r")

from app.langgraph_agent.graph import run_agent

@router.post("/{risk_id}/generate-suggestion")
async def generate_remediation_suggestion(risk_id: str):
    """
    使用 AI 生成修复建议
    """
    # 1. 获取风险详情
    query = "MATCH (r:Risk {id: $id}) RETURN r"
    results = neo4j_client.execute_query(query, {"id": risk_id})
    if not results:
         raise HTTPException(status_code=404, detail="Risk not found")
    risk = results[0].get("r")
    
    # 2. 构建 Prompt 调用 Agent
    prompt = f"""
    请为以下风险生成一份详细的修复建议方案：
    风险ID: {risk.get('id')}
    标题: {risk.get('title')}
    描述: {risk.get('description')}
    
    请查询图谱以了解相关的控制措施（Controls），并在建议中引用它们。
    建议应包含：
    1. 立即行动
    2. 长期缓解措施
    3. 验证步骤
    """
    
    agent_result = await run_agent(prompt)
    suggestion = agent_result["response"]
    
    # 3. 保存建议到数据库
    update_query = """
    MATCH (r:Risk {id: $id})
    SET r.remediation_suggestion = $suggestion, 
        r.remediation_source = 'AI'
    RETURN r
    """
    updated_results = neo4j_client.execute_query(update_query, {"id": risk_id, "suggestion": suggestion})
    
    return updated_results[0].get("r")

@router.put("/{risk_id}/suggestion")
async def save_remediation_suggestion(risk_id: str, request: RemediationRequest):
    """
    手动保存/更新修复建议
    """
    query = """
    MATCH (r:Risk {id: $id})
    SET r.remediation_suggestion = $suggestion, 
        r.remediation_source = 'Manual'
    RETURN r
    """
    results = neo4j_client.execute_query(query, {"id": risk_id, "suggestion": request.suggestion})
    if not results:
         raise HTTPException(status_code=404, detail="Risk not found")
    return results[0].get("r")

@router.post("/{risk_id}/remediate")
async def remediate_risk(risk_id: str):
    """
    启动风险修复流程: 将状态更新为 'Remediation In Progress'
    """
    query = """
    MATCH (r:Risk {id: $id})
    SET r.status = 'Remediation In Progress'
    RETURN r
    """
    results = neo4j_client.execute_query(query, {"id": risk_id})
    if not results:
         raise HTTPException(status_code=404, detail="Risk not found")
    return results[0].get("r")

@router.post("/{risk_id}/false-positive")
async def mark_false_positive(risk_id: str):
    """
    标记为误报: 将状态更新为 'False Positive'
    """
    query = """
    MATCH (r:Risk {id: $id})
    SET r.status = 'False Positive'
    RETURN r
    """
    results = neo4j_client.execute_query(query, {"id": risk_id})
    if not results:
         raise HTTPException(status_code=404, detail="Risk not found")
    return results[0].get("r")
