from typing import TypedDict, List
from langgraph.graph import StateGraph, END
import logging

# Define the state of the agent
class AgentState(TypedDict):
    messages: List[str]
    current_step: str
    context: dict

# Define a basic node (Processing Step)
def process_message(state: AgentState):
    # This is where the LLM Logic will go
    user_message = state['messages'][-1]
    response = f"Agent received: {user_message}. (This is a placeholder for LLM logic)"
    return {
        "messages": state['messages'] + [response],
        "current_step": "completed"
    }

# Build the Graph
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("process", process_message)

# Set Entry Point
workflow.set_entry_point("process")

# Add Edges
workflow.add_edge("process", END)

# Compile the graph
agent_app = workflow.compile()

# Helper function to invoke the graph (to be used by the API)
async def run_agent(message: str):
    initial_state = {
        "messages": [message],
        "current_step": "start",
        "context": {}
    }
    result = await agent_app.ainvoke(initial_state)
    return result
