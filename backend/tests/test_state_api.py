"""
VISIONCAP Backend Tests — State Machine, WebSockets & REST API
Tests state transitions, event listeners, system health status, and API routes.
"""

from httpx import AsyncClient, ASGITransport
from app.core.state import AppState, SystemState
from app.main import app


async def test_state_machine_transitions_and_broadcasting():
    """Test transitions through the full VISIONCAP interaction lifecycle."""
    state = AppState()
    received_events = []

    async def listener(event):
        received_events.append(event)

    state.add_listener(listener)

    # Transition sequence
    await state.set_state(SystemState.IDLE)
    assert state.system_state == SystemState.IDLE

    await state.set_state(SystemState.LISTENING)
    assert state.system_state == SystemState.LISTENING

    await state.set_state(SystemState.FRAME_CAPTURED)
    await state.set_state(SystemState.ANALYZING)
    await state.set_state(SystemState.THINKING)
    await state.set_state(SystemState.RESPONSE_READY)
    await state.set_state(SystemState.SPEAKING)
    await state.set_state(SystemState.IDLE)

    assert len(received_events) == 8
    assert received_events[0]["data"]["state"] == "idle"
    assert received_events[-1]["data"]["state"] == "idle"

    state.remove_listener(listener)


async def test_health_and_system_endpoints():
    """Test /health and /api/system/status endpoints."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # GET /health
        res_health = await ac.get("/health")
        assert res_health.status_code == 200
        data_health = res_health.json()
        assert data_health["status"] == "ok"
        assert "camera" in data_health
        assert "ai" in data_health
        assert data_health["version"] == "1.0.0"

        # GET /api/system/status
        res_sys = await ac.get("/api/system/status")
        assert res_sys.status_code == 200
        data_sys = res_sys.json()
        assert "state" in data_sys
        assert "camera" in data_sys
        assert "ai" in data_sys


async def test_camera_api_validation():
    """Test camera REST endpoints and 404/503 validations."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Status list
        res = await ac.get("/api/camera/status")
        assert res.status_code == 200
        assert isinstance(res.json(), list)

        # Non-existent camera status
        res_404 = await ac.get("/api/camera/nonexistent-id/status")
        assert res_404.status_code == 404

        # Non-existent camera frame
        res_frame_404 = await ac.get("/api/camera/frame/nonexistent-id")
        assert res_frame_404.status_code == 503


async def test_conversation_api():
    """Test conversation history retrieval and clearing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Clear history
        res_del = await ac.delete("/api/conversation/history")
        assert res_del.status_code == 200

        # Get history
        res_get = await ac.get("/api/conversation/history")
        assert res_get.status_code == 200
        assert res_get.json() == []
