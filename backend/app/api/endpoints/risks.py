from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from app.db.neo4j_client import neo4j_client

router = APIRouter()

class RiskItem(BaseModel):
    id: str
    title: str
    severity: str
    category: str
    status: str
    description: str
    dateIdentified: str
    owner: str

@router.get("/", response_model=List[RiskItem])
async def get_risks():
    """
    获取所有风险项列表。
    """
    query = "MATCH (r:Risk) RETURN r"
    results = neo4j_client.execute_query(query)
    
    # results 是字典列表, 例如 [{'r': {'id': 'R-001', ...}}]
    risks = []
    for record in results:
        node_data = record.get("r", {})
        # 确保所有必需字段都存在 (Pydantic 验证)
        # 我们依赖种子数据的完整性，或者在需要时提供默认值。
        risks.append(node_data)
        
    return risks
