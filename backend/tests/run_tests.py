"""
VISIONCAP — Backend Automated Test Suite Runner
Runs test assertions across camera, AI provider, conversation memory, state machine, and REST APIs.
"""

import asyncio
import sys
import os

# Ensure backend directory is on python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from tests.test_camera import (
    test_frame_buffer_storage_and_retrieval,
    test_multi_frame_buffer,
    test_camera_service_lifecycle,
    test_invalid_camera_response_handling,
)
from tests.test_ai import (
    test_ai_provider_missing_key_graceful_failure,
    test_mock_ai_pipeline_success,
    test_mock_ai_pipeline_timeout_handling,
    test_conversation_memory_bounded,
    test_vision_service_direct_base64,
)
from tests.test_state_api import (
    test_state_machine_transitions_and_broadcasting,
    test_health_and_system_endpoints,
    test_camera_api_validation,
    test_conversation_api,
)
from tests.test_groq import (
    test_groq_provider_initialization,
    test_groq_provider_missing_key,
    test_groq_provider_streaming_accumulation,
    test_ai_service_routes_to_groq,
)
from tests.test_speech import (
    test_tamil_unicode_detection,
    test_tanglish_detection_and_intent,
    test_english_detection,
    test_detect_language_api_endpoint,
)


async def run_all_tests():
    print("=" * 60)
    print("      VISIONCAP BACKEND TEST SUITE RUNNER")
    print("=" * 60)

    sync_tests = [
        ("FrameBuffer storage & retrieval", test_frame_buffer_storage_and_retrieval),
        ("MultiFrameBuffer management", test_multi_frame_buffer),
        ("Conversation memory bounds", test_conversation_memory_bounded),
        ("Groq provider initialization & defaults", test_groq_provider_initialization),
        ("AIService dynamic routing to Groq", test_ai_service_routes_to_groq),
        ("Tamil Unicode language detection", test_tamil_unicode_detection),
        ("Tanglish spoken query detection & intent", test_tanglish_detection_and_intent),
        ("English language detection", test_english_detection),
        ("Language detection API endpoint", test_detect_language_api_endpoint),
    ]

    async_tests = [
        ("Camera service lifecycle", test_camera_service_lifecycle),
        ("Invalid camera response handling", test_invalid_camera_response_handling),
        ("AI provider unconfigured error", test_ai_provider_missing_key_graceful_failure),
        ("Mock AI pipeline success", test_mock_ai_pipeline_success),
        ("Mock AI pipeline timeout handling", test_mock_ai_pipeline_timeout_handling),
        ("State machine transitions & broadcast", test_state_machine_transitions_and_broadcasting),
        ("Vision service direct base64 ingestion", test_vision_service_direct_base64),
        ("Groq provider missing key handling", test_groq_provider_missing_key),
        ("Groq streaming chunk accumulation", test_groq_provider_streaming_accumulation),
        ("Health check & system endpoints", test_health_and_system_endpoints),
        ("Camera API endpoints & validation", test_camera_api_validation),
        ("Conversation API endpoints", test_conversation_api),
    ]

    passed = 0
    failed = 0

    for name, fn in sync_tests:
        try:
            fn()
            print(f"  [PASS] {name}")
            passed += 1
        except Exception as e:
            print(f"  [FAIL] {name}: {e}")
            failed += 1

    for name, fn in async_tests:
        try:
            await fn()
            print(f"  [PASS] {name}")
            passed += 1
        except Exception as e:
            print(f"  [FAIL] {name}: {e}")
            failed += 1

    print("=" * 60)
    print(f"RESULTS: {passed} passed, {failed} failed (Total: {passed + failed})")
    print("=" * 60)

    return failed == 0


if __name__ == "__main__":
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1)
