from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()

class Document(BaseModel):
    id: str
    name: str
    type: str
    size: str
    uploadDate: str
    status: str

MOCK_DOCUMENTS = [
  { "id": 'D-001', "name": 'ISO27001_信息安全策略_v2.pdf', "type": 'PDF', "size": '2.4 MB', "uploadDate": '2024-03-15', "status": 'Indexed' },
  { "id": 'D-002', "name": '2023_内部审计报告.docx', "type": 'DOCX', "size": '1.1 MB', "uploadDate": '2024-02-10', "status": 'Indexed' },
  { "id": 'D-003', "name": '云基础设施配置清单.json', "type": 'JSON', "size": '0.5 MB', "uploadDate": '2024-03-18', "status": 'Processing' },
  { "id": 'D-004', "name": '员工访问日志_Q1.csv', "type": 'CSV', "size": '15.2 MB', "uploadDate": '2024-03-25', "status": 'Indexed' },
]

@router.get("/", response_model=List[Document])
async def get_documents():
    return MOCK_DOCUMENTS
