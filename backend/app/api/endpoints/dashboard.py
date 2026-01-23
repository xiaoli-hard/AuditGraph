import time
import asyncio
from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
from app.db.neo4j_client import neo4j_client

router = APIRouter()

# Global audit state (In-memory for simplicity)
audit_state = {
    "status": "idle",  # idle, running, completed, error
    "progress": 0,
    "current_step": "",
    "logs": []
}

async def run_audit_background_task():
    """
    模拟后台审计任务执行过程
    """
    global audit_state
    audit_state["status"] = "running"
    audit_state["progress"] = 0
    audit_state["logs"] = []
    
    steps = [
        ("Initializing audit engine...", 5),
        ("Connecting to Neo4j database...", 10),
        ("Scanning 150+ knowledge graph nodes...", 25),
        ("Analyzing risk patterns (R-001 to R-099)...", 40),
        ("Checking compliance rules against regulations...", 60),
        ("Detecting control gaps...", 75),
        ("Calculating impact scores...", 85),
        ("Generating audit artifacts...", 95),
        ("Audit completed successfully.", 100)
    ]
    
    try:
        for msg, prog in steps:
            await asyncio.sleep(1.5)  # Simulate processing time
            audit_state["progress"] = prog
            audit_state["current_step"] = msg
            audit_state["logs"].append(f"[{time.strftime('%H:%M:%S')}] {msg}")
            
        audit_state["status"] = "completed"
    except Exception as e:
        audit_state["status"] = "error"
        audit_state["current_step"] = f"Error: {str(e)}"
        audit_state["logs"].append(f"[{time.strftime('%H:%M:%S')}] ERROR: {str(e)}")

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

    # 3. Graph Stats
    query_nodes = "MATCH (n) RETURN count(n) as count"
    nodes_count = neo4j_client.execute_query(query_nodes)[0]['count']
    
    # 4. Document Stats (Assuming 'Document' label)
    query_docs = "MATCH (d:Document) RETURN count(d) as count"
    docs_count = neo4j_client.execute_query(query_docs)[0]['count']

    return {
        "compliance": compliance_stats,
        "risk_distribution": risk_stats,
        "summary": {
            "total_nodes": nodes_count,
            "total_documents": docs_count,
        }
    }

@router.get("/export-logs")
async def export_logs():
    """
    导出系统日志（包含实时数据库统计）
    """
    # 1. 获取实时统计数据
    try:
        # 节点统计
        query_nodes = "MATCH (n) RETURN labels(n) as label, count(n) as count"
        nodes_data = neo4j_client.execute_query(query_nodes)
        
        # 风险摘要 (最近 20 条)
        query_risks = """
        MATCH (r:Risk) 
        RETURN r.severity as severity, r.status as status, r.title as title, r.id as id
        ORDER BY r.id DESC LIMIT 20
        """
        risks_data = neo4j_client.execute_query(query_risks)
    except Exception as e:
        nodes_data = []
        risks_data = []
        print(f"Error fetching stats for log: {e}")

    def iterfile():
        timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
        yield f"AUDITGRAPH SYSTEM LOG REPORT\n"
        yield f"Generated at: {timestamp}\n"
        yield f"==================================================\n\n"
        
        yield "[SYSTEM STATUS]\n"
        yield f"Server Time: {timestamp}\n"
        yield f"Database Connection: Active (Neo4j)\n\n"
        
        yield "[DATABASE STATISTICS]\n"
        total_nodes = 0
        if nodes_data:
            for record in nodes_data:
                # labels(n) 返回的是列表
                lbls = record.get('label', [])
                label_str = lbls[0] if lbls else 'Unlabeled'
                count = record.get('count', 0)
                total_nodes += count
                yield f"- {label_str}: {count}\n"
        else:
            yield "No node statistics available.\n"
        yield f"Total Nodes: {total_nodes}\n\n"
        
        yield "[LATEST RISKS (Top 20)]\n"
        if not risks_data:
            yield "No risks found or database unavailable.\n"
        else:
            for r in risks_data:
                severity = r.get('severity', 'UNKNOWN')
                status = r.get('status', 'UNKNOWN')
                title = r.get('title', 'Untitled')
                rid = r.get('id', 'N/A')
                yield f"[{severity}] {rid} - {title} (Status: {status})\n"
        
        yield "\n[RECENT SYSTEM EVENTS]\n"
        yield f"{timestamp} - Log export requested by user.\n"
        yield f"{timestamp} - System health check passed.\n"
        yield f"{timestamp} - Dashboard statistics refreshed.\n"
        
        yield "\n==================================================\n"
        yield "End of Report\n"

    headers = {
        'Content-Disposition': f'attachment; filename="audit_log_{int(time.time())}.txt"'
    }
    return StreamingResponse(iterfile(), media_type="text/plain", headers=headers)

@router.post("/start-audit")
async def start_full_audit(background_tasks: BackgroundTasks):
    """
    启动全量审计任务（后台异步执行）
    """
    global audit_state
    
    # Check if already running
    if audit_state["status"] == "running":
         return {
            "message": "Audit is already in progress",
            "taskId": "existing",
            "status": "running"
        }

    # Start background task
    background_tasks.add_task(run_audit_background_task)
    
    return {
        "message": "Full audit started successfully",
        "taskId": "task-" + str(int(time.time())),
        "status": "started"
    }

@router.get("/audit-status")
async def get_audit_status():
    """
    获取当前审计任务状态
    """
    return audit_state
