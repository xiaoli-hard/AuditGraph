from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import os
import shutil
from datetime import datetime
from app.db.neo4j_client import neo4j_client

router = APIRouter()

class Document(BaseModel):
    id: str
    name: Optional[str] = None
    type: Optional[str] = None
    size: Optional[str] = "Unknown"
    uploadDate: Optional[str] = None
    status: Optional[str] = "Indexed"

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "../../../data/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def format_file_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    if size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    if size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"

@router.get("/", response_model=List[Document])
async def get_documents(search: Optional[str] = Query(default=None)):
    query = """
    MATCH (d:Document)
    WHERE ($search IS NULL OR toLower(d.name) CONTAINS toLower($search) OR toLower(d.id) CONTAINS toLower($search) OR toLower(d.type) CONTAINS toLower($search))
    RETURN d.id as id, d.name as name, d.type as type, d.size as size, d.uploadDate as uploadDate, d.status as status
    """
    try:
        results = neo4j_client.execute_query(query, {"search": search})
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload", response_model=List[Document])
async def upload_documents(files: List[UploadFile] = File(...)):
    created_docs: List[Document] = []
    for file in files:
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
        safe_name = file.filename.replace(" ", "_")
        stored_name = f"{timestamp}_{safe_name}"
        stored_path = os.path.join(UPLOAD_DIR, stored_name)
        with open(stored_path, "wb") as out_file:
            shutil.copyfileobj(file.file, out_file)
        size_bytes = os.path.getsize(stored_path)
        file_type = file.content_type.split("/")[-1].upper() if file.content_type else (safe_name.split(".")[-1].upper() if "." in safe_name else "FILE")
        doc_id = f"DOC-{timestamp}"
        upload_date = datetime.utcnow().strftime("%Y-%m-%d")
        doc = {
            "id": doc_id,
            "name": file.filename,
            "type": file_type,
            "size": format_file_size(size_bytes),
            "uploadDate": upload_date,
            "status": "Indexed",
            "storagePath": stored_path
        }
        create_query = """
        MERGE (d:Document {id: $id})
        SET d.name = $name,
            d.type = $type,
            d.size = $size,
            d.uploadDate = $uploadDate,
            d.status = $status,
            d.storagePath = $storagePath
        RETURN d.id as id, d.name as name, d.type as type, d.size as size, d.uploadDate as uploadDate, d.status as status
        """
        results = neo4j_client.execute_query(create_query, doc)
        if results:
            created_docs.append(Document(**results[0]))
    return created_docs

@router.get("/{doc_id}/download")
async def download_document(doc_id: str):
    query = """
    MATCH (d:Document {id: $id})
    RETURN d.storagePath as storagePath, d.name as name
    """
    results = neo4j_client.execute_query(query, {"id": doc_id})
    if not results:
        raise HTTPException(status_code=404, detail="Document not found")
    storage_path = results[0].get("storagePath")
    filename = results[0].get("name") or f"{doc_id}"
    if not storage_path or not os.path.exists(storage_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(storage_path, filename=filename)

@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    query = """
    MATCH (d:Document {id: $id})
    RETURN d.storagePath as storagePath
    """
    results = neo4j_client.execute_query(query, {"id": doc_id})
    if not results:
        raise HTTPException(status_code=404, detail="Document not found")
    storage_path = results[0].get("storagePath")
    if storage_path and os.path.exists(storage_path):
        os.remove(storage_path)
    delete_query = """
    MATCH (d:Document {id: $id})
    DETACH DELETE d
    """
    neo4j_client.execute_query(delete_query, {"id": doc_id})
    return {"status": "deleted"}
