from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from app.db.neo4j_client import neo4j_client

router = APIRouter()

class GraphNode(BaseModel):
    id: str
    group: int
    label: str
    val: int

class GraphLink(BaseModel):
    source: str
    target: str
    type: str

class GraphData(BaseModel):
    nodes: List[GraphNode]
    links: List[GraphLink]

@router.get("/", response_model=GraphData)
async def get_graph_data():
    """
    获取图谱可视化数据。
    返回节点和链接，供前端 D3/Recharts 渲染使用。
    """
    # 1. 获取节点
    # 返回所有具有 'id' 属性的节点。
    query_nodes = """
    MATCH (n)
    WHERE n.id IS NOT NULL
    RETURN n
    LIMIT 500
    """
    node_results = neo4j_client.execute_query(query_nodes)
    
    nodes = []
    seen_ids = set()
    
    for record in node_results:
        node_data = record.get("n", {})
        node_id = node_data.get("id")
        
        if node_id and node_id not in seen_ids:
            # 为缺失字段提供默认值
            group = node_data.get("group", 1)
            label = node_data.get("label") or node_data.get("title") or node_id
            val = node_data.get("val", 10) # 如果缺失，默认大小
            
            nodes.append({
                "id": node_id,
                "group": group,
                "label": label,
                "val": val
            })
            seen_ids.add(node_id)
            
    # 2. 获取关系 (Links)
    # 返回已找到节点之间的关系
    query_links = """
    MATCH (s)-[r]->(t)
    WHERE s.id IS NOT NULL AND t.id IS NOT NULL
    RETURN s.id as source, t.id as target, type(r) as type
    LIMIT 1000
    """
    link_results = neo4j_client.execute_query(query_links)
    
    links = []
    for record in link_results:
        source = record.get("source")
        target = record.get("target")
        # 确保端点存在于我们的节点列表中，以防止前端错误
        if source in seen_ids and target in seen_ids:
            links.append({
                "source": source,
                "target": target,
                "type": record.get("type", "RELATED")
            })

    return {
        "nodes": nodes,
        "links": links
    }
