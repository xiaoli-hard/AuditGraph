from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    steps: Optional[List[dict]] = None

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    # In a real scenario, this would call the LangGraph agent
    # For now, we return a simulated response from the backend
    return {
        "response": f"Backend received: {request.message}. (This is a response from the Python backend)",
        "steps": [
            {"node": "Input", "status": "completed", "detail": "Received user message"},
            {"node": "Process", "status": "completed", "detail": "Analyzing intent..."},
            {"node": "Output", "status": "completed", "detail": "Generated response"}
        ]
    }
