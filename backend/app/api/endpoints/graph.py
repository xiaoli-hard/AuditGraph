from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

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

MOCK_GRAPH_DATA = {
  "nodes": [
    { "id": 'ISO27001', "group": 1, "label": 'ISO 27001', "val": 20 },
    { "id": 'A.9', "group": 1, "label": 'A.9 访问控制', "val": 15 },
    { "id": 'A.9.1.1', "group": 2, "label": '访问控制策略', "val": 10 },
    { "id": 'A.9.4.1', "group": 2, "label": '访问限制', "val": 10 },
    { "id": 'DOC-001', "group": 3, "label": '密码策略.pdf', "val": 5 },
    { "id": 'LOG-005', "group": 3, "label": '服务器日志', "val": 5 },
    { "id": 'RISK-001', "group": 4, "label": '弱口令风险', "val": 8 },
    { "id": 'A.12', "group": 1, "label": 'A.12 操作安全', "val": 15 },
    { "id": 'A.12.3.1', "group": 2, "label": '数据备份', "val": 10 },
    { "id": 'RISK-002', "group": 4, "label": '数据丢失风险', "val": 8 }
  ],
  "links": [
    { "source": 'ISO27001', "target": 'A.9', "type": 'CONTAINS' },
    { "source": 'ISO27001', "target": 'A.12', "type": 'CONTAINS' },
    { "source": 'A.9', "target": 'A.9.1.1', "type": 'REQUIRES' },
    { "source": 'A.9', "target": 'A.9.4.1', "type": 'REQUIRES' },
    { "source": 'A.9.1.1', "target": 'DOC-001', "type": 'EVIDENCED_BY' },
    { "source": 'A.9.4.1', "target": 'LOG-005', "type": 'EVIDENCED_BY' },
    { "source": 'A.9.1.1', "target": 'RISK-001', "type": 'MITIGATES' },
    { "source": 'A.12', "target": 'A.12.3.1', "type": 'REQUIRES' },
    { "source": 'A.12.3.1', "target": 'RISK-002', "type": 'MITIGATES' }
  ]
}

@router.get("/", response_model=GraphData)
async def get_graph_data():
    return MOCK_GRAPH_DATA
