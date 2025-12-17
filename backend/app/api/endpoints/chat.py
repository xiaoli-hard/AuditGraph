from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.langgraph_agent.graph import run_agent
import traceback

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    steps: Optional[List[dict]] = None

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    聊天 API 端点。
    接收用户的消息，调用 LangGraph 智能体进行处理，并返回 AI 的回答及执行步骤。
    """
    try:
        # 调用 LangGraph Agent 处理消息
        result = await run_agent(request.message)
        
        return {
            "response": result["response"],
            "steps": [
                {"node": "Agent", "status": "completed", "detail": "LangGraph 处理完成"},
                # 如果 Agent 状态中捕获了详细步骤，可以在这里扩展
            ]
        }
    except Exception as e:
        # 将完整堆栈跟踪记录到控制台以便调试
        print(f"❌ 聊天端点错误: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
