from fastapi import APIRouter
from app.core.state import app_state

router = APIRouter(prefix="/api/system", tags=["System"])

@router.get("/status")
async def get_system_status():
    return app_state.get_system_status()

@router.post("/test")
async def run_system_tests():
    # Placeholder for running health checks on subsystems
    return {"status": "tests_completed", "results": {}}
