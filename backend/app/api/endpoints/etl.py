import time
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from app.api.deps import get_current_admin, CurrentUser
from app.scripts.etl_pipeline import load_controls_and_entities, load_relationships, load_risks

router = APIRouter()

etl_state = {
    "status": "idle",
    "progress": 0,
    "current_step": "",
    "logs": [],
    "last_run_at": None
}

def run_etl_task():
    global etl_state
    etl_state["status"] = "running"
    etl_state["progress"] = 0
    etl_state["logs"] = []
    etl_state["current_step"] = "Loading controls and entities"
    etl_state["logs"].append(f"[{time.strftime('%H:%M:%S')}] Loading controls and entities")
    try:
        load_controls_and_entities()
        etl_state["progress"] = 40
        etl_state["current_step"] = "Loading relationships"
        etl_state["logs"].append(f"[{time.strftime('%H:%M:%S')}] Loading relationships")
        load_relationships()
        etl_state["progress"] = 70
        etl_state["current_step"] = "Loading risks"
        etl_state["logs"].append(f"[{time.strftime('%H:%M:%S')}] Loading risks")
        load_risks()
        etl_state["progress"] = 100
        etl_state["status"] = "completed"
        etl_state["current_step"] = "Completed"
        etl_state["last_run_at"] = time.strftime('%Y-%m-%d %H:%M:%S')
        etl_state["logs"].append(f"[{time.strftime('%H:%M:%S')}] Completed")
    except Exception as e:
        etl_state["status"] = "error"
        etl_state["current_step"] = "Error"
        etl_state["logs"].append(f"[{time.strftime('%H:%M:%S')}] Error: {str(e)}")

@router.post("/run")
async def run_etl(background_tasks: BackgroundTasks, _: CurrentUser = Depends(get_current_admin)):
    if etl_state["status"] == "running":
        raise HTTPException(status_code=409, detail="ETL is already running")
    background_tasks.add_task(run_etl_task)
    return {"status": "running"}

@router.get("/status")
async def get_etl_status(_: CurrentUser = Depends(get_current_admin)):
    return etl_state
