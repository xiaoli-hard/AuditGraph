from typing import Annotated, Literal, List
from typing_extensions import TypedDict
import json

from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage, ToolMessage
from langgraph.graph import StateGraph, END, START
from langgraph.graph.message import add_messages

# 由于导入失败，手动实现 ToolNode 和 tools_condition
class BasicToolNode:
    def __init__(self, tools: list) -> None:
        self.tools_by_name = {tool.name: tool for tool in tools}

    def __call__(self, inputs: dict):
        if messages := inputs.get("messages", []):
            message = messages[-1]
        else:
            raise ValueError("No message found in input")

        outputs = []
        for tool_call in message.tool_calls:
            tool_result = self.tools_by_name[tool_call["name"]].invoke(
                tool_call["args"]
            )
            outputs.append(
                ToolMessage(
                    content=json.dumps(tool_result),
                    name=tool_call["name"],
                    tool_call_id=tool_call["id"],
                )
            )
        return {"messages": outputs}

def tools_condition(state):
    if isinstance(state, list):
        ai_message = state[-1]
    elif isinstance(state, dict) and (messages := state.get("messages", [])):
        ai_message = messages[-1]
    elif messages := getattr(state, "messages", []):
        ai_message = messages[-1]
    else:
        raise ValueError(f"No messages found in input state to tool_edge: {state}")

    if hasattr(ai_message, "tool_calls") and len(ai_message.tool_calls) > 0:
        return "tools"
    return END

from app.core.config import settings
from app.db.neo4j_client import neo4j_client

# 1. 定义工具
@tool
def query_graph(query: str) -> str:
    """
    在审计知识图谱上执行只读 Cypher 查询。
    使用此工具查找风险、控制、文档及其关系。
    
    Schema 概览:
    - 节点: 
      - Risk (风险): id, title, severity, status, description
      - Control (控制): id, label, type
      - Document (文档): id, label, type
      - Standard (标准): id, label
    - 关系:
      - (:Control)-[:MITIGATES]->(:Risk) (控制 缓解 风险)
      - (:Standard)-[:CONTAINS]->(:Control) (标准 包含 控制)
      - (:Control)-[:EVIDENCED_BY]->(:Document) (控制 由...证明)
      - (:Control)-[:REQUIRES]->(:Control) (控制 需要 控制)
    
    示例:
    - "查找所有高风险": MATCH (r:Risk) WHERE r.severity = 'High' RETURN r.title
    - "哪些控制措施缓解了风险 R-001?": MATCH (c:Control)-[:MITIGATES]->(r:Risk {id: 'R-001'}) RETURN c.label
    """
    try:
        # 安全检查：简单的只读检查
        if "DELETE" in query.upper() or "CREATE" in query.upper() or "MERGE" in query.upper() or "SET" in query.upper():
            return "错误: 仅允许只读查询 (MATCH/RETURN)。"
            
        results = neo4j_client.execute_query(query)
        return str(results)
    except Exception as e:
        return f"查询错误: {str(e)}"

tools = [query_graph]

# 2. 设置 LLM
llm = ChatOpenAI(
    base_url=settings.DOUBAO_BASE_URL,
    api_key=settings.ARK_API_KEY or settings.DOUBAO_API_KEY,
    model=settings.DOUBAO_MODEL,
    temperature=0
).bind_tools(tools)

# 3. 定义图状态
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]

# 4. 定义节点
def agent_node(state: AgentState):
    messages = state["messages"]
    response = llm.invoke(messages)
    return {"messages": [response]}

# 5. 构建图
workflow = StateGraph(AgentState)

workflow.add_node("agent", agent_node)
workflow.add_node("tools", BasicToolNode(tools))

workflow.add_edge(START, "agent")
workflow.add_conditional_edges(
    "agent",
    tools_condition,
    {"tools": "tools", END: END}
)
workflow.add_edge("tools", "agent")

agent_app = workflow.compile()

# 6. API 调用的辅助函数
async def run_agent(user_input: str, context: dict = None):
    """
    运行 Agent 的入口点 (供 API 使用)
    """
    system_prompt = """你是一个智能审计助手。
    你的目标是利用知识图谱帮助审计员分析风险、控制和文档。
    
    - 始终使用 'query_graph' 工具来检索事实。不要编造信息。
    - 如果用户询问风险，请查询 Risk 节点。
    - 如果用户询问合规性，请检查 Control 和 Evidence。
    - 提供简洁、专业的回答。
    """
    
    initial_messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_input)
    ]
    
    # 运行图
    # config={"recursion_limit": 10} 防止无限循环
    final_state = await agent_app.ainvoke(
        {"messages": initial_messages},
        config={"recursion_limit": 10}
    )
    
    # 提取最后一条消息内容
    last_message = final_state["messages"][-1]
    return {
        "response": last_message.content,
        "full_messages": [m.content for m in final_state["messages"]]
    }
