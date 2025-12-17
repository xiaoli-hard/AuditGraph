from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from app.db.neo4j_client import neo4j_client

router = APIRouter()

class AuditStat(BaseModel):
    name: str
    value: int
    color: str

@router.get("/stats")
async def get_dashboard_stats():
    """
    获取仪表盘统计数据。
    包括风险分布（按严重程度）和合规性状态。
    """
    # 1. 风险分布 (按严重程度)
    query_risk = """
    MATCH (r:Risk)
    RETURN r.severity as severity, count(r) as count
    """
    risk_data = neo4j_client.execute_query(query_risk)
    
    # 将严重程度映射到颜色和标准名称
    # 数据库中的严重程度: 'High', 'Medium', 'Low'
    risk_map = {
        "High": {"name": "高危", "color": "#ef4444"},
        "Medium": {"name": "中危", "color": "#f59e0b"},
        "Low": {"name": "低危", "color": "#3b82f6"}
    }
    
    risk_stats = []
    for item in risk_data:
        severity = item.get("severity")
        count = item.get("count")
        if severity in risk_map:
            risk_stats.append({
                "name": risk_map[severity]["name"],
                "value": count,
                "color": risk_map[severity]["color"]
            })
    
    # 2. 合规性统计 (目前基于风险状态推导)
    # 逻辑: Open = 不合规, Mitigated = 待审核, Closed = 合规
    query_status = """
    MATCH (r:Risk)
    RETURN r.status as status, count(r) as count
    """
    status_data = neo4j_client.execute_query(query_status)
    
    # 映射状态到合规类别
    # 数据库状态: 'Open', 'Mitigated', 'Closed'
    status_map = {
        "Open": {"name": "不合规", "color": "#ef4444"},
        "Mitigated": {"name": "待审核", "color": "#f59e0b"},
        "Closed": {"name": "已合规", "color": "#10b981"}
    }
    
    compliance_stats = []
    for item in status_data:
        status = item.get("status")
        count = item.get("count")
        if status in status_map:
            compliance_stats.append({
                "name": status_map[status]["name"],
                "value": count,
                "color": status_map[status]["color"]
            })

    return {
        "compliance": compliance_stats,
        "risk_distribution": risk_stats
    }
